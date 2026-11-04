import { useContext, useMemo, type ReactNode } from 'react'
import { ClockContext } from '../sim/context.js'
import { pickerTimeAllowed, type PickerConfiguration } from '../astro/picker.js'

/** One gate for every scene, wheel, keyboard, exact input and shared-clock edit. */
export function SelectionGuard({ children, configuration, timeZone }: { children: ReactNode; configuration: PickerConfiguration; timeZone: string }) {
  const parent = useContext(ClockContext)!
  const value = useMemo(() => ({ ...parent, canSelectDate: (time: number) => pickerTimeAllowed(time, timeZone, configuration) && (parent.canSelectDate?.(time) ?? true), selectDate: (time: number, animated = false) => {
    if (pickerTimeAllowed(time, timeZone, configuration) && (parent.canSelectDate?.(time) ?? true)) parent.selectDate(time, animated)
  } }), [parent, timeZone, configuration])
  return <ClockContext.Provider value={value}>{children}</ClockContext.Provider>
}
