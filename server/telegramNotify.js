// Ежедневный дайджест в Telegram-группу турнира: итоги вчерашних матчей +
// анонс завтрашних. Раз в сутки в 10:00 по Душанбе (см. scheduleDailyDigest).
const STAGE_LABELS = {
  group: 'Групповой этап',
  quarterfinal: '1/4 финала',
  semifinal: 'Полуфинал',
  third_place: 'Матч за 3-е место',
  final: 'Финал',
}

const DUSHANBE_TZ = 'Asia/Dushanbe'

// YYYY-MM-DD текущей даты в таймзоне Душанбе (не хостовой машины)
function dushanbeDateString(offsetDays = 0) {
  const now = new Date(Date.now() + offsetDays * 86400000)
  return new Intl.DateTimeFormat('en-CA', { timeZone: DUSHANBE_TZ }).format(now)
}

function teamName(teams, id) {
  return teams.find((t) => t.id === id)?.name ?? '???'
}

function formatFinished(match, teams) {
  const a = teamName(teams, match.teamAId)
  const b = teamName(teams, match.teamBId)
  const stage = STAGE_LABELS[match.stage] ?? match.stage
  if (match.status === 'forfeit') {
    const loser = match.forfeitLoserId ? teamName(teams, match.forfeitLoserId) : null
    return `${a} — ${b}: тех. поражение${loser ? ` (${loser})` : ''} [${stage}]`
  }
  return `${a} ${match.scoreA} : ${match.scoreB} ${b} [${stage}]`
}

function formatScheduled(match, teams) {
  const a = teamName(teams, match.teamAId)
  const b = teamName(teams, match.teamBId)
  const stage = STAGE_LABELS[match.stage] ?? match.stage
  const time = match.time ? `, ${match.time}` : ''
  return `${a} — ${b} [${stage}]${time}`
}

function buildDigestText(data, yesterday, tomorrow) {
  const { matches, teams } = data
  const finished = matches.filter((m) => m.date === yesterday && m.status !== 'scheduled')
  const upcoming = matches.filter((m) => m.date === tomorrow && m.status === 'scheduled')

  if (finished.length === 0 && upcoming.length === 0) {
    return null
  }

  const parts = []
  if (finished.length > 0) {
    parts.push('<b>Итоги вчерашних матчей:</b>\n' + finished.map((m) => formatFinished(m, teams)).join('\n'))
  }
  if (upcoming.length > 0) {
    parts.push('<b>Матчи завтра:</b>\n' + upcoming.map((m) => formatScheduled(m, teams)).join('\n'))
  }
  return parts.join('\n\n')
}

async function alreadySentToday(pool, today) {
  const result = await pool.query('SELECT 1 FROM telegram_digest_log WHERE date = $1', [today])
  return result.rows.length > 0
}

async function markSent(pool, today) {
  await pool.query(
    `INSERT INTO telegram_digest_log (date, sent_at) VALUES ($1, now())
     ON CONFLICT (date) DO NOTHING`,
    [today],
  )
}

async function sendTelegramMessage(token, chatId, text) {
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
  })
  if (!res.ok) {
    throw new Error(`Telegram API вернул ${res.status}: ${await res.text()}`)
  }
}

async function sendDailyDigest(pool, { token, chatId }) {
  const today = dushanbeDateString()
  if (await alreadySentToday(pool, today)) {
    return
  }

  const result = await pool.query('SELECT data FROM tournament_data WHERE id = 1')
  if (result.rows.length === 0) {
    return
  }

  const yesterday = dushanbeDateString(-1)
  const tomorrow = dushanbeDateString(1)
  const text = buildDigestText(result.rows[0].data, yesterday, tomorrow)

  // Дня без матчей помечаем отправленным, чтобы не пересчитывать каждую минуту до полуночи
  await markSent(pool, today)
  if (text) {
    await sendTelegramMessage(token, chatId, text)
  }
}

// Проверяет раз в минуту, не наступило ли 10:00 по Душанбе — без cron-зависимости
// ради одной ежедневной задачи в единственном процессе.
function scheduleDailyDigest(pool) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID
  if (!token || !chatId) {
    console.warn('TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID не заданы — дайджест в Telegram отключён')
    return
  }

  setInterval(() => {
    const hour = Number(
      new Intl.DateTimeFormat('en-GB', { timeZone: DUSHANBE_TZ, hour: '2-digit', hourCycle: 'h23' }).format(),
    )
    if (hour !== 10) return
    sendDailyDigest(pool, { token, chatId }).catch((err) => {
      console.error('Ошибка отправки Telegram-дайджеста:', err)
    })
  }, 60_000)
}

export { scheduleDailyDigest, sendDailyDigest, buildDigestText, dushanbeDateString }
