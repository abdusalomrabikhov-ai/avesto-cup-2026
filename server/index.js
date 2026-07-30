// Минимальный API-сервер: хранит весь TournamentData одной JSONB-строкой в Postgres,
// отдаёт клиентам, и раздаёт собранную статику фронтенда с того же origin (без CORS).
import express from 'express'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
import pg from 'pg'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { scheduleDailyDigest } from './telegramNotify.js'

const { Pool } = pg
const __dirname = path.dirname(fileURLToPath(import.meta.url))

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD
if (!ADMIN_PASSWORD) {
  throw new Error('ADMIN_PASSWORD не задан в переменных окружения')
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('railway') ? { rejectUnauthorized: false } : undefined,
})

await pool.query(`
  CREATE TABLE IF NOT EXISTS tournament_data (
    id INT PRIMARY KEY DEFAULT 1,
    data JSONB NOT NULL
  )
`)

await pool.query(`
  CREATE TABLE IF NOT EXISTS telegram_digest_log (
    date DATE PRIMARY KEY,
    sent_at TIMESTAMPTZ NOT NULL
  )
`)

// Счётчик посещений. Храним не сырые визиты, а сразу агрегат по дню:
// строк максимум (дней × страниц), таблица не растёт бесконечно и не нужна чистка.
// visitor_hash — SHA-256 от IP+UA+соли, не обратимый в IP: считаем «сколько
// устройств», не «кто именно». Уникальность внутри дня, не за всё время
await pool.query(`
  CREATE TABLE IF NOT EXISTS visit_log (
    date DATE NOT NULL,
    visitor_hash TEXT NOT NULL,
    path TEXT NOT NULL,
    hits INT NOT NULL DEFAULT 1,
    PRIMARY KEY (date, visitor_hash, path)
  )
`)

scheduleDailyDigest(pool)

const app = express()

// Railway проксирует запросы — без этого req.ip вернёт IP прокси, одинаковый для
// всех посетителей, и rate limit заблокирует вход сразу всем. Значение 1 (а не true):
// доверяем только ближайшему прокси, иначе IP можно подделать заголовком X-Forwarded-For
app.set('trust proxy', 1)

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        // base64-логотипы команд (src/data/logos.ts) — без data: они не отрисуются
        imgSrc: ["'self'", 'data:'],
        // Tailwind инжектит стили рантаймом
        styleSrc: ["'self'", "'unsafe-inline'"],
        fontSrc: ["'self'", 'data:'],
        // API на том же origin; Telegram зовётся с сервера, не из браузера
        connectSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
      },
    },
  }),
)

app.use(express.json({ limit: '5mb' }))

// CORS для /api/* — нужен только когда локальный dev-сервер (localhost:3002)
// дёргает этот прод-API напрямую через VITE_API_URL. Разрешаем только localhost,
// не '*' — иначе любой сторонний сайт смог бы дергать этот API из браузера пользователя
const ALLOWED_ORIGINS = [/^http:\/\/localhost:\d+$/]

app.use('/api', (req, res, next) => {
  const origin = req.headers.origin
  if (origin && ALLOWED_ORIGINS.some((re) => re.test(origin))) {
    res.header('Access-Control-Allow-Origin', origin)
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, OPTIONS')
  }
  if (req.method === 'OPTIONS') {
    res.sendStatus(204)
    return
  }
  next()
})

// 5 попыток на IP за 15 минут. Успешные входы не считаем, чтобы админ,
// часто перелогинивающийся во время турнира, не заблокировал сам себя
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Слишком много попыток входа. Попробуйте через 15 минут.' },
})

function requireAdmin(req, res, next) {
  const auth = req.headers.authorization ?? ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
  if (token !== ADMIN_PASSWORD) {
    console.warn(`[auth] Неверный токен PUT /api/data, ip=${req.ip}, ${new Date().toISOString()}`)
    res.status(401).json({ error: 'Неверный пароль' })
    return
  }
  next()
}

// Клиентская валидация (src/lib/validate.ts) обходится одним curl — проверяем
// форму документа на сервере, до записи. Только верхний уровень: цель — не дать
// превратить документ в мусор, а не продублировать бизнес-правила
function isValidTournamentData(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return false
  const arrays = ['teams', 'players', 'matches', 'awards', 'drawLots']
  if (!arrays.every((k) => Array.isArray(data[k]))) return false
  if (!data.countdown || typeof data.countdown !== 'object') return false
  return true
}

// Соль делает хеш неподбираемым: без неё диапазон IPv4 перебирается за секунды
// и hash превращается обратно в IP. При отсутствии env-переменной генерим
// случайную на старте — тогда хеши живут до перезапуска, статистика уникальных
// «рвётся» на деплое, но приватность не страдает
const VISIT_SALT = process.env.VISIT_SALT ?? crypto.randomBytes(32).toString('hex')

function visitorHash(req) {
  return crypto
    .createHash('sha256')
    .update(`${req.ip}|${req.headers['user-agent'] ?? ''}|${VISIT_SALT}`)
    .digest('hex')
}

// Счёт не должен ломать выдачу данных: ошибка записи логируется и глотается
async function recordVisit(req, rawPath) {
  // Нормализуем: только известные разделы, иначе мусорный путь из адресной
  // строки создаст строку в таблице (и это вектор на раздувание базы)
  const path = typeof rawPath === 'string' && /^\/[a-z0-9/:-]{0,40}$/i.test(rawPath) ? rawPath : '/'
  try {
    await pool.query(
      // Дата в поясе турнира, не в UTC: контейнер Railway живёт по UTC, и с 19:00
      // до полуночи по Душанбе (UTC+5) визиты уходили бы во вчерашнюю строку —
      // как раз в вечерний пик посещаемости
      `INSERT INTO visit_log (date, visitor_hash, path)
       VALUES ((CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Dushanbe')::date, $1, $2)
       ON CONFLICT (date, visitor_hash, path) DO UPDATE SET hits = visit_log.hits + 1`,
      [visitorHash(req), path],
    )
  } catch (err) {
    console.warn(`[stats] Не удалось записать визит: ${err.message}`)
  }
}

// Пинг со смены роута во фронтенде. 204 без тела — ответ клиенту не нужен
app.post('/api/visit', async (req, res) => {
  await recordVisit(req, req.body?.path)
  res.sendStatus(204)
})

app.get('/api/stats', requireAdmin, async (req, res) => {
  const [totals, daily, pages] = await Promise.all([
    // Уникальные за всё время считаем по distinct хешу, а не суммой дневных:
    // вернувшийся посетитель не должен считаться дважды
    pool.query(`SELECT COUNT(DISTINCT visitor_hash)::int AS visitors, COALESCE(SUM(hits), 0)::int AS hits FROM visit_log`),
    pool.query(
      `SELECT date, COUNT(DISTINCT visitor_hash)::int AS visitors, SUM(hits)::int AS hits
       FROM visit_log GROUP BY date ORDER BY date DESC LIMIT 30`,
    ),
    pool.query(
      `SELECT path, COUNT(DISTINCT visitor_hash)::int AS visitors, SUM(hits)::int AS hits
       FROM visit_log GROUP BY path ORDER BY hits DESC LIMIT 20`,
    ),
  ])
  res.json({ total: totals.rows[0], daily: daily.rows, pages: pages.rows })
})

// Сброс счётчика — чтобы обнулить тестовые заходы перед турниром.
// Необратимо: агрегат по дням восстановить неоткуда, сырых визитов не храним
app.delete('/api/stats', requireAdmin, async (req, res) => {
  await pool.query('DELETE FROM visit_log')
  console.log(`[stats] Статистика сброшена, ip=${req.ip}, ${new Date().toISOString()}`)
  res.sendStatus(204)
})

app.get('/api/data', async (req, res) => {
  const result = await pool.query('SELECT data FROM tournament_data WHERE id = 1')
  if (result.rows.length === 0) {
    res.status(404).json({ error: 'Данные ещё не инициализированы' })
    return
  }
  res.json(result.rows[0].data)
})

app.put('/api/data', requireAdmin, async (req, res) => {
  if (!isValidTournamentData(req.body)) {
    res.status(400).json({ error: 'Некорректная структура данных турнира' })
    return
  }
  await pool.query(
    `INSERT INTO tournament_data (id, data) VALUES (1, $1)
     ON CONFLICT (id) DO UPDATE SET data = $1`,
    [req.body],
  )
  console.log(`[data] Турнир обновлён, ip=${req.ip}, ${new Date().toISOString()}`)
  res.json(req.body)
})

app.post('/api/login', loginLimiter, (req, res) => {
  const { password } = req.body ?? {}
  if (password === ADMIN_PASSWORD) {
    res.status(200).json({ ok: true })
  } else {
    console.warn(`[auth] Неудачный вход, ip=${req.ip}, ${new Date().toISOString()}`)
    res.status(401).json({ ok: false })
  }
})

const distPath = path.join(__dirname, '../dist')
app.use(express.static(distPath))

// Админка не должна попадать в поисковый индекс: форма пароля на публично
// доступном URL — типовой триггер эвристик Safe Browsing. Заголовок надёжнее
// <meta> в SPA: краулер видит его сразу, не исполняя JS
app.get(/^\/admin(\/|$)/, (req, res, next) => {
  res.set('X-Robots-Tag', 'noindex, nofollow')
  next()
})

app.get(/^(?!\/api\/).*/, (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'))
})

const port = process.env.PORT || 3000
app.listen(port, () => {
  console.log(`Server listening on port ${port}`)
})
