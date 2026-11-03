import type { CalendarScale, YearScale } from './clockScales.js'
import { civilParts, daysInMonth, zonedToUtc } from './time.js'
import { MAX_TIME_MS, MIN_TIME_MS } from '../sim/clock.js'

export const clampTime = (ms: number) => Math.min(MAX_TIME_MS, Math.max(MIN_TIME_MS, ms))
const distance = (a: number, b: number) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)))

/** Pick the printed calendar tick nearest a longitude, preserving local time. */
export function dateAtLongitude(lon: number, scale: CalendarScale, current: number): number {
  const tick = scale.ticks.slice(0, -1).reduce((best, candidate) => distance(candidate.lon, lon) < distance(best.lon, lon) ? candidate : best)
  const p = civilParts(current, scale.timeZone)
  return clampTime(zonedToUtc(scale.timeZone, scale.year, tick.month, tick.day, p.hour, p.minute, p.second))
}

/** Pick a printed planetary-year tick, retaining the month/day and local time. */
export function yearAtLongitude(lon: number, scale: YearScale, current: number, timeZone: string): number {
  const tick = scale.markers.reduce((best, candidate) => distance(candidate.lon, lon) < distance(best.lon, lon) ? candidate : best)
  return changeCivilYear(tick.year, current, timeZone)
}

export function changeCivilYear(year: number, current: number, timeZone: string): number {
  const p = civilParts(current, timeZone)
  const y = Math.min(2400, Math.max(1600, year))
  return clampTime(zonedToUtc(timeZone, y, p.month, Math.min(p.day, daysInMonth(y, p.month)), p.hour, p.minute, p.second))
}

/** A globe-width swipe spans the supplied minutes, snapped to the requested duration. */
export function timeFromEarthDrag(start: number, deltaPx: number, width: number, minutesPerWidth = 1440, stepMs = 60000): number {
  return clampTime(start + Math.round(deltaPx / Math.max(1, width) * minutesPerWidth * 60000 / stepMs) * stepMs)
}
