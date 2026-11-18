import { useContext, useRef, useState, type ButtonHTMLAttributes, type CSSProperties, type Ref } from 'react'
import { CelestialThemeContext, type PickerTheme } from './themeContext.js'
import { usePickerTheme, useResolvedPickerTheme } from './usePickerTheme.js'
import { useVisualRenderer } from '../render/visualRenderer.js'
import { pickerColorStyle, type PickerColors } from './colors.js'
import type { PickerVariant } from './appearance.js'
import { SunSymbol, MoonSymbol } from './ThemeToggleSymbols.js'
import { SunIllustration, MoonIllustration } from './ThemeToggleIllustrations.js'
import { useVisibleArtworkMotion } from '../render/artworkClock.js'
import { ThemePreferenceMenu } from './ThemePreferenceMenu.js'

export type ThemeTogglePart = 'root' | 'switch' | 'preference' | 'menu' | 'option' | 'indicator' | 'track' | 'selection' | 'artwork' | 'sun' | 'moon' | 'status'
export interface ThemeToggleState { theme: PickerTheme; dark: boolean; disabled: boolean }
export type ThemeToggleStyles = Partial<Record<ThemeTogglePart, CSSProperties | ((state: ThemeToggleState) => CSSProperties)>>
export interface CelestialThemeToggleProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'type' | 'onChange' | 'value' | 'defaultValue'> {
  ref?: Ref<HTMLButtonElement>
  theme?: PickerTheme
  defaultTheme?: PickerTheme
  /** Visual skin, independent of the selected mode. Inherits a provider, otherwise the device. */
  appearance?: PickerTheme
  onThemeChange?: (theme: PickerTheme) => void
  variant?: PickerVariant
  size?: 'small' | 'medium' | 'large'
  /** LCD artwork inside the thumb. Both options use only ink and paper. */
  lcdArtwork?: 'symbols' | 'illustrations'
  /** Show the current mode beside the switch. Defaults to true. */
  showLabel?: boolean
  /** Include a Light / Dark / System menu. Set false for just the toggle. Defaults to true. */
  showMenu?: boolean
  /** Enable decorative Sun motion and stars. Reduced motion still takes priority. */
  animated?: boolean
  /** Accessible name of the preference dropdown. */
  preferenceLabel?: string
  /** Visible mode names, independent of the stable accessible name. */
  labels?: { light: string; dark: string; system?: string }
  colors?: PickerColors
  /** Stable accessible name; checked always means dark mode. */
  label?: string
  styles?: ThemeToggleStyles
  classNames?: Partial<Record<ThemeTogglePart, string>>
}

/** A standalone Sun/Moon toggle. It reports a preference; the host owns its page theme. */
export function CelestialThemeToggle({ theme, defaultTheme = 'auto', appearance, onThemeChange, variant = 'celestial', size = 'medium', lcdArtwork = 'symbols', showLabel = true, showMenu = true, animated = true, preferenceLabel = 'Theme preference', labels = { light: 'Light', dark: 'Dark' }, colors, label = 'Dark mode', disabled = false,
  className = '', style, styles, classNames, onClick, onKeyDown, 'aria-label': ariaLabel, ...props }: CelestialThemeToggleProps) {
  const parent = useContext(CelestialThemeContext)
  const [owned, setOwned] = useState<PickerTheme>(defaultTheme)
  const preferred = usePickerTheme(theme, owned)
  const skin = appearance ?? parent?.theme ?? 'auto'
  const dark = useResolvedPickerTheme(preferred) === 'dark'
  const renderer = useVisualRenderer()
  const host = useRef<HTMLSpanElement>(null)
  const motion = useVisibleArtworkMotion(host, variant === 'celestial' && animated && !disabled)
  const state = { theme: preferred, dark, disabled }
  const part = (name: ThemeTogglePart, base = '') => ({
    'data-theme-toggle-part': name,
    className: [base, classNames?.[name]].filter(Boolean).join(' '),
    style: typeof styles?.[name] === 'function' ? styles[name](state) : styles?.[name],
  })
  const root = part('root', `celestial-clock celestial-control celestial-theme-toggle ${className}`)
  const palette = { ...pickerColorStyle(colors, variant), ...(colors?.background ? { '--toggle-track': colors.background, '--toggle-night-sky': colors.background, '--toggle-day-sky': colors.background } : {}), ...(colors?.foreground ? { '--toggle-ink': colors.foreground } : {}) } as CSSProperties
  const select = (next: PickerTheme) => {
    if (disabled || next === preferred) return
    if (theme === undefined) {
      if (parent) parent.setTheme(next)
      else setOwned(next)
    }
    onThemeChange?.(next)
  }
  const status = preferred === 'auto' ? labels.system ?? 'System' : dark ? labels.dark : labels.light
  return <span {...root} ref={host} dir={props.dir}
    data-picker-style={variant} data-picker-theme={skin} data-toggle-size={size} data-state={dark ? 'dark' : 'light'} data-theme-preference={preferred} data-disabled={disabled} data-scene-motion={motion ? 'running' : 'paused'} data-lcd-artwork={lcdArtwork} data-toggle-artwork={variant === 'celestial' && renderer?.ThemeToggle ? '3d' : 'symbols'}
    style={{ ...palette, ...style, ...root.style }}>
    <button {...props} {...part('switch', 'theme-toggle-switch')} type="button" role="switch" aria-label={ariaLabel ?? label} aria-checked={dark} disabled={disabled} data-toggle-size={size} onClick={(event) => {
      onClick?.(event)
      if (event.defaultPrevented || disabled) return
      select(dark ? 'light' : 'dark')
    }} onKeyDown={(event) => {
      onKeyDown?.(event)
      if (event.defaultPrevented || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return
      event.preventDefault()
      const rtl = getComputedStyle(event.currentTarget).direction === 'rtl'
      select((event.key === 'ArrowRight') !== rtl ? 'dark' : 'light')
    }}>
    <span {...part('track', 'theme-toggle-track')} aria-hidden="true">
      {variant === 'celestial' && <span className="theme-toggle-stars">{Array.from({ length: 6 }, (_, i) => <i key={i} />)}</span>}
      <span className="theme-toggle-mark"><SunSymbol /></span>
      <span className="theme-toggle-mark"><MoonSymbol /></span>
      <span {...part('selection', 'theme-toggle-selection')}>
        {[false, true].map((night) => <span key={String(night)} {...part(night ? 'moon' : 'sun', night ? 'theme-toggle-moon' : 'theme-toggle-sun')} data-active={dark === night}>
          <span className="theme-toggle-symbol">{variant === 'lcd' && lcdArtwork === 'illustrations' ? night ? <MoonIllustration /> : <SunIllustration /> : night ? <MoonSymbol /> : <SunSymbol />}</span>
          {variant === 'celestial' && renderer?.ThemeToggle && <span {...part('artwork', 'theme-toggle-artwork')}><renderer.ThemeToggle dark={night} active={dark === night} animated={animated && !disabled} /></span>}
        </span>)}
      </span>
    </span>
    {!showMenu && showLabel && <span {...part('status', 'theme-toggle-status')} aria-hidden="true">{status}</span>}
    </button>
    {showMenu && <ThemePreferenceMenu theme={preferred} status={status} resolvedLabel={dark ? labels.dark : labels.light} labels={labels} label={preferenceLabel} disabled={disabled} showLabel={showLabel} onSelect={select} part={part} />}
  </span>
}
