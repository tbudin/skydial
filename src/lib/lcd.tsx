/* oxlint-disable react/only-export-components -- Public entry re-exports shared providers and hooks. */
/** Duotone SVG components. React/React DOM only; no Three.js dependency graph. */
import { CelestialValueInput as ValueInput, type CelestialValueInputProps } from './valueInput.js'
import { CelestialInput as Input, type CelestialInputProps } from './input.js'
import { CelestialRangeInput as RangeInput, type CelestialRangeInputProps } from './rangeInput.js'
import { CelestialWidget as Widget, type CelestialCardProps } from './cards.js'
import { CelestialDisplay as Display, CelestialDateDisplay as DateDisplay, CelestialTimeDisplay as TimeDisplay, CelestialBody as Body, type CelestialDisplayProps, type CelestialBodyProps } from './display.js'
import { CelestialPicker as Picker, type CelestialPickerProps } from './picker.js'
import { CelestialRangePicker as RangePicker, type CelestialRangePickerProps } from './range.js'
import { CelestialScrollPicker as Scroll, CelestialStepper as Stepper, type CelestialControlProps } from './PickerControls.js'

type Lcd<P> = Omit<P, 'variant'>
export function CelestialInput(props: Lcd<CelestialInputProps>) { return <Input {...props} variant="lcd" /> }
export function CelestialRangeInput(props: Lcd<CelestialRangeInputProps>) { return <RangeInput {...props} variant="lcd" /> }
export function CelestialPicker(props: Lcd<CelestialPickerProps>) { return <Picker {...props} variant="lcd" /> }
export function CelestialRangePicker(props: Lcd<CelestialRangePickerProps>) { return <RangePicker {...props} variant="lcd" /> }
export function CelestialScrollPicker(props: Lcd<CelestialControlProps>) { return <Scroll {...props} variant="lcd" /> }
export function CelestialStepper(props: Lcd<CelestialControlProps>) { return <Stepper {...props} variant="lcd" /> }
export function CelestialWidget(props: Lcd<CelestialCardProps>) { return <Widget {...props} variant="lcd" /> }
export function EarthWidget(props: Lcd<Omit<CelestialCardProps, 'kind'>>) { return <Widget {...props} kind="earth" variant="lcd" /> }
export function MoonWidget(props: Lcd<Omit<CelestialCardProps, 'kind'>>) { return <Widget {...props} kind="moon" variant="lcd" /> }
export function OrreryWidget(props: Lcd<Omit<CelestialCardProps, 'kind'>>) { return <Widget {...props} kind="orrery" variant="lcd" /> }
export function YearWidget(props: Lcd<Omit<CelestialCardProps, 'kind'>>) { return <Widget {...props} kind="year" variant="lcd" /> }
export function CelestialDisplay(props: Lcd<CelestialDisplayProps>) { return <Display {...props} variant="lcd" /> }
export function CelestialDateDisplay(props: Lcd<Omit<CelestialDisplayProps, 'timeFormat'>>) { return <DateDisplay {...props} variant="lcd" /> }
export function CelestialTimeDisplay(props: Lcd<Omit<CelestialDisplayProps, 'dateFormat'>>) { return <TimeDisplay {...props} variant="lcd" /> }
export function CelestialBody(props: Lcd<CelestialBodyProps>) { return <Body {...props} variant="lcd" /> }
export { CelestialProvider, type CelestialProviderProps } from '../sim/react.js'
export { useCelestialClock } from '../sim/hooks.js'
export { PICKER_PARTS } from './appearance.js'
export { WIDGET_PARTS } from './widgetAppearance.js'
export type { CelestialInputProps, CelestialRangeInputProps, CelestialPickerProps, CelestialRangePickerProps, CelestialControlProps, CelestialCardProps, CelestialDisplayProps, CelestialBodyProps }
export type { PickerColors } from './colors.js'
export type { PickerStyles, PickerClassNames, PickerAppearance } from './appearance.js'
export type { PickerUnit, PickerConfiguration } from '../astro/picker.js'
export type { PickerAvailability } from '../astro/availability.js'
export type { PickerDateRange, PickerRangeRules } from '../astro/range.js'
export type { PickerMessages, PickerLocalization } from './localization.js'

export function CelestialValueInput(props: CelestialValueInputProps) { return <ValueInput {...props} variant="lcd" /> }
export type { CelestialValueInputProps } from './valueInput.js'
