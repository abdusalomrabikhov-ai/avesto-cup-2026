import { Link } from 'react-router-dom'
import { Phone, Star } from 'lucide-react'
import type { Player } from '../types'

export function PlayerCard({ player }: { player: Player }) {
  return (
    <Link
      to={`/players/${player.id}`}
      className="group flex items-center gap-4 py-3 border-b border-slate-800/70 hover:pl-1 transition-all"
    >
      <span className="text-2xl font-black italic text-slate-700 group-hover:text-court-400 tabular-nums w-10 shrink-0 transition-colors">
        {player.number}
      </span>
      <div className="h-11 w-11 shrink-0 rounded-full bg-slate-800 overflow-hidden flex items-center justify-center">
        {player.photo ? (
          <img src={player.photo} alt={player.fullName} className="h-full w-full object-cover" />
        ) : (
          <span className="text-xs font-bold text-slate-500">{player.fullName.slice(0, 1)}</span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="font-semibold text-white truncate">{player.fullName}</p>
          {player.isCaptain && <Star className="h-3.5 w-3.5 text-gold-400 shrink-0" fill="currentColor" />}
        </div>
        <p className="text-xs text-slate-500 truncate">{player.position}</p>
      </div>
      {player.isCaptain && player.phone && (
        <span className="hidden sm:flex items-center gap-1 text-xs text-slate-500 shrink-0">
          <Phone className="h-3 w-3" />
          {player.phone}
        </span>
      )}
    </Link>
  )
}
