import { describe, expect, it } from 'vitest'
import { parseCalendarDate, formatCalendarDate, parseLocalTime, formatLocalTime, parseZonedDateTime, formatZonedDateTime, zonedDateTimeToInstant, instantToZonedDateTime, serializeCelestialValue, celestialValueToInstant } from './values.js'

describe('explicit civil values and transport', () => {
  it('keeps birthdays and local times independent of a time zone', () => {
    const birthday = parseCalendarDate('2028-02-29')
    expect(formatCalendarDate(birthday)).toBe('2028-02-29')
    const time = parseLocalTime('09:05')
    expect(formatLocalTime(time)).toBe('09:05:00')
    expect(serializeCelestialValue({ kind: 'date', value: birthday })).toBe('2028-02-29')
    expect(() => celestialValueToInstant({ kind: 'time', value: time }, { timeZone: 'UTC' })).toThrow(TypeError)
    expect(celestialValueToInstant({ kind: 'date', value: birthday }, { timeZone: 'Asia/Singapore' })).toBe(Date.UTC(2028, 1, 28, 16))
  })
  it('rejects rollover, invalid dates, invalid hours and unknown zones', () => {
    for (const text of ['2027-02-29', '2026-04-31', '1599-12-31', '2026-1-02', '2026-13-01']) expect(() => parseCalendarDate(text)).toThrow(RangeError)
    for (const text of ['24:00', '12:60', '12:00:60', '1:00', '12:00:00.1234']) expect(() => parseLocalTime(text)).toThrow(RangeError)
    expect(() => parseZonedDateTime('2026-01-01T12:00[Unknown/Zone]')).toThrow(RangeError)
  })
  it('disambiguates a repeated DST hour and preserves its offset in transport', () => {
    const wall = parseZonedDateTime('2026-11-01T01:30:00[America/New_York]')
    expect(zonedDateTimeToInstant(wall, 'earlier')).toBe(Date.UTC(2026, 10, 1, 5, 30))
    expect(zonedDateTimeToInstant(wall, 'later')).toBe(Date.UTC(2026, 10, 1, 6, 30))
    expect(zonedDateTimeToInstant(wall)).toBe(Date.UTC(2026, 10, 1, 5, 30))
    expect(() => zonedDateTimeToInstant(wall, 'reject')).toThrow(/Ambiguous/)
    for (const hour of [5, 6]) {
      const instant = Date.UTC(2026, 10, 1, hour, 30, 2, 123)
      const text = formatZonedDateTime(instantToZonedDateTime(instant, 'America/New_York'))
      expect(text).toContain(hour === 5 ? '-04:00[' : '-05:00[')
      expect(zonedDateTimeToInstant(parseZonedDateTime(text))).toBe(instant)
    }
    expect(() => zonedDateTimeToInstant({ ...wall, offset: '+00:00' })).toThrow(/offset/)
  })
  it('handles a missing DST hour, half-hour transitions and a skipped civil date', () => {
    const gap = parseZonedDateTime('2026-03-08T02:30:00[America/New_York]')
    expect(zonedDateTimeToInstant(gap, 'earlier')).toBe(Date.UTC(2026, 2, 8, 6, 30))
    expect(zonedDateTimeToInstant(gap, 'later')).toBe(Date.UTC(2026, 2, 8, 7, 30))
    expect(zonedDateTimeToInstant(gap)).toBe(Date.UTC(2026, 2, 8, 7, 30))
    expect(() => zonedDateTimeToInstant(gap, 'reject')).toThrow(/Nonexistent/)
    const half = parseZonedDateTime('2026-10-04T02:15:00[Australia/Lord_Howe]')
    expect(zonedDateTimeToInstant(half, 'later') - zonedDateTimeToInstant(half, 'earlier')).toBe(1800000)
    const skipped = parseZonedDateTime('2011-12-30T12:00:00[Pacific/Apia]')
    expect(zonedDateTimeToInstant(skipped, 'later') - zonedDateTimeToInstant(skipped, 'earlier')).toBe(86400000)
  })
})
