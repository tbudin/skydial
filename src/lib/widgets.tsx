import type { CSSProperties } from 'react'
import { DEFAULT_PLACE } from './defaults.js'
import CelestialClock, { type CelestialClockProps } from '../App.js'
import type { Place } from '../astro/places.js'
import { EarthPanel } from '../ui/EarthPanel.js'
import { MoonPanel } from '../ui/MoonPanel.js'
import { useSimNow } from '../ui/hooks.js'
import { ClockScope } from '../sim/react.js'
import type { CelestialWidgetProps } from './types.js'
export type { CelestialWidgetProps } from './types.js'

function PanelWidget({ kind, place = DEFAULT_PLACE, className = '', style, ...time }: CelestialWidgetProps & { kind: 'earth' | 'moon' }) {
  return (
    <ClockScope {...time}>
      <div className={`celestial-clock celestial-widget ${className}`} style={style}>
        <PanelContent kind={kind} place={place} />
      </div>
    </ClockScope>
  )
}

function PanelContent({ kind, place }: { kind: 'earth' | 'moon'; place: Place }) {
  const now = useSimNow()
  return kind === 'earth' ? <EarthPanel place={place} now={now} /> : <MoonPanel place={place} now={now} />
}

/** Observer-centred globe, civil/solar hour dial and daylight readings. */
export function EarthClock(props: CelestialWidgetProps) {
  return <PanelWidget {...props} kind="earth" />
}

/** Three-dimensional Moon, illuminated by the computed Sun direction. */
export function MoonClock(props: CelestialWidgetProps) {
  return <PanelWidget {...props} kind="moon" />
}

export interface OrreryClockProps extends Omit<CelestialClockProps, 'view'> {
  className?: string
  style?: CSSProperties
}

/** Solar-system date and planetary year clock. */
export function OrreryClock({ className = '', style, ...props }: OrreryClockProps) {
  return (
    <div className={`celestial-orrery-widget ${className}`} style={style}>
      <CelestialClock {...props} place={props.place ?? DEFAULT_PLACE} view="orrery" />
    </div>
  )
}
