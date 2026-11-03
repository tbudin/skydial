import type { Place } from '../astro/places.js'
import { calendarScale, yearScale as makeYearScale } from '../astro/clockScales.js'
import { civilParts, dayOfYear, zonedToUtc } from '../astro/time.js'
import type { YearPlanetId } from '../astro/bodies.js'
import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { PLANETS, PLANET_BY_ID } from '../astro/bodies.js'
import { helioEcliptic, normaliseAngle } from '../astro/ephemeris.js'
import { MONTH_SHORT } from '../astro/time.js'
import { CALENDAR_RADIUS, SCENE_EXTENT, radialScale, sampleOrbit } from '../geometry/projection.js'
import { layoutLabels, radialCandidates, type LabelRequest } from '../geometry/labelLayout.js'
import { usePickerParts } from '../lib/appearance.js'
import type { OrreryProps, LabelSpec } from './Orrery.js'
import { LcdPlanetGlyph } from './LcdPlanetGlyph.js'

type Props = Omit<OrreryProps, 'textures' | 'diagnostics'> & { now: number; width: number; height: number }

/** The same ephemeris and scales as the 3D dial, drawn with two inks in SVG. */
export function LcdOrrery({ now, width, height, calendar, yearScale, yearPlanet, currentDayIndex, currentMonth, currentYear,
  orbitEpochMs, onMonthSelect, onYearSelect, compact = false, visibleBodies, appearance, showMonths = true, showDays = true, showYears = true, sceneExtent = SCENE_EXTENT,
}: Props) {
  const part = usePickerParts()
  const host = useRef<HTMLDivElement>(null)
  const [sizes, setSizes] = useState<Record<string, { w: number; h: number }>>({})
  const zoom = Math.max(1, (Math.min(width, height) - (compact ? 20 : 60)) / (2 * sceneExtent))
  const showCalendar = showMonths || showDays
  const cx = width / 2
  const cy = height / 2
  const point = (lon: number, r: number) => ({ x: cx + Math.cos(lon) * r * zoom, y: cy - Math.sin(lon) * r * zoom })
  const visibleKey = (visibleBodies ?? PLANETS.map((p) => p.id)).join(',')
  const paths = useMemo(() => PLANETS.filter((p) => visibleKey.split(',').includes(p.id)).map((planet) => {
    const values = sampleOrbit(planet.body, planet.periodYears, orbitEpochMs, 360)
    const points = []
    for (let i = 0; i < values.length; i += 3) points.push(`${(cx + values[i] * zoom).toFixed(1)},${(cy + values[i + 2] * zoom).toFixed(1)}`)
    return { id: planet.id, points: points.join(' ') }
  }), [orbitEpochMs, visibleKey, cx, cy, zoom])
  const bodies = PLANETS.filter((p) => visibleKey.split(',').includes(p.id)).map((planet) => {
    const pos = helioEcliptic(planet.body, now)
    return { ...planet, ...point(pos.lon, radialScale(pos.rho)), lon: pos.lon, radius: radialScale(pos.rho) }
  })
  const earth = helioEcliptic('Earth', now)
  const yearPosition = helioEcliptic(PLANET_BY_ID[yearPlanet].body, now)
  const year = { ...yearPosition, radius: radialScale(yearPosition.rho) }
  const eTip = point(earth.lon, CALENDAR_RADIUS)
  const yTip = point(year.lon, year.radius + 0.2)
  const bodyScale = Math.max(0.1, appearance?.bodyScale ?? 1)
  const specs = useMemo(() => {
    if (compact) return []
    const day = calendar.ticks[currentDayIndex]?.day ?? 1
    const labels: LabelSpec[] = []
    if (showCalendar) labels.push({ id: 'date-pill', kind: 'date-pill', text: showDays ? `${String(day).padStart(2, '0')}${showMonths ? `/${String(currentMonth).padStart(2, '0')}` : ''}` : String(currentMonth).padStart(2, '0'), lon: 0, radius: CALENDAR_RADIUS })
    if (showYears) labels.push({ id: 'year-pill', kind: 'year-pill', text: String(currentYear ?? yearScale.fromYear), lon: 0, radius: 0 })
    for (let m = 1; showMonths && m <= 12; m++) {
      const start = calendar.ticks.find((t) => t.month === m && t.day === 1)!
      const end = m === 12 ? calendar.ticks[calendar.ticks.length - 1] : calendar.ticks.find((t) => t.month === m + 1 && t.day === 1)!
      labels.push({ id: `m${m}`, kind: 'month', text: String(m).padStart(2, '0'), value: m, active: m === currentMonth,
        lon: start.lon + normaliseAngle(end.lon - start.lon) / 2, radius: CALENDAR_RADIUS })
    }
    for (const marker of showYears ? yearScale.markers : []) {
      if (marker.major && marker.year !== currentYear) labels.push({ id: `y${marker.year}`, kind: 'year', text: String(marker.year), value: marker.year,
        lon: marker.lon, radius: radialScale(helioEcliptic(PLANET_BY_ID[yearPlanet].body, marker.startMs).rho) })
    }
    return labels
  }, [compact, calendar, currentDayIndex, currentMonth, currentYear, yearScale, yearPlanet, showMonths, showDays, showYears, showCalendar])
  useLayoutEffect(() => {
    const measure = () => {
      const next: typeof sizes = {}
      host.current?.querySelectorAll<HTMLElement>('[data-label]').forEach((el) => { next[el.dataset.label!] = { w: el.offsetWidth, h: el.offsetHeight } })
      setSizes((old) => JSON.stringify(old) === JSON.stringify(next) ? old : next)
    }
    const observer = new ResizeObserver(measure)
    host.current?.querySelectorAll('[data-label]').forEach((el) => observer.observe(el))
    measure()
    let active = true
    document.fonts?.ready.then(() => { if (active) measure() }).catch(() => {})
    return () => { active = false; observer.disconnect() }
  }, [specs])
  const direction = (lon: number) => ({ x: Math.cos(lon), y: -Math.sin(lon) })
  const requests: LabelRequest[] = specs.map((s) => {
    const { w, h } = sizes[s.id] ?? { w: Math.max(24, s.text.length * 7 + 8), h: 24 }
    const badge = s.kind.endsWith('pill')
    const anchor = s.kind === 'date-pill' ? eTip : s.kind === 'year-pill' ? yTip : point(s.lon, s.radius)
    const dir = direction(s.kind === 'date-pill' ? earth.lon : s.kind === 'year-pill' ? year.lon : s.lon)
    return { id: s.id, w, h, priority: badge ? 0 : s.kind === 'month' ? 1 : 2, pinned: badge,
      candidates: [...radialCandidates(anchor, dir, badge ? [6, 16] : [8], w, h, [0, 10, -10, 20, -20]),
        ...(s.kind === 'year' ? radialCandidates(anchor, { x: -dir.x, y: -dir.y }, [8], w, h, [0, 10, -10]) : [])] }
  })
  const placed = layoutLabels(requests, {
    discs: [{ x: cx, y: cy, r: 12 }, ...bodies.map((p) => ({ x: p.x, y: p.y, r: (p.id === 'earth' ? 6 : 11) * bodyScale }))],
    segs: [...(showCalendar ? [{ x0: cx, y0: cy, x1: eTip.x, y1: eTip.y, half: 2 }] : []), ...(showYears ? [{ x0: cx, y0: cy, x1: yTip.x, y1: yTip.y, half: 2 }] : [])],
  }, { x0: 2, y0: 2, x1: width - 2, y1: height - 2 })

  const ticks = (which: 'major' | 'minor') => calendar.ticks.slice(0, -1).filter((t) => (showMonths || t.month === currentMonth) && (showDays || t.day === 1) && (t.day === 1) === (which === 'major')).map((t) => {
    const a = point(t.lon, CALENDAR_RADIUS)
    const b = point(t.lon, CALENDAR_RADIUS - (t.day === 1 ? 0.2 : 0.06))
    return `M${a.x},${a.y}L${b.x},${b.y}`
  }).join('')
  return <div ref={host} className="orrery-stage lcd-orrery" data-renderer="lcd" data-visible-bodies={visibleKey.replaceAll(',', ' ')}>
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%" aria-hidden="true" focusable="false" fill="none" stroke="currentColor">
      {paths.map((path) => <polyline key={path.id} points={path.points} strokeWidth={appearance?.orbitWidth ?? 1} strokeDasharray={path.id === yearPlanet ? '3 3' : undefined} />)}
      {!compact && showCalendar && <>
        <circle cx={cx} cy={cy} r={CALENDAR_RADIUS * zoom} strokeWidth={appearance?.tickWidth ?? 1} />
        <path d={ticks('minor')} strokeWidth={appearance?.tickWidth ?? 1} />
        <path d={ticks('major')} strokeWidth={1.5 * (appearance?.tickWidth ?? 1)} />
      </>}
      {!compact && showYears && <>
        {yearScale.markers.map((m) => {
          const r = radialScale(helioEcliptic(PLANET_BY_ID[yearPlanet].body, m.startMs).rho)
          const a = point(m.lon, r - (m.major ? 0.12 : 0.06)); const b = point(m.lon, r + (m.major ? 0.12 : 0.06))
          return <path key={m.year} d={`M${a.x},${a.y}L${b.x},${b.y}`} />
        })}
      </>}
      {showCalendar && <path d={`M${cx},${cy}L${eTip.x},${eTip.y}`} strokeWidth={appearance?.handWidth ?? 1.5} />}
      {showYears && <path d={`M${cx},${cy}L${yTip.x},${yTip.y}`} strokeDasharray="4 2" strokeWidth={appearance?.handWidth ?? 1.5} />}
      <circle cx={cx} cy={cy} r={7 * Math.max(0.1, appearance?.sunScale ?? 1)} className="lcd-paper-fill" strokeWidth="2" />
      <circle cx={cx} cy={cy} r="2" fill="currentColor" />
      {bodies.map((body) => <g key={body.id} data-lcd-body={body.id} transform={`translate(${body.x},${body.y}) scale(${bodyScale})`}>
        <LcdPlanetGlyph body={body.id} />
      </g>)}
    </svg>
    <div {...part('orbitLabels', 'label-layer')} aria-hidden={onMonthSelect || onYearSelect ? undefined : true}>
      {specs.map((s, index) => {
        const pos = placed[index]
        const select = s.kind === 'month' && onMonthSelect ? () => onMonthSelect(s.value!) : s.kind === 'year' && onYearSelect ? () => onYearSelect(s.value!) : undefined
        const Element = select ? 'button' : 'span'
        return <Element key={s.id} type={select ? 'button' : undefined} onClick={select} tabIndex={select && pos.visible ? 0 : -1}
          aria-hidden={select && !pos.visible ? true : undefined} aria-label={select ? s.kind === 'month' ? `Select ${MONTH_SHORT[s.value! - 1]} ${calendar.year}` : `Select year ${s.value}` : undefined}
          data-label={s.id} data-kind={s.kind} data-longitude={s.lon} data-visible={String(pos.visible)}
          {...part(s.kind === 'month' ? 'monthLabel' : s.kind === 'year' ? 'yearLabel' : s.kind === 'date-pill' ? 'dateBadge' : 'yearBadge', `scale-label ${s.kind}${s.active ? ' active' : ''}`,
            { transform: `translate3d(${pos.cx - pos.w / 2}px, ${pos.cy - pos.h / 2}px, 0)` }, { selected: s.active })}>{s.text}</Element>
      })}
    </div>
  </div>
}


export function LcdCompactOrrery({ now, place, planet }: { now: number; place: Place; planet: YearPlanetId }) {
  const host = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ width: 300, height: 300 })
  const p = civilParts(now, place.timeZone)
  const calendar = useMemo(() => calendarScale(p.year, place.timeZone), [p.year, place.timeZone])
  const scale = useMemo(() => makeYearScale(planet, p.year, place.timeZone), [planet, p.year, place.timeZone])
  useLayoutEffect(() => {
    const observer = new ResizeObserver(([entry]) => setSize({ width: entry.contentRect.width, height: entry.contentRect.height }))
    if (host.current) observer.observe(host.current)
    return () => observer.disconnect()
  }, [])
  return <div ref={host} style={{ width: '100%', height: '100%' }}><LcdOrrery compact now={now} {...size} calendar={calendar} yearScale={scale} yearPlanet={planet}
    currentDayIndex={dayOfYear(p.year, p.month, p.day) - 1} currentMonth={p.month} currentYear={p.year}
    orbitEpochMs={zonedToUtc(place.timeZone, p.year, 7, 1)} /></div>
}
