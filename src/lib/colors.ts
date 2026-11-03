import type { CSSProperties } from 'react'
import type { OrreryPalette } from '../render/palette.js'

/** CSS colours shared by inputs, scroll/step controls and compact widgets. */
export interface PickerColors {
  background?: string
  foreground?: string
  muted?: string
  border?: string
  accent?: string
  orbit?: string
  tick?: string
  tickMajor?: string
  earthHand?: string
  yearHand?: string
}

export function pickerColorStyle(colors: PickerColors = {}, variant = 'celestial'): CSSProperties {
  const variables: Record<string, string> = {}
  const names: Partial<Record<keyof PickerColors, string[]>> = variant === 'lcd'
    ? { background: ['--lcd-paper'], foreground: ['--lcd-ink'] }
    : {
      background: ['--bg', '--widget-background'], foreground: ['--text', '--widget-foreground'],
      muted: ['--muted', '--widget-muted'], border: ['--line', '--widget-border'],
      accent: ['--picker-accent', '--hour'], earthHand: ['--green'], yearHand: ['--gold'],
    }
  for (const [key, value] of Object.entries(colors)) {
    if (value !== undefined) for (const name of names[key as keyof PickerColors] ?? []) variables[name] = value
  }
  return variables as CSSProperties
}

/** Keep the canvas palette in sync with the DOM controls. */
export function pickerColorPalette(colors: PickerColors = {}): Partial<OrreryPalette> {
  const palette: { -readonly [K in keyof OrreryPalette]?: OrreryPalette[K] } = {}
  const names: Partial<Record<keyof PickerColors, keyof Omit<OrreryPalette, 'orbitOpacity'>>> = {
    background: 'background', foreground: 'labelActive', muted: 'label', orbit: 'orbit',
    tick: 'tick', tickMajor: 'tickMajor', earthHand: 'earthHand', yearHand: 'yearHand',
  }
  for (const [key, value] of Object.entries(colors)) {
    const name = names[key as keyof PickerColors]
    if (name && value !== undefined) palette[name] = value
  }
  return palette
}
