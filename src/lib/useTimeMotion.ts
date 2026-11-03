import { useCallback, useEffect, useRef } from 'react'
import { useCelestialTime } from '../sim/hooks.js'
import { clampTime } from '../astro/selection.js'

/** Animate a click through astronomical time; direct drags remain under the pointer. */
export function useTimeMotion() {
  const { clock, selectDate, readOnly, motion } = useCelestialTime()
  const frame = useRef(0)
  const latest = useRef(selectDate)
  useEffect(() => { latest.current = selectDate }, [selectDate])
  const cancel = useCallback(function cancelFrame() {
    cancelAnimationFrame(frame.current)
    frame.current = 0
    motion.finish(cancelFrame)
  }, [motion])
  useEffect(() => cancel, [cancel])
  const choose = useCallback((target: number, animate = false) => {
    if (readOnly) return
    motion.cancel()
    cancel()
    const end = clampTime(target)
    if (!animate || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      latest.current(end)
      return
    }
    motion.start(cancel, end)
    const from = clock.now()
    const started = performance.now()
    const tick = (at: number) => {
      const p = Math.min(1, (at - started) / 420)
      const eased = p * p * (3 - 2 * p)
      latest.current(p === 1 ? end : from + (end - from) * eased, true)
      if (p < 1) frame.current = requestAnimationFrame(tick)
      else motion.finish(cancel)
    }
    frame.current = requestAnimationFrame(tick)
  }, [clock, readOnly, cancel, motion])
  const selectionNow = () => motion.target ?? clock.now()
  return { choose, cancel, readOnly, selectionNow }
}
