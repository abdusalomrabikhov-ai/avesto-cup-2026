// Минимальный API-сервер: хранит весь TournamentData одной JSONB-строкой в Postgres,
// отдаёт клиентам, и раздаёт собранную статику фронтенда с того же origin (без CORS).
import express from 'express'
import pg from 'pg'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

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

const app = express()
app.use(express.json({ limit: '5mb' }))

function requireAdmin(req, res, next) {
  const auth = req.headers.authorization ?? ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
  if (token !== ADMIN_PASSWORD) {
    res.status(401).json({ error: 'Неверный пароль' })
    return
  }
  next()
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
  await pool.query(
    `INSERT INTO tournament_data (id, data) VALUES (1, $1)
     ON CONFLICT (id) DO UPDATE SET data = $1`,
    [req.body],
  )
  res.json(req.body)
})

app.post('/api/login', (req, res) => {
  const { password } = req.body ?? {}
  if (password === ADMIN_PASSWORD) {
    res.status(200).json({ ok: true })
  } else {
    res.status(401).json({ ok: false })
  }
})

const distPath = path.join(__dirname, '../dist')
app.use(express.static(distPath))
app.get(/^(?!\/api\/).*/, (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'))
})

const port = process.env.PORT || 3000
app.listen(port, () => {
  console.log(`Server listening on port ${port}`)
})
