import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { CelestialValueInput } from './valueInput.js'
import { CelestialRangePicker } from './range.js'
import { instantToZonedDateTime } from '../astro/values.js'

const place = { name: 'Tokyo', latitude: 35.68, longitude: 139.69, timeZone: 'Asia/Tokyo', source: 'city' as const }
describe('typed values and range form contracts', () => {
  it('submits a civil date unchanged in different zones', () => {
    for (const timeZone of ['Asia/Tokyo', 'Pacific/Honolulu', 'America/New_York']) {
      const html = renderToStaticMarkup(<CelestialValueInput valueKind="date" value={{ year: 1990, month: 6, day: 15 }} name="birthday" place={{ ...place, timeZone }} scene={false} />)
      expect(html).toContain('name="birthday" value="1990-06-15"')
    }
  })
  it('submits a local time without its explicitly supplied reference date', () => {
    const html = renderToStaticMarkup(<CelestialValueInput valueKind="time" name="opening" defaultValue={{ hour: 9, minute: 5, second: 17 }} referenceDate={{ year: 2026, month: 11, day: 9 }} place={place} scene={false} />)
    expect(html).toContain('name="opening" value="09:05:17"')
  })
  it('honors 12-hour field formatting without requiring an explicit locale', () => {
    const html = renderToStaticMarkup(<CelestialValueInput valueKind="time" hourCycle="h12" name="opening" defaultValue={{ hour: 22, minute: 5, second: 0 }} referenceDate={{ year: 2026, month: 11, day: 9 }} place={place} scene={false} />)
    expect(html).toContain('10:05 pm')
    expect(html).toContain('name="opening" value="22:05:00"')
    const range = renderToStaticMarkup(<CelestialRangePicker hourCycle="h12" mode="time" place={place} defaultValue={{ start: Date.UTC(2026, 10, 9, 13, 5), end: Date.UTC(2026, 10, 9, 14, 5) }} />)
    expect(range).toContain('10:05 pm – 11:05 pm')
  })
  it('preserves a repeated appointment offset and an exact instant in form transport', () => {
    const instant = Date.UTC(2026, 10, 1, 6, 30, 2, 123)
    const zoned = renderToStaticMarkup(<CelestialValueInput valueKind="zoned" name="appointment" value={instantToZonedDateTime(instant, 'America/New_York')} scene={false} />)
    expect(zoned).toContain('name="appointment" value="2026-11-01T01:30:02.123-05:00[America/New_York]"')
    const html = renderToStaticMarkup(<CelestialValueInput valueKind="instant" name="event" value={instant} scene={false} />)
    expect(html).toContain('name="event" value="2026-11-01T06:30:02.123Z"')
  })
  it('rejects units that contradict the explicit civil value kind', () => {
    expect(() => renderToStaticMarkup(<CelestialValueInput valueKind="date" units={['hour']} scene={false} />)).toThrow(/units must match/)
    expect(() => renderToStaticMarkup(<CelestialValueInput valueKind="time" referenceDate={{ year: 2026, month: 11, day: 9 }} units={['year']} scene={false} />)).toThrow(/units must match/)
  })
  it('serializes a range as separate named endpoints and keeps an empty range empty', () => {
    const html = renderToStaticMarkup(<CelestialRangePicker name="trip" defaultValue={{ start: Date.UTC(2026, 10, 9, 9), end: Date.UTC(2026, 10, 10, 9) }} />)
    expect(html).toContain('name="trip.start" value="2026-11-09"')
    expect(html).toContain('name="trip.end" value="2026-11-10"')
    const empty = renderToStaticMarkup(<CelestialRangePicker name="trip" required />)
    expect(empty).toContain('name="trip.start" value=""')
    expect(empty).not.toContain('role="alert"')
  })
})
