import type { CalendarScale, YearScale } from '../astro/clockScales.js'
import type { PlanetId, YearPlanetId } from '../astro/bodies.js'
import type { OrreryPalette } from './palette.js'

export type LabelKind = 'month' | 'year' | 'date-pill' | 'year-pill'

export interface LabelSpec {
  id: string
  kind: LabelKind
  text: string
  active?: boolean
  /** Ecliptic longitude of the anchor, radians (pills: taken from the hand each frame) */
  lon: number
  /** Scene radius of the anchor (pills: computed each frame) */
  radius: number
  value?: number
}


export interface OrreryAppearance {
  palette?: Partial<OrreryPalette>
  /** Multipliers for orbit and tick stroke widths. */
  orbitWidth?: number
  tickWidth?: number
  /** Hand width in CSS pixels. */
  handWidth?: number
  bodyScale?: number
  sunScale?: number
}

export interface OrreryViewProps {
  appearance?: OrreryAppearance
  /** Enabled calendar units; omitted flags keep the full playground dial. */
  showMonths?: boolean
  showDays?: boolean
  showYears?: boolean
  sceneExtent?: number
  /** Omit to show the whole solar system. A date input uses Earth and its year planet. */
  visibleBodies?: readonly PlanetId[]
  theme?: 'light' | 'dark'
  onMonthSelect?: (month: number) => void
  onYearSelect?: (year: number) => void
  isMonthUnavailable?: (month: number) => boolean
  isYearUnavailable?: (year: number) => boolean
  /** Widget rendering omits dial labels and ticks, retaining the 3D solar system and hands. */
  compact?: boolean
  diagnostics?: boolean
  calendar: CalendarScale
  yearScale: YearScale
  yearPlanet: YearPlanetId
  /** Index into calendar.ticks of the current day */
  currentDayIndex: number
  currentMonth: number
  currentYear?: number
  /** Epoch (ms) the orbit paths are sampled around */
  orbitEpochMs: number
}
