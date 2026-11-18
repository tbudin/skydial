import { useState } from 'react'
import { CelestialThemeProvider, CelestialThemeSwitch, CelestialThemeToggle, useCelestialTheme, CelestialInput, CelestialRangeInput, CelestialPicker, CelestialScrollPicker, CelestialStepper, CelestialDisplay, CelestialBody, YearWidget, CelestialRenderProvider, type PickerTheme } from 'skydial/react'

const date = new Date('2026-03-20T12:00:00Z')
const colors = { background: '#f3dfaf', foreground: '#493119' }

export default function ThemeDemo() {
  const query = new URLSearchParams(location.search)
  const variant = query.has('lcd') ? 'lcd' : 'celestial'
  const [theme, setTheme] = useState<PickerTheme>('auto')
  return <><CelestialThemeProvider theme={query.has('controlled') ? theme : undefined} onThemeChange={setTheme}><CelestialRenderProvider quality="low" maxFps={20}><ThemeContent /></CelestialRenderProvider></CelestialThemeProvider>
    <section style={{ padding: 20 }} aria-label="Standalone control"><CelestialThemeSwitch variant={variant} defaultTheme="light" aria-label="Standalone appearance" /></section>
    <section style={{ padding: 20 }} aria-label="Standalone toggle"><CelestialThemeToggle variant={variant} label="Independent toggle" defaultTheme="light" appearance="light" size="large" /></section>
  </>
}

function ThemeContent() {
  const { theme, resolvedTheme, setTheme } = useCelestialTheme()
  const variant = new URLSearchParams(location.search).has('lcd') ? 'lcd' : 'celestial'
  const [controlled, setControlled] = useState<PickerTheme>('light')
  return <main style={{ padding: 20, maxWidth: 880, margin: '0 auto', background: resolvedTheme === 'dark' ? '#10141d' : '#f6f3ec', color: resolvedTheme === 'dark' ? '#e9eef6' : '#243044', minHeight: '100vh' }}>
    <h1>One appearance, everywhere</h1>
    <p>Switch between light, dark and your device’s appearance.</p>
    <CelestialThemeSwitch variant={variant} />
    <CelestialThemeToggle variant={variant} label="Page appearance" size="large" />
    <output data-testid="theme-state">{theme}/{resolvedTheme}</output>
    <button type="button" onClick={() => setTheme('auto')}>Follow device</button>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: 24, marginBlock: 24 }}>
      <section style={{ display: 'grid', gap: 16 }} aria-label="Shared theme fields">
        <CelestialInput label="Appointment" name="appointment" mode="datetime" defaultValue={date} variant={variant} />
        <CelestialRangeInput label="Trip" defaultValue={{ start: date, end: new Date('2026-03-21T12:00:00Z') }} variant={variant} />
        <CelestialPicker label="Simple field" defaultValue={date} variant={variant} />
        <div data-testid="wheel"><CelestialScrollPicker units={['year']} date={date} variant={variant} /></div>
        <div data-testid="stepper"><CelestialStepper units={['hour', 'minute']} date={date} variant={variant} /></div>
      </section>
      <section style={{ display: 'grid', gap: 16, alignContent: 'start' }} aria-label="Shared theme widgets">
        <YearWidget date={date} variant={variant} />
        <CelestialDisplay date={date} bodies={[]} variant={variant} />
        <CelestialBody date={date} body="moon" size={56} variant={variant} />
        <div data-testid="custom"><CelestialDisplay date={date} bodies={[]} variant={variant} colors={colors} label="Custom colours" /></div>
        <div data-testid="fixed"><CelestialDisplay date={date} bodies={[]} variant={variant} theme="light" label="Always light" /></div>
        <CelestialThemeProvider defaultTheme="dark"><div data-testid="nested"><CelestialDisplay date={date} bodies={[]} variant={variant} label="Independent section" /></div></CelestialThemeProvider>
      </section>
    </div>
    <section aria-label="Independent controls">
      <CelestialThemeSwitch variant={variant} aria-label="Controlled appearance" theme={controlled} onThemeChange={setControlled} />
      <output data-testid="controlled-theme">{controlled}</output>
      <CelestialThemeToggle variant={variant} label="Controlled toggle" theme={controlled} onThemeChange={setControlled} />
      <CelestialThemeToggle variant={variant} label="Disabled toggle" disabled />
      <CelestialThemeSwitch variant={variant} disabled aria-label="Disabled appearance" />
    </section>
  </main>
}
