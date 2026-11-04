import { useVisualRenderer } from '../render/visualRenderer.js'
import type { PlanetId } from '../astro/bodies.js'
import { useMemo } from 'react'
import { PLANET_BY_ID } from '../astro/bodies.js'
import { ClockScope } from '../sim/react.js'
import { useSimNow } from '../ui/hooks.js'
import { LcdEarth } from '../render/LcdEarth.js'
import { LcdBody } from '../render/LcdBody.js'
import { DEFAULT_PLACE } from './defaults.js'
import type { PickerVariant } from './appearance.js'
import type { PickerTheme } from './PickerControls.js'
import { pickerColorStyle, type PickerColors } from './colors.js'
import { DigitalText } from './DigitalText.js'
import type { CelestialWidgetProps } from './types.js'
import { widgetPart, type WidgetAppearance } from './widgetAppearance.js'

export type CelestialBodyId = PlanetId | 'moon'
export type DisplayFormat = Intl.DateTimeFormatOptions | false
interface DisplayAppearance extends WidgetAppearance {
  variant?: PickerVariant
  theme?: PickerTheme
  colors?: PickerColors
}
export interface CelestialBodyProps extends CelestialWidgetProps, DisplayAppearance {
  body?: CelestialBodyId
  /** CSS pixels; the body also shrinks to its container. */
  size?: number
}

/** A decorative, observer-aware body; expose a text name on the containing figure. */
export function BodyVisual({ body, place, variant }: { body: CelestialBodyId; place: NonNullable<CelestialWidgetProps['place']>; variant: PickerVariant }) {
  const renderer = useVisualRenderer()
  if (variant === 'lcd') return body === 'earth' ? <LcdEarth location={place} /> : <LcdBody body={body} location={place} />
  if (!renderer) return null
  if (body === 'earth') return <renderer.Earth location={place} illustration />
  if (body === 'moon') return <renderer.Moon location={place} illustration />
  return <renderer.Planet planet={body} illustration />
}

/** Standalone body for a header, badge or custom composition, without a selector. */
export function CelestialBody({ body = 'earth', size = 40, variant = 'celestial', theme = 'dark', colors, place = DEFAULT_PLACE, className = '', style, styles, classNames, ...time }: CelestialBodyProps) {
  const appearance = { styles, classNames }
  return <ClockScope {...time}><figure {...widgetPart(appearance, 'root', `celestial-clock celestial-body ${className}`, { width: size, height: size, ...pickerColorStyle(colors, variant), ...style })}
    data-body={body} data-picker-style={variant} data-picker-theme={theme} role="img" aria-label={body === 'moon' ? 'Moon' : PLANET_BY_ID[body].name}>
    <div {...widgetPart(appearance, 'scene', 'display-body-scene')} aria-hidden="true"><BodyVisual body={body} place={place} variant={variant} /></div>
  </figure></ClockScope>
}

export interface CelestialDisplayProps extends CelestialWidgetProps, DisplayAppearance {
  /** In display order. Empty hides artwork. All eight planets and the Moon are supported. */
  bodies?: readonly CelestialBodyId[]
  /** Intl options; false hides the date or time. The observer's time zone always applies. */
  dateFormat?: DisplayFormat
  timeFormat?: DisplayFormat
  /** Explicit default keeps server and client output consistent. */
  locale?: string
  size?: 'small' | 'medium' | 'large'
  layout?: 'inline' | 'stacked'
  label?: string
}
const DEFAULT_BODIES: readonly CelestialBodyId[] = ['earth', 'moon']
const DEFAULT_DATE: Intl.DateTimeFormatOptions = { year: 'numeric', month: '2-digit', day: '2-digit' }
const DEFAULT_TIME: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }

/** Read-only date/time for toolbars and dashboards; no input or popup is mounted. */
export function CelestialDisplay({ bodies = DEFAULT_BODIES, dateFormat = DEFAULT_DATE, timeFormat = DEFAULT_TIME, locale = 'en-GB', size = 'small', layout = 'inline', label,
  variant = 'celestial', theme = 'dark', colors, place = DEFAULT_PLACE, className = '', style, styles, classNames, ...time }: CelestialDisplayProps) {
  return <ClockScope {...time}><div {...widgetPart({ styles, classNames }, 'root', `celestial-clock celestial-display display-${size} display-${layout} ${className}`, { ...pickerColorStyle(colors, variant), ...style })}
    data-picker-style={variant} data-picker-theme={theme}>
    <DisplayContent {...{ bodies, dateFormat, timeFormat, locale, label, place, variant, styles, classNames }} />
  </div></ClockScope>
}

function DisplayContent({ bodies, dateFormat, timeFormat, locale, label, place, variant, styles, classNames }: Required<Pick<CelestialDisplayProps, 'bodies' | 'dateFormat' | 'timeFormat' | 'locale' | 'place' | 'variant'>> & Pick<CelestialDisplayProps, 'label' | 'styles' | 'classNames'>) {
  const now = useSimNow(timeFormat && (timeFormat.second || timeFormat.fractionalSecondDigits) ? 100 : 250)
  const appearance = { styles, classNames }
  const dateFormatter = useMemo(() => dateFormat === false ? null : new Intl.DateTimeFormat(locale, { ...dateFormat, timeZone: place.timeZone }), [locale, dateFormat, place.timeZone])
  const timeFormatter = useMemo(() => timeFormat === false ? null : new Intl.DateTimeFormat(locale, { ...timeFormat, timeZone: place.timeZone }), [locale, timeFormat, place.timeZone])
  const date = dateFormatter?.format(now) ?? ''
  const time = timeFormatter?.format(now) ?? ''
  return <>
    {bodies.length > 0 && <div {...widgetPart(appearance, 'bodies', 'display-bodies')}>
      {bodies.map((body, index) => <span key={`${body}-${index}`} {...widgetPart(appearance, 'body', 'display-body')} data-body={body} role="img" aria-label={body === 'moon' ? 'Moon' : PLANET_BY_ID[body].name}>
        <span className="display-body-scene" aria-hidden="true"><BodyVisual body={body} place={place} variant={variant} /></span>
      </span>)}
    </div>}
    <div {...widgetPart(appearance, 'content', 'display-copy')}>
      {label && <span {...widgetPart(appearance, 'label', 'display-label')}>{label}</span>}
      {(date || time) && <time {...widgetPart(appearance, 'value', 'display-value')} dateTime={new Date(now).toISOString()}>
        {date && <span {...widgetPart(appearance, 'date', 'display-date')}>{variant === 'lcd' ? <DigitalText>{date}</DigitalText> : date}</span>}
        {time && <span {...widgetPart(appearance, 'time', 'display-time')}>{variant === 'lcd' ? <DigitalText>{time}</DigitalText> : time}</span>}
      </time>}
    </div>
  </>
}

export function CelestialDateDisplay(props: CelestialDisplayProps) { return <CelestialDisplay timeFormat={false} {...props} /> }
export function CelestialTimeDisplay(props: CelestialDisplayProps) { return <CelestialDisplay dateFormat={false} {...props} /> }
