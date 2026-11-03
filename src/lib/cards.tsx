import { DigitalText } from './DigitalText.js'
import type { PickerVariant } from './appearance.js'
import type { PickerTheme } from './PickerControls.js'
import { pickerColorPalette, pickerColorStyle, type PickerColors } from './colors.js'
import { LcdEarth } from '../render/LcdEarth.js'
import { LcdBody } from '../render/LcdBody.js'
import { LcdCompactOrrery } from '../render/LcdOrrery.js'
import { useState } from 'react'
import { DEFAULT_PLACE } from './defaults.js'
import { ClockScope } from '../sim/react.js'
import { civilParts } from '../astro/time.js'
import { PLANET_BY_ID, type YearPlanetId } from '../astro/bodies.js'
import { earthView, moonView, phaseName } from '../astro/observer.js'
import { EarthGlobe } from '../render/EarthGlobe.js'
import { MoonGlobe } from '../render/MoonGlobe.js'
import { PlanetGlobe } from '../render/PlanetGlobe.js'
import { useSimNow } from '../ui/hooks.js'
import type { CelestialWidgetProps } from './widgets.js'
import { CompactOrrery } from '../render/CompactOrrery.js'

export interface CelestialCardProps extends CelestialWidgetProps {
  variant?: PickerVariant
  theme?: PickerTheme
  colors?: PickerColors
  kind?: 'earth' | 'moon' | 'orrery' | 'year'
  size?: 'small' | 'medium' | 'large'
  planet?: YearPlanetId
  defaultPlanet?: YearPlanetId
  onPlanetChange?: (planet: YearPlanetId) => void
}

/** Compact website cards with small, medium and large home-screen proportions. */
export function CelestialWidget({ kind = 'earth', size = 'small', variant = 'celestial', theme = 'dark', colors, place = DEFAULT_PLACE, className = '', style, planet, defaultPlanet = 'jupiter', onPlanetChange, ...time }: CelestialCardProps) {
  const [internalPlanet, setPlanet] = useState(defaultPlanet)
  const selected = planet ?? internalPlanet
  return <ClockScope {...time}>
    <article className={`celestial-clock celestial-card widget-${kind} widget-${size} ${className}`} data-planet={selected} data-picker-style={variant} data-picker-theme={theme} style={{ ...pickerColorStyle(colors, variant), ...style }} aria-label={`${kind === 'year' ? PLANET_BY_ID[selected].name + ' year' : kind} widget`}>
      <CardContent kind={kind} size={size} place={place} planet={selected} variant={variant} colors={colors} theme={theme} />
      {(kind === 'year' || kind === 'orrery') && <label className="widget-planet-select"><span className="sr-only">Year hand planet</span><select value={selected} disabled={planet !== undefined && !onPlanetChange} onChange={(event) => {
        const next = event.target.value as YearPlanetId
        if (planet === undefined) setPlanet(next)
        onPlanetChange?.(next)
      }}>{(['jupiter', 'saturn', 'uranus', 'neptune'] as const).map((id) => <option key={id} value={id}>{PLANET_BY_ID[id].name}</option>)}</select></label>}
    </article>
  </ClockScope>
}

function CardContent({ kind, place, planet, variant, colors, theme }: Required<Pick<CelestialCardProps, 'kind' | 'place' | 'planet' | 'size' | 'variant' | 'theme'>> & Pick<CelestialCardProps, 'colors'>) {
  const now = useSimNow(250)
  const p = civilParts(now, place.timeZone)
  const pad = (n: number) => String(n).padStart(2, '0')
  const moon = kind === 'moon' ? moonView(place, now) : null
  const earth = kind === 'earth' ? earthView(place, now) : null
  const date = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: place.timeZone }).format(now)
  const caption = kind === 'earth' ? (earth!.sunAltitude >= 0 ? 'Daylight' : 'After sunset') : kind === 'moon' ? phaseName(moon!.phaseLon) : kind === 'year' ? `${PLANET_BY_ID[planet].periodYears.toFixed(1)}-year orbit` : `${PLANET_BY_ID[planet].name} year hand`
  const value = kind === 'earth' ? `${pad(p.hour)}:${pad(p.minute)}` : kind === 'moon' ? `${Math.round(moon!.illuminated * 100)}%` : kind === 'year' ? String(p.year) : date
  return <>
    <div className="widget-copy">
      <span className="widget-eyebrow">{kind === 'earth' ? place.name : kind === 'moon' ? 'THE MOON' : kind === 'year' ? 'YEAR' : 'SOLAR SYSTEM'}</span>
      <strong className="widget-value">{variant === 'lcd' ? <DigitalText>{value}</DigitalText> : value}</strong>
      <span className="widget-caption">{caption}</span>
      <span className="widget-detail">{kind === 'earth' ? `${date} · ${place.timeZone.replace(/_/g, ' ')}` : kind === 'moon' ? 'of the visible disc illuminated' : kind === 'year' ? 'Earth years per revolution' : 'Positions at the selected moment'}</span>
    </div>
    <div className="widget-scene" aria-hidden="true">
      {kind === 'earth' && (variant === 'lcd' ? <LcdEarth location={place} /> : <EarthGlobe location={place} />)}
      {kind === 'moon' && (variant === 'lcd' ? <LcdBody body="moon" location={place} /> : <MoonGlobe location={place} />)}
      {kind === 'year' && (variant === 'lcd' ? <LcdBody body={planet} location={place} /> : <PlanetGlobe planet={planet} />)}
      {kind === 'orrery' && (variant === 'lcd' ? <LcdCompactOrrery now={now} place={place} planet={planet} /> : <CompactOrrery now={now} place={place} planet={planet} palette={pickerColorPalette(colors)} theme={theme} />)}
    </div>
  </>
}

export function EarthWidget(props: Omit<CelestialCardProps, 'kind'>) { return <CelestialWidget {...props} kind="earth" /> }
export function MoonWidget(props: Omit<CelestialCardProps, 'kind'>) { return <CelestialWidget {...props} kind="moon" /> }
export function OrreryWidget(props: Omit<CelestialCardProps, 'kind'>) { return <CelestialWidget {...props} kind="orrery" /> }
export function YearWidget(props: Omit<CelestialCardProps, 'kind'>) { return <CelestialWidget {...props} kind="year" /> }
