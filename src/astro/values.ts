import { civilParts, daysInMonth, zoneOffsetMs } from './time.js'

/** A Gregorian calendar date, independent of a time zone or instant. */
export interface CalendarDate { year: number; month: number; day: number }
/** A wall-clock reading, independent of a calendar date or time zone. */
export interface LocalTime { hour: number; minute: number; second: number; millisecond?: number }
export interface ZonedDateTime { date: CalendarDate; time: LocalTime; timeZone: string; offset?: string }
export type TimeDisambiguation = 'compatible' | 'earlier' | 'later' | 'reject'
export type CelestialValue =
  | { kind: 'date'; value: CalendarDate }
  | { kind: 'time'; value: LocalTime }
  | { kind: 'instant'; value: number }
  | { kind: 'zoned'; value: ZonedDateTime }

const pad = (n: number, width = 2) => String(n).padStart(width, '0')
const offsetCache = new Map<string, readonly number[]>()
function nearbyOffsets(wall: number, timeZone: string): readonly number[] {
  const day = Math.floor(wall / 86400000) * 86400000
  const key = `${timeZone}:${day}`
  const cached = offsetCache.get(key)
  if (cached) return cached
  const offsets = [...new Set([-172800000, -86400000, 0, 86400000, 172800000].map((delta) => zoneOffsetMs(day + delta, timeZone)))]
  if (offsetCache.size >= 2048) offsetCache.delete(offsetCache.keys().next().value!)
  offsetCache.set(key, offsets)
  return offsets
}
function validateDate(value: CalendarDate) {
  const { year, month, day } = value
  if (![year, month, day].every(Number.isInteger) || year < 1600 || year > 2400 || month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month)) throw new RangeError('Expected a Gregorian date within 1600–2400.')
}
function validateTime(value: LocalTime) {
  if (![value.hour, value.minute, value.second].every(Number.isInteger) || value.hour < 0 || value.hour > 23 || value.minute < 0 || value.minute > 59 || value.second < 0 || value.second > 59) throw new RangeError('Expected a local time within 00:00:00–23:59:59.')
  if (value.millisecond !== undefined && (!Number.isInteger(value.millisecond) || value.millisecond < 0 || value.millisecond > 999)) throw new RangeError('Milliseconds must be between 0 and 999.')
}
export function formatCalendarDate(value: CalendarDate): string {
  validateDate(value)
  return `${pad(value.year, 4)}-${pad(value.month)}-${pad(value.day)}`
}
export function parseCalendarDate(text: string): CalendarDate {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) throw new RangeError('Expected YYYY-MM-DD.')
  const [year, month, day] = text.split('-').map(Number)
  const value = { year, month, day }
  validateDate(value)
  return value
}
export function formatLocalTime(value: LocalTime, seconds = true): string {
  validateTime(value)
  return `${pad(value.hour)}:${pad(value.minute)}${seconds ? `:${pad(value.second)}${value.millisecond ? `.${pad(value.millisecond, 3)}` : ''}` : ''}`
}
export function parseLocalTime(text: string): LocalTime {
  if (!/^\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?$/.test(text)) throw new RangeError('Expected HH:mm or HH:mm:ss[.SSS].')
  const [clock, fraction] = text.split('.')
  const [hour, minute, second = 0] = clock.split(':').map(Number)
  const value = { hour, minute, second, ...(fraction ? { millisecond: Number(fraction.padEnd(3, '0')) } : {}) }
  validateTime(value)
  return value
}

/** Resolve a wall-clock time explicitly, including repeated or missing DST hours. */
export function zonedDateTimeToInstant(value: ZonedDateTime, disambiguation: TimeDisambiguation = 'compatible'): number {
  validateDate(value.date)
  validateTime(value.time)
  if (!['compatible', 'earlier', 'later', 'reject'].includes(disambiguation)) throw new RangeError('Unknown time disambiguation.')
  const { year, month, day } = value.date
  const { hour, minute, second } = value.time
  const wall = Date.UTC(year, month - 1, day, hour, minute, second, value.time.millisecond ?? 0)
  // Sampling either side discovers both offsets at a transition, including
  // half-hour transitions and a whole skipped date (e.g. Pacific/Apia).
  const candidates = nearbyOffsets(wall, value.timeZone).map((offset) => wall - offset).sort((a, b) => a - b)
  const exact = candidates.filter((candidate) => {
    const p = civilParts(candidate, value.timeZone)
    return p.year === year && p.month === month && p.day === day && p.hour === hour && p.minute === minute && p.second === second
  })
  if (value.offset !== undefined) {
    const matching = exact.find((candidate) => formatOffset(zoneOffsetMs(candidate, value.timeZone)) === (value.offset === 'Z' ? '+00:00' : value.offset))
    if (matching === undefined) throw new RangeError('The UTC offset does not match this local date, time and time zone.')
    return matching
  }
  if (exact.length === 1) return exact[0]
  if (disambiguation === 'reject') throw new RangeError(exact.length ? 'Ambiguous local time.' : 'Nonexistent local time.')
  const choices = exact.length ? exact : candidates
  return disambiguation === 'earlier' || exact.length && disambiguation === 'compatible' ? choices[0] : choices[choices.length - 1]
}
export function instantToZonedDateTime(time: Date | number, timeZone: string): ZonedDateTime {
  if (!Number.isFinite(Number(time))) throw new RangeError('Expected a valid instant.')
  const { year, month, day, hour, minute, second } = civilParts(Number(time), timeZone)
  const millisecond = (Number(time) % 1000 + 1000) % 1000
  const value = { date: { year, month, day }, time: { hour, minute, second, ...(millisecond ? { millisecond } : {}) }, timeZone, offset: formatOffset(zoneOffsetMs(Number(time), timeZone)) }
  validateDate(value.date)
  return value
}
export function formatZonedDateTime(value: ZonedDateTime): string {
  // Validate the IANA zone without choosing an offset for a potentially repeated hour.
  new Intl.DateTimeFormat('en', { timeZone: value.timeZone })
  if (value.offset !== undefined) zonedDateTimeToInstant(value)
  return `${formatCalendarDate(value.date)}T${formatLocalTime(value.time)}${value.offset ?? ''}[${value.timeZone}]`
}
export function parseZonedDateTime(text: string): ZonedDateTime {
  const match = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?)(Z|[+-]\d{2}:\d{2}(?::\d{2})?)?\[([^\]]+)\]$/.exec(text)
  if (!match) throw new RangeError('Expected YYYY-MM-DDTHH:mm:ss[Area/City].')
  const value = { date: parseCalendarDate(match[1]), time: parseLocalTime(match[2]), timeZone: match[4], ...(match[3] ? { offset: match[3] } : {}) }
  formatZonedDateTime(value)
  return value
}

function formatOffset(milliseconds: number): string {
  const total = Math.abs(milliseconds) / 1000
  const seconds = total % 60
  return `${milliseconds < 0 ? '-' : '+'}${pad(Math.floor(total / 3600))}:${pad(Math.floor(total / 60) % 60)}${seconds ? `:${pad(seconds)}` : ''}`
}

/** Stable transport representation. Dates and times never acquire a UTC offset. */
export function serializeCelestialValue(value: CelestialValue): string {
  switch (value.kind) {
    case 'date': return formatCalendarDate(value.value)
    case 'time': return formatLocalTime(value.value)
    case 'zoned': return formatZonedDateTime(value.value)
    case 'instant': {
      if (!Number.isFinite(value.value)) throw new RangeError('Expected a valid instant.')
      return new Date(value.value).toISOString()
    }
  }
}

/** Date-only and time-only values require explicit context to become an instant. */
export function celestialValueToInstant(value: CelestialValue, context: { timeZone: string; date?: CalendarDate; time?: LocalTime; disambiguation?: TimeDisambiguation }): number {
  if (value.kind === 'instant') { serializeCelestialValue(value); return value.value }
  if (value.kind === 'zoned') return zonedDateTimeToInstant(value.value, context.disambiguation)
  if (value.kind === 'time' && !context.date) throw new TypeError('A local time requires an explicit calendar date.')
  return zonedDateTimeToInstant({ date: value.kind === 'date' ? value.value : context.date!, time: value.kind === 'time' ? value.value : context.time ?? { hour: 0, minute: 0, second: 0 }, timeZone: context.timeZone }, context.disambiguation)
}
