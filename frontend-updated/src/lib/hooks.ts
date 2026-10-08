import { useEffect, useState, type RefObject } from 'react'
import { useReducedMotion } from 'motion/react'

/** True while the referenced element is within (or near) the viewport. Used to pause offscreen loops. */
export function useOnScreen(ref: RefObject<Element | null>, margin = '120px') {
  const [on, setOn] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setOn(e.isIntersecting), { rootMargin: margin })
    io.observe(el)
    return () => io.disconnect()
  }, [ref, margin])
  return on
}

/** Autoplay is allowed when the user has not asked for reduced motion and the tab is visible. */
export function useAutoplay(ref: RefObject<Element | null>) {
  const reduced = useReducedMotion()
  const on = useOnScreen(ref)
  const [visible, setVisible] = useState(true)
  useEffect(() => {
    const h = () => setVisible(!document.hidden)
    document.addEventListener('visibilitychange', h)
    return () => document.removeEventListener('visibilitychange', h)
  }, [])
  return { running: !reduced && on && visible, reduced: !!reduced }
}
