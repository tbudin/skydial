import { DigitalText } from './DigitalText.js'
import type { PickerVariant } from './appearance.js'
import type { PickerTheme } from './PickerControls.js'
import { pickerColorPalette, pickerColorStyle, type PickerColors } from './colors.js'
import { LcdCompactOrrery } from '../render/LcdOrrery.js'
import { DEFAULT_PLACE } from './defaults.js'
import { ClockScope } from '../sim/react.js'
import { civilParts } from '../astro/time.js'
import { PLANET_BY_ID, type YearPlanetId } from '../astro/bodies.js'
import { earthView, moonView, phaseName } from '../astro/observer.js'
import { BodyVisual } from './display.js'
import { widgetPart, type WidgetAppearance } from './widgetAppearance.js'
import { useSimNow } from '../ui/hooks.js'
import type { CelestialWidgetProps } from './types.js'
import { useVisualRenderer } from '../render/visualRenderer.js'

export interface CelestialCardProps extends CelestialWidgetProps, WidgetAppearance {
  variant?: PickerVariant
  theme?: PickerTheme
  colors?: PickerColors
  kind?: 'earth' | 'moon' | 'orrery' | 'year'
  size?: 'small' | 'medium' | 'large'
  planet?: YearPlanetId
  defaultPlanet?: YearPlanetId
  /** @deprecated Cards no longer render a selector. Configure planet through props. */
  onPlanetChange?: (planet: YearPlanetId) => void
}

/** Compact website cards with small, medium and large home-screen proportions. */
export function CelestialWidget({ kind = 'earth', size = 'small', variant = 'celestial', theme = 'dark', colors, place = DEFAULT_PLACE, className = '', style, planet, defaultPlanet = 'jupiter', onPlanetChange: _onPlanetChange, styles, classNames, ...time }: CelestialCardProps) {
  const selected = planet ?? defaultPlanet
  return <ClockScope {...time}>
    <article {...widgetPart({ styles, classNames }, 'root', `celestial-clock celestial-card widget-${kind} widget-${size} ${className}`, { ...pickerColorStyle(colors, variant), ...style })} data-planet={selected} data-picker-style={variant} data-picker-theme={theme} aria-label={`${kind === 'year' ? PLANET_BY_ID[selected].name + ' year' : kind} widget`}>
      <CardContent kind={kind} place={place} planet={selected} variant={variant} colors={colors} theme={theme} styles={styles} classNames={classNames} />
    </article>
  </ClockScope>
}

function CardContent({ kind, place, planet, variant, colors, theme, styles, classNames }: Required<Pick<CelestialCardProps, 'kind' | 'place' | 'planet' | 'variant' | 'theme'>> & Pick<CelestialCardProps, 'colors' | 'styles' | 'classNames'>) {
  const appearance = { styles, classNames }
  const renderer = useVisualRenderer()
  const now = useSimNow(250)
  const p = civilParts(now, place.timeZone)
  const pad = (n: number) => String(n).padStart(2, '0')
  const moon = kind === 'moon' ? moonView(place, now) : null
  const earth = kind === 'earth' ? earthView(place, now) : null
  const date = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: variant === 'lcd' ? '2-digit' : 'short', timeZone: place.timeZone }).format(now)
  const caption = kind === 'earth' ? (earth!.sunAltitude >= 0 ? 'Daylight' : 'After sunset') : kind === 'moon' ? phaseName(moon!.phaseLon) : kind === 'year' ? `${PLANET_BY_ID[planet].periodYears.toFixed(1)}-year orbit` : `${PLANET_BY_ID[planet].name} year hand`
  const value = kind === 'earth' ? `${pad(p.hour)}:${pad(p.minute)}` : kind === 'moon' ? `${Math.round(moon!.illuminated * 100)}%` : kind === 'year' ? String(p.year) : date
  return <div {...widgetPart(appearance, 'layout', 'widget-layout')}>
    <div {...widgetPart(appearance, 'content', 'widget-copy')}>
      <span {...widgetPart(appearance, 'label', 'widget-eyebrow')}>{kind === 'earth' ? place.name : kind === 'moon' ? 'THE MOON' : kind === 'year' ? PLANET_BY_ID[planet].name : 'SOLAR SYSTEM'}</span>
      {kind === 'moon' ? <strong {...widgetPart(appearance, 'value', 'widget-value')}>{variant === 'lcd' ? <DigitalText>{value}</DigitalText> : value}</strong>
        : <time {...widgetPart(appearance, 'value', 'widget-value')} dateTime={new Date(now).toISOString()}>{variant === 'lcd' ? <DigitalText>{value}</DigitalText> : value}</time>}
      <span {...widgetPart(appearance, 'caption', 'widget-caption')}>{caption}</span>
      <span {...widgetPart(appearance, 'detail', 'widget-detail')}>{kind === 'earth' ? `${date} · ${place.timeZone.replace(/_/g, ' ')}` : kind === 'moon' ? 'of the visible disc illuminated' : kind === 'year' ? 'Earth years per revolution' : 'Positions at the selected moment'}</span>
    </div>
    <div {...widgetPart(appearance, 'scene', 'widget-scene')} aria-hidden="true">
      {kind !== 'orrery' && <div {...widgetPart(appearance, 'body', 'widget-body')}><BodyVisual body={kind === 'year' ? planet : kind} place={place} variant={variant} /></div>}
      {kind === 'orrery' && (variant === 'lcd' ? <LcdCompactOrrery now={now} place={place} planet={planet} /> : renderer ? <renderer.CompactOrrery now={now} place={place} planet={planet} palette={pickerColorPalette(colors)} theme={theme} /> : null)}
    </div>
  </div>
}

export function EarthWidget(props: Omit<CelestialCardProps, 'kind'>) { return <CelestialWidget {...props} kind="earth" /> }
export function MoonWidget(props: Omit<CelestialCardProps, 'kind'>) { return <CelestialWidget {...props} kind="moon" /> }
export function OrreryWidget(props: Omit<CelestialCardProps, 'kind'>) { return <CelestialWidget {...props} kind="orrery" /> }
export function YearWidget(props: Omit<CelestialCardProps, 'kind'>) { return <CelestialWidget {...props} kind="year" /> }
