import { TimeMotionController } from './motion.js'
import { useContext, useMemo, useState, type ReactNode } from 'react'
import { SimClock } from './clock.js'
import { ClockContext, type ClockContextValue } from './context.js'

export interface CelestialProviderProps {
  children: ReactNode
  /** Share an explicit clock to synchronize several widgets. */
  clock?: SimClock
  /** Controlled UTC instant. Playback is disabled while this is provided. */
  date?: Date | number
  /** Starting instant for an uncontrolled, initially paused clock. */
  defaultDate?: Date | number
  onDateChange?: (date: Date) => void
}

/** Each provider owns its time; nest one to isolate widgets. */
export function CelestialProvider({ children, clock, date, defaultDate, onDateChange }: CelestialProviderProps) {
  const [ownedClock] = useState(() => new SimClock(defaultDate === undefined ? undefined : Number(defaultDate)))
  const [motion] = useState(() => new TimeMotionController())
  const dateMs = date === undefined ? undefined : Number(date)
  const fixedClock = useMemo(() => dateMs === undefined ? null : new SimClock(dateMs), [dateMs])
  if (clock && date !== undefined) throw new Error('Provide either clock or date, not both.')
  const activeClock = fixedClock ?? clock ?? ownedClock
  const value = useMemo<ClockContextValue>(() => ({
    clock: activeClock,
    controlled: dateMs !== undefined,
    readOnly: dateMs !== undefined && !onDateChange,
    motion,
    selectDate: (timeMs, animated = false) => {
      if (!animated) motion.cancel()
      if (dateMs === undefined) {
        activeClock.setPlaying(false)
        activeClock.setTime(timeMs)
      }
      onDateChange?.(new Date(timeMs))
    },
  }), [activeClock, dateMs, onDateChange, motion])
  return <ClockContext.Provider value={value}>{children}</ClockContext.Provider>
}

/** Inherit a surrounding provider unless this widget supplies its own time. */
export function ClockScope(props: CelestialProviderProps) {
  const inherited = useContext(ClockContext)
  if (inherited && props.clock === undefined && props.date === undefined && props.defaultDate === undefined && props.onDateChange === undefined) {
    return props.children
  }
  return <CelestialProvider {...props} />
}
