import { describe, expect, it } from 'vitest'
import { civilDateValue, selectCivilDate } from './dateSelection.js'

const previous = Date.parse('2026-01-15T04:30:00Z')
describe('date selection in the observer time zone', () => {
  it('selects Singapore civil dates without a UTC day shift', () => {
    const ms = selectCivilDate('2026-06-01', previous, 'Asia/Singapore')!
    expect(new Date(ms).toISOString()).toBe('2026-06-01T04:30:00.000Z')
    expect(civilDateValue(ms, 'Asia/Singapore')).toBe('2026-06-01')
  })
  it('preserves New York wall time across daylight saving changes', () => {
    const ms = selectCivilDate('2026-07-15', Date.parse('2026-01-15T17:30:00Z'), 'America/New_York')!
    expect(new Date(ms).toISOString()).toBe('2026-07-15T16:30:00.000Z')
  })
  it('validates leap days and rejects malformed or unsupported dates', () => {
    expect(selectCivilDate('2028-02-29', previous, 'UTC')).not.toBeNull()
    for (const value of ['', '2026-02-29', '2026-04-31', '2026-00-01', '2026-13-01', '2026-01-00', '1599-12-31', '2401-01-01', '2026-1-1']) {
      expect(selectCivilDate(value, previous, 'UTC')).toBeNull()
    }
  })
})
