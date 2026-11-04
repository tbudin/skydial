import { describe, expect, it } from 'vitest'
import { createAvailability } from './availability.js'
import { pickerTimeAllowed } from './picker.js'
import { validatePickerRange } from './range.js'

const business = createAvailability({ weekdays: [1, 2, 3, 4, 5], hours: [{ start: '09:00', end: '17:00' }], excludedDates: ['2026-11-05'] })
describe('availability across civil dates, times and intervals', () => {
  it('uses the selected zone for weekdays, exceptions and exclusive closing hours', () => {
    expect(pickerTimeAllowed(Date.UTC(2026, 10, 4, 1), 'Asia/Singapore', business)).toBe(true)
    expect(pickerTimeAllowed(Date.UTC(2026, 10, 4, 9), 'Asia/Singapore', business)).toBe(false)
    expect(pickerTimeAllowed(Date.UTC(2026, 10, 5, 1), 'Asia/Singapore', business)).toBe(false)
    expect(pickerTimeAllowed(Date.UTC(2026, 10, 7, 1), 'Asia/Singapore', business)).toBe(false)
    expect(pickerTimeAllowed(Date.UTC(2026, 10, 4, 1), 'America/New_York', business)).toBe(false)
  })
  it('supports overnight hours, explicit closures and bounds', () => {
    const overnight = createAvailability({ hours: [{ start: '22:00', end: '06:00' }] })
    expect(pickerTimeAllowed(Date.UTC(2026, 10, 4, 2), 'UTC', overnight)).toBe(true)
    expect(pickerTimeAllowed(Date.UTC(2026, 10, 4, 12), 'UTC', overnight)).toBe(false)
    expect(pickerTimeAllowed(Date.UTC(2026, 10, 4, 2), 'UTC', { ...overnight, min: Date.UTC(2026, 10, 4, 3) })).toBe(false)
    expect(pickerTimeAllowed(Date.UTC(2026, 10, 4, 2), 'UTC', createAvailability({ hours: [] }))).toBe(false)
  })
  it('validates partial, ordered and duration-constrained ranges', () => {
    const start = Date.UTC(2026, 10, 4, 10)
    expect(validatePickerRange(null, 'UTC')).toBeNull()
    expect(validatePickerRange(null, 'UTC', {}, true)).toBe('incomplete')
    expect(validatePickerRange({ start, end: null }, 'UTC')).toBe('incomplete')
    expect(validatePickerRange({ start, end: start - 1 }, 'UTC')).toBe('order')
    expect(validatePickerRange({ start, end: start + 3600000 }, 'UTC', { minimumDuration: 7200000 })).toBe('duration')
    expect(validatePickerRange({ start, end: start + 3600000 }, 'UTC', { maximumDuration: 3600000 })).toBeNull()
  })
  it('rejects unavailable interior dates unless explicitly allowed and supports reservation overlap', () => {
    const range = { start: Date.UTC(2026, 10, 6, 10), end: Date.UTC(2026, 10, 9, 10) }
    const weekdays = createAvailability({ weekdays: [1, 2, 3, 4, 5] })
    expect(validatePickerRange(range, 'UTC', weekdays)).toBe('rangeUnavailable')
    expect(validatePickerRange(range, 'UTC', { ...weekdays, allowsNonContiguousRanges: true })).toBeNull()
    expect(validatePickerRange(range, 'UTC', { isRangeUnavailable: ({ start, end }) => start < Date.UTC(2026, 10, 8) && end > Date.UTC(2026, 10, 7) })).toBe('rangeUnavailable')
  })
})
