import { Link } from 'react-router-dom'
import type { Team } from '../types'
import { TeamLogo } from './TeamLogo'

interface Props {
  team: Team
  size?: 'sm' | 'md' | 'lg'
  linkToTeam?: boolean
}

const SIZE_MAP = { sm: 'sm', md: 'md', lg: 'xl' } as const

export function TeamBadge({ team, size = 'md', linkToTeam = true }: Props) {
  const content = (
    <span className="flex items-center gap-3 min-w-0">
      <TeamLogo team={team} size={SIZE_MAP[size]} shape="square" />
      <span className="truncate font-medium text-slate-100">{team.name}</span>
    </span>
  )

  if (!linkToTeam) return content

  return (
    <Link to={`/teams/${team.id}`} className="block hover:text-court-400 transition-colors min-w-0">
      {content}
    </Link>
  )
}
