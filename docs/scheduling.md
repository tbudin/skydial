# Scheduling and explicit date values

Available in Skydial 0.3.0, alongside the existing single-value pickers and widgets.

## One window for a range

```tsx
import { CelestialRangeInput } from 'skydial/react'
import { createAvailability } from 'skydial/astro'
import 'skydial/style.css'

const availability = createAvailability({
  weekdays: [1, 2, 3, 4, 5], // Sunday = 0
  excludedDates: ['2026-12-25'],
  hours: [{ start: '09:00', end: '17:00' }],
})

<CelestialRangeInput
  name="booking"
  mode="datetime"
  place={london}
  value={range}
  onChange={setRange}
  {...availability}
  minimumDuration={30 * 60_000}
  maximumDuration={7 * 86_400_000}
  required
  clearable
/>
```

`range` is `{ start: Date | number | null, end: Date | number | null } | null`.
Start and End share one popup and one set of controls. Selection stays on the
active endpoint until the user switches it. The calendar orbit highlights the
portion of the range in its displayed year. Both visible endpoints can be focused
and activated. Other years remain accessible through the exact controls and
orbital year navigation. Year edits retain the month/day, clamping leap days.

The native form contains `booking.start` and `booking.end`; override these with
`startName` and `endName`. Values use civil ISO strings at the chosen precision,
independent of display locale. Both endpoints are required once either is chosen.
Clear removes the whole range. An uncontrolled field resets to `defaultValue`;
a controlled host can use `onReset` to update its value. Disabled fields do not
submit; read-only fields submit without allowing changes.

`minimumDuration` and `maximumDuration` count **elapsed milliseconds**. A civil
day crossing DST may contain 23 or 25 hours. Date ranges allow equal endpoints
unless a minimum duration is supplied. Endpoint selection cannot cross the other
endpoint or its duration bounds. Whole-range validation rejects unavailable
interior calendar days unless `allowsNonContiguousRanges` is true. Optional
`isRangeUnavailable({ start, end }, timeZone)` checks reservations or other
whole-interval rules. Availability is synchronous; fetch server data in the host,
then supply predicates. Revalidate bookings on the server when saving.

`CelestialRangePicker` from `skydial/pickers` provides the same form and range
behaviour with precise controls only. `presentation="inline"` displays the
selection window directly, with no date-input trigger.

## Availability

All modern picker surfaces share one selection gate: the orbit, rotating Earth,
scrolling, keyboard edits, step buttons and typed values cannot commit an
unavailable instant. Out-of-policy controlled values remain visible and invalidate
the native form; they are never silently moved to another date.

- `isDateUnavailable(date)` receives `{ year, month, day }` in the selected time
  zone, not a UTC date and not the browser's time zone.
- `isTimeUnavailable(time, date)` receives `{ hour, minute, second }` plus that
  calendar date. Callbacks should be pure and inexpensive.
- `createAvailability` composes allowed weekdays, excluded ISO dates and local
  business-hour intervals. Start is inclusive, end exclusive; overnight intervals
  such as 22:00–06:00 are supported. An empty hours array closes all times.
- Scrollers mark unavailable resulting selections and keyboard navigation skips
  them. Exact and step controls preserve other units and reject unavailable
  results. They do not silently choose a different hidden month, day or time.
- Dot-pattern orbital sections indicate unavailable dates. Hover previews identify
  unavailable targets. Printed month/year labels reflect the resulting instant.

For a range, time rules validate endpoints. Use `isRangeUnavailable` to check an
entire booked interval: an arbitrary time predicate cannot define whether an
interval crosses a reservation without the host's interval rule.

## Localization

Use `locale`, `hourCycle="h12" | "h23"` and `dir="ltr" | "rtl"`. Explicit locales
set date-column order, date/time formatting, month names and number formatting.
The default keeps the existing ISO field formatting and canonical unit order.
Twelve-hour controls include AM/PM and matching precision tabs; the hour wheel
continues through both periods so availability rules cannot trap selection in
one period. Accessible hour-option names distinguish AM from PM.

Built-in interface messages cover English, French, German, Spanish and Arabic.
Other locales use Intl date/number formatting with English interface messages;
provide `messages` and `labels` for other translations or terminology. RTL follows
the locale, with an explicit direction override. Pickers use the Gregorian
calendar, matching the astronomical calendar scales. Non-Gregorian calendar
editing is not implemented. LCD retains Latin segmented digits and numeric months;
its labels and accessible descriptions are still localized.

## Civil dates, local times, instants and zoned appointments

`CelestialInput` retains its existing `Date | number | null` API. The new
`CelestialValueInput` makes the application's value semantics explicit:

```tsx
<CelestialValueInput valueKind="date" name="birthday"
  value={{ year: 1990, month: 6, day: 15 }} onChange={setBirthday} />

<CelestialValueInput valueKind="time" name="openingTime"
  referenceDate={{ year: 2026, month: 11, day: 9 }}
  value={{ hour: 9, minute: 0, second: 0 }} onChange={setOpeningTime} />

<CelestialValueInput valueKind="instant" name="eventAt"
  value={Date.UTC(2026, 10, 9, 9)} onChange={setEventInstant} />
```

| Kind | Value | Native submission |
| --- | --- | --- |
| `date` | `CalendarDate` | `1990-06-15` |
| `time` | `LocalTime` | `09:00:00` |
| `instant` | UTC milliseconds | `2026-11-09T09:00:00.000Z` |
| `zoned` | `{ date, time, timeZone, offset? }` | `2026-11-01T01:30:00-04:00[America/New_York]` |

A civil date stays the same when the displayed time zone changes. A local time
requires an explicit reference date for its astronomical illustration; that date
is not submitted. An instant stays the same while its local display changes.
Zoned values preserve their zone; values created from an instant include its UTC
offset so the two occurrences of a repeated DST hour remain distinguishable.
Geographic coordinates remain separate from civil time zones.

Framework-free helpers in `skydial/astro` include `parseCalendarDate`,
`formatCalendarDate`, `parseLocalTime`, `formatLocalTime`, `parseZonedDateTime`,
`formatZonedDateTime`, `zonedDateTimeToInstant`, `instantToZonedDateTime`,
`celestialValueToInstant` and `serializeCelestialValue`.

DST conversion accepts `compatible` (earlier repeated hour, later missing hour),
`earlier`, `later` or `reject`. Explicit offsets must match the selected zone.
Calendar values are Gregorian and use Skydial's 1600–2400 support window. Local
and zoned time helpers preserve optional milliseconds, although picker controls
currently edit down to seconds. Host code should choose a policy for recurring
appointments separately from a single appointment's stored value.

## LCD and performance budgets

```tsx
import { CelestialInput, CelestialRangeInput, CelestialBody } from 'skydial/lcd'
import 'skydial/style.css'
```

The LCD entry requires React and React DOM, plus the package's existing Astronomy
Engine dependency. It imports no Three.js, Fiber or Drei, and fetches no bitmap
textures. All exported visual components are fixed to LCD. Use `/react` to switch
styles dynamically. Native Vue/Svelte/DOM integrations continue using the shared
full renderer; the renderer-free LCD entry is currently a React entry.

The library build checks a 65 kB gzip budget for the LCD JavaScript module graph,
excluding external React/React DOM and Astronomy Engine. The isolated consumer
build includes those dependencies and verifies that no bitmap assets are copied.
3D planet components request only their own maps and share per-texture cache
promises. Compact orbital inputs request the Sun, Earth, chosen year planet and
Saturn's rings when relevant; the full playground still uses all visible planets.

`CelestialRenderProvider` from `/react` exposes a shared `quality` (`auto`, `low`,
`high`) and `maxFps` (1–60). Default `auto` caps device pixel ratio at 1.5 for
interactive scenes and 2 for decorative body illustrations. Illustrations use
selectively loaded 2K planet maps; orbital scenes keep their smaller 1K maps.
`low` uses pixel ratio 1 and 1K planet maps and defaults to 15 fps;
`high` permits pixel ratio 2. Earth and Moon retain their panel maps in all
quality modes. Paused scenes render on
change, offscreen live canvases stop continuous drawing, and hidden documents
pause continuous drawing. These are rendering budgets, not a claim of physical
GPU or battery benchmarking.

DOM/Vue/Svelte support `range`, `rangeField` and `value` components through the
existing mount/action/options contracts. The documentation's **Ranges & scheduling**
page provides a live form, external settings and actual submitted values.
