import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { CelestialInput, CelestialPicker, CelestialScrollPicker, CelestialStepper, CelestialDatePicker, CelestialTimePicker, CelestialProvider, EarthWidget, MoonWidget, YearWidget, OrreryWidget, OrreryClock, type PickerUnit } from 'skydial/react'
import type { Place, YearPlanetId } from 'skydial/astro'
import type { EarthPickerView } from 'skydial/react'
import 'skydial/style.css'
import './style.css'

const singapore: Place = { name: 'Singapore', latitude: 1.2903, longitude: 103.852, timeZone: 'Asia/Singapore', source: 'custom' }
const initial = new Date('2026-03-20T12:00:00Z')

export function Playground() {
  const [date, setDate] = useState(initial)
  const [planet, setPlanet] = useState<YearPlanetId>('jupiter')
  const [showMoon, setShowMoon] = useState(true)
  return <>
    <header className="host-header"><span>CELESTIAL CLOCK · INTERACTIVE ELEMENTS</span><h1>A small universe.<br />In your hands.</h1><p>Turn Earth to set the time. Follow an orbit to find a date.</p></header>
    <main className="host-grid">
      <section className="host-card host-wide" data-testid="selected">
        <div className="host-section-header"><h2>01 / The celestial picker</h2><output data-testid="selected-date">{date.toISOString()}</output></div>
        <CelestialDatePicker date={date} onDateChange={setDate} place={singapore} planet={planet} onPlanetChange={setPlanet} />
      </section>
      <section className="host-wide host-widget-section" data-testid="widgets">
        <div className="host-section-header"><h2>02 / A place on your website</h2><p>Small, medium and large. The same universe, at a glance.</p></div>
        <CelestialProvider date={date}>
          <div className="host-widget-gallery">
            <div className="host-small-pair">
              <EarthWidget size="small" place={singapore} />
              <div data-testid="independent">{showMoon && <MoonWidget size="small" defaultDate={new Date('2026-01-01T12:00:00Z')} place={singapore} />}</div>
              <YearWidget size="medium" place={singapore} planet={planet} onPlanetChange={setPlanet} />
            </div>
            <OrreryWidget size="large" place={singapore} planet={planet} />
          </div>
        </CelestialProvider>
        <button className="host-toggle" type="button" onClick={() => setShowMoon((value) => !value)}>Toggle Moon</button>
        <p className="host-note">The Moon card keeps its own date. The other widgets follow your selection.</p>
      </section>
      <section className="host-card host-wide" data-testid="standalone">
        <div className="host-section-header"><h2>03 / Choose your year hand</h2><p>Jupiter by default. Switch planets to change the scale of time.</p></div>
        <OrreryClock date={date} place={singapore} />
      </section>
    </main>
    <footer className="host-footer">Textures: Solar System Scope (CC BY 4.0) and NASA. Positions: Astronomy Engine.</footer>
  </>
}

export function UncontrolledPlayground() {
  return <CelestialDatePicker defaultDate={initial} place={singapore} />
}

function ControlledEarthDemo() {
  const [view, setView] = useState<EarthPickerView>('rotation')
  const [place, setPlace] = useState(singapore)
  return <>
    <output data-testid="camera-view">{view}</output><output data-testid="camera-place">{place.name}</output>
    <button type="button" onClick={() => { setView('city'); setPlace({ name: 'London', latitude: 51.5074, longitude: -0.1278, timeZone: 'Europe/London', source: 'city' }) }}>Show London from host</button>
    <CelestialTimePicker defaultDate={initial} place={singapore} earthView={view} onEarthViewChange={setView} earthPlace={place} onEarthPlaceChange={setPlace} />
  </>
}

function PopupDemo() {
  const query = new URLSearchParams(window.location.search)
  const [date, setDate] = useState(new Date('2028-01-31T15:59:00Z'))
  return <>
    <output data-testid="popup-date">{date.toISOString()}</output>
    <CelestialDatePicker date={date} onDateChange={query.has('readonly') ? undefined : setDate} place={singapore}
      presentation="popover" includeTime={!query.has('dateonly')} disabled={query.has('disabled')} label="Choose date" />
    <CelestialTimePicker date={date} onDateChange={query.has('readonly') ? undefined : setDate} place={singapore}
      presentation="popover" showDay disabled={query.has('disabled')} label="Choose time" />
    <button type="button" onClick={() => setDate(new Date('2029-03-01T04:30:00Z'))}>Set date from host</button>
  </>
}

function FormDemo() {
  const query = new URLSearchParams(window.location.search)
  const start = new Date('2028-01-31T15:59:17Z')
  const [value, setValue] = useState<Date | null>(query.has('empty') ? null : start)
  const [result, setResult] = useState('')
  const units: PickerUnit[] = query.has('year') ? ['year'] : ['year', 'month', 'day', 'hour', 'minute', 'second']
  return <main style={{ maxWidth: 300, padding: 12 }}>
    <form onReset={(event) => { if (query.has('cancelreset')) event.preventDefault() }} onSubmit={(event) => { event.preventDefault(); setResult(JSON.stringify(Object.fromEntries(new FormData(event.currentTarget)))) }}>
      <input aria-label="Title" name="title" defaultValue="Event" />
      <CelestialPicker label="Starts" name="startsAt" units={units} place={singapore} required clearable theme="light"
        {...(query.has('controlled') || query.has('readonly') ? { value, onChange: query.has('readonly') ? undefined : setValue } : { defaultValue: query.has('empty') ? null : start })}
        control={query.has('stepper') ? 'stepper' : 'wheel'} presentation={query.has('inline') ? 'inline' : 'popover'}
        min={Date.UTC(2028, 0, 1)} max={Date.UTC(2029, 11, 31, 15, 59, 59)} steps={{ minute: 15, second: 10 }} disabled={query.has('disabled')} />
      <button type="submit">Submit</button><button type="reset">Reset</button>
    </form>
    <output data-testid="form-result">{result}</output>
    <button type="button" onClick={() => setValue(new Date('2029-02-28T04:30:00Z'))}>Set form value from host</button>
    <section aria-label="Reusable controls"><CelestialStepper units={['day', 'hour', 'minute']} date={value ?? start} onDateChange={setValue} place={singapore} steps={{ minute: 15 }} /><CelestialScrollPicker units={['year']} date={value ?? start} onDateChange={setValue} theme="light" /><output data-testid="primitive-value">{value?.toISOString()}</output></section>
  </main>
}

function CelestialInputDemo() {
  const query = new URLSearchParams(window.location.search)
  const [value, setValue] = useState<Date | null>(new Date('2028-01-31T15:59:00Z'))
  const [result, setResult] = useState('')
  return <main style={{ maxWidth: 360, padding: 16 }}><form onSubmit={(event) => { event.preventDefault(); setResult(JSON.stringify(Object.fromEntries(new FormData(event.currentTarget)))) }}>
    <CelestialInput variant={query.has('lcd') ? 'lcd' : 'celestial'} presentation={query.has('inline') ? 'inline' : 'popover'} control={query.has('stepper') ? 'stepper' : query.has('wheel') ? 'wheel' : 'both'} label="Appointment" name="when" value={value} onChange={query.has('readonly') ? undefined : setValue}
      mode={query.has('timeonly') ? 'time' : query.has('combined') ? 'datetime' : 'date'} precision={query.has('year') ? 'year' : query.has('seconds') ? 'second' : undefined}
      scene={query.has('moon') ? 'moon' : query.has('planet') ? 'planet' : 'auto'} theme={query.has('system') ? 'auto' : query.has('dark') ? 'dark' : 'light'}
      wheelRowHeight={query.has('custom') ? 48 : undefined} wheelRows={query.has('custom') ? 5 : 3}
      styles={query.has('custom') ? {
        field: { borderRadius: 18, borderColor: '#8b5cf6' }, panel: { background: '#faf5ff', padding: 12 },
        wheelOption: ({ selected }) => ({ color: selected ? '#7c3aed' : '#6b7280', fontWeight: selected ? 700 : 400 }),
        stepButton: { borderRadius: 0 }, monthLabel: { fontSize: 11 }, yearLabel: { color: '#7c3aed' },
      } : undefined} classNames={query.has('custom') ? { field: 'appointment-field', panel: 'appointment-panel', globe: 'appointment-earth' } : undefined}
      orbitalStyle={query.has('custom') ? { palette: { yearHand: '#7c3aed' }, handWidth: 2, bodyScale: 1.2 } : undefined}
      place={singapore} min={Date.UTC(2028, 0, 1)} max={Date.UTC(2035, 11, 31)} steps={{ minute: 15, year: query.has('year') ? 5 : 1 }} disabled={query.has('disabled')} required clearable />
    <button type="submit">Submit appointment</button><label>Notes<input name="notes" /></label></form><output data-testid="input-date">{value?.toISOString()}</output><output data-testid="input-result">{result}</output></main>
}

if (new URLSearchParams(window.location.search).has('input')) {
  createRoot(document.getElementById('root')!).render(<CelestialInputDemo />)
} else if (new URLSearchParams(window.location.search).has('form')) {
  createRoot(document.getElementById('root')!).render(<FormDemo />)
} else if (new URLSearchParams(window.location.search).has('popup')) {
  createRoot(document.getElementById('root')!).render(<PopupDemo />)
} else if (new URLSearchParams(window.location.search).has('adapters')) {
  void import('./adapters').then(({ mountAdapterDemos }) => mountAdapterDemos(document.getElementById('root')!))
} else if (new URLSearchParams(window.location.search).has('time')) {
  const query = new URLSearchParams(window.location.search)
  createRoot(document.getElementById('root')!).render(query.has('controlledview') ? <ControlledEarthDemo /> : <CelestialTimePicker
    {...(query.has('readonly') ? { date: initial } : { defaultDate: initial })}
    place={singapore} disabled={query.has('disabled')} />)
} else {
  createRoot(document.getElementById('root')!).render(
    new URLSearchParams(window.location.search).has('uncontrolled') ? <UncontrolledPlayground /> : <Playground />,
  )
}
