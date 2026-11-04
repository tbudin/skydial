import { LcdOrrery } from '../render/LcdOrrery.js'
import { useContext, useEffect, useEffectEvent, useId, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import type { Place } from '../astro/places.js'
import { PLANET_BY_ID, type PlanetId, type YearPlanetId } from '../astro/bodies.js'
import { calendarScale, yearScale } from '../astro/clockScales.js'
import { civilParts, dayOfYear, zonedToUtc } from '../astro/time.js'
import { changeCivilYear, dateAtLongitude, yearAtLongitude } from '../astro/selection.js'
import { helioEcliptic, normaliseAngle } from '../astro/ephemeris.js'
import { CALENDAR_RADIUS, SCENE_EXTENT, radialScale } from '../geometry/projection.js'
import { PickerAppearanceContext, usePickerParts, usePickerVariant } from './appearance.js'
import { pickerColorPalette } from './colors.js'
import type { OrreryAppearance } from '../render/orreryTypes.js'
import { useVisualRenderer } from '../render/visualRenderer.js'
import { usePickerLocale } from './localization.js'
import { PlanetSelector } from '../ui/PlanetSelector.js'
import { useSimNow, useVisualNow } from '../ui/hooks.js'
import { useTimeMotion } from './useTimeMotion.js'
import { useCelestialTime } from '../sim/hooks.js'
import type { RangeSelection } from './rangeSelection.js'
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
  rangeSelection?: RangeSelection
}

interface OrbitPreview {
  kind: 'day' | 'year'
  unit: 'day' | 'month' | 'year'
  label: string
  x: number
  y: number
  unavailable?: boolean
}

export function OrreryControl({ place, planet, onPlanetChange, planetReadOnly, disabled, theme, units, steps, min, max, compact = false, appearance: customAppearance, rangeSelection }: Props) {
  const part = usePickerParts()
  const variant = usePickerVariant()
  const renderer = useVisualRenderer()
  const i18n = usePickerLocale()
  const { colors } = useContext(PickerAppearanceContext)
  const appearance = useMemo(() => ({ ...customAppearance, palette: { ...pickerColorPalette(colors), ...customAppearance?.palette } }), [colors, customAppearance])
  const now = useSimNow(33)
  const visualNow = useVisualNow(33)
  const p = civilParts(now, place.timeZone)
  const [anchorYear, setAnchorYear] = useState(p.year)
  const [thumbs, setThumbs] = useState<Partial<Record<YearPlanetId, string>>>({})
  const stage = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ width: 500, height: 500 })
  const { choose, readOnly, selectionNow } = useTimeMotion()
  const { canSelectDate } = useCelestialTime()
  const previewId = useId()
  const hintsId = useId()
  const [preview, setPreview] = useState<OrbitPreview | null>(null)
  const [focused, setFocused] = useState<'day' | 'year' | null>(null)
  const [dragging, setDragging] = useState<'day' | 'year' | null>(null)
  const wheel = useRef({ kind: '', delta: 0, at: 0 })
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
  const scale = useMemo(() => {
    // January boundaries stay fixed while Earth refines the day. All bodies and
    // hands still follow the complete selected instant between those boundaries.
    const result = yearScale(planet, anchorYear, place.timeZone)
    return { ...result, toYear: Math.min(2400, result.toYear), markers: result.markers.filter((marker) => marker.year <= 2400) }
  }, [planet, anchorYear, place.timeZone])
  const calendar = useMemo(() => calendarScale(p.year, place.timeZone), [p.year, place.timeZone])
  const epoch = useMemo(() => zonedToUtc(place.timeZone, p.year, 7, 1), [p.year, place.timeZone])
  const drag = useRef<{ kind: 'day' | 'year'; time: number; calendar: typeof calendar; scale: typeof scale; offset?: number } | null>(null)
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
    renderer?.thumbnails?.().then((result) => { if (alive && !compact) setThumbs(result) })
    return () => { alive = false }
    // Thumbnails are static representations of the same mesh factory.
  }, [compact, variant, renderer])
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
    const snapshot = drag.current ?? { kind, time: selectionNow(), calendar, scale, offset: 0 }
    const rect = stage.current?.getBoundingClientRect()
    if (!rect) return null
    const lon = Math.atan2(-(event.clientY - rect.top - rect.height / 2), event.clientX - rect.left - rect.width / 2) + (snapshot.offset ?? 0)
    const days = showMonths ? snapshot.calendar.ticks : snapshot.calendar.ticks.slice(0, -1).filter((tick) => tick.month === civilParts(snapshot.time, place.timeZone).month)
    const selectionCalendar = showMonths ? snapshot.calendar : { ...snapshot.calendar, ticks: [...days, days[0]] }
    const target = resolveOrbit(!drag.current && event.currentTarget.classList.contains('orbit-handle-target') ? snapshot.time : snapshot.kind === 'day'
      ? dateAtLongitude(lon, selectionCalendar, snapshot.time)
      : yearAtLongitude(lon, snapshot.scale, snapshot.time, place.timeZone))
    const parts = civilParts(target, place.timeZone)
    const tick = snapshot.kind === 'day'
      ? snapshot.calendar.ticks.find((tick) => tick.month === parts.month && tick.day === parts.day)
      : snapshot.scale.markers.find((marker) => marker.year === parts.year)
    const snappedLon = tick?.lon ?? lon
    const radius = kind === 'day' ? CALENDAR_RADIUS * zoom : yearRadius
    return { target, preview: {
      kind: snapshot.kind,
      unavailable: canSelectDate ? !canSelectDate(target) : false,
      unit: snapshot.kind === 'year' ? 'year' as const : showDays ? 'day' as const : 'month' as const,
      label: snapshot.kind === 'year' ? String(parts.year) : [showDays ? variant === 'lcd' ? String(parts.day).padStart(2, '0') : parts.day : '', showMonths ? variant === 'lcd' ? String(parts.month).padStart(2, '0') : new Intl.DateTimeFormat(i18n.locale, { month: 'short', calendar: 'gregory', timeZone: 'UTC' }).format(new Date(Date.UTC(2000, parts.month - 1, 1))) : '', showYears ? parts.year : ''].filter((value) => value !== '').join(variant === 'lcd' ? '/' : ' '),
      x: size.width / 2 + Math.cos(snappedLon) * radius,
      y: size.height / 2 - Math.sin(snappedLon) * radius,
    } }
  }
  const movePointer = (kind: 'day' | 'year', event: PointerEvent<SVGCircleElement>, animate = false) => {
    if (kind === 'day' ? dayLocked : yearLocked) return
    const next = targetFromPointer(kind, event)
    if (!next) return
    keepPreview()
    setPreview((previous) => previous?.kind === next.preview.kind && previous.label === next.preview.label && previous.x === next.preview.x && previous.y === next.preview.y && previous.unavailable === next.preview.unavailable ? previous : next.preview)
    if (drag.current) choose(next.target, animate)
  }
  const pointerDown = (kind: 'day' | 'year', event: PointerEvent<SVGCircleElement>) => {
    if ((kind === 'day' ? dayLocked : yearLocked) || event.button !== 0) return
    event.preventDefault()
    const slider = stage.current!.querySelector<SVGCircleElement>(`.orbit-hit-${kind}`)!
    slider.focus({ preventScroll: true })
    slider.setPointerCapture(event.pointerId)
    const rect = stage.current!.getBoundingClientRect()
    const pointerAngle = Math.atan2(-(event.clientY - rect.top - rect.height / 2), event.clientX - rect.left - rect.width / 2)
    const selectedAngle = kind === 'day' ? calendar.ticks[dayOfYear(p.year, p.month, p.day) - 1].lon
      : scale.markers.find((marker) => marker.year === p.year)?.lon ?? helioEcliptic(PLANET_BY_ID[planet].body, now).lon
    drag.current = { kind, time: selectionNow(), calendar, scale, offset: event.currentTarget.classList.contains('orbit-handle-target') ? selectedAngle - pointerAngle : 0 }
    setDragging(kind)
    movePointer(kind, event)
  }
  const keyboard = (kind: 'day' | 'year', event: KeyboardEvent<SVGCircleElement>) => {
    if (kind === 'day' ? dayLocked : yearLocked) return
    const delta = ['ArrowRight', 'ArrowUp'].includes(event.key) ? 1 : ['ArrowLeft', 'ArrowDown'].includes(event.key) ? -1 : 0
    const page = event.key === 'PageUp' ? -1 : event.key === 'PageDown' ? 1 : 0
    const edge = event.key === 'Home' ? -1 : event.key === 'End' ? 1 : 0
    if (!delta && !page && !edge) return
    event.preventDefault()
    clearPreview()
    const selectedTime = selectionNow()
    const selectedParts = civilParts(selectedTime, place.timeZone)
    if (edge) {
      const target = kind === 'year' ? changeCivilYear(edge < 0 ? 1600 : 2400, selectedTime, place.timeZone)
        : zonedToUtc(place.timeZone, selectedParts.year, showMonths ? edge < 0 ? 1 : 12 : selectedParts.month,
          edge < 0 ? 1 : daysInMonth(selectedParts.year, showMonths ? 12 : selectedParts.month), selectedParts.hour, selectedParts.minute, selectedParts.second)
      selectOrbit(target, false)
      return
    }
    if (page) {
      selectOrbit(stepPickerUnit(selectedTime, kind === 'year' ? 'year' : showMonths ? 'month' : 'day', page * (kind === 'year' ? 10 : showMonths ? 1 : 7), place.timeZone, steps), false)
      return
    }
    if (kind === 'year') {
      const year = civilParts(stepPickerUnit(selectedTime, 'year', delta, place.timeZone, steps), place.timeZone).year
      if (year < scale.fromYear || year > scale.toYear) setAnchorYear(Math.min(2400, Math.max(1600, year)))
      selectOrbit(changeCivilYear(year, selectedTime, place.timeZone), false)
    } else {
      selectOrbit(stepPickerUnit(selectedTime, showDays ? 'day' : 'month', delta, place.timeZone, steps), false)
    }
  }
  const finish = (event: PointerEvent<SVGCircleElement>) => { drag.current = null; setDragging(null); if (event.pointerType === 'touch') clearPreview() }
  const scrollOrbit = useEffectEvent((event: WheelEvent) => {
    if (event.ctrlKey || event.metaKey || event.altKey) return
    const target = event.target instanceof Element ? event.target.closest<SVGCircleElement>('[data-orbit-kind]') : null
    const kind = target?.dataset.orbitKind
    // A passing scroll over the illustration must still scroll the host page.
    if (!target || kind !== 'day' && kind !== 'year' || !document.activeElement?.classList.contains(`orbit-hit-${kind}`) || (kind === 'day' ? dayLocked : yearLocked)) return
    event.preventDefault()
    const at = event.timeStamp
    if (wheel.current.kind !== kind || at - wheel.current.at > 240) wheel.current = { kind, delta: 0, at }
    wheel.current.at = at
    wheel.current.delta += (event.deltaY || event.deltaX) * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 100 : 1)
    const count = Math.max(-4, Math.min(4, Math.trunc(wheel.current.delta / 40)))
    if (!count) return
    wheel.current.delta -= count * 40
    clearPreview()
    selectOrbit(stepPickerUnit(selectionNow(), kind === 'year' ? 'year' : showDays ? 'day' : 'month', count, place.timeZone, steps), false)
  })
  useEffect(() => {
    const element = stage.current!
    element.addEventListener('wheel', scrollOrbit, { passive: false })
    return () => element.removeEventListener('wheel', scrollOrbit)
  }, [])
  const dayRadius = CALENDAR_RADIUS * zoom
  const hitWidth = showCalendar && showYears ? Math.max(6, Math.min(44, Math.abs(dayRadius - yearRadius) - 4)) : 44
  const showLens = !dayLocked && showDays && dragging === 'day'
  const monthArc = useMemo(() => {
    if (!showMonths) return ''
    const first = calendar.ticks.find((tick) => tick.month === p.month && tick.day === 1)!
    const last = calendar.ticks.find((tick) => tick.month === p.month + 1 && tick.day === 1) ?? calendar.ticks[calendar.ticks.length - 1]
    const span = normaliseAngle(last.lon - first.lon)
    return Array.from({ length: 33 }, (_, i) => {
      const angle = first.lon + span * i / 32
      return `${i ? 'L' : 'M'}${size.width / 2 + Math.cos(angle) * (dayRadius - 3)},${size.height / 2 - Math.sin(angle) * (dayRadius - 3)}`
    }).join(' ')
  }, [calendar, p.month, dayRadius, size.width, size.height, showMonths])
  const Dial = variant === 'lcd' ? LcdOrrery : renderer?.Orrery
  const dayTime = (index: number) => {
    const tick = calendar.ticks[index]
    return zonedToUtc(place.timeZone, p.year, tick.month, tick.day, p.hour, p.minute, p.second)
  }
  const arc = (ticks: readonly { lon: number }[], radius: number) => ticks.map((tick, index) => `${index ? 'L' : 'M'}${size.width / 2 + Math.cos(tick.lon) * radius},${size.height / 2 - Math.sin(tick.lon) * radius}`).join(' ')
  const rangeStart = rangeSelection?.value?.start
  const rangeEnd = rangeSelection?.value?.end
  const startParts = rangeStart == null ? null : civilParts(Number(rangeStart), place.timeZone)
  const endParts = rangeEnd == null ? null : civilParts(Number(rangeEnd), place.timeZone)
  const selectedTicks = startParts && endParts && Number(rangeStart) <= Number(rangeEnd) ? calendar.ticks.filter((tick) => {
    const day = Date.UTC(p.year, tick.month - 1, tick.day)
    return day >= Date.UTC(startParts.year, startParts.month - 1, startParts.day) && day <= Date.UTC(endParts.year, endParts.month - 1, endParts.day)
  }) : []
  const yearRangePath = useMemo(() => {
    if (showCalendar || rangeStart == null || rangeEnd == null) return ''
    const lower = Math.max(Number(rangeStart), zonedToUtc(place.timeZone, scale.fromYear, 1, 1))
    const upper = Math.min(Number(rangeEnd), zonedToUtc(place.timeZone, scale.toYear + 1, 1, 1))
    if (upper <= lower) return ''
    return Array.from({ length: 65 }, (_, index) => {
      const position = helioEcliptic(PLANET_BY_ID[planet].body, lower + (upper - lower) * index / 64)
      const radius = radialScale(position.rho) * zoom - 10
      return `${index ? 'L' : 'M'}${size.width / 2 + Math.cos(position.lon) * radius},${size.height / 2 - Math.sin(position.lon) * radius}`
    }).join(' ')
  }, [showCalendar, rangeStart, rangeEnd, place.timeZone, scale.fromYear, scale.toYear, planet, zoom, size.width, size.height])
  return (
    <section {...part('orrery', 'orrery-control', { '--orbit-day-color': appearance.palette.earthHand, '--orbit-year-color': appearance.palette.yearHand } as import('react').CSSProperties)} aria-label={i18n.messages.orbit}>
      {!compact && <div className="orbit-control-heading"><span>DAY · EARTH’S ORBIT</span><span>YEAR · {PLANET_BY_ID[planet].name.toUpperCase()}</span></div>}
      {!compact && <PlanetSelector value={planet} onChange={(next) => onPlanetChange?.(next)} thumbnails={thumbs} disabled={planetReadOnly || disabled} />}
      <div ref={stage} {...part('orbitStage', 'orrery-control-stage')} data-dragging={dragging ?? undefined} onPointerLeave={clearPreview}
        onBlurCapture={(event) => { if (!(event.relatedTarget instanceof Node) || !event.currentTarget.contains(event.relatedTarget)) setFocused(null) }}>
        {Dial ? <Dial now={visualNow} width={size.width} height={size.height} appearance={appearance} visibleBodies={compact ? visibleBodies : undefined} showMonths={showMonths} showDays={showDays} showYears={showYears} sceneExtent={sceneExtent} theme={theme} calendar={calendar} yearScale={scale} yearPlanet={planet}
          isMonthUnavailable={(month) => canSelectDate ? !canSelectDate(resolveOrbit(stepPickerUnit(selectionNow(), 'month', month - p.month, place.timeZone))) : false}
          isYearUnavailable={(year) => canSelectDate ? !canSelectDate(resolveOrbit(changeCivilYear(year, selectionNow(), place.timeZone))) : false}
          onMonthSelect={dayLocked ? undefined : (month) => {
            selectOrbit(stepPickerUnit(selectionNow(), 'month', month - civilParts(selectionNow(), place.timeZone).month, place.timeZone), true)
            stage.current?.querySelector<SVGCircleElement>('.orbit-hit-day')?.focus({ preventScroll: true })
          }}
          onYearSelect={yearLocked ? undefined : (year) => {
            selectOrbit(changeCivilYear(year, selectionNow(), place.timeZone), true)
            stage.current?.querySelector<SVGCircleElement>('.orbit-hit-year')?.focus({ preventScroll: true })
          }}
          currentDayIndex={dayOfYear(p.year, p.month, p.day) - 1} currentMonth={p.month} currentYear={p.year} orbitEpochMs={epoch} />
          : <div className="loading" role="status">{i18n.messages.loading}</div>}
        <svg className="orbit-pick-layer" width="100%" height="100%" viewBox={`0 0 ${size.width} ${size.height}`} aria-label={i18n.messages.selectOrbit}>
          {showCalendar && selectedTicks.length > 1 && <path {...part('rangeTrack', 'orbit-selected-range')} d={arc(selectedTicks, dayRadius - 10)} aria-hidden="true" />}
          {!showCalendar && yearRangePath && <path {...part('rangeTrack', 'orbit-selected-range')} d={yearRangePath} aria-hidden="true" />}
          {showCalendar && canSelectDate && calendar.ticks.slice(0, -1).map((tick, index) => !canSelectDate(dayTime(index)) && <path key={index} {...part('unavailableTrack', 'orbit-unavailable')} d={arc([tick, calendar.ticks[index + 1]], dayRadius)} aria-hidden="true" />)}
          {showCalendar && monthArc && <path {...part('orbitMonthArc', 'orbit-month-arc')} d={monthArc} aria-hidden="true" />}
          {(['day', 'year'] as const).filter((kind) => kind === 'day' ? showCalendar : showYears).map((kind) => {
            const angle = kind === 'day' ? calendar.ticks[dayOfYear(p.year, p.month, p.day) - 1].lon : helioEcliptic(PLANET_BY_ID[planet].body, now).lon
            const radius = kind === 'day' ? dayRadius : yearRadius
            return <g key={kind} className="orbit-interaction" data-kind={kind}>
              <circle {...part('orbitTrack', 'orbit-focus-ring', undefined, { unit: kind, disabled: kind === 'day' ? dayLocked : yearLocked })} cx={size.width / 2} cy={size.height / 2} r={kind === 'day' ? dayRadius : yearRadius} aria-hidden="true" />
              <circle className={`orbit-hit orbit-hit-${kind}`} data-orbit-kind={kind} cx={size.width / 2} cy={size.height / 2}
                r={kind === 'day' ? dayRadius : yearRadius} fill="none" stroke="transparent" strokeWidth={hitWidth}
                role="slider" tabIndex={(kind === 'day' ? dayLocked : yearLocked) ? -1 : 0} aria-disabled={kind === 'day' ? dayLocked : yearLocked}
                aria-label={kind === 'day' ? !showDays ? i18n.messages.monthOrbit : i18n.messages.dayOrbit : i18n.messages.yearOrbit.replace('{planet}', PLANET_BY_ID[planet].name)}
                aria-valuemin={kind === 'day' ? 1 : 1600} aria-valuemax={kind === 'day' ? !showDays ? 12 : !showMonths ? daysInMonth(p.year, p.month) : calendar.ticks.length - 1 : 2400}
                aria-valuenow={kind === 'day' ? !showDays ? p.month : !showMonths ? p.day : dayOfYear(p.year, p.month, p.day) : p.year}
                aria-valuetext={kind === 'day' ? new Intl.DateTimeFormat(i18n.locale, { timeZone: place.timeZone, calendar: 'gregory', dateStyle: 'full' }).format(now) : String(p.year)}
                aria-describedby={[`${hintsId}-${kind}`, activePreview?.kind === kind ? previewId : ''].filter(Boolean).join(' ')}
                onFocus={() => { setFocused(kind); wheel.current = { kind, delta: 0, at: 0 } }}
                onPointerDown={(event) => pointerDown(kind, event)} onPointerEnter={(event) => movePointer(kind, event)} onPointerMove={(event) => movePointer(kind, event)} onPointerLeave={leavePreview}
                onPointerUp={finish} onPointerCancel={finish} onLostPointerCapture={finish}
                onKeyDown={(event) => keyboard(kind, event)} />
              <g {...part('orbitHandle', 'orbit-selection-handle', undefined, { unit: kind, selected: focused === kind, disabled: kind === 'day' ? dayLocked : yearLocked })} transform={`translate(${size.width / 2 + Math.cos(angle) * radius},${size.height / 2 - Math.sin(angle) * radius})`} aria-hidden="true"><circle className="orbit-handle-disc" r={kind === 'year' ? 9 : 6} />{kind === 'day' && <circle className="orbit-handle-dot" r="2" />}</g>
              {!(kind === 'day' ? dayLocked : yearLocked) && <circle className="orbit-handle-target" data-orbit-kind={kind} cx={size.width / 2 + Math.cos(angle) * radius} cy={size.height / 2 - Math.sin(angle) * radius} r="22" aria-hidden="true"
                onPointerDown={(event) => pointerDown(kind, event)} onPointerEnter={(event) => movePointer(kind, event)} onPointerMove={(event) => movePointer(kind, event)} onPointerLeave={leavePreview} />}
            </g>
          })}
          {rangeSelection && (['start', 'end'] as const).map((endpoint) => {
            const instant = rangeSelection.value?.[endpoint]
            if (instant == null) return null
            const date = civilParts(Number(instant), place.timeZone)
            if (showCalendar ? date.year !== p.year : date.year < scale.fromYear || date.year > scale.toYear) return null
            const tick = calendar.ticks[dayOfYear(date.year, date.month, date.day) - 1]
            const position = helioEcliptic(PLANET_BY_ID[planet].body, Number(instant))
            const angle = showCalendar ? tick.lon : position.lon
            const radius = (showCalendar ? dayRadius : radialScale(position.rho) * zoom) - 10
            return <g key={endpoint} {...part('rangeEndpoint', 'orbit-range-endpoint', undefined, { selected: rangeSelection.active === endpoint, endpoint })} data-range-endpoint={endpoint} role="button" tabIndex={0} aria-pressed={rangeSelection.active === endpoint}
              aria-label={`${i18n.messages[endpoint]}: ${new Intl.DateTimeFormat(i18n.locale, { timeZone: place.timeZone, dateStyle: 'long', calendar: 'gregory' }).format(Number(instant))}`}
              transform={`translate(${size.width / 2 + Math.cos(angle) * radius},${size.height / 2 - Math.sin(angle) * radius})`}
              onClick={() => rangeSelection.activate(endpoint)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); rangeSelection.activate(endpoint) } }}>
              <circle r="18" fill="transparent" stroke="none" /><circle r={endpoint === 'start' ? 5 : 7} className="orbit-range-point" />
            </g>
          })}
          {activePreview && <circle {...part('orbitPreviewMarker', 'orbit-preview-marker', undefined, { unit: activePreview.unit, disabled: activePreview.unavailable })} data-kind={activePreview.kind} data-unavailable={activePreview.unavailable || undefined} cx={activePreview.x} cy={activePreview.y} r={4} aria-hidden="true" />}
        </svg>
        {activePreview && <OrbitHoverPreview id={previewId} preview={activePreview} width={size.width} height={size.height} onPointerEnter={keepPreview} onPointerLeave={leavePreview} />}
        {showLens && <div {...part('orbitLens', 'orbit-date-lens')} aria-hidden="true">
          {(size.width < 250 ? [-1, 0, 1] : [-2, -1, 0, 1, 2]).map((offset) => {
            const target = resolveOrbit(stepPickerUnit(now, 'day', offset, place.timeZone, steps, { min, max }))
            const date = civilParts(target, place.timeZone)
            const unavailable = offset !== 0 && target === now
            return <span key={offset} {...part('orbitLensDay', 'orbit-lens-day', undefined, { unit: 'day', selected: offset === 0, disabled: unavailable })}
              data-selected={offset === 0} data-unavailable={unavailable || undefined}><span>{variant === 'lcd' ? String(date.month).padStart(2, '0') : new Intl.DateTimeFormat(i18n.locale, { month: 'short', calendar: 'gregory', timeZone: 'UTC' }).format(new Date(Date.UTC(2000, date.month - 1, 1)))}</span><strong>{date.day}</strong></span>
          })}
        </div>}
      </div>
      <span id={`${hintsId}-day`} className="picker-sr-only">{i18n.messages.dayHint}</span>
      <span id={`${hintsId}-year`} className="picker-sr-only">{i18n.messages.yearHint}</span>
      {showYears && <div {...part('rangeNavigation', 'orbit-range-navigation')}>
        <button type="button" {...part('rangeButton', 'chip', undefined, { direction: -1 })} aria-label={i18n.messages.earlier} disabled={anchorYear <= 1600} onClick={() => setAnchorYear(Math.max(1600, anchorYear - (Math.floor(PLANET_BY_ID[planet].periodYears) - 1)))}>←</button>
        <span {...part('rangeLabel', 'orbit-range-caption')} aria-live="polite" aria-atomic="true"><span className="orbit-range-years">{scale.fromYear}–{Math.min(2400, scale.toYear)}</span><span className="orbit-range-planet">{PLANET_BY_ID[planet].name}</span></span>
        <button type="button" {...part('rangeButton', 'chip', undefined, { direction: 1 })} aria-label={i18n.messages.later} disabled={anchorYear >= 2400} onClick={() => setAnchorYear(Math.min(2400, anchorYear + (Math.floor(PLANET_BY_ID[planet].periodYears) - 1)))}>→</button>
      </div>}
      {!compact && <p className="picker-instruction">Click a month or year label, or drag its ring. The outer calendar selects a day; the gold orbit selects a year.</p>}
    </section>
  )
}

function OrbitHoverPreview({ id, preview, width, height, onPointerEnter, onPointerLeave }: {
  id: string; preview: OrbitPreview; width: number; height: number; onPointerEnter: () => void; onPointerLeave: () => void
}) {
  const part = usePickerParts()
  const { messages } = usePickerLocale()
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
  return <span ref={ref} id={id} role="tooltip" data-kind={preview.kind} data-unavailable={preview.unavailable || undefined} {...part('orbitPreview', 'orbit-preview', {
    left: Math.max(4, Math.min(width - size.width - 4, preview.x + 12)),
    top: Math.max(4, Math.min(height - size.height - 4, preview.y - size.height - 12)),
  }, { unit: preview.unit, disabled: preview.unavailable })} onPointerEnter={onPointerEnter} onPointerLeave={onPointerLeave}>{preview.label}{preview.unavailable ? ` · ${messages.unavailable}` : ''}</span>
}
