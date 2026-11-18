import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { CelestialThemeProvider, CelestialThemeSwitch, useCelestialTheme } from './theme.js'
import { CelestialThemeSwitch as LcdSwitch } from './lcd.js'
import { CelestialPicker } from './picker.js'
import { CelestialInput } from './input.js'
import { CelestialRangeInput } from './rangeInput.js'
import { CelestialScrollPicker, CelestialStepper } from './PickerControls.js'
import { CelestialDisplay, CelestialBody } from './display.js'
import { YearWidget } from './cards.js'

const date = Date.UTC(2026, 2, 20, 12)
function ThemeReading() {
  const { theme, resolvedTheme } = useCelestialTheme()
  return <output>{theme}/{resolvedTheme}</output>
}

describe('shared appearance', () => {
  it('inherits across production components with no DOM wrapper and retains explicit overrides', () => {
    const html = renderToStaticMarkup(<CelestialThemeProvider theme="light">
      <CelestialPicker defaultValue={date} /><CelestialInput defaultValue={date} />
      <CelestialRangeInput /><CelestialScrollPicker date={date} /><CelestialStepper date={date} />
      <CelestialDisplay date={date} bodies={[]} /><CelestialBody date={date} body="moon" variant="lcd" /><YearWidget date={date} />
      <CelestialDisplay date={date} bodies={[]} theme="dark" />
      <CelestialThemeProvider theme="dark"><CelestialDisplay date={date} bodies={[]} /></CelestialThemeProvider>
    </CelestialThemeProvider>)
    expect(html.match(/data-picker-theme="light"/g)).toHaveLength(8)
    expect(html.match(/data-picker-theme="dark"/g)).toHaveLength(2)
    expect(html).not.toContain('celestial-theme-provider')
  })
  it('preserves existing defaults outside providers and renders system mode safely on the server', () => {
    const outside = renderToStaticMarkup(<><CelestialPicker /><CelestialInput /><YearWidget date={date} /></>)
    expect(outside.match(/data-picker-theme="dark"/g)).toHaveLength(2)
    expect(outside.match(/data-picker-theme="auto"/g)).toHaveLength(1)
    expect(renderToStaticMarkup(<CelestialThemeProvider><ThemeReading /></CelestialThemeProvider>)).toContain('auto/dark')
    expect(() => renderToStaticMarkup(<ThemeReading />)).toThrow('CelestialThemeProvider')
  })
  it('offers named non-submit buttons, selected states, translations and full styling hooks', () => {
    const html = renderToStaticMarkup(<CelestialThemeSwitch defaultTheme="light" labels={{ appearance: 'Affichage', light: 'Clair', dark: 'Sombre', auto: 'Système' }}
      classNames={{ button: 'my-mode' }} styles={{ root: { borderRadius: 12 }, button: ({ selected }) => ({ fontWeight: selected ? 700 : 400 }) }} />)
    expect(html).toContain('role="group" aria-label="Affichage"')
    expect(html.match(/type="button"/g)).toHaveLength(3)
    expect(html.match(/aria-pressed="true"/g)).toHaveLength(1)
    expect(html).toContain('font-weight:700')
    expect(html).toContain('my-mode')
    expect(html).toContain('border-radius:12px')
    expect(html).toContain('Système')
    const lcd = renderToStaticMarkup(<LcdSwitch disabled />)
    expect(lcd).toContain('data-picker-style="lcd"')
    expect(lcd.match(/disabled=""/g)).toHaveLength(3)
  })
})
