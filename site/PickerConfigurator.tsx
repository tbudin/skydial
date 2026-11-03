import { useState, type CSSProperties } from 'react'
import { CelestialInput, CelestialScrollPicker, CelestialStepper, PICKER_PARTS, type PickerPart, type PickerStyles, type PickerClassNames, type OrreryAppearance, type PickerScene, type PickerControl, type PickerUnit, type PickerSize, type PickerSteps } from 'skydial/react'
import { usePreviewSettings } from './previewSettings.js'
import { CITIES, PICKER_UNITS, zonedToUtc, type YearPlanetId } from 'skydial/astro'

const initial = new Date('2026-03-20T12:00:00Z')
const presets: Record<string, PickerUnit[]> = {
  Year: ['year'], 'Year & month': ['year', 'month'], Date: ['year', 'month', 'day'],
  Time: ['hour', 'minute'], 'Day & time': ['day', 'hour', 'minute'],
  'Date & time': ['year', 'month', 'day', 'hour', 'minute'], Seconds: [...PICKER_UNITS],
}

export default function PickerConfigurator() {
  const [units, setUnits] = useState<PickerUnit[]>(presets.Date)
  const { variant, theme, palettes } = usePreviewSettings()
  const colors = palettes[variant]
  const [control, setControl] = useState<PickerControl>('both')
  const [scene, setScene] = useState<PickerScene>('auto')
  const [interactive, setInteractive] = useState(true)
  const [earthView, setEarthView] = useState<'rotation' | 'city'>('city')
  const [presentation, setPresentation] = useState<'popover' | 'inline'>('popover')
  const [size, setSize] = useState<PickerSize>('small')
  const [steps, setSteps] = useState<PickerSteps>({})
  const [value, setValue] = useState<Date | null>(initial)
  const [label, setLabel] = useState('Starts')
  const [city, setCity] = useState('London')
  const [required, setRequired] = useState(true)
  const [disabled, setDisabled] = useState(false)
  const [readOnly, setReadOnly] = useState(false)
  const [clearable, setClearable] = useState(true)
  const [bounded, setBounded] = useState(false)
  const [minimum, setMinimum] = useState('2026-01-01')
  const [maximum, setMaximum] = useState('2035-12-31')
  const [customRadius, setRadius] = useState<number | null>(null)
  const radius = customRadius ?? (variant === 'lcd' ? 2 : 8)
  const [planet, setPlanet] = useState<YearPlanetId>('jupiter')
  const [placement, setPlacement] = useState<'auto' | 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end'>('auto')
  const [offset, setOffset] = useState(6)
  const [wheelRowHeight, setWheelRowHeight] = useState(36)
  const [wheelRows, setWheelRows] = useState<3 | 5>(3)
  const [styledPart, setStyledPart] = useState<PickerPart>('field')
  const [styles, setStyles] = useState<PickerStyles>({})
  const [classNames, setClassNames] = useState<PickerClassNames>({})
  const [styleDrafts, setStyleDrafts] = useState<Partial<Record<PickerPart, string>>>({})
  const [styleError, setStyleError] = useState('')
  const [orbitalStyle, setOrbitalStyle] = useState<OrreryAppearance>({})
  const [orbitalDraft, setOrbitalDraft] = useState('{}')
  const [orbitalError, setOrbitalError] = useState('')
  const [result, setResult] = useState('')
  const [copied, setCopied] = useState(false)
  const place = { ...(CITIES.find((item) => item.name === city) ?? CITIES[0]), source: 'city' as const }
  const boundDate = (date: string, end: boolean) => {
    const [year, month, day] = date.split('-').map(Number)
    return zonedToUtc(place.timeZone, year, month, day, end ? 23 : 0, end ? 59 : 0, end ? 59 : 0)
  }
  const bounds = bounded ? { min: boundDate(minimum, false), max: boundDate(maximum, true) } : {}
  const style = { '--picker-radius': `${radius}px` } as CSSProperties
  const celestial = scene !== false
  const hasDate = units.some((unit) => ['year', 'month', 'day'].includes(unit))
  const hasTime = units.some((unit) => ['hour', 'minute', 'second'].includes(unit))
  const hasCalendar = units.includes('month') || units.includes('day')
  const hasYear = units.includes('year')
  const options = { variant, colors, units, steps, size, theme, place, disabled, readOnly, styles, classNames, wheelRowHeight, wheelRows, ...bounds }
  const code = `<CelestialInput\n  name="startsAt"\n  label=${JSON.stringify(label)}\n  units={${JSON.stringify(units)}}\n  control="${control}"\n  variant="${variant}"${Object.keys(colors).length ? `\n  colors={${JSON.stringify(colors)}}` : ''}\n  scene={${JSON.stringify(scene)}}${!interactive ? '\n  interactive={false}' : ''}\n  planet="${planet}"\n  popoverPlacement="${placement}"\n  popoverOffset={${offset}}\n  wheelRowHeight={${wheelRowHeight}}\n  wheelRows={${wheelRows}}${Object.keys(styles).length ? `\n  styles={${JSON.stringify(styles)}}` : ''}${Object.keys(classNames).length ? `\n  classNames={${JSON.stringify(classNames)}}` : ''}${Object.keys(orbitalStyle).length ? `\n  orbitalStyle={${JSON.stringify(orbitalStyle)}}` : ''}\n  presentation="${presentation}"\n  size="${size}"\n  theme="${theme}"${Object.keys(steps).length ? `\n  steps={${JSON.stringify(steps)}}` : ''}${bounded ? `\n  min={${bounds.min}}\n  max={${bounds.max}}` : ''}\n  place={${JSON.stringify(place)}}${earthView === 'rotation' ? '\n  defaultEarthView="rotation"' : ''}\n  style={${JSON.stringify(style)}}${required ? '\n  required' : ''}${clearable ? '\n  clearable' : ''}${disabled ? '\n  disabled' : ''}${readOnly ? '\n  readOnly' : ''}\n  defaultValue={new Date('2026-03-20T12:00:00Z')}\n/>`
  return <div className="picker-builder">
    <nav className="picker-library-sections" aria-label="Library components"><a href="./">Date & time inputs</a><a href="../widgets/">Website widgets</a><a href="../orrery/">Orrery playground</a></nav>
    <div className="picker-presets" role="group" aria-label="Picker presets">{Object.entries(presets).map(([name, fields]) => <button key={name} type="button" aria-pressed={JSON.stringify(fields) === JSON.stringify(units)} onClick={() => setUnits(fields)}>{name}</button>)}</div>
    <div className="picker-builder-grid">
      <section className="picker-builder-settings" aria-label="Configure your picker">
        <h2>Make it fit</h2>
        <fieldset><legend>Units</legend><div className="picker-unit-checks">{PICKER_UNITS.map((unit) => <label key={unit}><input type="checkbox" checked={units.includes(unit)} disabled={units.length === 1 && units[0] === unit} onChange={(event) => setUnits(PICKER_UNITS.filter((candidate) => candidate === unit ? event.target.checked : units.includes(candidate)))} />{unit}</label>)}</div></fieldset>
        <div className="picker-settings-pair">
          <label>Control<select value={control} onChange={(event) => setControl(event.target.value as typeof control)}><option value="both">Scroll wheels & −/+</option><option value="wheel">Scroll wheels</option><option value="stepper">− / + buttons</option></select></label>
          <label>Presentation<select value={presentation} onChange={(event) => setPresentation(event.target.value as typeof presentation)}><option value="popover">Field & popover</option><option value="inline">Inline control</option></select></label>
          <label>Size<select value={size} onChange={(event) => setSize(event.target.value as PickerSize)}><option value="small">Small · 32px field</option><option value="medium">Medium · 40px field</option><option value="large">Large · 44px field</option></select></label>
        </div>
        <label>Celestial view<select value={scene === false ? 'none' : scene} onChange={(event) => setScene(event.target.value === 'none' ? false : event.target.value as PickerScene)}><option value="auto">Automatic · date / time</option><option value="orrery">Orbital calendar</option><option value="none">No celestial view</option></select></label>
        {celestial && <label className="picker-scene-toggle"><input type="checkbox" checked={interactive} onChange={(event) => setInteractive(event.target.checked)} />Interactive celestial controls</label>}
        {celestial && (hasTime || scene === 'earth') && <label>Earth view<select value={earthView} onChange={(event) => setEarthView(event.target.value as typeof earthView)}><option value="rotation">Turn Earth</option><option value="city">Keep the selected city in view</option></select></label>}
        {celestial && hasYear && <label>Year planet<select value={planet} onChange={(event) => setPlanet(event.target.value as YearPlanetId)}>{['jupiter', 'saturn', 'uranus', 'neptune'].map((item) => <option key={item} value={item}>{item[0].toUpperCase() + item.slice(1)}</option>)}</select></label>}
        <div className="picker-settings-pair">
          <label>Popup placement<select value={placement} onChange={(event) => setPlacement(event.target.value as typeof placement)}>{['auto', 'bottom-start', 'bottom-end', 'top-start', 'top-end'].map((item) => <option key={item}>{item}</option>)}</select></label>
          <label>Popup gap<input type="number" min={0} max={40} value={offset} onChange={(event) => setOffset(Number(event.target.value))} /></label>
          <label>Wheel row height<input type="number" min={24} max={64} value={wheelRowHeight} onChange={(event) => { if (event.target.validity.valid) setWheelRowHeight(Number(event.target.value)) }} /></label>
          <label>Visible wheel rows<select value={wheelRows} onChange={(event) => setWheelRows(Number(event.target.value) as 3 | 5)}><option value={3}>3</option><option value={5}>5</option></select></label>
        </div>
        <fieldset><legend>Style every element</legend>
          <label>Element to style<select value={styledPart} onChange={(event) => { setStyledPart(event.target.value as PickerPart); setStyleError('') }}>{PICKER_PARTS.map((name) => <option key={name}>{name}</option>)}</select></label>
          <label>CSS properties<textarea spellCheck={false} rows={4} placeholder={'{ "borderRadius": 16, "background": "#f5f3ff" }'} value={styleDrafts[styledPart] ?? '{}'} onChange={(event) => {
            const text = event.target.value
            setStyleDrafts({ ...styleDrafts, [styledPart]: text })
            try {
              const next: unknown = JSON.parse(text)
              if (!next || Array.isArray(next) || typeof next !== 'object' || Object.values(next).some((v) => typeof v !== 'string' && typeof v !== 'number')) throw new Error('Use a CSS property object with text or numeric values.')
              setStyles({ ...styles, [styledPart]: next as CSSProperties }); setStyleError('')
            } catch { setStyleError('Enter a valid CSS property object. The last valid style stays applied.') }
          }} /></label>
          {styleError && <p role="alert">{styleError}</p>}
          <label>CSS class<input value={classNames[styledPart] ?? ''} onChange={(event) => setClassNames({ ...classNames, [styledPart]: event.target.value })} /></label>
          <p>Set colours, fonts, spacing, borders, shadows and layout for each element. Your styles are included in the component code.</p>
        </fieldset>
        {celestial && hasDate && <fieldset><legend>Orbital appearance</legend><label>Orbit style<textarea rows={4} spellCheck={false} value={orbitalDraft} placeholder={'{ "palette": { "yearHand": "#8b5cf6" }, "handWidth": 2 }'} onChange={(event) => {
          const text = event.target.value; setOrbitalDraft(text)
          try {
            const next = JSON.parse(text) as OrreryAppearance
            const colours = ['background', 'orbit', 'tick', 'tickMajor', 'label', 'labelActive', 'earthHand', 'yearHand']
            if (!next || Array.isArray(next) || typeof next !== 'object' || Object.entries(next).some(([key, v]) => key === 'palette'
              ? !v || typeof v !== 'object' || Array.isArray(v) || Object.entries(v).some(([k, value]) => k === 'orbitOpacity' ? typeof value !== 'number' || value < 0 || value > 1 : !colours.includes(k) || typeof value !== 'string' || !CSS.supports('color', value))
              : !['orbitWidth', 'tickWidth', 'handWidth', 'bodyScale', 'sunScale'].includes(key) || typeof v !== 'number' || v < 0 || v > 10)) throw new Error('Invalid orbit style')
            setOrbitalStyle(next); setOrbitalError('')
          } catch { setOrbitalError('Use palette colours and numeric orbitWidth, tickWidth, handWidth, bodyScale or sunScale (0–10).') }
        }} /></label>{orbitalError && <p role="alert">{orbitalError}</p>}<p>{variant === 'lcd' ? 'Set orbit and tick weights, hand width, planet size and Sun size. LCD colours are set in the header.' : 'Set the canvas palette, orbit and tick weights, hand width, planet size and Sun size.'}</p></fieldset>}
        <fieldset><legend>Step size</legend><div className="picker-step-settings">{units.map((unit) => <label key={unit}>{unit}<input type="number" min={1} max={{ year: 800, month: 12, day: 31, hour: 24, minute: 60, second: 60 }[unit]} value={steps[unit] ?? 1} onChange={(event) => { const next = Number(event.target.value); if (event.target.validity.valid && next >= 1) setSteps({ ...steps, [unit]: next }) }} /></label>)}</div></fieldset>
        <label>Field label<input value={label} onChange={(event) => setLabel(event.target.value)} /></label>
        <label>Time zone / city<select value={city} onChange={(event) => setCity(event.target.value)}>{CITIES.map((item) => <option key={item.name}>{item.name}</option>)}</select></label>
        <label>Corner radius<input type="range" min={0} max={20} value={radius} onChange={(event) => setRadius(Number(event.target.value))} /></label>
        <div className="picker-unit-checks picker-state-checks">
          <label><input type="checkbox" checked={required} onChange={(event) => setRequired(event.target.checked)} />Required</label><label><input type="checkbox" checked={clearable} onChange={(event) => setClearable(event.target.checked)} />Clearable</label><label><input type="checkbox" checked={disabled} onChange={(event) => setDisabled(event.target.checked)} />Disabled</label><label><input type="checkbox" checked={readOnly} onChange={(event) => setReadOnly(event.target.checked)} />Read only</label>
          <label><input type="checkbox" checked={bounded} onChange={(event) => setBounded(event.target.checked)} />Limit range</label>
        </div>
        {bounded && <div className="picker-settings-pair"><label>Earliest date<input type="date" min="1600-01-01" max={maximum} value={minimum} onChange={(event) => { if (event.target.value && event.target.value <= maximum) setMinimum(event.target.value) }} /></label><label>Latest date<input type="date" min={minimum} max="2400-12-31" value={maximum} onChange={(event) => { if (event.target.value && event.target.value >= minimum) setMaximum(event.target.value) }} /></label></div>}
      </section>
      <div className="picker-builder-preview">
        <section className="picker-form-example" data-preview-theme={theme} aria-label="Website form example">
          <span className="picker-example-eyebrow">YOUR WEBSITE</span><h2>Create an event</h2><p>{celestial ? hasCalendar ? `Earth’s revolution selects ${units.includes('day') ? 'the day' : 'the month'}.${hasYear ? ' Your year planet sets the year range.' : ''} Scrolling columns and −/+ steps stay in sync.` : hasYear ? 'Your chosen planet sets the year range. Scrolling columns and −/+ steps stay in sync.' : 'Click the time to open Earth, scrolling columns and exact −/+ steps together.' : 'Click the field to open precise scrolling and step controls.'}</p>
          <form onSubmit={(event) => { event.preventDefault(); setResult(JSON.stringify(Object.fromEntries(new FormData(event.currentTarget)), null, 2)) }} onReset={() => { setValue(initial); setResult('') }}>
            <label className="picker-example-title">Event name<input name="title" defaultValue="An evening under the stars" /></label>
            <CelestialInput {...options} value={value} onChange={setValue} label={label} name="startsAt" control={control} scene={scene} interactive={interactive} planet={planet} orbitalStyle={orbitalStyle} popoverPlacement={placement} popoverOffset={offset} earthView={earthView} onEarthViewChange={setEarthView} earthPlace={place} presentation={presentation} required={required} clearable={clearable} style={{ ...style, '--picker-viewport-inset-top': 'var(--top-h)' } as CSSProperties} description={place.timeZone} />
            <div className="picker-example-submit"><button type="submit">Save event</button><button type="reset">Reset form</button></div>
          </form>
          <output className="picker-submit-result" aria-live="polite">{result || 'Submit to inspect the actual form value.'}</output>
        </section>
        <section className="picker-builder-code" aria-label="Your component code"><div><span>YOUR COMPONENT</span><button type="button" onClick={() => { void navigator.clipboard.writeText(`import { CelestialInput } from 'skydial/react'\nimport 'skydial/style.css'\n\n${code}`).then(() => setCopied(true)).catch(() => setCopied(false)) }}>{copied ? 'Copied' : 'Copy'}</button></div><pre tabIndex={0} role="region" aria-label="Component code"><code>{code}</code></pre></section>
      </div>
    </div>
    <section className="picker-primitives"><h2>Use just the elements</h2><p>These are separate package exports. They use the same units, steps and selected value as the field above.</p><div>
      <article><h3>Scrolling control</h3><CelestialScrollPicker {...options} date={value ?? initial} onDateChange={setValue} style={style} /><code>CelestialScrollPicker</code></article>
      <article><h3>Editable − / + control</h3><CelestialStepper {...options} date={value ?? initial} onDateChange={setValue} style={style} /><code>CelestialStepper</code></article>
    </div></section>

  </div>
}
