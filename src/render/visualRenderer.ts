import { createContext, createElement, useContext, type ComponentType, type ReactNode } from 'react'
import type { Location } from '../astro/observer.js'
import type { PlanetId, YearPlanetId } from '../astro/bodies.js'
import type { Place } from '../astro/places.js'
import type { OrreryViewProps } from './orreryTypes.js'
import type { OrreryPalette } from './palette.js'

export interface VisualRenderer {
  Earth: ComponentType<{ location: Location; view?: 'observer' | 'rotation'; cameraDistance?: number; illustration?: boolean }>
  Moon: ComponentType<{ location: Location; illustration?: boolean }>
  Planet: ComponentType<{ planet: Exclude<PlanetId, 'earth'>; illustration?: boolean }>
  Orrery: ComponentType<OrreryViewProps & { now?: number; width?: number; height?: number }>
  CompactOrrery: ComponentType<{ now: number; place: Place; planet: YearPlanetId; palette?: Partial<OrreryPalette>; theme?: 'light' | 'dark' | 'auto' }>
  thumbnails?: () => Promise<Partial<Record<YearPlanetId, string>>>
}
const VisualRendererContext = createContext<VisualRenderer | null>(null)
export function VisualRendererProvider({ renderer, children }: { renderer: VisualRenderer; children?: ReactNode }) {
  return createElement(VisualRendererContext.Provider, { value: renderer }, children)
}
export function useVisualRenderer() { return useContext(VisualRendererContext) }

export type RenderQuality = 'auto' | 'low' | 'high'
export interface CelestialRenderOptions { quality?: RenderQuality; maxFps?: number }
const RenderOptionsContext = createContext<Required<CelestialRenderOptions>>({ quality: 'auto', maxFps: 30 })
/** Optional shared budget for a page containing several 3D widgets. */
export function CelestialRenderProvider({ quality, maxFps, children }: CelestialRenderOptions & { children: ReactNode }) {
  const parent = useContext(RenderOptionsContext)
  if (maxFps !== undefined && (!Number.isFinite(maxFps) || maxFps < 1 || maxFps > 60)) throw new RangeError('maxFps must be between 1 and 60.')
  if (quality !== undefined && !['auto', 'low', 'high'].includes(quality)) throw new RangeError('Unknown render quality.')
  return createElement(RenderOptionsContext.Provider, { value: { quality: quality ?? parent.quality, maxFps: maxFps ?? (quality === 'low' ? 15 : parent.maxFps) } }, children)
}
export function useRenderOptions() { return useContext(RenderOptionsContext) }
