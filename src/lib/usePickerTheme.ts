import { useContext, useSyncExternalStore } from 'react'
import { CelestialThemeContext, type PickerTheme } from './themeContext.js'

const listeners = new Set<() => void>()
let media: MediaQueryList | null = null
const notifyTheme = () => listeners.forEach((notify) => notify())
const subscribeTheme = (notify: () => void) => {
  if (typeof window.matchMedia !== 'function') return () => {}
  if (!media) {
    media = window.matchMedia('(prefers-color-scheme: light)')
    media.addEventListener('change', notifyTheme)
  }
  listeners.add(notify)
  return () => {
    listeners.delete(notify)
    if (!listeners.size) {
      media?.removeEventListener('change', notifyTheme)
      media = null
    }
  }
}
const subscribeNothing = () => () => {}
const systemLight = () => typeof window !== 'undefined' && typeof window.matchMedia === 'function'
  ? (media ?? window.matchMedia('(prefers-color-scheme: light)')).matches : false
const serverDark = () => false

/** Explicit component props win; a provider otherwise precedes the existing default. */
export function usePickerTheme(theme?: PickerTheme, fallback: PickerTheme = 'dark') {
  const context = useContext(CelestialThemeContext)
  return theme ?? context?.theme ?? fallback
}

export function useResolvedPickerTheme(theme?: PickerTheme, fallback: PickerTheme = 'dark') {
  const preferred = usePickerTheme(theme, fallback)
  const light = useSyncExternalStore(preferred === 'auto' ? subscribeTheme : subscribeNothing, systemLight, serverDark)
  return preferred === 'auto' ? light ? 'light' : 'dark' : preferred
}
