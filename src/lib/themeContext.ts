import { createContext } from 'react'

export type PickerTheme = 'dark' | 'light' | 'auto'
export type ResolvedPickerTheme = 'dark' | 'light'
export interface CelestialThemeState {
  theme: PickerTheme
  setTheme: (theme: PickerTheme) => void
}

export const CelestialThemeContext = createContext<CelestialThemeState | null>(null)
