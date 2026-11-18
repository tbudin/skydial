import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { CelestialThemeToggle } from './themeToggle.js'
import { CelestialThemeToggle as LcdToggle } from './lcd.js'
import { CelestialThemeProvider } from './theme.js'

describe('standalone appearance toggle', () => {
  it('is a native non-submit switch with one stable accessible name and a binary state', () => {
    for (const theme of ['light', 'dark'] as const) {
      const html = renderToStaticMarkup(<CelestialThemeToggle theme={theme} label="Dark appearance" />)
      expect(html).toContain('type="button" role="switch" aria-label="Dark appearance"')
      expect(html).toContain(`aria-checked="${theme === 'dark'}"`)
      expect(html.match(/<button/g)).toHaveLength(1)
      expect(html).not.toContain('aria-pressed')
      expect(html).not.toContain('<div')
    }
  })
  it('renders a two-colour LCD skin and retains palette and per-part style overrides', () => {
    const html = renderToStaticMarkup(<LcdToggle defaultTheme="light" disabled colors={{ background: '#f3dfaf', foreground: '#493119' }} size="small" dir="rtl"
      classNames={{ selection: 'my-selection' }} styles={{ track: { borderRadius: 8 }, selection: ({ dark }) => ({ opacity: dark ? .8 : 1 }) }} />)
    expect(html).toContain('data-picker-style="lcd"')
    expect(html).toContain('data-toggle-size="small"')
    expect(html).toContain('--lcd-paper:#f3dfaf')
    expect(html).toContain('--lcd-ink:#493119')
    expect(html).toContain('my-selection')
    expect(html).toContain('opacity:1')
    expect(html).toContain('disabled=""')
    expect(html).not.toContain('<canvas')
  })
  it('includes a localisable current-theme label and offers the engraved LCD artwork', () => {
    const html = renderToStaticMarkup(<LcdToggle theme="dark" lcdArtwork="illustrations" labels={{ light: 'Jour', dark: 'Nuit' }} />)
    expect(html).toContain('data-theme-toggle-part="status"')
    expect(html).toContain('>Nuit</span>')
    expect(html).toContain('data-toggle-illustration="moon"')
    expect(html).toContain('data-toggle-illustration="sun"')
    expect(html).not.toContain('<canvas')
    expect(renderToStaticMarkup(<LcdToggle showLabel={false} />)).not.toContain('data-theme-toggle-part="status"')
  })
  it('provides System in a native dropdown and supports a switch-only configuration', () => {
    const html = renderToStaticMarkup(<LcdToggle defaultTheme="auto" labels={{ light: 'Jour', dark: 'Nuit', system: 'Système' }} />)
    expect(html).toContain('aria-label="Theme preference"')
    expect(html).toContain('<option value="auto" selected="">Système</option>')
    expect(html).toContain('data-theme-preference="auto"')
    expect(renderToStaticMarkup(<LcdToggle showMenu={false} />)).not.toContain('<select')
  })
  it('inherits the host appearance while an explicit skin retains priority', () => {
    const inherited = renderToStaticMarkup(<CelestialThemeProvider theme="light"><LcdToggle theme="dark" /></CelestialThemeProvider>)
    expect(inherited).toContain('data-picker-theme="light"')
    expect(inherited).toContain('aria-checked="true"')
    const explicit = renderToStaticMarkup(<CelestialThemeProvider theme="light"><LcdToggle appearance="dark" /></CelestialThemeProvider>)
    expect(explicit).toContain('data-picker-theme="dark"')
  })
})
