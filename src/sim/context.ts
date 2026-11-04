import type { TimeMotionController } from './motion.js'
import { createContext } from 'react'
import type { SimClock } from './clock.js'

export interface ClockContextValue {
  clock: SimClock
  controlled: boolean
  readOnly: boolean
  motion: TimeMotionController
  selectDate: (timeMs: number, animated?: boolean) => void
  /** Optional internal gate used by constrained form controls. */
  canSelectDate?: (timeMs: number) => boolean
}

export const ClockContext = createContext<ClockContextValue | null>(null)
