import { useSyncExternalStore } from 'react'
import type { PickerColors, PickerTheme, PickerVariant } from 'skydial/react'

type PreviewSettings = { variant: PickerVariant; theme: PickerTheme; palettes: Record<PickerVariant, PickerColors> }
const key = 'celestial-clock:preview'
const listeners = new Set<() => void>()
function initialSettings(): PreviewSettings {
  let saved: Partial<PreviewSettings> = {}
  try { saved = JSON.parse(sessionStorage.getItem(key) ?? '{}') ?? {} } catch { /* Use defaults when storage is unavailable. */ }
  let siteTheme: string | null = null
  try { siteTheme = localStorage.getItem('package-site:theme') } catch { /* Follow the system. */ }
  const preferredTheme = saved.theme ?? siteTheme
  const query = new URLSearchParams(window.location.search).get('style')
  return {
    variant: query === 'lcd' || query === 'celestial' ? query : saved.variant === 'lcd' ? 'lcd' : 'celestial',
    theme: preferredTheme === 'light' || preferredTheme === 'dark' ? preferredTheme : 'auto',
    palettes: { celestial: saved.palettes?.celestial ?? {}, lcd: saved.palettes?.lcd ?? {} },
  }
}
let settings = initialSettings()
export const getPreviewSettings = () => settings
export const subscribePreviewSettings = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener) } }
export function updatePreviewSettings(next: Partial<Pick<PreviewSettings, 'variant' | 'theme'>>) {
  settings = { ...settings, ...next }
  if (next.variant) {
    const url = new URL(window.location.href)
    url.searchParams.set('style', next.variant)
    history.replaceState(history.state, '', url)
  }
  persist()
}
export function updatePreviewColors(colors: PickerColors) {
  settings = { ...settings, palettes: { ...settings.palettes, [settings.variant]: colors } }
  persist()
}
function persist() {
  try { sessionStorage.setItem(key, JSON.stringify(settings)) } catch { /* Keep the live preview working without storage. */ }
  listeners.forEach((listener) => listener())
}
export function usePreviewSettings() { return useSyncExternalStore(subscribePreviewSettings, getPreviewSettings, getPreviewSettings) }
export function getPreviewAppearance() {
  return { variant: settings.variant, theme: settings.theme, colors: settings.palettes[settings.variant] }
}
