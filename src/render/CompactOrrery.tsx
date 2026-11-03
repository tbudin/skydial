import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { calendarScale, yearScale } from '../astro/clockScales.js'
import { civilParts, dayOfYear, zonedToUtc } from '../astro/time.js'
import type { Place } from '../astro/places.js'
import type { YearPlanetId } from '../astro/bodies.js'
import { loadTextures, type TextureSet } from './textures.js'
import { Orrery } from './Orrery.js'
import type { OrreryPalette } from './palette.js'

const subscribeTheme = (notify: () => void) => {
  const media = window.matchMedia('(prefers-color-scheme: light)')
  media.addEventListener('change', notify)
  return () => media.removeEventListener('change', notify)
}
const systemLight = () => window.matchMedia('(prefers-color-scheme: light)').matches
const serverDark = () => false

export function CompactOrrery({ now, place, planet, palette, theme = 'dark' }: { now: number; place: Place; planet: YearPlanetId; palette?: Partial<OrreryPalette>; theme?: 'light' | 'dark' | 'auto' }) {
  const light = useSyncExternalStore(subscribeTheme, systemLight, serverDark)
  const [textures, setTextures] = useState<TextureSet | null>(null)
  const p = civilParts(now, place.timeZone)
  const calendar = useMemo(() => calendarScale(p.year, place.timeZone), [p.year, place.timeZone])
  const scale = useMemo(() => yearScale(planet, p.year, place.timeZone), [planet, p.year, place.timeZone])
  useEffect(() => {
    let active = true
    loadTextures().then((result) => { if (active) setTextures(result.textures) })
    return () => { active = false }
  }, [])
  if (!textures) return <span className="widget-loading">Loading the solar system…</span>
  return <Orrery compact textures={textures} calendar={calendar} yearScale={scale} yearPlanet={planet} appearance={{ palette }} theme={theme === 'auto' ? light ? 'light' : 'dark' : theme}
    currentDayIndex={dayOfYear(p.year, p.month, p.day) - 1} currentMonth={p.month} currentYear={p.year}
    orbitEpochMs={zonedToUtc(place.timeZone, p.year, 7, 1)} />
}
