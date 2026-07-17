// Ежедневный дайджест в Telegram-группу турнира: итоги вчерашних матчей,
// анонс сегодняшних, анонс завтрашних — тремя отдельными сообщениями. Раз в
// сутки в 10:00 по Душанбе (см. scheduleDailyDigest).
const STAGE_LABELS = {
  group: 'Групповой этап',
  quarterfinal: '1/4 финала',
  semifinal: 'Полуфинал',
  third_place: 'Матч за 3-е место',
  final: 'Финал',
}

// Единственный зал турнира — тот же адрес, что в src/components/Footer.tsx
const VENUE = 'СДЮШОР №5, ул. Дж. Расулова 41, г. Душанбе'

const DUSHANBE_TZ = 'Asia/Dushanbe'

// YYYY-MM-DD текущей даты в таймзоне Душанбе (не хостовой машины)
function dushanbeDateString(offsetDays = 0) {
  const now = new Date(Date.now() + offsetDays * 86400000)
  return new Intl.DateTimeFormat('en-CA', { timeZone: DUSHANBE_TZ }).format(now)
}

// ДД.ММ.ГГГГ — тот же формат, что src/lib/formatDate.ts
function formatDate(isoDate) {
  const [y, m, d] = isoDate.split('-')
  return `${d}.${m}.${y}`
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

function buildResultsText(data, yesterday) {
  const finished = data.matches.filter((m) => m.date === yesterday && m.status !== 'scheduled')
  if (finished.length === 0) return null
  return (
    `🏀 Итоги вчерашних матчей!\n📅 ${formatDate(yesterday)}\n\n` +
    finished.map((m) => formatFinished(m, data.teams)).join('\n')
  )
}

function buildScheduleLines(data, date) {
  const upcoming = data.matches.filter((m) => m.date === date && m.status === 'scheduled')
  if (upcoming.length === 0) return null
  return upcoming.map((m) => {
    const a = teamName(data.teams, m.teamAId)
    const b = teamName(data.teams, m.teamBId)
    const time = m.time ?? '?'
    return `🕐 ${time} — ${a} 🆚 ${b}`
  })
}

function buildTodayText(data, today) {
  const lines = buildScheduleLines(data, today)
  if (!lines) return null
  return (
    `🏀 Сегодня играем!\n📅 ${formatDate(today)}\n` +
    lines.join('\n') +
    `\n📍 Место проведения: ${VENUE}`
  )
}

function buildScheduleText(data, tomorrow) {
  const lines = buildScheduleLines(data, tomorrow)
  if (!lines) return null
  return (
    `🏀 Расписание предстоящих матчей турнира!\n📅 ${formatDate(tomorrow)}\n` +
    lines.join('\n') +
    `\n📍 Место проведения: ${VENUE}`
  )
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
    body: JSON.stringify({ chat_id: chatId, text }),
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
  const data = result.rows[0].data
  const resultsText = buildResultsText(data, yesterday)
  const todayText = buildTodayText(data, today)
  const scheduleText = buildScheduleText(data, tomorrow)

  // Дня без матчей помечаем отправленным, чтобы не пересчитывать каждую минуту до полуночи
  await markSent(pool, today)
  if (resultsText) {
    await sendTelegramMessage(token, chatId, resultsText)
  }
  if (todayText) {
    await sendTelegramMessage(token, chatId, todayText)
  }
  if (scheduleText) {
    await sendTelegramMessage(token, chatId, scheduleText)
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

export {
  scheduleDailyDigest,
  sendDailyDigest,
  sendTelegramMessage,
  buildResultsText,
  buildTodayText,
  buildScheduleText,
  dushanbeDateString,
}
