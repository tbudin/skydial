import { useState } from 'react'
import { celestialValueToInstant, instantToZonedDateTime, serializeCelestialValue, type CalendarDate, type LocalTime, type ZonedDateTime, type CelestialValue, type TimeDisambiguation } from '../astro/values.js'
import { CelestialInput, type CelestialInputProps } from './input.js'
import { DEFAULT_PLACE } from './defaults.js'
import { pickerUnits } from '../astro/picker.js'

type Common = Omit<CelestialInputProps, 'value' | 'defaultValue' | 'onChange' | 'mode' | 'referenceDate'> & { disambiguation?: TimeDisambiguation }
type ValueProps<K, V> = { valueKind: K; value?: V | null; defaultValue?: V | null; onChange?: (value: V | null) => void }
export type CelestialValueInputProps = Common & (
  | ValueProps<'date', CalendarDate>
  | (ValueProps<'time', LocalTime> & { referenceDate: CalendarDate })
  | ValueProps<'instant', number>
  | ValueProps<'zoned', ZonedDateTime>
)

/** Explicit civil-date, local-time, instant or zoned values with stable form serialization. */
export function CelestialValueInput(props: CelestialValueInputProps) {
  const { valueKind, value, defaultValue = null, onChange, name, form, onReset, disambiguation = 'compatible', ...rest } = props
  if (!['date', 'time', 'instant', 'zoned'].includes(valueKind)) throw new RangeError('Choose a date, time, instant or zoned value kind.')
  const [state, setState] = useState<{ kind: typeof valueKind; value: CalendarDate | LocalTime | number | ZonedDateTime | null }>(() => ({ kind: valueKind, value: defaultValue }))
  const owned = state.kind === valueKind ? state.value : defaultValue
  if (state.kind !== valueKind) setState({ kind: valueKind, value: defaultValue })
  const controlled = value !== undefined
  const selected = controlled ? value : owned
  const tagged = selected === null ? null : { kind: valueKind, value: selected } as CelestialValue
  const place = valueKind === 'zoned' && selected ? { ...(props.place ?? DEFAULT_PLACE), timeZone: (selected as ZonedDateTime).timeZone } : props.place ?? DEFAULT_PLACE
  const date = valueKind === 'time' ? props.referenceDate : undefined
  const units = pickerUnits({ ...props, mode: valueKind === 'date' ? 'date' : valueKind === 'time' ? 'time' : 'datetime' })
  if (valueKind === 'date' && units.some((unit) => ['hour', 'minute', 'second'].includes(unit)) || valueKind === 'time' && units.some((unit) => ['year', 'month', 'day'].includes(unit))) throw new RangeError('Picker units must match the selected civil value kind.')
  const instant = tagged === null ? null : celestialValueToInstant(tagged, { timeZone: place.timeZone, date, disambiguation })
  const referenceInstant = date ? celestialValueToInstant({ kind: 'date', value: date }, { timeZone: place.timeZone, disambiguation }) : undefined
  const change = (next: Date | null) => {
    const zoned = next === null ? null : instantToZonedDateTime(next, place.timeZone)
    const nextValue = zoned === null ? null : valueKind === 'date' ? zoned.date : valueKind === 'time' ? zoned.time : valueKind === 'instant' ? Number(next) : zoned
    if (!controlled) setState({ kind: valueKind, value: nextValue })
    if (nextValue === null) onChange?.(null)
    else switch (props.valueKind) {
      case 'date': props.onChange?.(nextValue as CalendarDate); break
      case 'time': props.onChange?.(nextValue as LocalTime); break
      case 'instant': props.onChange?.(nextValue as number); break
      case 'zoned': props.onChange?.(nextValue as ZonedDateTime); break
    }
  }
  // The time-only date is explicit context for the illustration, never submitted.
  const { referenceDate: _referenceDate, ...configuration } = rest as Omit<typeof rest, 'referenceDate'> & { referenceDate?: CalendarDate }
  return <>
    <CelestialInput {...configuration} form={form} place={place} mode={valueKind === 'date' ? 'date' : valueKind === 'time' ? 'time' : 'datetime'}
      referenceDate={referenceInstant} disambiguation={disambiguation} value={instant} onChange={controlled && !onChange ? undefined : change}
      onReset={() => { if (!controlled) setState({ kind: valueKind, value: defaultValue }); onReset?.() }} />
    <input type="hidden" name={name} form={form} disabled={props.disabled} value={tagged === null ? '' : serializeCelestialValue(tagged)} />
  </>
}
