import { useId, useState } from 'react'
import { PLANET_BY_ID, type YearPlanetId } from '../astro/bodies.js'
import { EarthTimeControl } from './EarthTimeControl.js'
import { useEarthView, type EarthPickerViewProps } from './useEarthView.js'
import { OrreryControl } from './OrreryControl.js'
import { DEFAULT_PLACE } from './defaults.js'
import { civilDateValue, selectCivilDate } from '../astro/dateSelection.js'
import { daysInYear, dayOfYear, civilParts, monthDayFromDayOfYear, zonedToUtc } from '../astro/time.js'
import { ClockScope } from '../sim/react.js'
import { useCelestialTime } from '../sim/hooks.js'
import { useSimNow } from '../ui/hooks.js'
import { EarthClock, MoonClock, type CelestialWidgetProps } from './widgets.js'
import { PickerField, type PickerPresentation } from './PickerField.js'
import { SelectionWheels } from './SelectionWheels.js'

export interface CelestialDatePickerProps extends CelestialWidgetProps, EarthPickerViewProps {
  label?: string
  /** Live 3D positions accompanying the selected date. */
  preview?: 'orrery' | 'earth' | 'moon' | false
  disabled?: boolean
  planet?: YearPlanetId
  defaultPlanet?: YearPlanetId
  onPlanetChange?: (planet: YearPlanetId) => void
  /** Show native exact inputs below the direct 3D controls. */
  showInputs?: boolean
  /** Compact field opening a selection window, or the existing embedded scene. */
  presentation?: PickerPresentation
  /** Set false for a date-only picker, preserving the existing civil time. */
  includeTime?: boolean
}

/** Keyboard-accessible civil date input and year scrubber with 3D preview. */
export function CelestialDatePicker({
  label = 'Date', preview = 'orrery', place = DEFAULT_PLACE,
  disabled = false, className = '', style, planet, defaultPlanet = 'jupiter', onPlanetChange, showInputs = false,
  earthView, defaultEarthView, onEarthViewChange, earthPlace, onEarthPlaceChange,
  presentation = 'inline', includeTime = true, ...time
}: CelestialDatePickerProps) {
  const cameraSettings = useEarthView(place, disabled, { earthView, defaultEarthView, onEarthViewChange, earthPlace, onEarthPlaceChange })
  const [internalPlanet, setInternalPlanet] = useState<YearPlanetId>(defaultPlanet)
  const yearPlanet = planet ?? internalPlanet
  const selectPlanet = (next: YearPlanetId) => {
    if (planet === undefined) setInternalPlanet(next)
    onPlanetChange?.(next)
  }
  const scene = <>
    {preview === 'orrery' && <>
      {presentation === 'inline' && <PickerReading place={place} label={label} planet={yearPlanet} includeTime={includeTime} />}
      <div className={`direct-picker-layout ${includeTime ? '' : 'picker-date-only'}`}>
        {includeTime && <EarthTimeControl place={place} disabled={disabled} cameraSettings={cameraSettings} />}
        <OrreryControl place={place} planet={yearPlanet} onPlanetChange={selectPlanet} disabled={disabled} planetReadOnly={planet !== undefined && !onPlanetChange} />
      </div>
    </>}
    {(showInputs || preview !== 'orrery') && <DateSelection label={label} place={place} disabled={disabled} includeTime={includeTime} />}
    {preview === 'orrery' && !showInputs && <details className="picker-exact"><summary>Enter an exact date{includeTime ? ' and time' : ''}</summary><DateSelection label={label} place={place} disabled={disabled} includeTime={includeTime} /></details>}
    {preview === 'earth' && <EarthClock place={place} />}
    {preview === 'moon' && <MoonClock place={place} />}
</>
  return (
    <ClockScope {...time}>
      <div className={`celestial-clock celestial-date-picker ${presentation === 'popover' ? 'celestial-picker-compact' : ''} ${className}`} style={style}>
        {presentation === 'popover' ? <PickerField label={label === 'Date' && includeTime ? 'Date & time' : label} mode={includeTime ? 'datetime' : 'date'} place={place} disabled={disabled}>
          <SelectionWheels place={place} date time={includeTime} disabled={disabled} />
          {scene}
        </PickerField> : scene}
      </div>
    </ClockScope>
  )
}

function DateSelection({ label, place, disabled, includeTime }: Pick<CelestialDatePickerProps, 'label' | 'disabled' | 'includeTime'> & { place: typeof DEFAULT_PLACE }) {
  const id = useId()
  const now = useSimNow()
  const { selectDate, readOnly } = useCelestialTime()
  const isDisabled = disabled || readOnly
  const parts = civilParts(now, place.timeZone)
  const value = civilDateValue(now, place.timeZone)
  const select = (next: string) => {
    const ms = selectCivilDate(next, now, place.timeZone)
    if (ms !== null) selectDate(ms)
  }
  return (
    <div className="date-selection">
      <label htmlFor={id}>{label}</label>
      <input id={id} className="date-input mono" type="date" value={value}
        min="1600-01-01" max="2400-12-31" disabled={isDisabled}
        onChange={(event) => select(event.target.value)} aria-describedby={`${id}-zone`} />
      {includeTime && <><label className="sr-only" htmlFor={`${id}-time`}>Time</label>
      <input id={`${id}-time`} className="date-input mono" type="time" aria-label="Time" disabled={isDisabled}
        value={`${String(parts.hour).padStart(2, '0')}:${String(parts.minute).padStart(2, '0')}`}
        onChange={(event) => {
          const [hour, minute] = event.target.value.split(':').map(Number)
          if (Number.isInteger(hour) && Number.isInteger(minute)) selectDate(zonedToUtc(place.timeZone, parts.year, parts.month, parts.day, hour, minute, 0))
        }} /></>}
      <span id={`${id}-zone`} className="sub">{place.timeZone}</span>
      <label className="scrubber">
        <span className="sr-only">Day of year</span>
        <input type="range" min={1} max={daysInYear(parts.year)} step={1}
          value={dayOfYear(parts.year, parts.month, parts.day)} disabled={isDisabled}
          aria-valuetext={value} onChange={(event) => {
            const day = monthDayFromDayOfYear(parts.year, Number(event.target.value))
            select(`${parts.year}-${String(day.month).padStart(2, '0')}-${String(day.day).padStart(2, '0')}`)
          }} />
      </label>
    </div>
  )
}

function PickerReading({ place, label, planet, includeTime }: { place: typeof DEFAULT_PLACE; label: string; planet: YearPlanetId; includeTime: boolean }) {
  const now = useSimNow(33)
  return <header className="direct-picker-heading">
    <div><span className="picker-eyebrow">{label}{includeTime ? ' & TIME' : ''}</span><output className="picker-selected-date">{new Intl.DateTimeFormat('en-GB', { timeZone: place.timeZone, day: 'numeric', month: 'long', year: 'numeric' }).format(now)}</output></div>
    <span className="picker-year-source">Year from {PLANET_BY_ID[planet].name}</span>
  </header>
}
