import type { CSSProperties } from 'react'
import type { Place } from '../astro/places.js'
import type { CelestialProviderProps } from '../sim/react.js'
export type CelestialStyle = CSSProperties | (CSSProperties & { [property: `--${string}`]: string | number | undefined })

/** Shared time/container props without importing a visual renderer. */
export interface CelestialWidgetProps extends Omit<CelestialProviderProps, 'children'> {
  place?: Place
  className?: string
  style?: CelestialStyle
}
