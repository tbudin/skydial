import { MAX_YEAR, MIN_YEAR } from './bodies.js'
import { civilParts, daysInMonth, zonedToUtc } from './time.js'

/** A date input's YYYY-MM-DD in the observer's zone, preserving local time. */
export function selectCivilDate(value: string, previousTimeMs: number, timeZone: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const [year, month, day] = value.split('-').map(Number)
  if (year < MIN_YEAR || year > MAX_YEAR || month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month)) return null
  const previous = civilParts(previousTimeMs, timeZone)
  const result = zonedToUtc(timeZone, year, month, day, previous.hour, previous.minute, previous.second)
  return Math.min(Date.UTC(MAX_YEAR + 1, 0, 1) - 1, Math.max(Date.UTC(MIN_YEAR, 0, 1), result))
}

export function civilDateValue(timeMs: number, timeZone: string): string {
  const p = civilParts(timeMs, timeZone)
  return `${String(p.year).padStart(4, '0')}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`
}
