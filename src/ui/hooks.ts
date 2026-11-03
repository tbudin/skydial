import { useEffect, useState, useSyncExternalStore } from 'react'
import { useCelestialClock } from '../sim/hooks.js'

export function useClockState() {
  const simClock = useCelestialClock()
  return useSyncExternalStore(simClock.subscribe, simClock.getState, simClock.getState)
}

/** Simulated time, refreshed for the UI at a modest rate (3D runs per frame). */
export function useSimNow(intervalMs = 100) {
  const simClock = useCelestialClock()
  const [sample, setSample] = useState(() => ({ clock: simClock, now: simClock.now() }))
  const now = sample.clock === simClock ? sample.now : simClock.now()
  useEffect(() => {
    let id = 0
    const tick = () => {
      const next = simClock.now()
      setSample((previous) => previous.clock === simClock && previous.now === next ? previous : { clock: simClock, now: next })
    }
    id = window.setInterval(tick, intervalMs)
    const unsub = simClock.subscribe(tick)
    return () => {
      window.clearInterval(id)
      unsub()
    }
  }, [intervalMs, simClock])
  return now
}
