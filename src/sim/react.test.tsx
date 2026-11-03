import CelestialClock from '../App.js'
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { CelestialProvider } from './react.js'
import { useCelestialClock } from './hooks.js'
import { CelestialDatePicker } from '../lib/datePicker.js'
import { EarthWidget, YearWidget } from '../lib/cards.js'
import { MoonClock } from '../lib/widgets.js'
import { CelestialTimePicker } from '../lib/timePicker.js'

function ClockProbe() {
  return <output>{new Date(useCelestialClock().now()).toISOString()}</output>
}

describe('server-renderable clock components', () => {
  it('isolates nested providers without touching global state', () => {
    const html = renderToStaticMarkup(
      <CelestialProvider date={Date.UTC(2026, 0, 1)}>
        <ClockProbe />
        <CelestialProvider date={Date.UTC(2026, 6, 1)}><ClockProbe /></CelestialProvider>
        <ClockProbe />
      </CelestialProvider>,
    )
    expect(html.match(/2026-01-01/g)).toHaveLength(2)
    expect(html.match(/2026-07-01/g)).toHaveLength(1)
  })
  it('renders the date input without window, navigator or WebGL', () => {
    const html = renderToStaticMarkup(<CelestialDatePicker date={Date.UTC(2026, 1, 28)} preview={false} />)
    expect(html).toContain('2026-02-28')
    expect(html).toContain('type="date"')
    expect(html).toContain('disabled')
    expect(html).toContain('Europe/London')
  })
  it('renders a lunar reading on the server', () => {
    const html = renderToStaticMarkup(<MoonClock date={Date.UTC(2026, 0, 1)} />)
    expect(html).toContain('Moon telemetry')
    expect(html).toContain('illuminated')
  })
})

describe('compact cards and direct picker server markup', () => {
  it('renders a chosen camera city on the server while keeping the clock time zone', () => {
    const html = renderToStaticMarkup(<CelestialTimePicker date={Date.UTC(2026, 0, 1)} defaultEarthView="city"
      earthPlace={{ name: 'New York', latitude: 40.7128, longitude: -74.006, timeZone: 'America/New_York', source: 'city' }} />)
    expect(html).toContain('Stay on city')
    expect(html).toContain('40.71° N, 74.01° W')
    expect(html).toContain('Time in Greenwich')
    expect(html).toContain('Use my location')
    expect(html).toContain('earth-city-reticle')
  })
  it('renders useful widget readings and the configured year planet without WebGL', () => {
    const html = renderToStaticMarkup(<><EarthWidget date={Date.UTC(2026, 0, 1)} /><YearWidget defaultPlanet="saturn" date={Date.UTC(2026, 0, 1)} /></>)
    expect(html).toContain('Saturn year widget')
    expect(html).toContain('29.5-year orbit')
    expect(html).toContain('00:00')
  })
  it('renders direct controls with Jupiter as the default year planet', () => {
    const html = renderToStaticMarkup(<CelestialDatePicker defaultDate={Date.UTC(2026, 0, 1)} />)
    expect(html).toContain('Rotate Earth to set time')
    expect(html).toContain('Day of year on the calendar ring')
    expect(html).toContain('Year on Jupiter')
    expect(html).toContain('Enter an exact date and time')
  })
  it('renders a compact field without mounting a hidden scene or touching browser dialog APIs', () => {
    const html = renderToStaticMarkup(<CelestialDatePicker presentation="popover" includeTime={false} defaultDate={Date.UTC(2028, 0, 31, 12)} />)
    expect(html).toContain('31 Jan 2028')
    expect(html).toContain('aria-haspopup="dialog"')
    expect(html).toContain('aria-expanded="false"')
    expect(html).not.toContain('<dialog')
    expect(html).not.toContain('Rotate Earth to set time')
  })
})

describe('embedded full clock', () => {
  it('does not navigate the host site and marks a fixed planet as read-only', () => {
    const html = renderToStaticMarkup(<CelestialClock date={Date.UTC(2026, 0, 1)} planet="saturn" />)
    expect(html).not.toContain('href="/?view=ambient"')
    expect(html).toContain('aria-label="Year hand planet"')
    expect(html).toContain('disabled')
  })
})
