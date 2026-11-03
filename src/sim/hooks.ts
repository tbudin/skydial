import { useContext } from 'react'
import { ClockContext } from './context.js'

export function useCelestialTime() {
  const context = useContext(ClockContext)
  if (!context) throw new Error('Celestial widgets must be inside a CelestialProvider.')
  return context
}

export function useCelestialClock() {
  return useCelestialTime().clock
}
