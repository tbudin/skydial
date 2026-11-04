import { useState, type CSSProperties } from 'react'
import { CelestialInput, CelestialRangeInput, CelestialValueInput, CelestialBody, CelestialRenderProvider, type PickerDateRange, type CalendarDate } from 'skydial/react'
import { createAvailability } from 'skydial/astro'

const initial = { start: Date.UTC(2026, 10, 9, 10), end: Date.UTC(2026, 10, 10, 16) }
const rules = createAvailability({ weekdays: [1, 2, 3, 4, 5], hours: [{ start: '09:00', end: '17:00' }] })
export default function SchedulingDemo() {
  const query = new URLSearchParams(window.location.search)
  const [range, setRange] = useState<PickerDateRange | null>(initial)
  const [date, setDate] = useState<Date | null>(new Date(initial.start))
  const [birthday, setBirthday] = useState<CalendarDate | null>({ year: 1990, month: 6, day: 15 })
  const [zone, setZone] = useState('UTC')
  const [result, setResult] = useState('')
  const place = { name: zone, latitude: 51.5, longitude: 0, timeZone: zone, source: 'custom' as const }
  const appearance = { variant: query.has('lcd') ? 'lcd' as const : 'celestial' as const, theme: query.has('dark') ? 'dark' as const : 'light' as const, locale: query.get('locale') ?? 'en-GB', hourCycle: query.has('h12') ? 'h12' as const : 'h23' as const }
  const fieldFont = query.get('fieldfont')
  const fieldStyles = fieldFont === 'value' ? { value: { fontSize: 20 } } : fieldFont === 'field' ? { field: { fontSize: 20 } } : undefined
  const fieldStyle = fieldFont === 'variable' ? { '--picker-field-font-size': '20px' } as CSSProperties : undefined
  if (query.has('planetperf')) return <CelestialRenderProvider quality={query.has('low') ? 'low' : 'auto'}><main><h1>One planet</h1><CelestialBody body="jupiter" size={96} /><CelestialBody body="jupiter" size={48} /></main></CelestialRenderProvider>
  return <main style={{ maxWidth: 620, margin: '24px auto', padding: 12, color: '#243044', background: '#fff' }}><h1>Scheduling</h1>
    <form onSubmit={(event) => { event.preventDefault(); setResult(JSON.stringify(Object.fromEntries(new FormData(event.currentTarget)))) }}>
      <CelestialRangeInput {...appearance} {...rules} place={place} label="Booking" name="booking" value={range} onChange={query.has('readonly') ? undefined : setRange} mode={query.has('timerange') ? 'time' : query.has('combined') ? 'datetime' : 'date'} precision={query.has('yearrange') ? 'year' : query.has('seconds') ? 'second' : undefined} required clearable
        presentation={query.has('inline') ? 'inline' : 'popover'} control={query.has('stepper') ? 'stepper' : query.has('wheel') ? 'wheel' : 'both'} allowsNonContiguousRanges={query.has('noncontiguous')} disabled={query.has('disabled')} styles={fieldStyles} style={fieldStyle} onReset={() => setRange(initial)} />
      <CelestialInput {...appearance} {...rules} control={query.has('stepper') ? 'stepper' : 'both'} label="Appointment" name="appointment" mode="datetime" value={date} onChange={query.has('readonly') ? undefined : setDate} place={place} clearable />
      <CelestialValueInput {...appearance} label="Birthday" name="birthday" valueKind="date" value={birthday} onChange={setBirthday} place={place} />
      <button type="submit">Submit</button><button type="reset">Reset</button><label>Notes<input name="notes" /></label>
    </form>
    <output data-testid="scheduling-result">{result}</output><output data-testid="appointment-value">{date?.toISOString()}</output><output data-testid="birthday-value">{JSON.stringify(birthday)}</output>
    <button type="button" onClick={() => setZone(zone === 'UTC' ? 'Asia/Tokyo' : 'UTC')}>Change time zone</button>
    <button type="button" onClick={() => setDate(new Date(Date.UTC(2026, 10, 8, 10)))}>Unavailable date from host</button>
  </main>
}
