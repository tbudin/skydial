import { LcdEarth } from '../render/LcdEarth.js'
import { usePickerParts, usePickerVariant } from './appearance.js'
import { useId, useRef, useState, type PointerEvent, type KeyboardEvent } from 'react'
import { EarthGlobe } from '../render/EarthGlobe.js'
import type { Place } from '../astro/places.js'
import { civilParts, zonedToUtc } from '../astro/time.js'
import { clampTime, timeFromEarthDrag } from '../astro/selection.js'
import { useCelestialClock } from '../sim/hooks.js'
import { useSimNow } from '../ui/hooks.js'
import { useTimeMotion } from './useTimeMotion.js'
import { useEarthView, type EarthPickerViewProps } from './useEarthView.js'
import { EarthViewControls } from './EarthViewControls.js'
import { pickerStep, type PickerSteps, type PickerUnit } from '../astro/picker.js'

type TimeUnit = 'hour' | 'minute' | 'second'
const defaultUnits: readonly PickerUnit[] = ['hour', 'minute']
const labels = { hour: 'Hours', minute: 'Minutes', second: 'Seconds' }
const shortLabels = { hour: 'Hr', minute: 'Min', second: 'Sec' }
const duration = { hour: 3600000, minute: 60000, second: 1000 }
const format = (n: number) => String(n).padStart(2, '0')

export function EarthTimeControl({ place, disabled = false, cameraSettings, compact = false, units = defaultUnits, steps, ...viewProps }: { place: Place; disabled?: boolean; compact?: boolean; units?: readonly PickerUnit[]; steps?: PickerSteps; cameraSettings?: ReturnType<typeof useEarthView> } & EarthPickerViewProps) {
  const part = usePickerParts()
  const variant = usePickerVariant()
  const now = useSimNow(33)
  const clock = useCelestialClock()
  const { choose, cancel, readOnly, selectionNow } = useTimeMotion()
  const timeUnits = (['hour', 'minute', 'second'] as const).filter((unit) => units.includes(unit))
  const [precision, setUnit] = useState<TimeUnit>('hour')
  const unit = timeUnits.includes(precision) ? precision : timeUnits[0] ?? 'hour'
  const hasSeconds = timeUnits.includes('second')
  const gesture = useRef<{ pointer: number; x: number; time: number; width: number; span: number; step: number } | null>(null)
  const hint = useId()
  const p = civilParts(now, place.timeZone)
  const locked = disabled || readOnly
  const ownEarth = useEarthView(place, disabled, viewProps)
  const earth = cameraSettings ?? ownEarth
  // Composed inputs preserve hidden seconds. Standalone minute editors retain
  // their whole-minute behaviour, including historical time-zone offsets.
  const timeStart = (time: number) => time - (compact || hasSeconds ? 0 : civilParts(time, place.timeZone).second * 1000) - ((time % 1000 + 1000) % 1000)
  const step = (part: TimeUnit, direction: number) => {
    if (locked) return
    setUnit(part)
    choose(timeStart(selectionNow()) + direction * duration[part] * pickerStep(part, steps))
  }
  const enter = (part: TimeUnit, value: number) => {
    if (locked) return
    const current = civilParts(selectionNow(), place.timeZone)
    if (value === current[part]) return
    choose(clampTime(zonedToUtc(place.timeZone, current.year, current.month, current.day,
      part === 'hour' ? value : current.hour, part === 'minute' ? value : current.minute, part === 'second' ? value : hasSeconds ? current.second : 0)))
  }
  const key = (event: KeyboardEvent<HTMLDivElement>) => {
    if (locked) return
    const direction = event.key === 'ArrowRight' || event.key === 'ArrowUp' ? 1 : event.key === 'ArrowLeft' || event.key === 'ArrowDown' ? -1 : 0
    if (!direction) return
    event.preventDefault()
    const arrowUnit = unit === 'hour' && timeUnits.includes('minute') ? 'minute' : unit
    const quantum = pickerStep(arrowUnit, steps)
    const increment = event.shiftKey && timeUnits.includes('hour') ? duration.hour * pickerStep('hour', steps)
      : duration[arrowUnit] * quantum * (unit === 'hour' && arrowUnit === 'minute' ? Math.ceil(15 / quantum) : 1)
    choose(timeStart(selectionNow()) + direction * increment)
  }
  const down = (event: PointerEvent<HTMLDivElement>) => {
    if (locked || event.button !== 0 || gesture.current) return
    cancel()
    const quantum = unit === 'hour' && timeUnits.includes('minute') ? 'minute' : unit
    gesture.current = { pointer: event.pointerId, x: event.clientX, time: timeStart(clock.now()), width: event.currentTarget.clientWidth, span: { hour: 1440, minute: 60, second: 1 }[unit], step: duration[quantum] * pickerStep(quantum, steps) }
    event.currentTarget.focus({ preventScroll: true })
    event.currentTarget.setPointerCapture(event.pointerId)
  }
  const end = (event: PointerEvent<HTMLDivElement>) => {
    if (gesture.current?.pointer === event.pointerId) gesture.current = null
  }
  return (
    <section {...part('earth', 'earth-time-control')} aria-label="Earth time picker">
      {!compact && <EarthViewControls place={place} settings={earth} />}
      <div {...part('earthPrecision', 'earth-precision')} role="group" aria-label="Earth drag precision" data-count={timeUnits.length}>
        {!compact && <span>Drag</span>}
        {timeUnits.map((precision) => <button key={precision} {...part('earthPrecisionButton', '', undefined, { selected: unit === precision, disabled: locked })} type="button" disabled={locked}
          aria-label={labels[precision]} aria-pressed={unit === precision} onClick={() => setUnit(precision)}><span className="earth-precision-full">{labels[precision]}</span><span className="earth-precision-short" aria-hidden="true">{shortLabels[precision]}</span></button>)}
      </div>
      <div {...part('globe', 'earth-turner')} role="slider" aria-label="Rotate Earth to set time" aria-describedby={compact ? undefined : hint}
        tabIndex={locked ? -1 : 0} aria-disabled={locked} aria-valuemin={0} aria-valuemax={hasSeconds ? 86399 : timeUnits.includes('minute') ? 1439 : 23}
        aria-valuenow={hasSeconds ? p.hour * 3600 + p.minute * 60 + p.second : timeUnits.includes('minute') ? p.hour * 60 + p.minute : p.hour} aria-valuetext={`${format(p.hour)}:${format(p.minute)}${hasSeconds ? `:${format(p.second)}` : ''}, ${p.day}/${p.month}/${p.year}, ${place.timeZone}`}
        onKeyDown={key} onPointerDown={down}
        onPointerMove={(event) => {
          const start = gesture.current
          if (!locked && start?.pointer === event.pointerId) choose(timeFromEarthDrag(start.time, event.clientX - start.x, start.width, start.span, start.step))
        }}
        onPointerUp={end} onPointerCancel={end} onLostPointerCapture={end}>
        {variant === 'lcd' ? <LcdEarth location={earth.view === 'city' ? earth.viewPlace : place} view={earth.view === 'city' ? 'observer' : 'rotation'} /> : <EarthGlobe location={earth.view === 'city' ? earth.viewPlace : place} view={earth.view === 'city' ? 'observer' : 'rotation'} cameraDistance={4.6} />}
        {earth.view === 'city' && <span {...part('reticle', 'earth-city-reticle')} aria-hidden="true" />}
        {!compact && <span className="earth-drag-hint" aria-hidden="true">{unit !== 'hour' ? `← FINE TUNE ${labels[unit].toUpperCase()} →` : earth.view === 'city' ? '← MOVE THROUGH TIME →' : '← TURN EARTH →'}</span>}
      </div>
      {!compact && <div className="earth-time-editor mono">
        {timeUnits.map((part, index) => <div key={part} className="earth-time-editor-unit">{index > 0 && <span className="time-colon" aria-hidden="true">:</span>}<TimePart label={labels[part]} value={p[part]} max={part === 'hour' ? 23 : 59} disabled={locked} active={unit === part}
          onFocus={() => setUnit(part)} onEnter={(value) => enter(part, value)} onStep={(direction) => step(part, direction)} /></div>)}
      </div>}
      {!compact && <p id={hint} className="picker-instruction">{unit === 'second' ? 'Fine control: one swipe spans 60 seconds.' : unit === 'minute' ? 'Fine control: one swipe spans 60 minutes.' : 'One swipe spans 24 hours. Choose Minutes to fine-tune.'}<br />Type a time or use − / + for exact steps.</p>}
      {!compact && <span className="picker-zone">Time in {place.name} · {place.timeZone} · 24-hour time</span>}
    </section>
  )
}

function TimePart({ label, value, max, disabled, active, onFocus, onEnter, onStep }: {
  label: string; value: number; max: number; disabled: boolean; active: boolean
  onFocus: () => void; onEnter: (value: number) => void; onStep: (direction: number) => void
}) {
  const [draft, setDraft] = useState<string | null>(null)
  const discard = useRef(false)
  return <div className="earth-time-part" data-active={active}>
    <label>
      <span className="earth-time-label">{label}</span>
      <input className="earth-time-digit" type="text" inputMode="numeric" pattern="[0-9]*" maxLength={2}
        role="spinbutton" aria-valuemin={0} aria-valuemax={max} aria-valuenow={value} autoComplete="off"
        value={draft ?? format(value)} disabled={disabled}
        onFocus={(event) => { discard.current = false; onFocus(); setDraft(format(value)); event.currentTarget.select() }}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={(event) => {
          const text = event.currentTarget.value
          if (!discard.current && /^\d{1,2}$/.test(text) && Number(text) <= max) onEnter(Number(text))
          setDraft(null)
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter') { event.preventDefault(); event.currentTarget.blur() }
          else if (event.key === 'Escape') {
            event.preventDefault()
            discard.current = true
            event.currentTarget.blur()
          } else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
            event.preventDefault()
            setDraft(null)
            onStep(event.key === 'ArrowUp' ? 1 : -1)
          }
        }} />
    </label>
    <div className="earth-time-steps">
      <button type="button" aria-label={`Decrease ${label.toLowerCase()}`} disabled={disabled} onClick={() => onStep(-1)}>−</button>
      <button type="button" aria-label={`Increase ${label.toLowerCase()}`} disabled={disabled} onClick={() => onStep(1)}>+</button>
    </div>
  </div>
}
