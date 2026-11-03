import { describe, expect, it } from 'vitest'
import { pickerUnits, pickerBounds, pickerStep, pickerUnitAllowed, pickerFormValue, setPickerUnit, stepPickerUnit } from './picker.js'
import { civilParts, zonedToUtc } from './time.js'
import { yearScale } from './clockScales.js'
import { helioLongitude } from './ephemeris.js'

describe('composable picker units and civil selection', () => {
  it('supports a year alone, time precision and ordered custom units', () => {
    expect(pickerUnits({ precision: 'year' })).toEqual(['year'])
    expect(pickerUnits({ mode: 'time', precision: 'second' })).toEqual(['hour', 'minute', 'second'])
    expect(pickerUnits({ units: ['minute', 'year', 'minute'] })).toEqual(['year', 'minute'])
    expect(() => pickerUnits({ units: [] })).toThrow(RangeError)
    expect(() => pickerStep('minute', { minute: 0 })).toThrow(RangeError)
    expect(() => pickerBounds({ min: Date.UTC(2030, 0), max: Date.UTC(2026, 0) })).toThrow(RangeError)
  })
  it('clamps month ends and leap days while preserving hidden local time', () => {
    const start = zonedToUtc('Asia/Singapore', 2028, 1, 31, 23, 59, 17)
    const leap = setPickerUnit(start, 'month', 2, 'Asia/Singapore')!
    expect(civilParts(leap, 'Asia/Singapore')).toMatchObject({ year: 2028, month: 2, day: 29, hour: 23, minute: 59, second: 17 })
    expect(civilParts(setPickerUnit(leap, 'year', 2029, 'Asia/Singapore')!, 'Asia/Singapore')).toMatchObject({ year: 2029, month: 2, day: 28 })
    expect(setPickerUnit(start, 'minute', 60, 'Asia/Singapore')).toBeNull()
  })
  it('steps through civil midnight and daylight-saving changes', () => {
    const midnight = zonedToUtc('Asia/Singapore', 2026, 12, 31, 23, 45)
    expect(civilParts(stepPickerUnit(midnight, 'minute', 1, 'Asia/Singapore', { minute: 15 }), 'Asia/Singapore')).toMatchObject({ year: 2027, month: 1, day: 1, hour: 0, minute: 0 })
    const before = zonedToUtc('America/New_York', 2024, 3, 9, 12)
    const after = stepPickerUnit(before, 'day', 1, 'America/New_York')
    expect(after - before).toBe(23 * 3600000)
    expect(civilParts(after, 'America/New_York').hour).toBe(12)
    const gap = zonedToUtc('America/New_York', 2024, 3, 10, 1, 30)
    expect(civilParts(stepPickerUnit(gap, 'hour', 1, 'America/New_York'), 'America/New_York')).toMatchObject({ hour: 3, minute: 30 })
  })
  it('allows partial date buckets and enforces exact instant bounds', () => {
    const now = Date.UTC(2026, 5, 20, 12)
    const range = { min: Date.UTC(2026, 5, 15, 14), max: Date.UTC(2026, 6, 2, 16) }
    expect(pickerUnitAllowed(now, 'year', 2026, 'UTC', range)).toBe(true)
    expect(pickerUnitAllowed(now, 'month', 5, 'UTC', range)).toBe(false)
    expect(pickerUnitAllowed(now, 'month', 6, 'UTC', range)).toBe(true)
    expect(pickerUnitAllowed(now, 'month', 7, 'UTC', range)).toBe(true)
    expect(setPickerUnit(now, 'day', 15, 'UTC', range)).toBe(range.min)
    expect(stepPickerUnit(range.max, 'minute', 1, 'UTC', {}, range)).toBe(range.max)
  })
  it('submits the configured civil precision rather than an incidental hidden date', () => {
    const now = Date.UTC(2026, 2, 20, 12, 5, 9)
    expect(pickerFormValue(now, 'Asia/Singapore', ['year'])).toBe('2026')
    expect(pickerFormValue(now, 'Asia/Singapore', ['year', 'month'])).toBe('2026-03')
    expect(pickerFormValue(now, 'Asia/Singapore', ['hour', 'minute', 'second'])).toBe('20:05:09')
    expect(pickerFormValue(now, 'Asia/Singapore', ['day', 'hour', 'minute'])).toBe('2026-03-20T20:05')
  })
  it('calibrates picker year marks to the same month and time as year selection', () => {
    const reference = { month: 9, day: 16, hour: 21, minute: 6, second: 0 }
    const marker = yearScale('jupiter', 2026, 'Europe/London', reference).markers.find((item) => item.year === 2030)!
    expect(marker.startMs).toBe(zonedToUtc('Europe/London', 2030, 9, 16, 21, 6))
    expect(marker.lon).toBe(helioLongitude('Jupiter', marker.startMs))
  })
})
