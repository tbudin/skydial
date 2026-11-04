import { createElement, type ComponentType } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { CelestialRangeInput, CelestialRangePicker, CelestialValueInput, CelestialInput, CelestialPicker, CelestialScrollPicker, CelestialStepper, CelestialDatePicker, CelestialTimePicker, CelestialWidget, CelestialClock, EarthClock, MoonClock, OrreryClock } from '../lib/index.js'
import type { CelestialInputProps } from '../lib/input.js'
import type { CelestialPickerProps } from '../lib/picker.js'
import type { CelestialControlProps } from '../lib/PickerControls.js'
import type { CelestialDatePickerProps } from '../lib/datePicker.js'
import type { CelestialTimePickerProps } from '../lib/timePicker.js'
import type { CelestialCardProps } from '../lib/cards.js'
import type { CelestialWidgetProps, OrreryClockProps } from '../lib/widgets.js'
import type { CelestialClockProps } from '../App.js'
import { CelestialDisplay, CelestialBody, type CelestialDisplayProps, type CelestialBodyProps } from '../lib/display.js'

import type { CelestialRangeInputProps } from '../lib/rangeInput.js'
import type { CelestialRangePickerProps } from '../lib/range.js'
import type { CelestialValueInputProps } from '../lib/valueInput.js'

export interface CelestialComponentMap {
  range: CelestialRangeInputProps
  rangeField: CelestialRangePickerProps
  value: CelestialValueInputProps
  input: CelestialInputProps
  field: CelestialPickerProps
  scroll: CelestialControlProps
  stepper: CelestialControlProps
  picker: CelestialDatePickerProps
  time: CelestialTimePickerProps
  widget: CelestialCardProps
  display: CelestialDisplayProps
  body: CelestialBodyProps
  clock: CelestialClockProps
  earth: CelestialWidgetProps
  moon: CelestialWidgetProps
  orrery: OrreryClockProps
}
export type CelestialComponent = keyof CelestialComponentMap
const components = { range: CelestialRangeInput, rangeField: CelestialRangePicker, value: CelestialValueInput, input: CelestialInput, field: CelestialPicker, scroll: CelestialScrollPicker, stepper: CelestialStepper, picker: CelestialDatePicker, time: CelestialTimePicker, widget: CelestialWidget, display: CelestialDisplay, body: CelestialBody, clock: CelestialClock, earth: EarthClock, moon: MoonClock, orrery: OrreryClock }
const roots = new WeakMap<HTMLElement, Root>()

export interface CelestialMount<K extends CelestialComponent> {
  /** Replace all props, preserving component state for unchanged defaults. */
  update: (props: CelestialComponentMap[K]) => void
  destroy: () => void
}

/** Browser-only mount API shared by the Vue, Svelte and vanilla integrations. */
export function mountCelestial<K extends CelestialComponent>(element: HTMLElement, component: K, props: CelestialComponentMap[K] = {} as CelestialComponentMap[K]): CelestialMount<K> {
  if (roots.has(element)) throw new Error('This element already contains a celestial mount. Update or destroy it first.')
  const Selected = components[component] as ComponentType<CelestialComponentMap[K]>
  if (!Selected) throw new TypeError(`Unknown celestial component: ${component}`)
  const root = createRoot(element)
  roots.set(element, root)
  let destroyed = false
  const update = (next: CelestialComponentMap[K]) => {
    if (destroyed) throw new Error('Cannot update a destroyed celestial mount.')
    root.render(createElement(Selected, next))
  }
  update(props)
  return { update, destroy: () => {
    if (destroyed) return
    destroyed = true
    roots.delete(element)
    root.unmount()
  } }
}
