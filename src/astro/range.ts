import { civilParts } from './time.js'
import { pickerTimeAllowed, type PickerConfiguration } from './picker.js'

export interface PickerDateRange { start: Date | number | null; end: Date | number | null }
export interface PickerRangeRules extends PickerConfiguration {
  /** Elapsed milliseconds, including DST. Omit to allow a same-day range. */
  minimumDuration?: number
  maximumDuration?: number
  allowsNonContiguousRanges?: boolean
  /** Validate whole intervals, e.g. for overlap with existing reservations. */
  isRangeUnavailable?: (range: { start: number; end: number }, timeZone: string) => boolean
}
export type PickerRangeError = 'incomplete' | 'order' | 'range' | 'duration' | 'rangeUnavailable' | null
export function validatePickerRange(value: PickerDateRange | null, timeZone: string, rules: PickerRangeRules = {}, required = false): PickerRangeError {
  for (const limit of [rules.minimumDuration, rules.maximumDuration]) if (limit !== undefined && (!Number.isFinite(limit) || limit < 0)) throw new RangeError('Range durations must be nonnegative milliseconds.')
  if (rules.minimumDuration !== undefined && rules.maximumDuration !== undefined && rules.minimumDuration > rules.maximumDuration) throw new RangeError('minimumDuration must not exceed maximumDuration.')
  if (!value || value.start === null && value.end === null) return required ? 'incomplete' : null
  if (value.start === null || value.end === null) return 'incomplete'
  const start = Number(value.start)
  const end = Number(value.end)
  if (!Number.isFinite(start) || !Number.isFinite(end)) return 'range'
  if (start > end) return 'order'
  if (!pickerTimeAllowed(start, timeZone, rules) || !pickerTimeAllowed(end, timeZone, rules)) return 'rangeUnavailable'
  if (end - start < (rules.minimumDuration ?? 0) || end - start > (rules.maximumDuration ?? Infinity)) return 'duration'
  if (rules.isRangeUnavailable?.({ start, end }, timeZone)) return 'rangeUnavailable'
  if (rules.isDateUnavailable && !rules.allowsNonContiguousRanges) {
    const first = civilParts(start, timeZone)
    const last = civilParts(end, timeZone)
    const to = Date.UTC(last.year, last.month - 1, last.day)
    for (let day = Date.UTC(first.year, first.month - 1, first.day); day <= to; day += 86400000) {
      const date = new Date(day)
      if (rules.isDateUnavailable({ year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate() })) return 'rangeUnavailable'
    }
  }
  return null
}
