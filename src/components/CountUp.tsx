import { useEffect, useRef, useState } from 'react'

const DURATION_MS = 1200
const EASE_OUT = (t: number) => 1 - Math.pow(1 - t, 3)

interface Props {
  value: number
  format?: (n: number) => string
}

// Считает от 0 до value один раз при появлении на экране, затем остаётся на конечном значении
export function CountUp({ value, format = (n) => String(n) }: Props) {
  const [display, setDisplay] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    let frameId: number
    let started = false

    const animate = (startTime: number) => (now: number) => {
      const progress = Math.min((now - startTime) / DURATION_MS, 1)
      setDisplay(Math.round(value * EASE_OUT(progress)))
      if (progress < 1) frameId = requestAnimationFrame(animate(startTime))
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !started) {
          started = true
          frameId = requestAnimationFrame((t) => animate(t)(t))
          observer.disconnect()
        }
      },
      { threshold: 0.3 },
    )
    observer.observe(el)

    return () => {
      observer.disconnect()
      cancelAnimationFrame(frameId)
    }
  }, [value])

  return (
    <span ref={ref} className="tabular-nums">
      {format(display)}
    </span>
  )
}
