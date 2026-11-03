import { useState } from 'react'
import { CelestialDisplay, type CelestialDisplayProps, type CelestialBodyId, type DisplayFormat } from 'skydial/react'
import { PLANETS, type Place } from 'skydial/astro'
import { usePreviewSettings } from './previewSettings.js'

const dateFormats: Record<string, DisplayFormat> = {
  Numeric: { day: '2-digit', month: '2-digit', year: 'numeric' },
  Written: { day: 'numeric', month: 'short', year: 'numeric' },
  'Year & month': { year: 'numeric', month: '2-digit' },
  Year: { year: 'numeric' }, Hidden: false,
}
const timeFormats: Record<string, DisplayFormat> = {
  'Hours & minutes': { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' },
  Seconds: { hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' },
  '12-hour': { hour: 'numeric', minute: '2-digit', hour12: true }, Hidden: false,
}
const bodyOptions = [...PLANETS.map(({ id, name }) => ({ id: id as CelestialBodyId, name })), { id: 'moon' as const, name: 'Moon' }]

export default function DisplayConfigurator({ date, place }: { date: Date; place: Place }) {
  const { variant, theme, palettes } = usePreviewSettings()
  const [bodies, setBodies] = useState<CelestialBodyId[]>(['earth', 'moon'])
  const [dateStyle, setDateStyle] = useState('Numeric')
  const [timeStyle, setTimeStyle] = useState('Hours & minutes')
  const [locale, setLocale] = useState('en-GB')
  const [size, setSize] = useState<NonNullable<CelestialDisplayProps['size']>>('small')
  const [layout, setLayout] = useState<NonNullable<CelestialDisplayProps['layout']>>('inline')
  const [label, setLabel] = useState('Local time')
  const [copied, setCopied] = useState(false)
  const options = { date, place, bodies, dateFormat: dateFormats[dateStyle], timeFormat: timeFormats[timeStyle], locale, size, layout, label, variant, theme, colors: palettes[variant] }
  const code = `import { CelestialDisplay } from 'skydial/react'\nimport 'skydial/style.css'\n\n<CelestialDisplay\n  bodies={${JSON.stringify(bodies)}}\n  dateFormat={${JSON.stringify(options.dateFormat)}}\n  timeFormat={${JSON.stringify(options.timeFormat)}}\n  locale="${locale}"\n  size="${size}"\n  layout="${layout}"\n  label=${JSON.stringify(label)}\n  variant="${variant}"\n  theme="${theme}"${Object.keys(options.colors).length ? `\n  colors={${JSON.stringify(options.colors)}}` : ''}\n  place={${JSON.stringify(place)}}\n  date={new Date('${date.toISOString()}')}\n/>`
  const preset = (name: string) => {
    setDateStyle(name === 'Time' ? 'Hidden' : name === 'Year' ? 'Year' : 'Numeric')
    setTimeStyle(name === 'Time' ? 'Seconds' : name === 'Date & time' ? 'Hours & minutes' : 'Hidden')
    setBodies(name === 'Year' ? ['jupiter'] : name === 'Time' ? ['moon'] : ['earth', 'moon'])
    setLabel(name === 'Year' ? 'Year' : name === 'Date' ? 'Date' : 'Local time')
  }
  return <div className="compact-builder">
    <div className="compact-presets widget-size-choices" role="group" aria-label="Compact display presets">{['Date & time', 'Date', 'Time', 'Year'].map((name) => <button type="button" key={name} onClick={() => preset(name)}>{name}</button>)}</div>
    <div className="compact-builder-grid">
      <details className="component-settings"><summary>Component settings</summary><div className="compact-settings">
        <h3>Component settings</h3>
        <fieldset><legend>Celestial bodies</legend><div className="compact-body-options">{bodyOptions.map(({ id, name }) => <label key={id}><input type="checkbox" checked={bodies.includes(id)} onChange={(event) => setBodies(event.target.checked ? [...bodies, id] : bodies.filter((body) => body !== id))} />{name}</label>)}</div></fieldset>
        <div className="compact-settings-pair">
          <label>Date format<select value={dateStyle} onChange={(event) => setDateStyle(event.target.value)}>{Object.keys(dateFormats).map((name) => <option key={name}>{name}</option>)}</select></label>
          <label>Time format<select value={timeStyle} onChange={(event) => setTimeStyle(event.target.value)}>{Object.keys(timeFormats).map((name) => <option key={name}>{name}</option>)}</select></label>
          <label>Locale<select value={locale} onChange={(event) => setLocale(event.target.value)}>{['en-GB', 'en-US', 'fr-FR', 'ja-JP'].map((name) => <option key={name}>{name}</option>)}</select></label>
          <label>Display size<select value={size} onChange={(event) => setSize(event.target.value as typeof size)}>{['small', 'medium', 'large'].map((name) => <option key={name}>{name}</option>)}</select></label>
          <label>Layout<select value={layout} onChange={(event) => setLayout(event.target.value as typeof layout)}><option>inline</option><option>stacked</option></select></label>
          <label>Label<input value={label} onChange={(event) => setLabel(event.target.value)} /></label>
        </div>
      </div></details>
      <div className="compact-preview-column">
        <div className="compact-preview" role="region" aria-label="Compact display preview">
          <span className="compact-preview-kicker">In your interface</span>
          <CelestialDisplay {...options} />
        </div>
        <div className="compact-code"><div><span>Your component</span><button type="button" onClick={async () => { try { await navigator.clipboard.writeText(code); setCopied(true) } catch { setCopied(false) } }}>{copied ? 'Copied' : 'Copy code'}</button><span className="picker-sr-only" role="status">{copied ? 'Component code copied' : ''}</span></div><pre tabIndex={0} role="region" aria-label="Compact display code"><code>{code}</code></pre></div>
      </div>
    </div>
  </div>
}
