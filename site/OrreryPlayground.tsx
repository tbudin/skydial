import { useState } from 'react'
import { CelestialInput, type PickerUnit, type PickerControl } from 'skydial/react'
import { CITIES, type YearPlanetId } from 'skydial/astro'
import { usePreviewSettings } from './previewSettings.js'

export default function OrreryPlayground() {
  const [date, setDate] = useState<Date | null>(new Date('2026-03-20T12:00:00Z'))
  const [planet, setPlanet] = useState<YearPlanetId>('jupiter')
  const [units, setUnits] = useState<PickerUnit[]>(['year', 'month', 'day'])
  const [control, setControl] = useState<PickerControl>('both')
  const [city, setCity] = useState('London')
  const { variant, theme, palettes } = usePreviewSettings()
  const place = { ...(CITIES.find((place) => place.name === city) ?? CITIES[0]), source: 'city' as const }
  const code = `<CelestialInput\n  presentation="inline"\n  label="Orbital date picker"\n  units={${JSON.stringify(units)}}\n  scene="orrery"\n  planet="${planet}"\n  control="${control}"\n  variant="${variant}"\n  theme="${theme}"${Object.keys(palettes[variant]).length ? `\n  colors={${JSON.stringify(palettes[variant])}}` : ''}\n  place={${JSON.stringify(place)}}\n  defaultValue={new Date('${date?.toISOString() ?? '2026-03-20T12:00:00Z'}')}\n/>`
  return <div className="orrery-playground">
    <details className="component-settings"><summary>Component settings</summary><section className="orrery-settings" aria-label="Orrery settings">
      <fieldset><legend>Calendar units</legend><div className="widget-size-choices">{(['year', 'month', 'day'] as const).map((unit) => <label key={unit}><input type="checkbox" checked={units.includes(unit)} disabled={units.length === 1 && units[0] === unit} onChange={(event) => setUnits((['year', 'month', 'day'] as const).filter((item) => item === unit ? event.target.checked : units.includes(item)))} />{unit}</label>)}</div></fieldset>
      <fieldset><legend>Year planet</legend><div className="widget-size-choices" role="group" aria-label="Year planet">{(['jupiter', 'saturn', 'uranus', 'neptune'] as const).map((id) => <button key={id} type="button" aria-pressed={planet === id} onClick={() => setPlanet(id)}>{id[0].toUpperCase() + id.slice(1)}</button>)}</div></fieldset>
      <div className="compact-settings-pair"><label>Exact controls<select value={control} onChange={(event) => setControl(event.target.value as PickerControl)}><option value="both">Scroll wheels & −/+</option><option value="wheel">Scroll wheels</option><option value="stepper">−/+</option></select></label><label>Observer city<select value={city} onChange={(event) => setCity(event.target.value)}>{CITIES.map(({ name }) => <option key={name}>{name}</option>)}</select></label></div>
    </section></details>
    <div className="orrery-preview">
      <CelestialInput value={date} onChange={setDate} presentation="inline" label="Orbital date picker" scene="orrery" units={units} planet={planet} control={control} place={place} variant={variant} theme={theme} colors={palettes[variant]} />
    </div>
    <pre className="orrery-code" tabIndex={0} role="region" aria-label="Orrery component code"><code>{code}</code></pre>
  </div>
}
