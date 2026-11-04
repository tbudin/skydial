import { useMemo, useRef, useState } from 'react'
import { civilParts, daysInMonth, zonedToUtc } from '../astro/time.js'
import { PICKER_UNITS, pickerUnits, pickerStep, pickerBounds, pickerUnitAllowed, pickerTimeAllowed, setPickerUnit, stepPickerUnit, type PickerConfiguration, type PickerUnit } from '../astro/picker.js'
import { ClockScope } from '../sim/react.js'
import { useCelestialTime } from '../sim/hooks.js'
import { useSimNow } from '../ui/hooks.js'
import { DEFAULT_PLACE } from './defaults.js'
import type { CelestialWidgetProps } from './types.js'
import { PickerAppearanceContext, usePickerParts, usePickerVariant, type PickerAppearance } from './appearance.js'
import { ScrollWheel } from './ScrollWheel.js'
import { pickerColorStyle } from './colors.js'
import { PickerLocalizationProvider, localizedPickerUnits, pickerLocale, parsePickerInteger, usePickerLocale, type PickerLocalization } from './localization.js'
import { SelectionGuard } from './SelectionGuard.js'

export type PickerSize = 'small' | 'medium' | 'large'
export type PickerTheme = 'dark' | 'light' | 'auto'
export interface CelestialControlProps extends CelestialWidgetProps, PickerConfiguration, PickerAppearance, PickerLocalization {
  disabled?: boolean
  readOnly?: boolean
  size?: PickerSize
  theme?: PickerTheme
  labels?: Partial<Record<PickerUnit, string>>
}
export type PickerControl = 'wheel' | 'stepper' | 'both'

export function PickerControls({ control, place = DEFAULT_PLACE, size = 'small', disabled = false, readOnly = false, labels = {}, wheelRowHeight, wheelRows = 3, ...configuration }: CelestialControlProps & { control: PickerControl }) {
  const part = usePickerParts()
  const i18n = usePickerLocale()
  const now = useSimNow()
  const { clock, selectDate, readOnly: fixed } = useCelestialTime()
  const configured = pickerUnits(configuration)
  const units = configuration.locale ? localizedPickerUnits(configured, i18n.locale) : configured
  const range = { ...pickerBounds(configuration), disambiguation: configuration.disambiguation }
  const locked = disabled || readOnly || fixed
  const parts = civilParts(now, place.timeZone)
  const twelveHour = i18n.hourCycle === 'h12' && units.includes('hour')
  const allowed = (time: number) => pickerTimeAllowed(time, place.timeZone, configuration)
  const rowHeight = Math.max(24, wheelRowHeight ?? (size === 'small' ? 36 : size === 'medium' ? 40 : 44))
  const denseColumns = [...units.map((unit) => unit === 'year' ? 'minmax(var(--picker-year-width, 52px), 1fr)' : 'minmax(0, 1fr)'), ...(twelveHour ? ['minmax(0, 1fr)'] : [])].join(' ')
  return <div {...part('controlGroup', `celestial-control-group picker-control-${control}`, { '--picker-columns': Math.min(3, units.length + Number(twelveHour)), '--picker-unit-count': units.length + Number(twelveHour), '--picker-dense-columns': denseColumns } as import('react').CSSProperties)} role="group" aria-label={control === 'stepper' ? i18n.messages.controls : i18n.messages.scroll}>
    {units.map((unit) => {
      const label = labels[unit] ?? i18n.units[unit]
      const step = pickerStep(unit, configuration.steps)
      const minimum = unit === 'year' ? Math.max(1600, civilParts(range.min, place.timeZone).year) : ['month', 'day'].includes(unit) ? 1 : 0
      const maximum = { year: Math.min(2400, civilParts(range.max, place.timeZone).year), month: 12, day: daysInMonth(parts.year, parts.month), hour: 23, minute: 59, second: 59 }[unit]
      const value = parts[unit]
      const select = (next: number) => {
        if (locked) return
        const time = setPickerUnit(clock.now(), unit, next, place.timeZone, range)
        if (time !== null && allowed(time)) selectDate(time)
      }
      const values: number[] = []
      for (let n = minimum; n <= maximum; n += step) values.push(n)
      if (!values.includes(value)) values.push(value)
      values.sort((a, b) => a - b)
      const change = (direction: number) => {
        const next = stepPickerUnit(clock.now(), unit, direction, place.timeZone, configuration.steps, range)
        return allowed(next) ? next : now
      }
      if (control !== 'stepper') return <div key={unit} {...part('unit', '', undefined, { unit })} data-unit={unit}>
        <ScrollUnit label={label} unit={unit} values={values} value={value} now={now} zone={place.timeZone} configuration={configuration} disabled={locked} rowHeight={rowHeight} rows={wheelRows} onSelect={select} />
        {control === 'both' && <StepButtons unit={unit} label={label} disabled={locked} decrementDisabled={change(-1) === now} incrementDisabled={change(1) === now} onStep={(direction) => { if (!locked) selectDate(change(direction)) }} />}
      </div>
      return <StepUnit key={unit} label={label} unit={unit} value={twelveHour && unit === 'hour' ? value % 12 || 12 : value} min={twelveHour && unit === 'hour' ? 1 : minimum} max={twelveHour && unit === 'hour' ? 12 : maximum} disabled={locked}
        decrementDisabled={change(-1) === now} incrementDisabled={change(1) === now}
        onSelect={(next) => select(twelveHour && unit === 'hour' ? next % 12 + Math.floor(value / 12) * 12 : next)} onStep={(direction) => { if (!locked) selectDate(change(direction)) }} />
    })}
    {twelveHour && <div data-unit="dayPeriod" {...part('unit', 'picker-period-unit')}><span {...part('unitLabel', 'picker-wheel-label')}>{i18n.messages.dayPeriod}</span><div className="picker-period-buttons" role="group" aria-label={i18n.messages.dayPeriod}>
      {[0, 1].map((period) => {
        const next = setPickerUnit(now, 'hour', parts.hour % 12 + period * 12, place.timeZone, range)!
        const text = new Intl.DateTimeFormat(i18n.locale, { timeZone: 'UTC', hour: 'numeric', hourCycle: 'h12' }).formatToParts(new Date(Date.UTC(2000, 0, 1, period * 12))).find((p) => p.type === 'dayPeriod')?.value ?? (period ? 'PM' : 'AM')
        return <button key={period} type="button" {...part('dayPeriodButton', '', undefined, { selected: Math.floor(parts.hour / 12) === period, disabled: locked || !allowed(next) })} aria-pressed={Math.floor(parts.hour / 12) === period} disabled={locked || !allowed(next)} onClick={() => selectDate(next)}>{text}</button>
      })}
    </div></div>}
  </div>
}

function ScrollUnit({ label, unit, values, value, now, zone, configuration, disabled, rowHeight, rows, onSelect }: {
  label: string; unit: PickerUnit; values: number[]; value: number; now: number; zone: string; configuration: PickerConfiguration; disabled: boolean; rowHeight: number; rows: 3 | 5; onSelect: (value: number) => void
}) {
  const variant = usePickerVariant()
  const i18n = usePickerLocale()
  const key = values.join(',')
  const { min, max, isDateUnavailable, isTimeUnavailable, disambiguation } = configuration
  const constrained = Boolean(isDateUnavailable || isTimeUnavailable || disambiguation)
  const p = civilParts(now, zone)
  const level = PICKER_UNITS.indexOf(unit)
  const reference = constrained ? now : zonedToUtc(zone, level === 0 ? 2000 : p.year, level <= 1 ? 1 : p.month, level <= 2 ? 1 : p.day, level <= 3 ? 0 : p.hour, level <= 4 ? 0 : p.minute)
  const items = useMemo(() => {
    const months = new Intl.DateTimeFormat(i18n.locale, { month: 'short', calendar: 'gregory', timeZone: 'UTC' })
    const numbers = new Intl.NumberFormat(i18n.locale, { useGrouping: false, minimumIntegerDigits: unit === 'year' ? 1 : 2, ...(variant === 'lcd' ? { numberingSystem: 'latn' } : {}) })
    return key.split(',').map(Number).map((number) => {
      const candidate = constrained ? setPickerUnit(reference, unit, number, zone, { min, max, disambiguation }) : null
      const label = unit === 'month' && variant !== 'lcd' ? months.format(new Date(Date.UTC(2000, number - 1, 1)))
        : numbers.format(unit === 'hour' && i18n.hourCycle === 'h12' ? number % 12 || 12 : number)
      const textValue = unit === 'hour' && i18n.hourCycle === 'h12' ? new Intl.DateTimeFormat(i18n.locale, { hour: 'numeric', hourCycle: 'h12', timeZone: 'UTC' }).format(new Date(Date.UTC(2000, 0, 1, number))) : undefined
      return { value: String(number), label, textValue, disabled: !pickerUnitAllowed(reference, unit, number, zone, { min, max }) || constrained && (candidate === null || !pickerTimeAllowed(candidate, zone, { min, max, isDateUnavailable, isTimeUnavailable })) }
    })
  }, [key, unit, reference, zone, min, max, variant, isDateUnavailable, isTimeUnavailable, i18n.locale, i18n.hourCycle, disambiguation, constrained])
  return <div data-unit={unit}><ScrollWheel selectionKey={now} label={label} items={items} value={String(value)} disabled={disabled} rowHeight={rowHeight} rows={rows} unit={unit} onSelect={(next) => onSelect(Number(next))} /></div>
}

function StepUnit({ label, unit, value, min, max, disabled, decrementDisabled, incrementDisabled, onSelect, onStep }: {
  label: string; unit: PickerUnit; value: number; min: number; max: number; disabled: boolean; decrementDisabled: boolean; incrementDisabled: boolean; onSelect: (value: number) => void; onStep: (direction: number) => void
}) {
  const part = usePickerParts()
  const [draft, setDraft] = useState<string | null>(null)
  const discard = useRef(false)
  const i18n = usePickerLocale()
  const variant = usePickerVariant()
  const display = new Intl.NumberFormat(i18n.locale, { useGrouping: false, minimumIntegerDigits: unit === 'year' ? 1 : 2, ...(variant === 'lcd' ? { numberingSystem: 'latn' } : {}) }).format(value)
  return <div {...part('unit', 'picker-step-unit', undefined, { unit })} data-unit={unit}>
    <label><span {...part('unitLabel', 'picker-wheel-label', undefined, { unit })}>{label}</span><input {...part('stepInput', '', undefined, { unit, disabled })} type="text" inputMode="numeric" role="spinbutton" aria-valuemin={min} aria-valuemax={max} aria-valuenow={value} aria-valuetext={display}
      value={draft ?? display} disabled={disabled} autoComplete="off"
      onFocus={(event) => { discard.current = false; setDraft(display); event.currentTarget.select() }} onChange={(event) => setDraft(event.target.value)}
      onBlur={(event) => { const next = parsePickerInteger(event.target.value, i18n.locale); if (!discard.current && next !== null && next >= min && next <= max && next !== value) onSelect(next); setDraft(null) }}
      onKeyDown={(event) => {
        if (event.key === 'Enter') { event.preventDefault(); event.currentTarget.blur() }
        if (event.key === 'Escape') { event.preventDefault(); discard.current = true; event.currentTarget.blur() }
        if (event.key === 'ArrowUp' || event.key === 'ArrowDown') { event.preventDefault(); setDraft(null); onStep(event.key === 'ArrowUp' ? 1 : -1) }
      }} /></label>
    <StepButtons unit={unit} label={label} disabled={disabled} decrementDisabled={decrementDisabled} incrementDisabled={incrementDisabled} onStep={onStep} />
  </div>
}

function StepButtons({ unit, label, disabled, decrementDisabled, incrementDisabled, onStep }: { unit: PickerUnit; label: string; disabled: boolean; decrementDisabled: boolean; incrementDisabled: boolean; onStep: (direction: number) => void }) {
  const part = usePickerParts()
  const { messages } = usePickerLocale()
  return <div {...part('stepButtons', 'picker-step-buttons', undefined, { unit })}>
    <button {...part('stepButton', '', undefined, { unit, direction: -1, disabled: disabled || decrementDisabled })} type="button" aria-label={`${messages.decrease} ${label.toLocaleLowerCase()}`} disabled={disabled || decrementDisabled} onClick={() => onStep(-1)}>
      <svg aria-hidden="true" focusable="false" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 8h10" /></svg>
    </button>
    <button {...part('stepButton', '', undefined, { unit, direction: 1, disabled: disabled || incrementDisabled })} type="button" aria-label={`${messages.increase} ${label.toLocaleLowerCase()}`} disabled={disabled || incrementDisabled} onClick={() => onStep(1)}>
      <svg aria-hidden="true" focusable="false" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 8h10M8 3v10" /></svg>
    </button>
  </div>
}

function StandaloneControls({ control, className = '', style, theme = 'dark', size = 'small', variant = 'celestial', colors, ...props }: CelestialControlProps & { control: 'wheel' | 'stepper' }) {
  const { date, defaultDate, clock, onDateChange } = props
  const time = { date, defaultDate, clock, onDateChange }
  const i18n = pickerLocale(props)
  return <PickerLocalizationProvider locale={props.locale} hourCycle={props.hourCycle} dir={props.dir} messages={props.messages} labels={props.labels}><ClockScope {...time}><SelectionGuard configuration={props} timeZone={(props.place ?? DEFAULT_PLACE).timeZone}>
    <PickerAppearanceContext.Provider value={{ styles: props.styles, classNames: props.classNames, variant, colors }}><div className={`celestial-clock celestial-control celestial-control-surface ${className} ${props.classNames?.root ?? ''}`} dir={i18n.dir} lang={i18n.locale} data-picker-part="root" data-picker-theme={theme} data-picker-size={size} data-picker-style={variant} style={{ ...pickerColorStyle(colors, variant), ...style, ...(typeof props.styles?.root === 'function' ? props.styles.root({}) : props.styles?.root) }}>
      <PickerControls {...props} size={size} control={control} />
    </div></PickerAppearanceContext.Provider>
  </SelectionGuard></ClockScope></PickerLocalizationProvider>
}
export function CelestialScrollPicker(props: CelestialControlProps) { return <StandaloneControls {...props} control="wheel" /> }
export function CelestialStepper(props: CelestialControlProps) { return <StandaloneControls {...props} control="stepper" /> }
