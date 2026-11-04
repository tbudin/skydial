import { useCallback, useEffect, useRef } from 'react'
import { useCelestialTime } from '../sim/hooks.js'
import { clampTime } from '../astro/selection.js'
import { SimClock } from '../sim/clock.js'

/** Commit once, then animate the celestial view. Direct drags stay under the pointer. */
export function useTimeMotion() {
  const { clock, selectDate, readOnly, motion, canSelectDate } = useCelestialTime()
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
    if (readOnly || canSelectDate && !canSelectDate(clampTime(target))) return
    const from = (motion.getVisualClock() ?? clock).now()
    motion.cancel()
    cancel()
    const end = clampTime(target)
    latest.current(end)
    if (!animate || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return
    }
    const visualClock = new SimClock(from)
    motion.start(cancel, end, visualClock)
    const started = performance.now()
    const tick = (at: number) => {
      const p = Math.min(1, (at - started) / 260)
      const eased = p * p * (3 - 2 * p)
      visualClock.setTime(p === 1 ? end : from + (end - from) * eased)
      if (p < 1) frame.current = requestAnimationFrame(tick)
      else motion.finish(cancel)
    }
    frame.current = requestAnimationFrame(tick)
  }, [clock, readOnly, cancel, motion, canSelectDate])
  const selectionNow = () => motion.target ?? clock.now()
  return { choose, cancel, readOnly, selectionNow }
}
