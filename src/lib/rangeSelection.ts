import { createContext, useContext } from 'react'
import type { PickerDateRange } from '../astro/range.js'
import type { RangeEndpoint } from './range.js'

export interface RangeSelection {
  value: PickerDateRange | null
  active: RangeEndpoint
  activate: (endpoint: RangeEndpoint) => void
}
export const RangeSelectionContext = createContext<RangeSelection | null>(null)
export function useRangeSelection() { return useContext(RangeSelectionContext) }
