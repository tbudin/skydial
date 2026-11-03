import { useSyncExternalStore } from 'react'
import type { PickerColors, PickerTheme, PickerVariant } from 'skydial/react'

const lcdDefaults = { light: { background: '#c9cfb4', foreground: '#263426' }, dark: { background: '#1a281f', foreground: '#d3dbba' } }
const celestialDefaults: Record<'light' | 'dark', Required<PickerColors>> = {
  light: { background: '#ffffff', foreground: '#243044', muted: '#66748a', border: '#78879a', accent: '#315d9a', orbit: '#64758b', tick: '#697b91', tickMajor: '#384e66', earthHand: '#287652', yearHand: '#946b20' },
  dark: { background: '#0b111b', foreground: '#e9eef6', muted: '#98a7bb', border: '#71839b', accent: '#a9c8ff', orbit: '#8796b0', tick: '#7d8aa1', tickMajor: '#c9d2e0', earthHand: '#79c99e', yearHand: '#d8b46a' },
}
export const COLOUR_PRESETS: Record<string, Pick<PickerColors, 'background' | 'foreground'>> = {
  'Classic green': { background: '#c9cfb4', foreground: '#263426' },
  'Ice blue': { background: '#dcebf1', foreground: '#183747' },
  Amber: { background: '#f3dfaf', foreground: '#493119' },
  Graphite: { background: '#20252b', foreground: '#e4e9eb' },
}
const subscribeTheme = (notify: () => void) => {
  const media = window.matchMedia('(prefers-color-scheme: dark)')
  media.addEventListener('change', notify)
  return () => media.removeEventListener('change', notify)
}
const systemDark = () => window.matchMedia('(prefers-color-scheme: dark)').matches
const serverLight = () => false
export function useResolvedPreviewTheme(theme: PickerTheme) {
  const dark = useSyncExternalStore(subscribeTheme, systemDark, serverLight)
  return theme === 'auto' ? dark ? 'dark' : 'light' : theme
}
export function previewSwatches(variant: PickerVariant, theme: 'light' | 'dark', colors: PickerColors) {
  return { ...(variant === 'lcd' ? lcdDefaults[theme] : celestialDefaults[theme]), ...colors }
}
export function colourPresetName(colors: PickerColors) {
  return Object.entries(COLOUR_PRESETS).find(([, pair]) => colors.background === pair.background && colors.foreground === pair.foreground)?.[0] ?? (Object.keys(colors).length ? 'Custom' : 'Theme defaults')
}
export function coloursForPreset(name: string, variant: PickerVariant): PickerColors {
  const pair = COLOUR_PRESETS[name]
  return pair ? variant === 'lcd' ? { ...pair } : { ...pair, muted: pair.foreground, border: pair.foreground, accent: pair.foreground, earthHand: pair.foreground, yearHand: pair.foreground, orbit: pair.foreground, tick: pair.foreground, tickMajor: pair.foreground } : {}
}
