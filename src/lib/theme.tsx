/* oxlint-disable react/only-export-components -- Theme provider, hook and control share one public entry. */
import { useCallback, useContext, useMemo, useState, type CSSProperties, type HTMLAttributes, type ReactNode } from 'react'
import { CelestialThemeContext, type PickerTheme } from './themeContext.js'
import { usePickerTheme, useResolvedPickerTheme } from './usePickerTheme.js'
import type { PickerVariant } from './appearance.js'
import { pickerColorStyle, type PickerColors } from './colors.js'

export type { PickerTheme, ResolvedPickerTheme } from './themeContext.js'
export interface CelestialThemeProviderProps {
  children?: ReactNode
  theme?: PickerTheme
  defaultTheme?: PickerTheme
  onThemeChange?: (theme: PickerTheme) => void
}

/** Shares appearance without changing the host document or writing browser storage. */
export function CelestialThemeProvider({ children, theme, defaultTheme = 'auto', onThemeChange }: CelestialThemeProviderProps) {
  const [owned, setOwned] = useState(defaultTheme)
  const setTheme = useCallback((next: PickerTheme) => {
    if (theme === undefined) setOwned(next)
    onThemeChange?.(next)
  }, [theme, onThemeChange])
  const value = useMemo(() => ({ theme: theme ?? owned, setTheme }), [theme, owned, setTheme])
  return <CelestialThemeContext.Provider value={value}>{children}</CelestialThemeContext.Provider>
}

/** Build a custom control or restore system appearance with setTheme('auto'). */
export function useCelestialTheme() {
  const context = useContext(CelestialThemeContext)
  const resolvedTheme = useResolvedPickerTheme(context?.theme, 'auto')
  if (!context) throw new Error('useCelestialTheme requires a CelestialThemeProvider.')
  return { ...context, resolvedTheme }
}

export interface ThemeSwitchButtonState {
  theme: PickerTheme
  selected: boolean
  disabled: boolean
}
export interface CelestialThemeSwitchProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'defaultValue' | 'onChange'> {
  /** Omit to use the nearest provider, or a standalone uncontrolled control. */
  theme?: PickerTheme
  defaultTheme?: PickerTheme
  onThemeChange?: (theme: PickerTheme) => void
  variant?: PickerVariant
  colors?: PickerColors
  disabled?: boolean
  labels?: Partial<Record<PickerTheme | 'appearance', string>>
  styles?: { root?: CSSProperties; button?: CSSProperties | ((state: ThemeSwitchButtonState) => CSSProperties) }
  classNames?: { root?: string; button?: string }
}

const options: readonly PickerTheme[] = ['light', 'dark', 'auto']
const defaultLabels = { light: 'Light', dark: 'Dark', auto: 'System', appearance: 'Appearance' }

/** Native toggle buttons; keyboard and touch accessible, with no form submission. */
export function CelestialThemeSwitch({ theme, defaultTheme = 'auto', onThemeChange, variant = 'celestial', colors, disabled = false,
  labels, styles, classNames, className = '', style, 'aria-label': ariaLabel, ...props }: CelestialThemeSwitchProps) {
  const parent = useContext(CelestialThemeContext)
  const [owned, setOwned] = useState(defaultTheme)
  const preferred = usePickerTheme(theme, owned)
  const text = { ...defaultLabels, ...labels }
  const select = (next: PickerTheme) => {
    if (disabled || next === preferred) return
    if (theme === undefined) {
      if (parent) parent.setTheme(next)
      else setOwned(next)
    }
    onThemeChange?.(next)
  }
  return <div {...props} role="group" aria-label={ariaLabel ?? text.appearance} aria-disabled={disabled || undefined}
    className={`celestial-clock celestial-control celestial-theme-switch ${className} ${classNames?.root ?? ''}`}
    data-picker-theme={preferred} data-picker-style={variant} data-theme-part="root"
    style={{ ...pickerColorStyle(colors, variant), ...style, ...styles?.root }}>
    {options.map((option) => {
      const state = { theme: option, selected: preferred === option, disabled }
      return <button key={option} type="button" data-theme-part="button" data-theme-option={option} aria-pressed={state.selected} disabled={disabled}
        className={classNames?.button} style={typeof styles?.button === 'function' ? styles.button(state) : styles?.button}
        onClick={() => select(option)}>{text[option]}</button>
    })}
  </div>
}
