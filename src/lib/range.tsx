import { RangeSelectionContext, useRangeSelection } from './rangeSelection.js'
import { useState, type ReactNode } from 'react'
import { pickerBounds, pickerFormValue, pickerUnits } from '../astro/picker.js'
import { validatePickerRange, type PickerDateRange, type PickerRangeRules } from '../astro/range.js'
import { CelestialPicker, type CelestialPickerProps } from './picker.js'
import { DEFAULT_PLACE } from './defaults.js'
import { localizedPickerValue, pickerLocale, usePickerLocale } from './localization.js'
import { usePickerParts } from './appearance.js'

export type RangeEndpoint = 'start' | 'end'
export interface CelestialRangePickerProps extends Omit<CelestialPickerProps, 'value' | 'defaultValue' | 'onChange' | 'clock' | 'formatValue' | 'children'>, PickerRangeRules {
  value?: PickerDateRange | null
  defaultValue?: PickerDateRange | null
  onChange?: (value: PickerDateRange | null) => void
  /** One scene and one set of exact controls, shared between explicit endpoints. */
  children?: ReactNode
  startName?: string
  endName?: string
}

/** One popup, two stable endpoints. Selecting a start never silently advances to end. */
export function CelestialRangePicker({ value, defaultValue = null, onChange, children, name, startName, endName, onReset, ...props }: CelestialRangePickerProps) {
  const [owned, setOwned] = useState<PickerDateRange | null>(defaultValue)
  const [active, activate] = useState<RangeEndpoint>('start')
  const controlled = value !== undefined
  const selection = controlled ? value : owned
  const place = props.place ?? DEFAULT_PLACE
  const i18n = pickerLocale(props)
  const units = pickerUnits(props)
  const global = pickerBounds(props)
  const other = active === 'start' ? selection?.end : selection?.start
  const otherTime = other == null ? null : Number(other)
  const from = otherTime === null ? global.min : active === 'end' ? Math.max(global.min, otherTime + (props.minimumDuration ?? 0)) : Math.max(global.min, otherTime - (props.maximumDuration ?? Infinity))
  const to = otherTime === null ? global.max : active === 'start' ? Math.min(global.max, otherTime - (props.minimumDuration ?? 0)) : Math.min(global.max, otherTime + (props.maximumDuration ?? Infinity))
  const bounds = from <= to ? { min: from, max: to } : global
  const error = validatePickerRange(selection, place.timeZone, props, props.required)
  const commit = (next: Date | null) => {
    if (props.disabled || props.readOnly || controlled && !onChange) return
    const range = next === null ? null : { start: selection?.start ?? null, end: selection?.end ?? null, [active]: next }
    if (!controlled) setOwned(range)
    onChange?.(range)
  }
  const formValue = (date: Date | number | null | undefined) => date == null ? '' : pickerFormValue(Number(date), place.timeZone, units)
  const localized = props.locale || props.hourCycle && units.includes('hour')
  const display = (date: Date | number | null | undefined) => date == null ? i18n.messages.choose : localized ? localizedPickerValue(Number(date), place.timeZone, units, props, props.variant === 'lcd') : formValue(date).replace('T', ' · ')
  return <RangeSelectionContext.Provider value={{ value: selection, active, activate }}>
    <CelestialPicker {...props} {...bounds} referenceDate={other ?? props.referenceDate} value={selection?.[active] ?? null} onChange={controlled && !onChange ? undefined : commit}
      toolbar={<RangeTabs />}
      validationMessage={props.validationMessage || (error && selection && (selection.start !== null || selection.end !== null) ? i18n.messages[error] : '')}
      formatValue={() => `${display(selection?.start)} – ${display(selection?.end)}`}
      onReset={() => { if (!controlled) setOwned(defaultValue); activate('start'); onReset?.() }}>
      {children}
    </CelestialPicker>
    <input type="hidden" name={startName ?? (name ? `${name}.start` : undefined)} form={props.form} disabled={props.disabled} value={formValue(selection?.start)} />
    <input type="hidden" name={endName ?? (name ? `${name}.end` : undefined)} form={props.form} disabled={props.disabled} value={formValue(selection?.end)} />
  </RangeSelectionContext.Provider>
}
function RangeTabs() {
  const selection = useRangeSelection()!
  const part = usePickerParts()
  const { messages } = usePickerLocale()
  return <div {...part('rangeTabs', 'picker-range-tabs')} role="group" aria-label={`${messages.start} / ${messages.end}`}>
    {(['start', 'end'] as const).map((endpoint) => <button key={endpoint} type="button" {...part('rangeTab', '', undefined, { selected: selection.active === endpoint, endpoint })} data-range-endpoint={endpoint} aria-pressed={selection.active === endpoint} onClick={() => selection.activate(endpoint)}>{messages[endpoint]}</button>)}
  </div>
}
