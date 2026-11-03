import { useContext, useSyncExternalStore } from 'react'
import { ClockContext } from './context.js'

export function useCelestialTime() {
  const context = useContext(ClockContext)
  if (!context) throw new Error('Celestial widgets must be inside a CelestialProvider.')
  return context
}

export function useCelestialClock() {
  return useCelestialTime().clock
}

const noVisualClock = () => null

/** Internal renderer clock. Forms and callbacks always use the committed selection. */
export function useVisualClock() {
  const { clock, motion } = useCelestialTime()
  return useSyncExternalStore(motion.subscribe, motion.getVisualClock, noVisualClock) ?? clock
}
