import { LcdOrrery } from '../render/LcdOrrery.js'
import { useContext, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import type { Place } from '../astro/places.js'
import { PLANET_BY_ID, type PlanetId, type YearPlanetId } from '../astro/bodies.js'
import { calendarScale, yearScale } from '../astro/clockScales.js'
import { civilParts, dayOfYear, MONTH_SHORT, zonedToUtc } from '../astro/time.js'
import { changeCivilYear, clampTime, dateAtLongitude, yearAtLongitude } from '../astro/selection.js'
import { helioEcliptic, normaliseAngle } from '../astro/ephemeris.js'
import { CALENDAR_RADIUS, SCENE_EXTENT, radialScale } from '../geometry/projection.js'
import { loadTextures, type TextureLoadResult } from '../render/textures.js'
import { renderThumbnails } from '../render/thumbnails.js'
import { PickerAppearanceContext, usePickerParts, usePickerVariant } from './appearance.js'
import { pickerColorPalette } from './colors.js'
import { Orrery, type OrreryAppearance } from '../render/Orrery.js'
import { PlanetSelector } from '../ui/PlanetSelector.js'
import { useSimNow } from '../ui/hooks.js'
import { useTimeMotion } from './useTimeMotion.js'
import { clampPickerTime, stepPickerUnit, type PickerBounds, type PickerUnit, type PickerSteps } from '../astro/picker.js'
import { daysInMonth } from '../astro/time.js'

interface Props extends PickerBounds {
  place: Place
  planet: YearPlanetId
  onPlanetChange?: (planet: YearPlanetId) => void
  compact?: boolean
  appearance?: OrreryAppearance
  planetReadOnly?: boolean
  disabled?: boolean
  theme?: 'light' | 'dark'
  units?: readonly PickerUnit[]
  steps?: PickerSteps
}

interface OrbitPreview {
  kind: 'day' | 'year'
  unit: 'day' | 'month' | 'year'
  label: string
  x: number
  y: number
}

export function OrreryControl({ place, planet, onPlanetChange, planetReadOnly, disabled, theme, units, steps, min, max, compact = false, appearance: customAppearance }: Props) {
  const part = usePickerParts()
  const variant = usePickerVariant()
  const { colors } = useContext(PickerAppearanceContext)
  const appearance = useMemo(() => ({ ...customAppearance, palette: { ...pickerColorPalette(colors), ...customAppearance?.palette } }), [colors, customAppearance])
  const now = useSimNow(33)
  const p = civilParts(now, place.timeZone)
  const [anchorYear, setAnchorYear] = useState(p.year)
  const [assets, setAssets] = useState<TextureLoadResult | null>(null)
  const [thumbs, setThumbs] = useState<Partial<Record<YearPlanetId, string>>>({})
  const stage = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ width: 500, height: 500 })
  const { choose, readOnly, selectionNow } = useTimeMotion()
  const previewId = useId()
  const [preview, setPreview] = useState<OrbitPreview | null>(null)
  const hidePreview = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const locked = disabled || readOnly
  const showMonths = units?.includes('month') ?? true
  const showDays = units?.includes('day') ?? true
  const showYears = units?.includes('year') ?? true
  const showCalendar = showMonths || showDays
  const visibleBodies = useMemo<PlanetId[]>(() => [...(showCalendar ? ['earth' as const] : []), ...(showYears ? [planet] : [])], [showCalendar, showYears, planet])
  const sceneExtent = showCalendar ? SCENE_EXTENT : radialScale(PLANET_BY_ID[planet].semiMajorAxisAu) * 1.1 + .3
  const dayLocked = locked || Boolean(units && !units.includes('month') && !units.includes('day'))
  const yearLocked = locked || Boolean(units && !units.includes('year'))
  const resolveOrbit = (target: number) => {
    if (!units) return clampPickerTime(target, { min, max })
    const current = civilParts(selectionNow(), place.timeZone)
    const next = civilParts(target, place.timeZone)
    const year = units.includes('year') ? next.year : current.year
    const month = units.includes('month') ? next.month : current.month
    return clampPickerTime(zonedToUtc(place.timeZone, year, month, Math.min(units.includes('day') ? next.day : current.day, daysInMonth(year, month)), current.hour, current.minute, current.second), { min, max })
  }
  const selectOrbit = (target: number, animate: boolean) => choose(resolveOrbit(target), animate)
  const { month: refMonth, day: refDay } = civilParts(selectionNow(), place.timeZone)
  const scale = useMemo(() => {
    // Year ticks use this civil day's midnight, like calendar ticks. Keep their geometry
    // stable during time-of-day edits; a sub-day planet movement is smaller than a pixel.
    const result = yearScale(planet, anchorYear, place.timeZone, { month: refMonth, day: refDay, hour: 0, minute: 0, second: 0 })
    return { ...result, toYear: Math.min(2400, result.toYear), markers: result.markers.filter((marker) => marker.year <= 2400) }
  }, [planet, anchorYear, place.timeZone, refMonth, refDay])
  const calendar = useMemo(() => calendarScale(p.year, place.timeZone), [p.year, place.timeZone])
  const epoch = useMemo(() => zonedToUtc(place.timeZone, p.year, 7, 1), [p.year, place.timeZone])
  const drag = useRef<{ kind: 'day' | 'year'; time: number; calendar: typeof calendar; scale: typeof scale } | null>(null)
  const lastYear = useRef(p.year)
  const activePreview = !locked && preview && (preview.kind === 'day' ? showCalendar : showYears) ? preview : null
  const hasPreview = activePreview !== null
  const clearPreview = () => { clearTimeout(hidePreview.current); setPreview(null) }
  const keepPreview = () => clearTimeout(hidePreview.current)
  const leavePreview = () => { clearTimeout(hidePreview.current); hidePreview.current = setTimeout(() => setPreview(null), 120) }

  useEffect(() => () => clearTimeout(hidePreview.current), [])
  useLayoutEffect(() => {
    if (!hasPreview) return
    const dismiss = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      event.stopPropagation()
      clearTimeout(hidePreview.current)
      setPreview(null)
    }
    document.addEventListener('keydown', dismiss, true)
    return () => document.removeEventListener('keydown', dismiss, true)
  }, [hasPreview])

  useEffect(() => {
    // Follow changes from exact inputs or scroll wheels without undoing manual range navigation.
    if (lastYear.current !== p.year && !drag.current && (p.year < scale.fromYear || p.year > scale.toYear)) setAnchorYear(p.year)
    lastYear.current = p.year
  }, [p.year, scale.fromYear, scale.toYear])

  useEffect(() => {
    if (variant === 'lcd') return
    let alive = true
    loadTextures().then((result) => {
      if (!alive) return
      setAssets(result)
      if (!compact) setThumbs(renderThumbnails(result.textures, Date.now()))
    })
    return () => { alive = false }
    // Thumbnails are static representations of the same mesh factory.
  }, [compact, variant])
  useEffect(() => {
    const el = stage.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => setSize({ width: entry.contentRect.width, height: entry.contentRect.height }))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const zoom = Math.max(1, (Math.min(size.width, size.height) - 60) / (2 * sceneExtent))
  const yearRadius = radialScale(helioEcliptic(PLANET_BY_ID[planet].body, now).rho) * zoom
  const targetFromPointer = (kind: 'day' | 'year', event: PointerEvent<SVGCircleElement>) => {
    const snapshot = drag.current ?? { kind, time: selectionNow(), calendar, scale }
    const rect = stage.current?.getBoundingClientRect()
    if (!rect) return null
    const lon = Math.atan2(-(event.clientY - rect.top - rect.height / 2), event.clientX - rect.left - rect.width / 2)
    const days = showMonths ? snapshot.calendar.ticks : snapshot.calendar.ticks.slice(0, -1).filter((tick) => tick.month === civilParts(snapshot.time, place.timeZone).month)
    const selectionCalendar = showMonths ? snapshot.calendar : { ...snapshot.calendar, ticks: [...days, days[0]] }
    const target = resolveOrbit(snapshot.kind === 'day'
      ? dateAtLongitude(lon, selectionCalendar, snapshot.time)
      : yearAtLongitude(lon, snapshot.scale, snapshot.time, place.timeZone))
    const parts = civilParts(target, place.timeZone)
    const tick = snapshot.kind === 'day'
      ? snapshot.calendar.ticks.find((tick) => tick.month === parts.month && tick.day === parts.day)
      : snapshot.scale.markers.find((marker) => marker.year === parts.year)
    const snappedLon = tick?.lon ?? lon
    const radius = Number(event.currentTarget.getAttribute('r'))
    return { target, preview: {
      kind: snapshot.kind,
      unit: snapshot.kind === 'year' ? 'year' as const : showDays ? 'day' as const : 'month' as const,
      label: snapshot.kind === 'year' ? String(parts.year) : [showDays ? parts.day : '', showMonths ? MONTH_SHORT[parts.month - 1] : '', showYears ? parts.year : ''].filter((value) => value !== '').join(' '),
      x: size.width / 2 + Math.cos(snappedLon) * radius,
      y: size.height / 2 - Math.sin(snappedLon) * radius,
    } }
  }
  const movePointer = (kind: 'day' | 'year', event: PointerEvent<SVGCircleElement>, animate = false) => {
    if (kind === 'day' ? dayLocked : yearLocked) return
    const next = targetFromPointer(kind, event)
    if (!next) return
    keepPreview()
    setPreview((previous) => previous?.kind === next.preview.kind && previous.label === next.preview.label && previous.x === next.preview.x && previous.y === next.preview.y ? previous : next.preview)
    if (drag.current) choose(next.target, animate)
  }
  const pointerDown = (kind: 'day' | 'year', event: PointerEvent<SVGCircleElement>) => {
    if ((kind === 'day' ? dayLocked : yearLocked) || event.button !== 0) return
    event.preventDefault()
    event.currentTarget.focus({ preventScroll: true })
    event.currentTarget.setPointerCapture(event.pointerId)
    drag.current = { kind, time: now, calendar, scale }
    movePointer(kind, event, true)
  }
  const keyboard = (kind: 'day' | 'year', event: KeyboardEvent<SVGCircleElement>) => {
    if (kind === 'day' ? dayLocked : yearLocked) return
    const delta = ['ArrowRight', 'ArrowUp'].includes(event.key) ? 1 : ['ArrowLeft', 'ArrowDown'].includes(event.key) ? -1 : 0
    if (!delta) return
    event.preventDefault()
    clearPreview()
    const selectedTime = selectionNow()
    const selectedParts = civilParts(selectedTime, place.timeZone)
    if (kind === 'year') {
      const year = civilParts(stepPickerUnit(selectedTime, 'year', delta, place.timeZone, steps), place.timeZone).year
      if (year < scale.fromYear || year > scale.toYear) setAnchorYear(Math.min(2400, Math.max(1600, year)))
      selectOrbit(changeCivilYear(year, selectedTime, place.timeZone), true)
    } else {
      if (units && !units.includes('day')) { selectOrbit(stepPickerUnit(selectedTime, 'month', delta, place.timeZone, steps), true); return }
      const day = new Date(Date.UTC(selectedParts.year, selectedParts.month - 1, selectedParts.day + delta))
      selectOrbit(clampTime(zonedToUtc(place.timeZone, day.getUTCFullYear(), day.getUTCMonth() + 1, day.getUTCDate(), selectedParts.hour, selectedParts.minute, selectedParts.second)), true)
    }
  }
  const finish = (event: PointerEvent<SVGCircleElement>) => { drag.current = null; if (event.pointerType === 'touch') clearPreview() }
  const Dial = variant === 'lcd' ? LcdOrrery : Orrery
  return (
    <section {...part('orrery', 'orrery-control')} aria-label="Orbital date picker">
      {!compact && <div className="orbit-control-heading"><span>DAY · EARTH’S ORBIT</span><span>YEAR · {PLANET_BY_ID[planet].name.toUpperCase()}</span></div>}
      {!compact && <PlanetSelector value={planet} onChange={(next) => onPlanetChange?.(next)} thumbnails={thumbs} disabled={planetReadOnly || disabled} />}
      <div ref={stage} {...part('orbitStage', 'orrery-control-stage')} onPointerLeave={clearPreview}>
        {variant === 'lcd' || assets ? <Dial now={now} width={size.width} height={size.height} appearance={appearance} visibleBodies={compact ? visibleBodies : undefined} showMonths={showMonths} showDays={showDays} showYears={showYears} sceneExtent={sceneExtent} theme={theme} textures={assets?.textures ?? {}} calendar={calendar} yearScale={scale} yearPlanet={planet}
          onMonthSelect={dayLocked ? undefined : (month) => {
            const first = calendar.ticks.find((tick) => tick.month === month && tick.day === 1)!
            const next = month === 12 ? calendar.ticks[calendar.ticks.length - 1] : calendar.ticks.find((tick) => tick.month === month + 1 && tick.day === 1)!
            selectOrbit(dateAtLongitude(first.lon + normaliseAngle(next.lon - first.lon) / 2, calendar, selectionNow()), true)
            stage.current?.querySelector<SVGCircleElement>('.orbit-hit-day')?.focus({ preventScroll: true })
          }}
          onYearSelect={yearLocked ? undefined : (year) => {
            selectOrbit(changeCivilYear(year, selectionNow(), place.timeZone), true)
            stage.current?.querySelector<SVGCircleElement>('.orbit-hit-year')?.focus({ preventScroll: true })
          }}
          currentDayIndex={dayOfYear(p.year, p.month, p.day) - 1} currentMonth={p.month} currentYear={p.year} orbitEpochMs={epoch} />
          : <div className="loading">Loading the solar system…</div>}
        <svg className="orbit-pick-layer" width="100%" height="100%" viewBox={`0 0 ${size.width} ${size.height}`} aria-label="Select a date from the orbital scales">
          {(['day', 'year'] as const).filter((kind) => kind === 'day' ? showCalendar : showYears).map((kind) => (
            <circle key={kind} className={`orbit-hit orbit-hit-${kind}`} cx={size.width / 2} cy={size.height / 2}
              r={kind === 'day' ? CALENDAR_RADIUS * zoom : yearRadius} fill="none" stroke="transparent" strokeWidth={26}
              role="slider" tabIndex={(kind === 'day' ? dayLocked : yearLocked) ? -1 : 0} aria-disabled={kind === 'day' ? dayLocked : yearLocked}
              aria-label={kind === 'day' ? !showDays ? 'Month on Earth’s orbit' : !showMonths ? 'Day of month on Earth’s orbit' : 'Day of year on the calendar ring' : `Year on ${PLANET_BY_ID[planet].name}’s orbit`}
              aria-valuemin={kind === 'day' ? 1 : 1600} aria-valuemax={kind === 'day' ? !showDays ? 12 : !showMonths ? daysInMonth(p.year, p.month) : calendar.ticks.length - 1 : 2400}
              aria-valuenow={kind === 'day' ? !showDays ? p.month : !showMonths ? p.day : dayOfYear(p.year, p.month, p.day) : p.year}
              aria-valuetext={kind === 'day' ? `${p.day}/${p.month}/${p.year}` : String(p.year)}
              aria-describedby={activePreview?.kind === kind ? previewId : undefined}
              onPointerDown={(event) => pointerDown(kind, event)} onPointerEnter={(event) => movePointer(kind, event)} onPointerMove={(event) => movePointer(kind, event)} onPointerLeave={leavePreview}
              onPointerUp={finish} onPointerCancel={finish} onLostPointerCapture={finish}
              onKeyDown={(event) => keyboard(kind, event)} />
          ))}
          {activePreview && <circle {...part('orbitPreviewMarker', 'orbit-preview-marker', undefined, { unit: activePreview.unit })} data-kind={activePreview.kind} cx={activePreview.x} cy={activePreview.y} r={4} aria-hidden="true" />}
        </svg>
        {activePreview && <OrbitHoverPreview id={previewId} preview={activePreview} width={size.width} height={size.height} onPointerEnter={keepPreview} onPointerLeave={leavePreview} />}
      </div>
      {variant !== 'lcd' && assets && assets.failed.length > 0 && <p className="warning" role="alert">Some surface textures are unavailable. Plain 3D materials are shown.</p>}
      {showYears && <div {...part('rangeNavigation', 'orbit-range-navigation')}>
        <button type="button" {...part('rangeButton', 'chip', undefined, { direction: -1 })} aria-label="Earlier year range" disabled={anchorYear <= 1600} onClick={() => setAnchorYear(Math.max(1600, anchorYear - (Math.floor(PLANET_BY_ID[planet].periodYears) - 1)))}>←</button>
        <span {...part('rangeLabel')} aria-live="polite" aria-atomic="true">{scale.fromYear}–{Math.min(2400, scale.toYear)} · {PLANET_BY_ID[planet].name}</span>
        <button type="button" {...part('rangeButton', 'chip', undefined, { direction: 1 })} aria-label="Later year range" disabled={anchorYear >= 2400} onClick={() => setAnchorYear(Math.min(2400, anchorYear + (Math.floor(PLANET_BY_ID[planet].periodYears) - 1)))}>→</button>
      </div>}
      {!compact && <p className="picker-instruction">Click a month or year label, or drag its ring. The outer calendar selects a day; the gold orbit selects a year.</p>}
    </section>
  )
}

function OrbitHoverPreview({ id, preview, width, height, onPointerEnter, onPointerLeave }: {
  id: string; preview: OrbitPreview; width: number; height: number; onPointerEnter: () => void; onPointerLeave: () => void
}) {
  const part = usePickerParts()
  const ref = useRef<HTMLSpanElement>(null)
  const [size, setSize] = useState({ width: 100, height: 28 })
  useLayoutEffect(() => {
    const measure = () => {
      if (ref.current) setSize({ width: ref.current.offsetWidth, height: ref.current.offsetHeight })
    }
    const observer = new ResizeObserver(measure)
    observer.observe(ref.current!)
    measure()
    return () => observer.disconnect()
  }, [])
  return <span ref={ref} id={id} role="tooltip" data-kind={preview.kind} {...part('orbitPreview', 'orbit-preview', {
    left: Math.max(4, Math.min(width - size.width - 4, preview.x + 12)),
    top: Math.max(4, Math.min(height - size.height - 4, preview.y - size.height - 12)),
  }, { unit: preview.unit })} onPointerEnter={onPointerEnter} onPointerLeave={onPointerLeave}>{preview.label}</span>
}
