import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { trackVisit } from '../data/store'
import { normalizeVisitPath } from '../lib/visitPath'

// Пингует сервер на каждой смене публичного маршрута. Админку не считаем —
// это мы сами, в статистике посетителей она только шумит
export function TrackVisit() {
  const { pathname } = useLocation()

  useEffect(() => {
    if (pathname.startsWith('/admin')) return
    trackVisit(normalizeVisitPath(pathname))
  }, [pathname])

  return null
}
