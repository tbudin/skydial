import { useMemo, useState, type CSSProperties } from 'react'
import { CelestialInput, CelestialRangeInput, CelestialValueInput, type PickerDateRange, type CalendarDate, type PickerControl } from 'skydial/react'
import { CITIES, createAvailability, parseCalendarDate, type YearPlanetId } from 'skydial/astro'
import { usePreviewSettings } from './previewSettings.js'

const initial = { start: new Date('2026-11-09T09:00:00Z'), end: new Date('2026-11-10T16:00:00Z') }
const initialBirthday = parseCalendarDate('1990-06-15')
export default function SchedulingPlayground() {
  const { variant, theme, palettes } = usePreviewSettings()
  const [locale, setLocale] = useState('en-GB')
  const [city, setCity] = useState('London')
  const [hours, setHours] = useState(false)
  const [weekdays, setWeekdays] = useState(false)
  const [granularity, setGranularity] = useState('date')
  const [planet, setPlanet] = useState<YearPlanetId>('jupiter')
  const [control, setControl] = useState<PickerControl>('both')
  const [inline, setInline] = useState(false)
  const [twelve, setTwelve] = useState(false)
  const [range, setRange] = useState<PickerDateRange | null>(initial)
  const [birthday, setBirthday] = useState<CalendarDate | null>(initialBirthday)
  const [result, setResult] = useState('')
  const place = { ...(CITIES.find((item) => item.name === city) ?? CITIES[0]), source: 'city' as const }
  const availability = useMemo(() => createAvailability({ weekdays: weekdays ? [1, 2, 3, 4, 5] : undefined, hours: hours ? [{ start: '09:00', end: '17:00' }] : undefined }), [weekdays, hours])
  const mode = granularity === 'time' ? 'time' : granularity === 'datetime' || granularity === 'seconds' ? 'datetime' : 'date'
  const precision = granularity === 'year' ? 'year' : granularity === 'seconds' ? 'second' : undefined
  const appearance = { variant, theme, colors: palettes[variant], locale, place, hourCycle: twelve ? 'h12' as const : 'h23' as const, planet, style: { '--picker-viewport-inset-top': 'var(--top-h)' } as CSSProperties }
  return <div className="scheduling-playground">
    <section className="scheduling-preview" aria-label="Scheduling examples">
      <form onSubmit={(event) => { event.preventDefault(); setResult(JSON.stringify(Object.fromEntries(new FormData(event.currentTarget)), null, 2)) }}>
        <CelestialRangeInput {...appearance} {...availability} name="booking" label="Booking" mode={mode} precision={precision} control={control} value={range} onChange={setRange} required clearable presentation={inline ? 'inline' : 'popover'} onReset={() => setRange(initial)} />
        <CelestialInput {...appearance} {...availability} name="appointment" label="Appointment" mode="datetime" defaultValue={initial.start} clearable />
        <CelestialValueInput {...appearance} name="birthday" label="Birthday (calendar date)" valueKind="date" value={birthday} onChange={setBirthday} onReset={() => setBirthday(initialBirthday)} clearable />
        <div className="scheduling-form-actions"><button type="submit">Submit example</button><button type="reset">Reset example</button></div>
      </form>
      <output className="scheduling-result" aria-label="Submitted values">{result || 'Submitted values appear here.'}</output>
    </section>
    <details className="scheduling-settings"><summary>Component settings</summary><div className="scheduling-settings-grid">
      <label>Locale<select value={locale} onChange={(event) => setLocale(event.target.value)}>{['en-GB', 'en-US', 'fr-FR', 'de-DE', 'es-ES', 'ar-EG'].map((value) => <option key={value}>{value}</option>)}</select></label>
      <label>City and time zone<select value={city} onChange={(event) => setCity(event.target.value)}>{CITIES.map((place) => <option key={place.name}>{place.name}</option>)}</select></label>
      <label>Range units<select value={granularity} onChange={(event) => setGranularity(event.target.value)}><option value="date">Date</option><option value="datetime">Date and time</option><option value="year">Year only</option><option value="time">Time only</option><option value="seconds">Date and time with seconds</option></select></label>
      <label>Precise controls<select value={control} onChange={(event) => setControl(event.target.value as PickerControl)}><option value="both">Scroll and step</option><option value="wheel">Scroll</option><option value="stepper">Editable steps</option></select></label>
      <label>Year planet<select value={planet} onChange={(event) => setPlanet(event.target.value as YearPlanetId)}>{['jupiter', 'saturn', 'uranus', 'neptune'].map((id) => <option key={id} value={id}>{id[0].toUpperCase() + id.slice(1)}</option>)}</select></label>
      <label><input type="checkbox" checked={twelve} onChange={(event) => setTwelve(event.target.checked)} />12-hour time</label>
      <label><input type="checkbox" checked={weekdays} onChange={(event) => setWeekdays(event.target.checked)} />Weekdays only</label>
      <label><input type="checkbox" checked={hours} onChange={(event) => setHours(event.target.checked)} />09:00–17:00 only</label>
      <label><input type="checkbox" checked={inline} onChange={(event) => setInline(event.target.checked)} />Inline range window</label>
    </div></details>
    <pre className="scheduling-code" tabIndex={0} aria-label="Example code"><code>{`import { CelestialRangeInput } from 'skydial/${variant === 'lcd' ? 'lcd' : 'react'}'\nimport { createAvailability } from 'skydial/astro'\nimport 'skydial/style.css'\n\nconst availability = createAvailability({\n  weekdays: ${weekdays ? '[1, 2, 3, 4, 5]' : 'undefined'},\n  hours: ${hours ? "[{ start: '09:00', end: '17:00' }]" : 'undefined'},\n})\n\n<CelestialRangeInput\n  name="booking"\n  mode="${mode}"\n  planet="${planet}"\n  control="${control}"${precision ? `\n  precision="${precision}"` : ''}\n  locale="${locale}"\n  hourCycle="${twelve ? 'h12' : 'h23'}"\n  value={range}\n  onChange={setRange}\n  {...availability}\n/>`}</code></pre>
  </div>
}
