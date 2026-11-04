import { createContext, useContext, type CSSProperties } from 'react'
import type { PickerUnit } from '../astro/picker.js'
import type { PickerColors } from './colors.js'

/** Stable styling hooks shared by the form input and standalone controls. */
export const PICKER_PARTS = [
  'root', 'label', 'field', 'value', 'indicator', 'panel', 'content', 'visual', 'controls',
  'controlGroup', 'unit', 'unitLabel', 'wheelColumn', 'wheelFrame', 'wheel', 'wheelOption',
  'selection', 'stepInput', 'stepButtons', 'stepButton', 'footer', 'timezone', 'actions',
  'nowButton', 'clearButton', 'doneButton', 'description', 'error', 'scene', 'earth',
  'earthPrecision', 'earthPrecisionButton', 'globe', 'reticle', 'orrery', 'orbitStage',
  'orbitLabels', 'monthLabel', 'yearLabel', 'dateBadge', 'yearBadge', 'rangeNavigation',
  'rangeButton', 'rangeLabel', 'orbitPreview', 'orbitPreviewMarker', 'orbitTrack',
  'orbitHandle', 'orbitMonthArc', 'orbitLens', 'orbitLensDay',
  'dayPeriodButton', 'rangeTabs', 'rangeTab', 'rangeTrack', 'rangeEndpoint', 'unavailableTrack',
] as const
export type PickerPart = typeof PICKER_PARTS[number]
export type PickerPartState = { unit?: PickerUnit; selected?: boolean; disabled?: boolean; direction?: number; endpoint?: 'start' | 'end' }
export type PickerPartStyle = CSSProperties & { [key: `--${string}`]: string | number | undefined }
export type PickerStyles = Partial<Record<PickerPart, PickerPartStyle | ((state: PickerPartState) => PickerPartStyle)>>
export type PickerClassNames = Partial<Record<PickerPart, string>>
export type PickerVariant = 'celestial' | 'lcd'
export interface PickerAppearance {
  /** Celestial keeps textured 3D scenes; LCD uses flat duotone diagrams. */
  variant?: PickerVariant
  /** LCD uses background/foreground as its two inks; celestial supports every colour. */
  colors?: PickerColors
  /** Every visible DOM part can be styled, including selected/disabled states. */
  styles?: PickerStyles
  classNames?: PickerClassNames
  /** Geometry used by scrolling, in pixels; use this instead of CSS row heights. */
  wheelRowHeight?: number
  wheelRows?: 3 | 5
}
export const PickerAppearanceContext = createContext<PickerAppearance>({})
export function usePickerParts() {
  const { styles, classNames } = useContext(PickerAppearanceContext)
  return (part: PickerPart, className = '', style?: CSSProperties, state: PickerPartState = {}) => {
    const custom = styles?.[part]
    return {
      'data-picker-part': part,
      className: [className, classNames?.[part]].filter(Boolean).join(' '),
      style: { ...style, ...(typeof custom === 'function' ? custom(state) : custom) },
    }
  }
}

export function usePickerVariant() { return useContext(PickerAppearanceContext).variant ?? 'celestial' }
