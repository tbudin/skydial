import { useSyncExternalStore } from 'react'

const subscribeTheme = (notify: () => void) => {
  const media = window.matchMedia('(prefers-color-scheme: light)')
  media.addEventListener('change', notify)
  return () => media.removeEventListener('change', notify)
}
const systemLight = () => window.matchMedia('(prefers-color-scheme: light)').matches
const serverDark = () => false
export function useResolvedPickerTheme(theme: 'light' | 'dark' | 'auto') {
  const light = useSyncExternalStore(subscribeTheme, systemLight, serverDark)
  return theme === 'auto' ? light ? 'light' : 'dark' : theme
}
