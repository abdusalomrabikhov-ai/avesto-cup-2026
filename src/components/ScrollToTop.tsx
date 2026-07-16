import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

// react-router не скроллит наверх сам при смене маршрута — делаем это вручную
export function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}
