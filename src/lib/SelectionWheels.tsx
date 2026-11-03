import { ScrollWheel } from './ScrollWheel.js'
import { useMemo, useState } from 'react'
import type { Place } from '../astro/places.js'
import { civilParts, daysInMonth, MONTH_SHORT, zonedToUtc } from '../astro/time.js'
import { civilDateValue, selectCivilDate } from '../astro/dateSelection.js'
import { clampTime } from '../astro/selection.js'
import { useSimNow } from '../ui/hooks.js'
import { useCelestialTime } from '../sim/hooks.js'

const pad = (value: number) => String(value).padStart(2, '0')
const hours = Array.from({ length: 24 }, (_, i) => ({ value: String(i), label: pad(i) }))
const minutes = Array.from({ length: 60 }, (_, i) => ({ value: String(i), label: pad(i) }))
const months = MONTH_SHORT.map((label, i) => ({ value: String(i + 1), label }))
const years = Array.from({ length: 801 }, (_, i) => ({ value: String(1600 + i), label: String(1600 + i) }))

export function SelectionWheels({ place, date = false, time = false, day = false, disabled = false }: {
  place: Place; date?: boolean; time?: boolean; day?: boolean; disabled?: boolean
}) {
  const now = useSimNow(33)
  const { selectDate, readOnly, clock } = useCelestialTime()
  const parts = civilParts(now, place.timeZone)
  const dateValue = civilDateValue(now, place.timeZone)
  const locked = disabled || readOnly
  // Keep the day range stable throughout a gesture; changing it would move the scroll target.
  const [anchor, setAnchor] = useState(() => Number(clock.now()))
  const adjacentDays = useMemo(() => {
    if (!day) return []
    const p = civilParts(anchor, place.timeZone)
    const anchorDay = civilDateValue(anchor, place.timeZone)
    const formatter = new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', weekday: 'short', day: 'numeric', month: 'short' })
    return Array.from({ length: 731 }, (_, index) => {
      const value = new Date(Date.UTC(p.year, p.month - 1, p.day + index - 365))
      return { value: value.toISOString().slice(0, 10), label: formatter.format(value) }
    }).filter((item) => (Number(item.value.slice(0, 4)) >= 1600 && Number(item.value.slice(0, 4)) <= 2400) || item.value === anchorDay)
  }, [anchor, place.timeZone, day])
  if (day && !adjacentDays.some((item) => item.value === dateValue)) setAnchor(now)
  const days = useMemo(() => Array.from({ length: daysInMonth(parts.year, parts.month) }, (_, i) => ({ value: String(i + 1), label: pad(i + 1) })), [parts.year, parts.month])
  const chooseDatePart = (part: 'year' | 'month' | 'day', value: string) => {
    if (locked) return
    const current = { ...civilParts(clock.now(), place.timeZone), [part]: Number(value) }
    current.day = Math.min(current.day, daysInMonth(current.year, current.month))
    selectDate(clampTime(zonedToUtc(place.timeZone, current.year, current.month, current.day, current.hour, current.minute, current.second)))
  }
  const chooseTimePart = (part: 'hour' | 'minute', value: string) => {
    if (locked) return
    const current = { ...civilParts(clock.now(), place.timeZone), [part]: Number(value) }
    selectDate(clampTime(zonedToUtc(place.timeZone, current.year, current.month, current.day, current.hour, current.minute, 0)))
  }
  return <div className="picker-wheels" aria-label="Scroll to select">
    {date && <div className="picker-wheel-group" role="group" aria-label="Date wheels">
      <ScrollWheel label="Day" items={days} value={String(parts.day)} disabled={locked} onSelect={(value) => chooseDatePart('day', value)} />
      <ScrollWheel label="Month" items={months} value={String(parts.month)} disabled={locked} onSelect={(value) => chooseDatePart('month', value)} />
      <ScrollWheel label="Year" items={years} value={String(parts.year)} disabled={locked} onSelect={(value) => chooseDatePart('year', value)} />
    </div>}
    {time && <div className="picker-wheel-group" role="group" aria-label="Time wheels">
      {day && <ScrollWheel label="Day" items={adjacentDays} value={dateValue} disabled={locked} onSelect={(value) => {
        const next = selectCivilDate(value, clock.now(), place.timeZone)
        if (!locked && next !== null) selectDate(next)
      }} />}
      <ScrollWheel label="Hours" items={hours} value={String(parts.hour)} disabled={locked} onSelect={(value) => chooseTimePart('hour', value)} />
      <ScrollWheel label="Minutes" items={minutes} value={String(parts.minute)} disabled={locked} onSelect={(value) => chooseTimePart('minute', value)} />
    </div>}
  </div>
}
