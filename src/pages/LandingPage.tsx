import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, MapPin, Trophy } from 'lucide-react'
import { useTournamentData } from '../hooks/useTournamentData'
import { ButtonLink } from '../components/ui/Button'
import { MatchRow } from '../components/MatchRow'
import { TeamCarousel } from '../components/TeamCarousel'
import { CountdownTimer } from '../components/CountdownTimer'
import { CountUp } from '../components/CountUp'
import { COUNTDOWN_MODE_LABELS } from '../types'
import type { CountdownMode } from '../types'

const COUNTDOWN_HEADLINES: Record<CountdownMode, { title: string; subtitle: string }> = {
  tournament_start: {
    title: 'Скоро на паркете',
    subtitle: 'Следите за расписанием, чтобы не пропустить ни один матч.',
  },
  final: {
    title: 'Финал всё ближе',
    subtitle: 'Один матч решит, кто поднимет кубок турнира.',
  },
}
import avestoGroupLogo from '../assets/brand/avesto-group-logo.png'
import heroVideo from '../assets/brand/hero-video.mp4'

const PRIZE_FUND_AMOUNT = 60000
const formatPrizeFund = (n: number) => `${n.toLocaleString('ru-RU')} сомони`

export function LandingPage() {
  const { data } = useTournamentData()

  const teamsMap = useMemo(() => new Map(data.teams.map((t) => [t.id, t])), [data.teams])

  const upcomingMatches = useMemo(
    () =>
      data.matches
        .filter((m) => m.status === 'scheduled')
        .sort((a, b) => a.date.localeCompare(b.date) || (a.time ?? '99:99').localeCompare(b.time ?? '99:99'))
        .slice(0, 4),
    [data.matches],
  )

  // Всего матчей турнира: групповой этап (по факту созданных матчей) + фиксированная
  // плей-офф сетка на 8 команд (4 четвертьфинала + 2 полуфинала + финал + матч за 3-е место)
  const PLAYOFF_MATCHES_COUNT = 8
  const totalMatches = data.matches.filter((m) => m.stage === 'group').length + PLAYOFF_MATCHES_COUNT

  return (
    <div>
      {/* Hero: один лидирующий элемент — заголовок. Логотип холдинга — тихий водяной знак, не конкурирует. */}
      <section className="court-bg relative overflow-hidden border-b border-slate-700">
        <video
          aria-hidden="true"
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 h-full w-full object-cover blur-[4px] scale-105"
        >
          <source src={heroVideo} type="video/mp4" />
        </video>
        <div aria-hidden="true" className="absolute inset-0 bg-black/70" />
        <img
          src={avestoGroupLogo}
          alt=""
          aria-hidden="true"
          className="hidden lg:block absolute top-32 right-24 w-[300px] opacity-90 pointer-events-none select-none drop-shadow-[0_4px_20px_rgba(0,0,0,0.6)]"
        />
        <div className="max-w-6xl mx-auto px-4 pt-24 pb-16 sm:pt-32 sm:pb-20 relative">
          <span className="text-sm font-semibold text-court-400">Корпоративный чемпионат ООО «Авесто Групп»</span>
          <h1 className="text-6xl sm:text-8xl font-black uppercase italic tracking-tight text-white leading-[0.92] mt-4 max-w-3xl">
            Кубок Авесто<span className="text-court-400">-2026</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-xl mt-6 leading-relaxed">
            18 команд, 4 группы, один чемпион. Групповой этап, плей-офф и индивидуальные награды турнира.
          </p>

          <a
            href="https://yandex.tj/maps/org/spetsializirovannaya_detsko_yunosheskaya_shkola_olimpiyskogo_rezerva_5/214464609459/?ll=68.744996%2C38.554058&z=16"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-slate-400 text-sm mt-5 hover:text-court-400 transition-colors w-fit"
          >
            <MapPin className="h-4 w-4 text-court-400 shrink-0" />
            ул. Дж. Расулова 41, г. Душанбе
          </a>

          <div className="flex flex-wrap items-center gap-4 mt-9">
            <ButtonLink to="/groups" variant="solid">
              Турнирная таблица <ArrowRight className="h-4 w-4" />
            </ButtonLink>
            <ButtonLink to="/bracket" variant="outline">
              Сетка плей-офф
            </ButtonLink>
          </div>

          <div className="flex flex-wrap items-center gap-x-10 gap-y-6 mt-16 pt-8 border-t border-slate-700">
            <div>
              <span className="block text-2xl font-bold text-white tabular-nums">
                <CountUp value={18} />
              </span>
              <span className="text-sm text-slate-500">команд</span>
            </div>
            <div>
              <span className="block text-2xl font-bold text-white tabular-nums">
                <CountUp value={totalMatches} />
              </span>
              <span className="text-sm text-slate-500">матчей всего</span>
            </div>
            <span className="hidden sm:block h-10 w-px bg-slate-800" />
            <div className="flex items-center gap-3">
              <Trophy className="h-9 w-9 text-gold-400 shrink-0" />
              <div>
                <span className="block text-4xl font-black italic text-gold-400 tabular-nums leading-none">
                  <CountUp value={PRIZE_FUND_AMOUNT} format={formatPrizeFund} />
                </span>
                <span className="text-sm text-slate-500">общий призовой фонд турнира</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Countdown: собственное крупное заявление — единственная секция сайта с этим приёмом, намеренно */}
      <section className="border-b border-slate-700 bg-slate-800/50">
        <div className="max-w-4xl mx-auto px-4 py-20 sm:py-24 text-center">
          <span className="text-xs font-bold uppercase tracking-[0.3em] text-gold-400">
            {COUNTDOWN_MODE_LABELS[data.countdown.mode]}
          </span>
          <h2 className="text-4xl sm:text-6xl font-black uppercase italic text-white leading-[0.98] mt-5">
            {COUNTDOWN_HEADLINES[data.countdown.mode].title}
          </h2>
          <p className="text-slate-400 mt-5">{COUNTDOWN_HEADLINES[data.countdown.mode].subtitle}</p>
          <span className="block h-1 w-16 bg-slate-700 mx-auto mt-8" />
          <div className="mt-14">
            <CountdownTimer
              targetDateTime={
                data.countdown.mode === 'tournament_start' ? data.countdown.tournamentStart : data.countdown.final
              }
            />
          </div>
        </div>
      </section>

      {/* Ближайшие матчи: заголовок слева, контент справа — двухколоночная композиция вместо центрированного eyebrow-блока */}
      {upcomingMatches.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-10">
            <div>
              <h2 className="text-3xl font-black uppercase italic text-white leading-tight">Ближайшие матчи</h2>
              <p className="text-slate-500 text-sm mt-3">Следующие игры группового этапа.</p>
              <Link
                to="/matches"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-court-400 hover:text-court-300 mt-6 transition-colors"
              >
                Всё расписание <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="overflow-x-auto">
              <div className="flex flex-col min-w-[600px]">
                {upcomingMatches.map((m) => (
                  <MatchRow key={m.id} match={m} teamA={teamsMap.get(m.teamAId)} teamB={teamsMap.get(m.teamBId)} />
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Команды: карусель на всю ширину сайта, заголовок в контейнере */}
      <section className="border-t border-slate-700 bg-slate-800/50 py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
            <h2 className="text-3xl font-black uppercase italic text-white">Команды турнира</h2>
            <span className="text-slate-500 text-sm">18 команд · 4 группы</span>
          </div>
        </div>
        <TeamCarousel teams={data.teams} />
      </section>

      {/* Дальше: список-ссылки с разделителями вместо трёх одинаковых карточек */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <h2 className="text-2xl font-black uppercase italic text-white mb-2">Дальше</h2>
        <div className="divide-y divide-slate-700 border-y border-slate-700 mt-8">
          <Link to="/bracket" className="group flex items-center justify-between py-6 hover:pl-2 transition-all">
            <div>
              <span className="font-bold text-white text-lg">Сетка плей-офф</span>
              <p className="text-slate-500 text-sm mt-1">1/4 финала, полуфиналы, матч за 3-е место и финал</p>
            </div>
            <ArrowRight className="h-5 w-5 text-slate-600 group-hover:text-court-400 transition-colors shrink-0" />
          </Link>
          <Link to="/players" className="group flex items-center justify-between py-6 hover:pl-2 transition-all">
            <div>
              <span className="font-bold text-white text-lg">Рейтинг бомбардиров</span>
              <p className="text-slate-500 text-sm mt-1">Лидеры по очкам среди всех игроков турнира</p>
            </div>
            <ArrowRight className="h-5 w-5 text-slate-600 group-hover:text-court-400 transition-colors shrink-0" />
          </Link>
          <Link to="/awards" className="group flex items-center justify-between py-6 hover:pl-2 transition-all">
            <div>
              <span className="font-bold text-white text-lg">Индивидуальные награды</span>
              <p className="text-slate-500 text-sm mt-1">Лучший игрок, защитник и бомбардир турнира</p>
            </div>
            <ArrowRight className="h-5 w-5 text-slate-600 group-hover:text-court-400 transition-colors shrink-0" />
          </Link>
        </div>
      </section>
    </div>
  )
}
