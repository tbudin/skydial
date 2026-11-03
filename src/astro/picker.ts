import { MIN_TIME_MS, MAX_TIME_MS } from '../sim/clock.js'
import { civilParts, daysInMonth, zonedToUtc } from './time.js'

export const PICKER_UNITS = ['year', 'month', 'day', 'hour', 'minute', 'second'] as const
export type PickerUnit = typeof PICKER_UNITS[number]
export type PickerMode = 'date' | 'time' | 'datetime'
export type PickerSteps = Partial<Record<PickerUnit, number>>
export interface PickerBounds { min?: Date | number; max?: Date | number }
export interface PickerConfiguration extends PickerBounds {
  mode?: PickerMode
  /** Finest unit, e.g. year for a year-only field. Explicit units take precedence. */
  precision?: PickerUnit
  units?: readonly PickerUnit[]
  steps?: PickerSteps
}

export function pickerUnits({ mode = 'date', precision, units }: PickerConfiguration): PickerUnit[] {
  if (units) {
    if (!units.length || units.some((unit) => !PICKER_UNITS.includes(unit))) throw new RangeError('Choose at least one valid picker unit.')
    return PICKER_UNITS.filter((unit) => units.includes(unit))
  }
  const end = precision ? PICKER_UNITS.indexOf(precision) : mode === 'date' ? 2 : 4
  if (end < 0) throw new RangeError('Unknown picker precision.')
  const start = mode === 'time' && end >= 3 ? 3 : 0
  return PICKER_UNITS.slice(start, end + 1)
}

export function pickerBounds({ min, max }: PickerBounds = {}) {
  const lower = min === undefined ? MIN_TIME_MS : Number(min)
  const upper = max === undefined ? MAX_TIME_MS : Number(max)
  if (!Number.isFinite(lower) || !Number.isFinite(upper) || lower < MIN_TIME_MS || upper > MAX_TIME_MS || lower > upper) throw new RangeError('Picker bounds must be ordered dates within 1600–2400.')
  return { min: lower, max: upper }
}

export function pickerStep(unit: PickerUnit, steps: PickerSteps = {}): number {
  const step = steps[unit] ?? 1
  const maximum = { year: 800, month: 12, day: 31, hour: 24, minute: 60, second: 60 }[unit]
  if (!Number.isInteger(step) || step < 1 || step > maximum) throw new RangeError(`Invalid ${unit} step.`)
  return step
}

export function clampPickerTime(time: number, bounds: PickerBounds): number {
  const range = pickerBounds(bounds)
  return Math.min(range.max, Math.max(range.min, time))
}

/** Set a civil unit, preserving hidden units and clamping month-end dates. */
export function setPickerUnit(time: number, unit: PickerUnit, value: number, zone: string, bounds: PickerBounds = {}) {
  const p = { ...civilParts(time, zone), [unit]: value }
  if (!Number.isInteger(value)) return null
  const maximum = { year: 2400, month: 12, day: daysInMonth(p.year, p.month), hour: 23, minute: 59, second: 59 }[unit]
  if (value < (unit === 'year' ? 1600 : ['month', 'day'].includes(unit) ? 1 : 0) || value > maximum) return null
  p.day = Math.min(p.day, daysInMonth(p.year, p.month))
  return clampPickerTime(zonedToUtc(zone, p.year, p.month, p.day, p.hour, p.minute, p.second), bounds)
}

/** Calendar steps preserve local time; clock-unit steps pass through DST gaps and folds. */
export function stepPickerUnit(time: number, unit: PickerUnit, direction: number, zone: string, steps: PickerSteps = {}, bounds: PickerBounds = {}) {
  const p = civilParts(time, zone)
  const amount = pickerStep(unit, steps) * direction
  if (unit === 'hour' || unit === 'minute' || unit === 'second') {
    const duration = { hour: 3600000, minute: 60000, second: 1000 }[unit]
    return clampPickerTime(time + amount * duration, bounds)
  }
  if (unit === 'year') return setPickerUnit(time, unit, Math.min(2400, Math.max(1600, p.year + amount)), zone, bounds)!
  if (unit === 'month') {
    const month = new Date(Date.UTC(p.year, p.month - 1 + amount, 1))
    return clampPickerTime(zonedToUtc(zone, month.getUTCFullYear(), month.getUTCMonth() + 1, Math.min(p.day, daysInMonth(month.getUTCFullYear(), month.getUTCMonth() + 1)), p.hour, p.minute, p.second), bounds)
  }
  const next = new Date(Date.UTC(p.year, p.month - 1, p.day + amount, p.hour, p.minute, p.second))
  return clampPickerTime(zonedToUtc(zone, next.getUTCFullYear(), next.getUTCMonth() + 1, next.getUTCDate(), next.getUTCHours(), next.getUTCMinutes(), next.getUTCSeconds()), bounds)
}

/** Whether a unit's civil interval intersects the allowed instant range. */
export function pickerUnitAllowed(time: number, unit: PickerUnit, value: number, zone: string, bounds: PickerBounds = {}) {
  const p = { ...civilParts(time, zone), [unit]: value }
  const index = PICKER_UNITS.indexOf(unit)
  const start = { ...p }
  if (index < 1) start.month = 1
  if (index < 2) start.day = 1
  if (index < 3) start.hour = 0
  if (index < 4) start.minute = 0
  if (index < 5) start.second = 0
  const end = new Date(Date.UTC(start.year, start.month - 1, start.day, start.hour, start.minute, start.second))
  if (unit === 'year') end.setUTCFullYear(end.getUTCFullYear() + 1)
  if (unit === 'month') end.setUTCMonth(end.getUTCMonth() + 1)
  if (unit === 'day') end.setUTCDate(end.getUTCDate() + 1)
  if (unit === 'hour') end.setUTCHours(end.getUTCHours() + 1)
  if (unit === 'minute') end.setUTCMinutes(end.getUTCMinutes() + 1)
  if (unit === 'second') end.setUTCSeconds(end.getUTCSeconds() + 1)
  const from = zonedToUtc(zone, start.year, start.month, start.day, start.hour, start.minute, start.second)
  const to = zonedToUtc(zone, end.getUTCFullYear(), end.getUTCMonth() + 1, end.getUTCDate(), end.getUTCHours(), end.getUTCMinutes(), end.getUTCSeconds()) - 1
  const range = pickerBounds(bounds)
  return from <= range.max && to >= range.min
}

/** Civil form values follow the selected precision; callbacks still receive a complete Date. */
export function pickerFormValue(time: number, zone: string, units: readonly PickerUnit[]) {
  const p = civilParts(time, zone)
  const pad = (n: number) => String(n).padStart(2, '0')
  const hasDate = units.some((unit) => ['year', 'month', 'day'].includes(unit))
  const hasTime = units.some((unit) => ['hour', 'minute', 'second'].includes(unit))
  let date = String(p.year)
  if (units.includes('month') || units.includes('day')) date += `-${pad(p.month)}`
  if (units.includes('day')) date += `-${pad(p.day)}`
  let clock = pad(p.hour)
  if (units.includes('minute') || units.includes('second')) clock += `:${pad(p.minute)}`
  if (units.includes('second')) clock += `:${pad(p.second)}`
  return hasDate && hasTime ? `${date}T${clock}` : hasDate ? date : clock
}
