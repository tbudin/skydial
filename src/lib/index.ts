/**
 * Embeddable React entry point.
 *
 *   import { CelestialClock } from 'skydial'
 *   <CelestialClock view="orrery" useUrl={false} />
 *
 * Textures are included in the library build. Import skydial/style.css
 * once in your application.
 */
export { default as CelestialClock, type CelestialClockProps, type ViewMode } from '../App.js'
export { SimClock, SPEEDS } from '../sim/clock.js'
export * as astro from '../astro/index.js'

export { CelestialProvider } from '../sim/react.js'
export { useCelestialClock } from '../sim/hooks.js'
export type { CelestialProviderProps } from '../sim/react.js'
export { EarthClock, MoonClock, OrreryClock } from './widgets.js'
export type { CelestialWidgetProps, OrreryClockProps } from './widgets.js'
export { CelestialDatePicker } from './datePicker.js'
export type { CelestialDatePickerProps } from './datePicker.js'
export { CelestialWidget, EarthWidget, MoonWidget, OrreryWidget, YearWidget } from './cards.js'
export type { CelestialCardProps } from './cards.js'
export { CelestialTimePicker } from './timePicker.js'
export type { CelestialTimePickerProps } from './timePicker.js'
export type { PickerPresentation } from './PickerField.js'
export { CelestialInput, type CelestialInputProps, type PickerScene } from './input.js'
export { CelestialPicker, type CelestialPickerProps } from './picker.js'
export { CelestialScrollPicker, CelestialStepper } from './PickerControls.js'
export type { CelestialControlProps, PickerSize, PickerTheme, PickerControl } from './PickerControls.js'
export type { PickerUnit, PickerMode, PickerSteps, PickerConfiguration } from '../astro/picker.js'
export type { EarthPickerView, EarthPickerViewProps } from './useEarthView.js'
export { CelestialDatePicker as CelestialDateTimePicker } from './datePicker.js'
export type { CelestialDatePickerProps as CelestialDateTimePickerProps } from './datePicker.js'

export { PICKER_PARTS } from './appearance.js'
export type { PickerColors } from './colors.js'
export type { PickerVariant, PickerPart, PickerPartState, PickerPartStyle, PickerStyles, PickerClassNames, PickerAppearance } from './appearance.js'
export type { OrreryAppearance } from '../render/Orrery.js'
