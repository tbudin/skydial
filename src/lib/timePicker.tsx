import { ClockScope } from '../sim/react.js'
import { DEFAULT_PLACE } from './defaults.js'
import { EarthTimeControl } from './EarthTimeControl.js'
import type { CelestialWidgetProps } from './widgets.js'
import { useEarthView, type EarthPickerViewProps } from './useEarthView.js'
import { PickerField, type PickerPresentation } from './PickerField.js'
import { SelectionWheels } from './SelectionWheels.js'

export interface CelestialTimePickerProps extends CelestialWidgetProps, EarthPickerViewProps {
  disabled?: boolean
  label?: string
  presentation?: PickerPresentation
  /** Couple a civil-day wheel to hours and minutes. */
  showDay?: boolean
}

/** A standalone rotating Earth time control, also used by the combined picker. */
export function CelestialTimePicker({ place = DEFAULT_PLACE, disabled, label = 'Time', presentation = 'inline', showDay = false, className = '', style, earthView, defaultEarthView, onEarthViewChange, earthPlace, onEarthPlaceChange, ...time }: CelestialTimePickerProps) {
  const cameraSettings = useEarthView(place, disabled ?? false, { earthView, defaultEarthView, onEarthViewChange, earthPlace, onEarthPlaceChange })
  const earth = <EarthTimeControl place={place} disabled={disabled} cameraSettings={cameraSettings} />
  return <ClockScope {...time}>
    <div className={`celestial-clock celestial-time-picker ${presentation === 'popover' ? 'celestial-picker-compact' : ''} ${className}`} style={style}>
      {presentation === 'popover' ? <PickerField label={label} mode={showDay ? 'datetime' : 'time'} place={place} disabled={disabled}>
        <SelectionWheels place={place} time day={showDay} disabled={disabled} />
        {earth}
      </PickerField> : <>{showDay && <SelectionWheels place={place} time day disabled={disabled} />}{earth}</>}
    </div>
  </ClockScope>
}
