import { useResolvedPickerTheme } from './usePickerTheme.js'
import { useVisualRenderer } from '../render/visualRenderer.js'
import { usePickerLocale } from './localization.js'
import type { RangeSelection } from './rangeSelection.js'
import { LcdEarth } from '../render/LcdEarth.js'
import { LcdBody } from '../render/LcdBody.js'
import { useRef, type PointerEvent } from 'react'
import { pickerUnits, stepPickerUnit } from '../astro/picker.js'
import { PLANET_BY_ID, type YearPlanetId } from '../astro/bodies.js'
import { civilParts, daysInMonth } from '../astro/time.js'
import { useCelestialTime } from '../sim/hooks.js'
import { useSimNow } from '../ui/hooks.js'
import { OrreryControl } from './OrreryControl.js'
import { usePickerParts, usePickerVariant } from './appearance.js'
import type { OrreryAppearance } from '../render/orreryTypes.js'
import { EarthTimeControl } from './EarthTimeControl.js'
import { CelestialPicker, type CelestialPickerProps } from './picker.js'
import { DEFAULT_PLACE } from './defaults.js'
import type { EarthPickerViewProps } from './useEarthView.js'

export type PickerScene = 'auto' | 'orrery' | 'earth' | 'moon' | 'planet' | false
export interface CelestialInputProps extends Omit<CelestialPickerProps, 'children'>, EarthPickerViewProps {
  /** Auto uses Earth’s revolution for days, the year planet for years, and Earth’s rotation for time. */
  scene?: PickerScene
  /** Turn off direct scene manipulation to use the selected body as decoration. */
  interactive?: boolean
  /** Canvas colours, stroke weights and body sizes. DOM parts use styles/classNames. */
  orbitalStyle?: OrreryAppearance
  planet?: YearPlanetId
  defaultPlanet?: YearPlanetId
}


/** A compact input opening orbital dates, Earth time, scroll wheels and exact steps together. */
export function CelestialInput({ scene = 'auto', interactive = true, planet, defaultPlanet = 'jupiter',
  earthView, defaultEarthView, onEarthViewChange, earthPlace, onEarthPlaceChange,
  control = 'both', theme = 'auto', ...props }: CelestialInputProps) {
  const resolvedTheme = useResolvedPickerTheme(theme)
  return <CelestialPicker {...props} control={control} theme={theme}>
    {scene !== false && <InputScene {...props} scene={scene} interactive={interactive} planet={planet ?? defaultPlanet} theme={resolvedTheme}
      earthView={earthView} defaultEarthView={defaultEarthView} onEarthViewChange={onEarthViewChange} earthPlace={earthPlace} onEarthPlaceChange={onEarthPlaceChange} />}
  </CelestialPicker>
}

export function InputScene({ scene, interactive, planet, theme, place = DEFAULT_PLACE, disabled = false, readOnly = false, ...props }: CelestialInputProps & {
  scene: Exclude<PickerScene, false>; interactive: boolean; planet: YearPlanetId; theme: 'light' | 'dark'
  rangeSelection?: RangeSelection
}) {
  const { readOnly: fixed } = useCelestialTime()
  const i18n = usePickerLocale()
  const units = pickerUnits(props)
  const hasDate = units.some((unit) => ['year', 'month', 'day'].includes(unit))
  const hasTime = units.some((unit) => ['hour', 'minute', 'second'].includes(unit))
  const selectedScene = scene === 'auto' ? hasDate ? 'orrery' : 'earth' : scene
  const part = usePickerParts()
  const locked = disabled || readOnly || fixed
  return <section {...part('scene', 'celestial-input-scene')} data-scene={selectedScene} data-combined={selectedScene === 'orrery' && hasTime || undefined} data-interactive={interactive} data-scene-theme={theme} aria-label={i18n.messages.scene}>
    {selectedScene === 'orrery' ? <>
      <OrreryControl compact place={place} planet={planet} theme={theme} units={units} steps={props.steps} min={props.min} max={props.max} disabled={locked || !interactive} appearance={props.orbitalStyle} rangeSelection={props.rangeSelection} />
      {hasTime && <div className="celestial-input-earth-companion"><EarthTimeControl {...props} units={units} compact place={place} disabled={locked || !interactive} /></div>}
    </> : selectedScene === 'earth' && !hasDate
      ? <EarthTimeControl {...props} units={units} compact place={place} disabled={locked || !interactive} />
      : <BodyControl {...props} place={place} body={selectedScene === 'earth' ? 'earth' : selectedScene === 'moon' ? 'moon' : planet}
        disabled={locked} interactive={interactive && selectedScene !== 'moon'} />}
  </section>
}

function BodyControl({ body, interactive, disabled, place = DEFAULT_PLACE, ...configuration }: CelestialInputProps & { body: YearPlanetId | 'earth' | 'moon'; interactive: boolean; disabled: boolean }) {
  const now = useSimNow()
  const variant = usePickerVariant()
  const i18n = usePickerLocale()
  const renderer = useVisualRenderer()
  const { clock, selectDate } = useCelestialTime()
  const gesture = useRef<{ pointer: number; x: number; width: number; time: number } | null>(null)
  const units = pickerUnits(configuration)
  const unit = units[units.length - 1]
  const p = civilParts(now, place.timeZone)
  const name = body === 'earth' ? 'Earth' : body === 'moon' ? 'Moon' : PLANET_BY_ID[body].name
  const date = units.some((item) => ['year', 'month', 'day'].includes(item))
  const minimum = unit === 'year' ? 1600 : unit === 'month' || unit === 'day' ? 1 : 0
  const maximum = { year: 2400, month: 12, day: daysInMonth(p.year, p.month), hour: 23, minute: 59, second: 59 }[unit]
  const select = (time: number, direction: number) => {
    if (interactive && !disabled) selectDate(stepPickerUnit(time, unit, direction, place.timeZone, configuration.steps, configuration))
  }
  const end = (event: PointerEvent<HTMLDivElement>) => { if (gesture.current?.pointer === event.pointerId) gesture.current = null }
  return <div className="celestial-input-body" data-body={body} role={interactive ? 'slider' : 'img'}
    aria-label={interactive ? `${date ? i18n.messages.date : i18n.messages.time}: ${name}` : name}
    aria-valuemin={interactive ? minimum : undefined} aria-valuemax={interactive ? maximum : undefined}
    aria-valuenow={interactive ? p[unit] : undefined} aria-valuetext={interactive ? new Intl.DateTimeFormat(i18n.locale, { timeZone: place.timeZone, calendar: 'gregory', dateStyle: 'medium', timeStyle: 'medium' }).format(now) : undefined}
    aria-disabled={interactive ? disabled : undefined} tabIndex={interactive && !disabled ? 0 : undefined}
    onKeyDown={(event) => {
      const direction = ['ArrowRight', 'ArrowUp'].includes(event.key) ? 1 : ['ArrowLeft', 'ArrowDown'].includes(event.key) ? -1 : 0
      if (direction && interactive && !disabled) { event.preventDefault(); select(clock.now(), direction) }
    }}
    onPointerDown={(event) => {
      if (!interactive || disabled || event.button !== 0 || gesture.current) return
      event.preventDefault(); event.currentTarget.focus({ preventScroll: true }); event.currentTarget.setPointerCapture(event.pointerId)
      gesture.current = { pointer: event.pointerId, x: event.clientX, width: event.currentTarget.clientWidth, time: clock.now() }
    }}
    onPointerMove={(event) => {
      const start = gesture.current
      if (!start || start.pointer !== event.pointerId) return
      const span = { year: 10, month: 12, day: 31, hour: 24, minute: 60, second: 60 }[unit]
      select(start.time, Math.round((event.clientX - start.x) / start.width * span))
    }} onPointerUp={end} onPointerCancel={end} onLostPointerCapture={end}>
    {variant === 'lcd' ? body === 'earth' ? <LcdEarth location={configuration.earthPlace ?? place} view={(configuration.earthView ?? configuration.defaultEarthView ?? 'city') === 'city' ? 'observer' : 'rotation'} /> : <LcdBody body={body} location={place} /> : !renderer ? null : body === 'earth' ? <renderer.Earth location={configuration.earthPlace ?? place} view={(configuration.earthView ?? configuration.defaultEarthView ?? 'city') === 'city' ? 'observer' : 'rotation'} />
      : body === 'moon' ? <renderer.Moon location={place} /> : <renderer.Planet planet={body} />}
  </div>
}
