import { useMemo, useState } from 'react'
import { civilParts, daysInMonth, MONTH_SHORT, zonedToUtc } from '../astro/time.js'
import { PICKER_UNITS, pickerUnits, pickerStep, pickerBounds, pickerUnitAllowed, setPickerUnit, stepPickerUnit, type PickerConfiguration, type PickerUnit } from '../astro/picker.js'
import { ClockScope } from '../sim/react.js'
import { useCelestialTime } from '../sim/hooks.js'
import { useSimNow } from '../ui/hooks.js'
import { DEFAULT_PLACE } from './defaults.js'
import type { CelestialWidgetProps } from './types.js'
import { PickerAppearanceContext, usePickerParts, usePickerVariant, type PickerAppearance } from './appearance.js'
import { ScrollWheel } from './ScrollWheel.js'
import { pickerColorStyle } from './colors.js'

export type PickerSize = 'small' | 'medium' | 'large'
export type PickerTheme = 'dark' | 'light' | 'auto'
export interface CelestialControlProps extends CelestialWidgetProps, PickerConfiguration, PickerAppearance {
  disabled?: boolean
  readOnly?: boolean
  size?: PickerSize
  theme?: PickerTheme
  labels?: Partial<Record<PickerUnit, string>>
}
const UNIT_LABELS: Record<PickerUnit, string> = { year: 'Year', month: 'Month', day: 'Day', hour: 'Hours', minute: 'Minutes', second: 'Seconds' }

export type PickerControl = 'wheel' | 'stepper' | 'both'

export function PickerControls({ control, place = DEFAULT_PLACE, size = 'small', disabled = false, readOnly = false, labels = {}, wheelRowHeight, wheelRows = 3, ...configuration }: CelestialControlProps & { control: PickerControl }) {
  const part = usePickerParts()
  const now = useSimNow()
  const { clock, selectDate, readOnly: fixed } = useCelestialTime()
  const units = pickerUnits(configuration)
  const range = pickerBounds(configuration)
  const locked = disabled || readOnly || fixed
  const parts = civilParts(now, place.timeZone)
  const rowHeight = Math.max(24, wheelRowHeight ?? (size === 'small' ? 36 : size === 'medium' ? 40 : 44))
  return <div {...part('controlGroup', `celestial-control-group picker-control-${control}`, { '--picker-columns': Math.min(3, units.length), '--picker-unit-count': units.length } as import('react').CSSProperties)} role="group" aria-label={control === 'stepper' ? 'Step date and time' : 'Scroll date and time'}>
    {units.map((unit) => {
      const label = labels[unit] ?? UNIT_LABELS[unit]
      const step = pickerStep(unit, configuration.steps)
      const minimum = unit === 'year' ? Math.max(1600, civilParts(range.min, place.timeZone).year) : ['month', 'day'].includes(unit) ? 1 : 0
      const maximum = { year: Math.min(2400, civilParts(range.max, place.timeZone).year), month: 12, day: daysInMonth(parts.year, parts.month), hour: 23, minute: 59, second: 59 }[unit]
      const value = parts[unit]
      const select = (next: number) => {
        if (locked) return
        const time = setPickerUnit(clock.now(), unit, next, place.timeZone, range)
        if (time !== null) selectDate(time)
      }
      const values: number[] = []
      for (let n = minimum; n <= maximum; n += step) values.push(n)
      if (!values.includes(value)) values.push(value)
      values.sort((a, b) => a - b)
      const change = (direction: number) => stepPickerUnit(clock.now(), unit, direction, place.timeZone, configuration.steps, range)
      if (control !== 'stepper') return <div key={unit} {...part('unit', '', undefined, { unit })} data-unit={unit}>
        <ScrollUnit label={label} unit={unit} values={values} value={value} now={now} zone={place.timeZone} min={range.min} max={range.max} disabled={locked} rowHeight={rowHeight} rows={wheelRows} onSelect={select} />
        {control === 'both' && <StepButtons unit={unit} label={label} disabled={locked} decrementDisabled={change(-1) === now} incrementDisabled={change(1) === now} onStep={(direction) => { if (!locked) selectDate(change(direction)) }} />}
      </div>
      return <StepUnit key={unit} label={label} unit={unit} value={value} min={minimum} max={maximum} disabled={locked}
        decrementDisabled={change(-1) === now} incrementDisabled={change(1) === now}
        onSelect={select} onStep={(direction) => { if (!locked) selectDate(change(direction)) }} />
    })}
  </div>
}

function ScrollUnit({ label, unit, values, value, now, zone, min, max, disabled, rowHeight, rows, onSelect }: {
  label: string; unit: PickerUnit; values: number[]; value: number; now: number; zone: string; min: number; max: number; disabled: boolean; rowHeight: number; rows: 3 | 5; onSelect: (value: number) => void
}) {
  const variant = usePickerVariant()
  const key = values.join(',')
  const p = civilParts(now, zone)
  const level = PICKER_UNITS.indexOf(unit)
  // A unit's allowed interval depends only on larger units, not every live clock tick.
  const reference = zonedToUtc(zone, level === 0 ? 2000 : p.year, level <= 1 ? 1 : p.month, level <= 2 ? 1 : p.day, level <= 3 ? 0 : p.hour, level <= 4 ? 0 : p.minute)
  const items = useMemo(() => key.split(',').map(Number).map((number) => ({
    value: String(number), label: unit === 'month' && variant !== 'lcd' ? MONTH_SHORT[number - 1] : unit === 'year' ? String(number) : String(number).padStart(2, '0'),
    disabled: !pickerUnitAllowed(reference, unit, number, zone, { min, max }),
  })), [key, unit, reference, zone, min, max, variant])
  return <div data-unit={unit}><ScrollWheel selectionKey={now} label={label} items={items} value={String(value)} disabled={disabled} rowHeight={rowHeight} rows={rows} unit={unit} onSelect={(next) => onSelect(Number(next))} /></div>
}

function StepUnit({ label, unit, value, min, max, disabled, decrementDisabled, incrementDisabled, onSelect, onStep }: {
  label: string; unit: PickerUnit; value: number; min: number; max: number; disabled: boolean; decrementDisabled: boolean; incrementDisabled: boolean; onSelect: (value: number) => void; onStep: (direction: number) => void
}) {
  const part = usePickerParts()
  const [draft, setDraft] = useState<string | null>(null)
  const display = unit === 'year' ? String(value) : String(value).padStart(2, '0')
  return <div {...part('unit', 'picker-step-unit', undefined, { unit })} data-unit={unit}>
    <label><span {...part('unitLabel', 'picker-wheel-label', undefined, { unit })}>{label}</span><input {...part('stepInput', '', undefined, { unit, disabled })} type="text" inputMode="numeric" role="spinbutton" aria-valuemin={min} aria-valuemax={max} aria-valuenow={value}
      value={draft ?? display} disabled={disabled} autoComplete="off"
      onFocus={(event) => { setDraft(display); event.currentTarget.select() }} onChange={(event) => setDraft(event.target.value)}
      onBlur={(event) => { if (/^\d+$/.test(event.target.value) && Number(event.target.value) >= min && Number(event.target.value) <= max) onSelect(Number(event.target.value)); setDraft(null) }}
      onKeyDown={(event) => {
        if (event.key === 'Enter') { event.preventDefault(); event.currentTarget.blur() }
        if (event.key === 'Escape') { event.preventDefault(); event.currentTarget.value = display; event.currentTarget.blur() }
        if (event.key === 'ArrowUp' || event.key === 'ArrowDown') { event.preventDefault(); setDraft(null); onStep(event.key === 'ArrowUp' ? 1 : -1) }
      }} /></label>
    <StepButtons unit={unit} label={label} disabled={disabled} decrementDisabled={decrementDisabled} incrementDisabled={incrementDisabled} onStep={onStep} />
  </div>
}

function StepButtons({ unit, label, disabled, decrementDisabled, incrementDisabled, onStep }: { unit: PickerUnit; label: string; disabled: boolean; decrementDisabled: boolean; incrementDisabled: boolean; onStep: (direction: number) => void }) {
  const part = usePickerParts()
  return <div {...part('stepButtons', 'picker-step-buttons', undefined, { unit })}>
    <button {...part('stepButton', '', undefined, { unit, direction: -1, disabled: disabled || decrementDisabled })} type="button" aria-label={`Decrease ${label.toLowerCase()}`} disabled={disabled || decrementDisabled} onClick={() => onStep(-1)}>
      <svg aria-hidden="true" focusable="false" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 8h10" /></svg>
    </button>
    <button {...part('stepButton', '', undefined, { unit, direction: 1, disabled: disabled || incrementDisabled })} type="button" aria-label={`Increase ${label.toLowerCase()}`} disabled={disabled || incrementDisabled} onClick={() => onStep(1)}>
      <svg aria-hidden="true" focusable="false" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 8h10M8 3v10" /></svg>
    </button>
  </div>
}

function StandaloneControls({ control, className = '', style, theme = 'dark', size = 'small', variant = 'celestial', colors, ...props }: CelestialControlProps & { control: 'wheel' | 'stepper' }) {
  const { date, defaultDate, clock, onDateChange } = props
  return <ClockScope date={date} defaultDate={defaultDate} clock={clock} onDateChange={onDateChange}>
    <PickerAppearanceContext.Provider value={{ styles: props.styles, classNames: props.classNames, variant, colors }}><div className={`celestial-clock celestial-control celestial-control-surface ${className} ${props.classNames?.root ?? ''}`} data-picker-part="root" data-picker-theme={theme} data-picker-size={size} data-picker-style={variant} style={{ ...pickerColorStyle(colors, variant), ...style, ...(typeof props.styles?.root === 'function' ? props.styles.root({}) : props.styles?.root) }}>
      <PickerControls {...props} size={size} control={control} />
    </div></PickerAppearanceContext.Provider>
  </ClockScope>
}

/** A compact, composable scroll control with independently selected date/time units. */
export function CelestialScrollPicker(props: CelestialControlProps) { return <StandaloneControls {...props} control="wheel" /> }
/** Editable unit values and customizable civil −/+ steps, usable inside any form. */
export function CelestialStepper(props: CelestialControlProps) { return <StandaloneControls {...props} control="stepper" /> }
