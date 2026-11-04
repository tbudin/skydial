import { createElement, type ComponentType } from 'react'
import { nativeRenderer } from '../render/nativeRenderer.js'
import { VisualRendererProvider } from '../render/visualRenderer.js'
import { CelestialValueInput as ValueInput } from './valueInput.js'
import { CelestialInput as Input } from './input.js'
import { CelestialRangeInput as RangeInput } from './rangeInput.js'
import { CelestialDatePicker as DatePicker } from './datePicker.js'
import { CelestialTimePicker as TimePicker } from './timePicker.js'
import { CelestialWidget as Widget, EarthWidget as Earth, MoonWidget as Moon, OrreryWidget as Orrery, YearWidget as Year } from './cards.js'
import { CelestialDisplay as Display, CelestialDateDisplay as DateDisplay, CelestialTimeDisplay as TimeDisplay, CelestialBody as Body } from './display.js'

function withRenderer<P extends object>(View: ComponentType<P>) {
  return function CelestialView(props: P) {
    return createElement(VisualRendererProvider, { renderer: nativeRenderer }, createElement(View, props))
  }
}
export const CelestialValueInput = withRenderer(ValueInput)
export const CelestialInput = withRenderer(Input)
export const CelestialRangeInput = withRenderer(RangeInput)
export const CelestialDatePicker = withRenderer(DatePicker)
export const CelestialDateTimePicker = CelestialDatePicker
export const CelestialTimePicker = withRenderer(TimePicker)
export const CelestialWidget = withRenderer(Widget)
export const EarthWidget = withRenderer(Earth)
export const MoonWidget = withRenderer(Moon)
export const OrreryWidget = withRenderer(Orrery)
export const YearWidget = withRenderer(Year)
export const CelestialDisplay = withRenderer(Display)
export const CelestialDateDisplay = withRenderer(DateDisplay)
export const CelestialTimeDisplay = withRenderer(TimeDisplay)
export const CelestialBody = withRenderer(Body)
