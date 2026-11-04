import { civilParts } from './time.js'
import { parseCalendarDate, formatCalendarDate, parseLocalTime, type CalendarDate, type LocalTime } from './values.js'

export interface PickerAvailability {
  /** Receives a calendar date in the picker's place, never a UTC-converted date. */
  isDateUnavailable?: (date: CalendarDate) => boolean
  isTimeUnavailable?: (time: LocalTime, date: CalendarDate) => boolean
}
export function isPickerTimeAvailable(time: number, zone: string, rules: PickerAvailability = {}): boolean {
  if (!Number.isFinite(time)) return false
  if (!rules.isDateUnavailable && !rules.isTimeUnavailable) return true
  const p = civilParts(time, zone)
  const date = { year: p.year, month: p.month, day: p.day }
  return !rules.isDateUnavailable?.(date) && !rules.isTimeUnavailable?.({ hour: p.hour, minute: p.minute, second: p.second }, date)
}
export interface AvailabilityRules {
  /** Sunday = 0. Omit to allow every weekday. */
  weekdays?: readonly number[]
  excludedDates?: readonly string[]
  /** Local intervals, inclusive start and exclusive end. Overnight intervals are supported. */
  hours?: readonly { start: string; end: string }[]
}
/** Convenience rules for business days/hours; compose callbacks for server availability. */
export function createAvailability({ weekdays, excludedDates = [], hours }: AvailabilityRules): PickerAvailability {
  if (weekdays?.some((day) => !Number.isInteger(day) || day < 0 || day > 6)) throw new RangeError('Weekdays must be integers from 0 to 6.')
  const excluded = new Set(excludedDates.map((date) => formatCalendarDate(parseCalendarDate(date))))
  const seconds = (time: LocalTime) => time.hour * 3600 + time.minute * 60 + time.second
  const intervals = hours?.map(({ start, end }) => ({ start: seconds(parseLocalTime(start)), end: seconds(parseLocalTime(end)) }))
  return {
    isDateUnavailable: weekdays !== undefined || excluded.size ? (date) => {
      const key = `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`
      return excluded.has(key) || Boolean(weekdays && !weekdays.includes(new Date(Date.UTC(date.year, date.month - 1, date.day)).getUTCDay()))
    } : undefined,
    isTimeUnavailable: intervals ? (time) => !intervals.some(({ start, end }) => start < end ? seconds(time) >= start && seconds(time) < end : start > end && (seconds(time) >= start || seconds(time) < end)) : undefined,
  }
}
