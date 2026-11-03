import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { PLANET_BY_ID, YEAR_SCALES, type YearPlanetId } from './astro/bodies.js'
import { calendarScale, yearScale } from './astro/clockScales.js'
import { approximatePlace, isValidTimeZone, type Place } from './astro/places.js'
import { browserTimeZone, civilParts, dayOfYear, zonedToUtc, zoneOffsetMs } from './astro/time.js'
import { Orrery } from './render/Orrery.js'
import { loadTextures, type TextureKey, type TextureSet } from './render/textures.js'
import { renderThumbnails } from './render/thumbnails.js'
import { EarthPanel } from './ui/EarthPanel.js'
import { zoneLabel } from './ui/format.js'
import { LocationPicker } from './ui/LocationPicker.js'
import { MoonPanel } from './ui/MoonPanel.js'
import { PlanetSelector } from './ui/PlanetSelector.js'
import { TimeControls } from './ui/TimeControls.js'
import { useClockState, useSimNow } from './ui/hooks.js'
import { Reading } from './ui/Reading.js'
import type { SimClock } from './sim/clock.js'
import { acquireDeviceLocation, type DeviceLocationStatus } from './ui/deviceLocation.js'
import { ClockScope } from './sim/react.js'
import { useCelestialClock } from './sim/hooks.js'


export type ViewMode = 'full' | 'ambient' | 'orrery' | 'earth' | 'moon'
const PLANET_IDS: YearPlanetId[] = ['jupiter', 'saturn', 'uranus', 'neptune']

/** URL options, for embedding and ambient displays. See README. */
function readParams() {
  const q = new URLSearchParams(typeof window === 'undefined' ? '' : window.location.search)
  const view = (q.get('view') ?? 'full') as ViewMode
  const planet = q.get('planet') as YearPlanetId | null
  const tzParam = q.get('tz')
  const lat = q.get('lat')
  const lon = q.get('lon')
  let place: Place | null = null
  const tz = tzParam && isValidTimeZone(tzParam) ? tzParam : null
  if (lat !== null && lon !== null && Number.isFinite(Number(lat)) && Number.isFinite(Number(lon))) {
    place = {
      name: q.get('name') ?? `${Number(lat).toFixed(2)}, ${Number(lon).toFixed(2)}`,
      latitude: Math.max(-90, Math.min(90, Number(lat))),
      longitude: Math.max(-180, Math.min(180, Number(lon))),
      timeZone: tz ?? browserTimeZone(),
      source: 'custom',
    }
  }
  // URL time is an initial, paused instant, matching defaultDate.
  const t = q.get('t')

  return {
    view: (['full', 'ambient', 'orrery', 'earth', 'moon'] as ViewMode[]).includes(view) ? view : 'full',
    planet: planet && PLANET_IDS.includes(planet) ? planet : 'jupiter',
    place,
    tz,
    time: t && Number.isFinite(Date.parse(t)) ? Date.parse(t) : undefined,
  }
}


function usePlace(initial: Place | null, tzOverride: string | null, allowDevice: boolean, onDevicePlace?: (place: Place) => void) {
  const [place, setPlace] = useState<Place>(() => {
    if (initial) return initial
    const tz = tzOverride ?? browserTimeZone()
    return approximatePlace(tz, zoneOffsetMs(Date.now(), tz) / 60000)
  })
  const [geo, setGeo] = useState<DeviceLocationStatus>('idle')
  const cancelLocation = useRef<(() => void) | null>(null)
  useEffect(() => () => cancelLocation.current?.(), [])

  const requestDevice = useCallback(() => {
    cancelLocation.current?.()
    if (!window.isSecureContext) { setGeo('insecure'); return }
    if (!navigator.geolocation) { setGeo('unsupported'); return }
    setGeo('pending')
    cancelLocation.current = acquireDeviceLocation(navigator.geolocation, {
      retrying: () => setGeo('retrying'), failure: setGeo,
      success: (pos) => {
        const next: Place = { name: 'Your location', latitude: pos.coords.latitude, longitude: pos.coords.longitude,
          timeZone: browserTimeZone(), source: 'device' }
        setPlace(next)
        onDevicePlace?.(next)
        setGeo('granted')
      },
    })
  }, [onDevicePlace])

  // Use the device location automatically only when permission is already granted
  useEffect(() => {
    if (initial || !allowDevice) return
    navigator.permissions
      ?.query({ name: 'geolocation' as PermissionName })
      .then((s) => {
        if (s.state === 'granted') requestDevice()
        else if (s.state === 'denied') setGeo('denied')
      })
      .catch(() => {})
  }, [initial, allowDevice, requestDevice])

  const choosePlace = (next: Place) => { cancelLocation.current?.(); setGeo('idle'); setPlace(next) }
  return { place, setPlace: choosePlace, geo, requestDevice }
}

export interface CelestialClockProps {
  /** Which parts to show. Defaults to the URL's ?view= or 'full'. */
  view?: ViewMode
  /** Year-hand planet. Defaults to ?planet= or Jupiter. */
  planet?: YearPlanetId
  defaultPlanet?: YearPlanetId
  showPlanetSelector?: boolean
  showReadings?: boolean
  /** Observer. Defaults to ?lat=&lon=, the device location if already permitted, or an approximation from the time zone. */
  place?: Place
  /** Opt into reading initial options from the page URL (default false). */
  useUrl?: boolean
  /** Controlled UTC instant; otherwise the clock runs live. */
  date?: Date | number
  defaultDate?: Date | number
  onDateChange?: (date: Date) => void
  /** Optional explicitly shared simulation clock. */
  clock?: SimClock
  onPlaceChange?: (place: Place) => void
  onPlanetChange?: (planet: YearPlanetId) => void
  /** Never request device location automatically unless opted in. */
  useDeviceLocation?: boolean
  /** Enable demo-only window diagnostics. */
  diagnostics?: boolean
}

export default function App(props: CelestialClockProps = {}) {
  const [url] = useState(() => props.useUrl ? readParams() : null)
  return (
    <ClockScope clock={props.clock} date={props.date} defaultDate={props.defaultDate ?? url?.time} onDateChange={props.onDateChange}>
      <div className="celestial-clock">
        <ClockContent {...props} view={props.view ?? url?.view} initialPlanet={url?.planet} initialPlace={url?.place ?? undefined} initialTimeZone={url?.tz ?? undefined} />
      </div>
    </ClockScope>
  )
}

function ClockContent(props: CelestialClockProps & { initialPlanet?: YearPlanetId; initialPlace?: Place; initialTimeZone?: string }) {
  const simClock = useCelestialClock()
  const { place: internalPlace, setPlace: setInternalPlace, geo, requestDevice } = usePlace(props.place ?? props.initialPlace ?? null, props.initialTimeZone ?? null, props.useDeviceLocation === true, props.onPlaceChange)
  const place = props.place ?? internalPlace
  const setPlace = (next: Place) => {
    if (!props.place) setInternalPlace(next)
    props.onPlaceChange?.(next)
  }
  const tz = place.timeZone
  const now = useSimNow(100)
  const clock = useClockState()
  const parts = civilParts(now, tz)
  const doy = dayOfYear(parts.year, parts.month, parts.day)
  const view = props.view ?? 'full'

  const [internalPlanet, setInternalPlanet] = useState<YearPlanetId>(props.defaultPlanet ?? props.initialPlanet ?? 'jupiter')
  const yearPlanet = props.planet ?? internalPlanet
  const setYearPlanet = (next: YearPlanetId) => {
    if (!props.planet) setInternalPlanet(next)
    props.onPlanetChange?.(next)
  }
  const [textures, setTextures] = useState<TextureSet | null>(null)
  const [failed, setFailed] = useState<TextureKey[]>([])
  const [thumbs, setThumbs] = useState<Partial<Record<YearPlanetId, string>>>({})

  useEffect(() => {
    if (!props.diagnostics) return
    const target = window as unknown as { __celestialClockSim?: (speed: import('./sim/clock.js').SpeedId) => void }
    target.__celestialClockSim = (speed) => simClock.setSpeed(speed)
    return () => { delete target.__celestialClockSim }
  }, [props.diagnostics, simClock])

  useEffect(() => {
    let cancelled = false
    loadTextures().then(({ textures, failed }) => {
      if (cancelled) return
      setTextures(textures)
      setFailed(failed)
      if (view === 'full' || view === 'orrery') setThumbs(renderThumbnails(textures, Date.now()))
    })
    return () => {
      cancelled = true
    }
  }, [view])

  const calendar = useMemo(() => calendarScale(parts.year, tz), [parts.year, tz])
  const yScale = useMemo(() => yearScale(yearPlanet, parts.year, tz), [yearPlanet, parts.year, tz])
  const orbitEpochMs = useMemo(() => zonedToUtc(tz, parts.year, 7, 1), [parts.year, tz])
  const planet = PLANET_BY_ID[yearPlanet]

  const showTelemetry = view === 'full' || view === 'ambient' || view === 'earth' || view === 'moon'
  const showOrrery = view === 'full' || view === 'ambient' || view === 'orrery'
  const showControls = view === 'full'

  return (
    <main className={`app view-${view}`}>
      {view === 'full' && (
        <header className="masthead">
          <h1>Skydial</h1>
          <span className="masthead-note">{clock.live ? 'Live' : clock.playing ? 'Simulating' : 'Paused'}</span>
        </header>
      )}

      {showControls && <LocationPicker place={place} onChange={setPlace} onUseDevice={requestDevice} geoStatus={geo} />}

      <div className="side">
        {props.showReadings !== false && view !== 'earth' && view !== 'moon' && <Reading parts={parts} doy={doy} zone={zoneLabel(tz, now)} yearPlanet={yearPlanet} />}
        {showTelemetry && (
          <section className={`telemetry ${view === 'earth' || view === 'moon' ? 'single' : ''}`} aria-label="Earth and Moon telemetry">
            {view !== 'moon' && <EarthPanel place={place} now={now} />}
            {view !== 'earth' && <MoonPanel place={place} now={now} />}
          </section>
        )}
      </div>

      {showOrrery && (
        <section className="orrery-section" aria-label="Solar system clock">
          {view === 'orrery' && props.showPlanetSelector !== false && <PlanetSelector value={yearPlanet} onChange={setYearPlanet} thumbnails={thumbs} disabled={props.planet !== undefined && !props.onPlanetChange} />}
          <div className="orrery-canvas">
            {textures ? (
              <Orrery
                textures={textures}
                calendar={calendar}
                yearScale={yScale}
                yearPlanet={yearPlanet}
                currentDayIndex={doy - 1}
                currentMonth={parts.month}
                orbitEpochMs={orbitEpochMs}
                diagnostics={props.diagnostics}
              />
            ) : (
              <div className="loading">Loading textures…</div>
            )}
          </div>

          {failed.length > 0 && (
            <p className="warning" role="alert">
              Some textures failed to load ({failed.join(', ')}). Plain materials are shown instead.
            </p>
          )}

          {view === 'full' && (
            <p className="scale-note">
              The green hand reads the day and month on the calendar ring; the gold hand reads the year on {planet.name}’s orbit (scale {yScale.fromYear}–{yScale.toYear},
              labelled {YEAR_SCALES[yearPlanet].labelInterval === 1 ? 'every year' : `every ${YEAR_SCALES[yearPlanet].labelInterval} years`}). Directions are exact; distances are
              compressed and planet sizes enlarged.
            </p>
          )}
        </section>
      )}

      {showControls && (
        <section className="controls-section" aria-label="Controls">
          <PlanetSelector value={yearPlanet} onChange={setYearPlanet} thumbnails={thumbs} disabled={props.planet !== undefined && !props.onPlanetChange} />
          <TimeControls parts={parts} tz={tz} doy={doy} />
          <footer className="credits">
            Ephemerides: Astronomy Engine (VSOP87, IAU 2015 rotation models). Textures: Solar System Scope (CC BY 4.0) and NASA Earth at night.{' '}
            {props.useUrl && <a href="/?view=ambient">Ambient mode</a>}
          </footer>
        </section>
      )}
    </main>
  )
}
