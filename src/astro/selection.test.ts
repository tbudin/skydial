import { describe, expect, it } from 'vitest'
import { calendarScale, yearScale } from './clockScales.js'
import { civilParts } from './time.js'
import { changeCivilYear, dateAtLongitude, timeFromEarthDrag, yearAtLongitude } from './selection.js'

const start = Date.parse('2026-03-20T12:00:00Z')
const zone = 'Asia/Singapore'
describe('celestial direct selection', () => {
  it('selects a calendar-ring tick while retaining local time', () => {
    const scale = calendarScale(2026, zone)
    const june = scale.ticks.find((tick) => tick.month === 6 && tick.day === 15)!
    expect(new Date(dateAtLongitude(june.lon, scale, start)).toISOString()).toBe('2026-06-15T12:00:00.000Z')
  })
  it('wraps the circular calendar correctly across zero longitude', () => {
    const scale = calendarScale(2026, zone)
    for (const tick of [scale.ticks[0], scale.ticks[180], scale.ticks[364]]) {
      expect(dateAtLongitude(tick.lon + Math.PI * 2, scale, start)).toBe(dateAtLongitude(tick.lon, scale, start))
    }
  })
  it('selects Jupiter and Saturn year ticks and retains month and time', () => {
    for (const planet of ['jupiter', 'saturn'] as const) {
      const scale = yearScale(planet, 2026, zone)
      const marker = scale.markers.find((entry) => entry.year === 2030)!
      expect(new Date(yearAtLongitude(marker.lon, scale, start, zone)).toISOString()).toBe('2030-03-20T12:00:00.000Z')
    }
  })
  it('clamps a leap day when selecting a non-leap year', () => {
    const next = changeCivilYear(2027, Date.parse('2028-02-29T12:00:00Z'), zone)
    const parts = civilParts(next, zone)
    expect([parts.year, parts.month, parts.day, parts.hour]).toEqual([2027, 2, 28, 20])
  })
  it('rotates through midnight and advances the day', () => {
    expect(new Date(timeFromEarthDrag(Date.parse('2026-03-20T15:00:00Z'), 100, 400)).toISOString()).toBe('2026-03-20T21:00:00.000Z')
    expect(civilParts(timeFromEarthDrag(Date.parse('2026-03-20T15:00:00Z'), 100, 400), zone).day).toBe(21)
  })
  it('makes a minute-mode swipe 24 times finer and snaps to a whole minute', () => {
    expect(timeFromEarthDrag(start, 75, 300, 60)).toBe(start + 15 * 60000)
    expect(timeFromEarthDrag(start, 3, 300, 60)).toBe(start + 60000)
    expect(timeFromEarthDrag(start, -3, 300, 60)).toBe(start - 60000)
    expect(timeFromEarthDrag(start, 75, 300)).toBe(start + 6 * 3600000)
  })
  it('allows fine control through midnight and clamps at the supported limits', () => {
    const nearMidnight = Date.parse('2026-03-20T15:59:00Z')
    expect(civilParts(timeFromEarthDrag(nearMidnight, 5, 300, 60), zone)).toMatchObject({ day: 21, hour: 0, minute: 0 })
    expect(timeFromEarthDrag(Date.UTC(2400, 11, 31, 23, 59), 300, 300, 60)).toBe(Date.UTC(2401, 0, 1) - 1)
  })
  it('supports seconds, configured increments and hour-only precision without discarding hidden values', () => {
    const current = start + 37 * 1000
    expect(timeFromEarthDrag(current, 75, 300, 1, 1000)).toBe(current + 15 * 1000)
    expect(timeFromEarthDrag(current, -75, 300, 1, 1000)).toBe(current - 15 * 1000)
    expect(timeFromEarthDrag(current, 83, 300, 1, 5000)).toBe(current + 15 * 1000)
    expect(timeFromEarthDrag(current, 5, 300, 1440, 3600000)).toBe(current)
    expect(timeFromEarthDrag(current, 25, 300, 1440, 3600000)).toBe(current + 2 * 3600000)
  })
})
