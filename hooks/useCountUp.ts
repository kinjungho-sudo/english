import { useEffect, useState } from 'react'

export function useCountUp(target: number, duration = 1200, delay = 400) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => {
      const start = performance.now()
      const raf = (now: number) => {
        const p = Math.min((now - start) / duration, 1)
        const ease = 1 - Math.pow(1 - p, 3) // ease-out-cubic
        setValue(Math.round(ease * target))
        if (p < 1) requestAnimationFrame(raf)
      }
      requestAnimationFrame(raf)
    }, delay)
    return () => clearTimeout(t)
  }, [target, duration, delay])
  return value
}
