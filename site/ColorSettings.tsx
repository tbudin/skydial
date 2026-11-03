import { useState } from 'react'
import type { PickerColors, PickerTheme, PickerVariant } from 'skydial/react'
import { COLOUR_PRESETS, colourPresetName, coloursForPreset, previewSwatches, useResolvedPreviewTheme } from './previewColors.js'

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (color: string) => void }) {
  const [draft, setDraft] = useState<string | null>(null)
  const hex = /^#[\da-f]{6}$/i.test(value) ? value : /^#[\da-f]{3}$/i.test(value) ? '#' + [...value.slice(1)].map((c) => c + c).join('') : '#000000'
  return <div className="colour-field"><label>{label}<input type="color" value={hex} onChange={(event) => { setDraft(null); onChange(event.target.value) }} /></label>
    <input aria-label={`${label} colour code`} type="text" spellCheck={false} value={draft ?? value} onBlur={() => setDraft(null)} onChange={(event) => {
      const next = event.target.value
      setDraft(next)
      if (CSS.supports('color', next)) onChange(next)
    }} />
  </div>
}

export default function ColorSettings({ variant, theme, colors, onChange, showPalette = true }: { variant: PickerVariant; theme: PickerTheme; colors: PickerColors; onChange: (colors: PickerColors) => void; showPalette?: boolean }) {
  const resolved = useResolvedPreviewTheme(theme)
  const defaults = previewSwatches(variant, resolved, {})
  const field = (key: keyof PickerColors, label: string) => <ColorField key={key} label={label} value={colors[key] ?? (defaults as PickerColors)[key] ?? '#000000'} onChange={(value) => onChange({ ...colors, [key]: value })} />
  const preset = colourPresetName(colors)
  return <fieldset className="colour-settings"><legend>Colours</legend>
    {showPalette && <label>Colour palette<select value={preset} onChange={(event) => onChange(coloursForPreset(event.target.value, variant))}><option>Theme defaults</option>{Object.keys(COLOUR_PRESETS).map((name) => <option key={name}>{name}</option>)}<option disabled>Custom</option></select></label>}
    <div className="colour-fields">{field('foreground', variant === 'lcd' ? 'LCD ink' : 'Text')}{field('background', variant === 'lcd' ? 'LCD screen' : 'Background')}
      {variant !== 'lcd' && <>{field('accent', 'Accent')}{field('muted', 'Secondary text')}{field('border', 'Borders')}</>}
    </div>
    {variant !== 'lcd' && <details><summary>Orbit colours</summary><div className="colour-fields">{field('earthHand', 'Earth hand')}{field('yearHand', 'Year hand')}{field('orbit', 'Orbit lines')}{field('tick', 'Calendar ticks')}{field('tickMajor', 'Major ticks')}</div></details>}
    <button type="button" onClick={() => onChange({})}>Use theme colours</button>
  </fieldset>
}
