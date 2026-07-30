// Минимальный API-сервер: хранит весь TournamentData одной JSONB-строкой в Postgres,
// отдаёт клиентам, и раздаёт собранную статику фронтенда с того же origin (без CORS).
import express from 'express'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
import pg from 'pg'
import path from 'node:path'
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
