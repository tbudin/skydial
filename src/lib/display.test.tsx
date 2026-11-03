import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { CelestialProvider } from '../sim/react.js'
import { CelestialDisplay, CelestialDateDisplay, CelestialTimeDisplay, CelestialBody } from './display.js'
import { YearWidget, OrreryWidget } from './cards.js'

const date = Date.UTC(2026, 2, 20, 16, 45, 32)
const place = { name: 'Singapore', latitude: 1.35, longitude: 103.82, timeZone: 'Asia/Singapore', source: 'city' as const }

describe('compact display contract', () => {
  it('uses a semantic time and the configured local zone, independently of the host locale', () => {
    const html = renderToStaticMarkup(<CelestialDisplay date={date} place={place} bodies={[]} timeFormat={{ hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }} />)
    expect(html).toContain('dateTime="2026-03-20T16:45:32.000Z"')
    expect(html).toContain('21/03/2026')
    expect(html).toContain('00:45:32')
    expect(html).not.toMatch(/<input|<button|<select|<dialog/)
  })
  it('supports year-only, time-only and body-only configurations without extra readings', () => {
    const year = renderToStaticMarkup(<CelestialDateDisplay date={date} dateFormat={{ year: 'numeric' }} bodies={['jupiter']} />)
    expect(year).toContain('>2026<')
    expect(year).not.toContain('class="display-time"')
    const time = renderToStaticMarkup(<CelestialTimeDisplay date={date} bodies={[]} />)
    expect(time).toContain('>16:45<')
    expect(time).not.toContain('class="display-date"')
    const body = renderToStaticMarkup(<CelestialBody date={date} body="moon" variant="lcd" />)
    expect(body).toContain('role="img" aria-label="Moon"')
    expect(body).toContain('data-lcd-body="moon"')
    expect(body).not.toContain('<time')
  })
  it('inherits shared time, allows independent clocks, and exposes each body once', () => {
    const html = renderToStaticMarkup(<CelestialProvider date={date}>
      <CelestialDisplay dateFormat={{ year: 'numeric' }} timeFormat={false} bodies={['mars', 'moon']} variant="lcd" />
      <CelestialDateDisplay date={Date.UTC(2032, 0, 1)} dateFormat={{ year: 'numeric' }} bodies={[]} />
    </CelestialProvider>)
    expect(html).toContain('>2026<')
    expect(html).toContain('>2032<')
    expect(html.match(/aria-label="Mars"/g)).toHaveLength(1)
    expect(html.match(/aria-label="Moon"/g)).toHaveLength(1)
  })
  it('keeps custom colours, classes and part styles in both variants', () => {
    for (const variant of ['celestial', 'lcd'] as const) {
      const html = renderToStaticMarkup(<CelestialDisplay date={date} bodies={[]} variant={variant} colors={{ background: '#123456', foreground: '#abcdef' }} styles={{ date: { fontWeight: 700 } }} classNames={{ time: 'my-time' }} />)
      expect(html).toContain('#123456')
      expect(html).toContain('#abcdef')
      expect(html).toContain('font-weight:700')
      expect(html).toContain('display-time my-time')
    }
  })
  it('takes the planet from component settings with no rendered selector', () => {
    const html = renderToStaticMarkup(<><YearWidget date={date} planet="saturn" /><OrreryWidget date={date} planet="neptune" /></>)
    expect(html).toContain('Saturn year widget')
    expect(html).toContain('Neptune year hand')
    expect(html).not.toMatch(/<select|<button/)
  })
})
