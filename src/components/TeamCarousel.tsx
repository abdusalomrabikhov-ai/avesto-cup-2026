import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Team } from '../types'
import { TeamLogo } from './TeamLogo'

const CARD_STEP = 220 // px на одну "карточку" — шаг автопрокрутки и стрелок
const AUTO_ADVANCE_MS = 3000

// Тройной список: скроллим только по среднему сегменту, при выходе за его границы
// незаметно (без анимации) перескакиваем на эквивалентную позицию в среднем сегменте — иллюзия бесконечной карусели
export function TeamCarousel({ teams }: { teams: Team[] }) {
  const trackRef = useRef<HTMLDivElement>(null)

  const tripled = [...teams, ...teams, ...teams]

  // Ширину сегмента меряем каждый раз заново (а не один раз при монтировании) — логотипы
  // догружаются асинхронно и scrollWidth на момент монтирования может быть ещё не финальным
  const wrapIfNeeded = () => {
    const track = trackRef.current
    if (!track) return
    const segmentWidth = track.scrollWidth / 3
    if (!segmentWidth) return

    if (track.scrollLeft < segmentWidth * 0.5) {
      track.scrollLeft += segmentWidth
    } else if (track.scrollLeft > segmentWidth * 1.5) {
      track.scrollLeft -= segmentWidth
    }
  }

  const scrollBy = (dir: 1 | -1) => {
    trackRef.current?.scrollBy({ left: dir * CARD_STEP * 3, behavior: 'smooth' })
  }

  // Инициализация: встаём в начало среднего сегмента
  useEffect(() => {
    const track = trackRef.current
    if (!track || teams.length === 0) return
    track.scrollLeft = track.scrollWidth / 3
  }, [teams.length])

  // Автопрокрутка на один шаг каждые 3 секунды, с паузой при наведении
  useEffect(() => {
    const track = trackRef.current
    if (!track || teams.length === 0) return

    let paused = false
    const onEnter = () => { paused = true }
    const onLeave = () => { paused = false }
    track.addEventListener('mouseenter', onEnter)
    track.addEventListener('mouseleave', onLeave)

    const id = setInterval(() => {
      if (!paused) scrollBy(1)
    }, AUTO_ADVANCE_MS)

    return () => {
      clearInterval(id)
      track.removeEventListener('mouseenter', onEnter)
      track.removeEventListener('mouseleave', onLeave)
    }
  }, [teams.length])

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => scrollBy(-1)}
        aria-label="Прокрутить назад"
        className="hidden sm:flex absolute left-2 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full border border-slate-700 bg-slate-950 items-center justify-center text-slate-300 hover:border-court-400 hover:text-court-400 transition-colors"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      <div
        ref={trackRef}
        onScroll={wrapIfNeeded}
        className="flex gap-10 overflow-x-auto snap-x snap-mandatory px-6 sm:px-16 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {tripled.map((team, idx) => (
          <Link
            key={`${team.id}-${idx}`}
            to={`/teams/${team.id}`}
            className="flex flex-col items-center gap-4 text-center group shrink-0 w-36 sm:w-44 snap-start"
          >
            <TeamLogo
              team={team}
              size="2xl"
              className="!h-28 !w-28 sm:!h-36 sm:!w-36 border-2 group-hover:border-court-400 transition-colors"
            />
            <span className="font-bold uppercase text-white group-hover:text-court-400 transition-colors truncate w-full">
              {team.name}
            </span>
          </Link>
        ))}
      </div>

      <button
        type="button"
        onClick={() => scrollBy(1)}
        aria-label="Прокрутить вперёд"
        className="hidden sm:flex absolute right-2 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full border border-slate-700 bg-slate-950 items-center justify-center text-slate-300 hover:border-court-400 hover:text-court-400 transition-colors"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  )
}
