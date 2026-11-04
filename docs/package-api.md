# Package API

Skydial exposes independent entries for form controls, celestial visuals,
astronomy, simulation and framework adapters. See the
[live documentation](https://tbudin.github.io/skydial/) for interactive examples.
Build with `npm run build:lib`; use `npm pack` to create a local installable archive.

## Entries and requirements

| Entry | Contents | Runtime dependencies |
| --- | --- | --- |
| `skydial/pickers` | Compact form field, scroll picker, stepper and shared provider | React 19, React DOM; no Three.js |
| `skydial/picker.css` | Self-contained form-control styles; inherit the host font | None |
| `skydial/react` | Clock components, provider and hook | React 19, React DOM, Three.js, React Three Fiber 9, Drei 10, Astronomy Engine |
| `skydial/astro` | Positions, orientation, observer readings, calendar scales, civil-date helpers | Astronomy Engine |
| `skydial/clock` | `SimClock`, `SPEEDS`, supported UTC bounds | None |
| `skydial/three` | Mesh factories and browser texture loader | Three.js; Astronomy Engine for the exported orientation helper |
| `skydial/style.css` | Component-scoped dark 3D style | None |
| `skydial` | Compatibility alias for the React entry | Same as `/react` |

The React and Three.js dependencies are optional peers so astronomy-only and
native-JavaScript consumers do not need the browser renderer. For React, install
`react react-dom three @react-three/fiber @react-three/drei` with compatible
versions from `package.json`. Import the stylesheet once in the host app.

## Designed celestial date/time inputs

```tsx
import { CelestialInput } from 'skydial/react'
import 'skydial/style.css'

<CelestialInput name="startsAt" label="Date" mode="date" theme="auto" defaultValue={new Date('2026-03-20T12:00:00Z')} />
<CelestialInput name="time" mode="time" precision="second" steps={{ minute: 15 }} />
<CelestialInput name="year" precision="year" planet="jupiter" />
```

Click the compact field to open an orbital calendar, scrolling columns and precise
−/+ buttons together. `CelestialInput` accepts the complete `CelestialPicker` form
API below, plus:

| Prop | Default | Behavior |
| --- | --- | --- |
| `variant` | `celestial` | `celestial` keeps textured 3D. `lcd` uses duotone SVG diagrams and segmented digits, with no WebGL context or texture requests. |
| `scene` | `auto` | `auto`, `orrery`, `earth`, `moon`, `planet`, or `false`. Auto composes only the celestial controls needed by the enabled units. |
| `interactive` | `true` | Enable direct orbital/Earth edits; false keeps the scene decorative. The optional Moon scene remains decorative. Precise controls always remain available. |
| `control` | `both` | Scrolling columns with −/+ buttons; `wheel` and editable `stepper` are alternatives. |
| `theme` | `auto` | Light, dark or system appearance for the whole popup, including orbital lines, labels and transparent scene backgrounds. |
| `planet / defaultPlanet` | `jupiter` | Year planet; Jupiter, Saturn, Uranus or Neptune. It defines the year range. Earth still defines the day. Choose the year planet in host settings; the popup has no selector. |
| Earth view props | `city` | The selected place stays centred as time changes. `earthView`, `defaultEarthView`, `onEarthViewChange`, `earthPlace`, `onEarthPlaceChange` also support free rotation. |

The orrery, Earth rotation, scrollers, steps and submitted value share the field's
clock. Earth’s revolution handles enabled calendar units, and the selected year
planet defines the year scale. Year-only inputs show the Sun and the year planet,
with no Earth, calendar ring or day badge. Calendar-only inputs omit the year
planet and its navigation. A combined input adds an Earth rotation control for time.
Exact columns and form values follow `units`/`precision`. Bounds and read-only
state apply to all selection methods. The popup omits repeated date/time headings,
planet choices and help text; accessible names remain available. Done or Escape
returns focus to the input. Opening focuses the first exact control and scrolls
it into view. Tab can leave the nonmodal popup and closes it without stealing
focus; the host page remains usable. The full solar system is available separately through
the standalone Orrery playground and CelestialDatePicker.

| Enabled units | Celestial controls |
| --- | --- |
| `year` | Sun, chosen year planet, year scale and year-range navigation |
| `month` | Earth’s orbit with month marks and a month badge |
| `day` | Earth’s orbit with the current month’s day ticks and a day badge |
| `year, month` | Year-planet scale and Earth’s month ring, without daily ticks |
| `hour, minute, second` | Earth with Hours, Minutes and Seconds precision tabs |
| `year, second` | Year-planet scale and Earth with only a Seconds precision tab |

Other combinations follow the same composition rule. Changing units removes
unrelated controls rather than leaving inactive scales in the popup. Seconds
mode maps one globe-width swipe to 60 seconds; minute mode spans 60 minutes and
hour mode spans 24 hours. Drags snap to the active precision and configured step.
LCD wheel readings use a fixed inverse centre band; the scrolling list synchronizes
before paint when another celestial control changes its value.

Hover a selectable calendar or year-planet ring to preview the value before
clicking. A marker snaps to the same tick used for selection; hovering never
changes the field. The preview follows enabled units and date bounds in both
3D and LCD. Move away or press Escape to dismiss it (a second Escape closes an
open picker). The preview remains visible while its label is hovered. Decorative
and read-only scenes do not show selection previews.

### Colour configuration

`colors?: PickerColors` is shared by `CelestialInput`, `CelestialPicker`,
`CelestialScrollPicker`, `CelestialStepper` and the four compact widgets in every
framework integration. Values accept CSS colours. Omitted keys use theme defaults.

```tsx
<CelestialInput theme="light" colors={{
  background: '#fff8ef', foreground: '#342719', muted: '#675644',
  border: '#8e7963', accent: '#684322', earthHand: '#27674d', yearHand: '#905e22',
}} />
```

| Key | Celestial style | LCD style |
| --- | --- | --- |
| `background` | Field, panel, controls and widget background | Screen |
| `foreground` | Main text and active orbit labels | All ink, diagrams, borders and inverted selections |
| `muted` | Secondary text and orbit labels | Uses foreground |
| `border` | Field, panel, control and widget borders | Uses foreground |
| `accent` | Selections, actions and keyboard focus | Uses foreground |
| `earthHand`, `yearHand` | Day/year hands and matching labels | Uses foreground |
| `orbit`, `tick`, `tickMajor` | Canvas orbit and calendar strokes | Uses foreground |

Three-dimensional planet textures keep their natural colours. LCD always uses its
two colours. `orbitalStyle.palette` overrides matching canvas colours; explicit
`style` and `styles` overrides take precedence for DOM parts. Keep contrast in
mind when choosing a custom palette.

### Duotone LCD style

```tsx
<CelestialInput variant="lcd" mode="datetime" planet="jupiter" theme="light"
  colors={{ background: '#dcebf1', foreground: '#183747' }} />
<EarthWidget variant="lcd" theme="light" size="medium" />
```

The same `variant` works with `CelestialPicker`, `CelestialScrollPicker`,
`CelestialStepper` and all four compact widgets. Light mode uses dark ink on an
olive screen; dark mode inverts the display. `theme="auto"` follows the system.
Use `colors.background` and `colors.foreground` for the screen and ink. The input
builder and widget gallery share a sticky preview header with 3D/LCD buttons,
light/dark/system appearance and one Colours panel containing palette presets and custom colour fields.
Choices persist between those pages; switching styles preserves the selected
instant. The panel exposes swatches, editable CSS colour codes and theme reset. Chosen colours are included in the generated code.
Custom colours stay fixed when changing themes; omit them to follow the theme.
The CSS variables `--lcd-paper` and `--lcd-ink` remain available.
`styles`/`classNames` still override individual elements. The `orbitalStyle`
geometry settings (stroke weights and body sizes) work in both views; its
multicolour palette belongs to the 3D view. LCD keeps its two inks.

LCD shares the calendar, planetary-year scales, input selection and form values
with 3D. Earth is an original geographic dot-matrix drawing with finer coastlines, islands,
lakes, computed rotation, observer framing and an inverse-colour night hemisphere. The
Moon has original maria, crater rims and ray markings clipped to its computed
illuminated hemisphere. Planets use distinct projected cloud belts, storms, polar
markings and layered rings; miniature dial glyphs retain recognisable features.
These surface markings are illustrative, rather than dated weather observations
or surveyed terrain. Body rotation and lunar illumination use the astronomy
engine. All artwork keeps the configured two inks. It uses SVG, no bitmap textures or WebGL.
The visual entry still imports the renderer peers; use the form-only entry when
you do not need any celestial scenes.

### Complete styling and placement

`styles` and `classNames` address every visible DOM part by stable name. Import
`PICKER_PARTS` to enumerate them, or target `[data-picker-part="field"]` in your
stylesheet. Styles accept CSS properties, CSS custom properties, or a function
receiving `{ unit, selected, disabled, direction }` when relevant. Root `style`
and `className` remain available. Styles on a part override its defaults.

LCD form readings prefer 16px and inherit the `field` or `value` part's font
size. For example, `styles={{ field: { fontSize: 14 } }}` sets the preferred text
size, including its vector digits. CSS consumers can set
`--picker-field-font-size` instead; `--picker-field-digit-gap` adjusts spacing.
Complete LCD readings stay on one line: the artwork scales down only when the
available field width requires it, and returns to the preferred size when space
allows. The full accessible value is preserved. Wheels and widget clocks retain
their independent type sizes.

```tsx
<CelestialInput
  name="appointment" planet="saturn" mode="datetime"
  popoverPlacement="bottom-end" popoverOffset={8}
  wheelRowHeight={40} wheelRows={3}
  styles={{
    field: { borderRadius: 12, fontFamily: 'inherit' },
    panel: { background: '#faf5ff', boxShadow: '0 16px 48px #31206030' },
    wheelOption: ({ selected }) => ({ color: selected ? '#7c3aed' : '#64748b' }),
    stepButton: { borderRadius: 4 },
    monthLabel: { fontSize: 11 },
  }}
  classNames={{ field: 'booking-date', panel: 'booking-picker' }}
  orbitalStyle={{ palette: { yearHand: '#7c3aed' }, handWidth: 2, bodyScale: 1.2 }}
/>
```

The named parts cover root, label, field, value, indicator, panel, content, visual,
controls, controlGroup, unit, unitLabel, wheelColumn, wheelFrame, wheel, wheelOption,
selection, stepInput, stepButtons, stepButton, footer, timezone, actions, nowButton,
clearButton, doneButton, description, error, scene, earth, earthPrecision,
earthPrecisionButton, globe, reticle, orrery, orbitStage, orbitLabels, monthLabel,
yearLabel, dateBadge, yearBadge, rangeNavigation, rangeButton, rangeLabel,
orbitPreview, orbitPreviewMarker, orbitTrack, orbitHandle, orbitMonthArc,
orbitLens and orbitLensDay.
The same control parts work with `CelestialScrollPicker` and `CelestialStepper`.

The orbital picker preserves the day when a month label is chosen, clamping to
the destination month's last day when necessary. Selection and form values
commit immediately; only the celestial illustration animates. Drags, keyboard
edits and reduced-motion selections apply directly.

Year ticks are fixed to local 1 January boundaries. Choosing another year keeps
the selected month, day and time (with leap-day clamping); refining the day moves
Earth and every other visible body to the same instant without rotating the year
scale. LCD months use `01`–`12`, including the segmented scroll selection, orbital
labels, date badge and drag magnifier. The 3D style retains abbreviated month names.

The same month/day can appear at a slightly different orbital angle in another
year. The calendar ring follows Earth's calculated position in the fixed J2000
frame: calendar years contain whole days, whereas an orbit does not. Leap years
correct that mismatch, with smaller astronomical variations also included. The
dial centre stays fixed. See [NASA's leap-day explanation](https://www.jpl.nasa.gov/edu/news/doing-the-math-on-why-we-have-leap-day/).

Focus follows the circular ring. Focused rings accept trackpad or mouse-wheel
steps without capturing ordinary page scrolling. Arrow keys use the configured
day/month/year steps, Page Up/Down jumps a month (or ten year steps), and Home/End
selects the ends of the relevant scale within the allowed date bounds. A temporary
strip magnifies nearby dates while dragging the day ring; it is a visual guide
during the captured gesture. The exact scrollers
and step controls remain available alongside the illustration.

`orbitalStyle.palette` accepts background, orbit, orbitOpacity, tick, tickMajor,
label, labelActive, earthHand and yearHand. `orbitWidth` and `tickWidth` multiply
default strokes; `handWidth` sets pixels; `bodyScale` and `sunScale` resize meshes.
Use the `orbitStage` style or `--picker-orbit-size` to resize the orbital view.
The time globe accepts the `globe` part's CSS sizes, border, shadow and background.
`--picker-earth-size` sets its viewport width (up to 230px alongside an orbital
date view, up to 260px in a time-only view); the globe fits narrower containers.

Use `wheelRowHeight` (minimum 24px) and `wheelRows` (3 or 5) to change scrolling
geometry; CSS heights alone cannot update scroll math. `--picker-unit-width` and
`--picker-year-width` set minimum column widths; columns stretch evenly within
each row. `--picker-column-gap` and `--picker-row-gap` control their spacing.
Mouse wheels, trackpads and touch swipes step directly between complete values,
without fractional scrolling behind the fixed selection band. Pinch zoom remains
available; unavailable values are skipped and external changes reset the gesture.
The popup supports `auto`,
`bottom-start`, `bottom-end`, `top-start`, and `top-end` placement. It flips when
necessary and aligns within the viewport. If neither side of the input has enough
space, the window shifts within the viewport rather than cropping its content.
Combined inputs place the orrery and Earth beside each other with all selected
units in one row below; landscape screens use a wider layout. Default scenes
adapt to the available height so the popup itself does not need scrolling.
Custom dimensions that exceed the viewport retain an accessible scroll fallback.
`--picker-panel-width` and
`--picker-panel-max-height` set its dimensions. The live builder exposes each
part's CSS properties and class name, orbit styles, scroll geometry and placement.
For a host with a sticky header, set `--picker-viewport-inset-top` to its height
(in pixels) to keep a popup below that header.

All visual integrations expose this component: React `CelestialInput`, Vue
`CelestialInput` with an options object, Svelte `component: 'input'`, and vanilla
`mountCelestial(element, 'input', options)`. Visual renderer peers are required.
The form-only entry below retains its renderer-free dependency graph.

For advanced React composition, `CelestialPicker` also accepts scene `children`
alongside its synchronized precise controls. A child should inherit the surrounding
clock instead of supplying an independent date/defaultDate/clock.

## Compact form fields and reusable controls

```tsx
import { CelestialPicker, CelestialScrollPicker, CelestialStepper } from 'skydial/pickers'
import 'skydial/picker.css'

<CelestialPicker name="startsAt" mode="datetime" required clearable theme="light" />
<CelestialPicker name="year" precision="year" control="stepper" defaultValue={new Date('2026-01-01T12:00:00Z')} />
<CelestialScrollPicker units={['year', 'month']} steps={{ year: 5 }} />
<CelestialStepper units={['day', 'hour', 'minute']} steps={{ minute: 15 }} />
```

The form-only entry does not load Three.js, Fiber or Drei. The same components
are also exported by the full React entry; Vue and DOM adapters expose them as
`CelestialPicker`, `CelestialScrollPicker`, `CelestialStepper` and component
kinds `field`, `scroll`, `stepper`. Vue, Svelte and DOM adapters retain their
existing shared visual-renderer peer requirements.

`CelestialPicker` defaults to an empty, uncontrolled field with an anchored,
non-modal popover. `value` / `onChange` control a nullable Date or UTC millisecond
value; `defaultValue` establishes an uncontrolled initial value. `onChange`
receives a complete `Date` or `null`. Without explicit value, clock or callbacks,
a field inherits a surrounding provider instead. Do not supply both `clock` and
`value`. A controlled value without `onChange` is read-only.

| Option | Default | Behavior |
| --- | --- | --- |
| `mode` | `date` | `date`, `time`, `datetime` unit presets |
| `precision` | mode default | Finest unit; `year` alone creates a year field |
| `units` | derived | Explicit ordered subset of year/month/day/hour/minute/second; overrides presets |
| `control` | `wheel` | Snapping scroll columns or editable `stepper` buttons |
| `steps` | one per unit | Per-unit increments, e.g. minute: 15, second: 10, year: 5 |
| `presentation` | `popover` | Anchored compact window or an inline element |
| `min`, `max` | supported UTC bounds | Allowed instants; partial date buckets remain selectable |
| `size` | `small` | 32px, 40px or 44px field height |
| `theme` | `dark` | `light`, `dark`, `auto` |
| `name`, `form`, `required` | unset | Native form serialization, association and validation |
| `clearable` | false | Clear a nullable field; shared clocks remain non-nullable |
| `disabled`, `readOnly` | false | Disabled values are omitted from submission; read-only values submit |
| `label`, `placeholder`, `description` | Date / Choose a value / unset | Visible field text and help |
| `labels`, `messages` | English | Unit labels and action/validation text |
| `className`, `classNames`, `style` | unset | Wrapper, field, panel, label and CSS-variable customization |

`--picker-radius`, `--picker-accent` and `--picker-font` customize the appearance
without replacing behavior. Inputs and panels default to a single 1px border
and no shadow. Override `--picker-field-border`, `--picker-panel-border` and
`--picker-panel-shadow`, or use the `field` and `panel` part styles, in either
design. Keyboard focus retains its separate visible indicator.

Scroll columns support mouse wheels, trackpads,
touch and arrows, Page Up/Down, Home/End. Step values can be typed; Enter confirms,
Escape discards and Up/Down steps. Civil day/month/year stepping preserves local
time across DST and clamps invalid month-end/leap dates. Hour/minute steps carry
through midnight. Scroll columns include an off-grid current value rather than
silently rewriting controlled data; subsequent choices use the configured slots.

A named field submits the selected civil precision: `2026`, `2026-03`,
`2026-03-20`, `12:15`, or `2026-03-20T12:15`. The observer's `place.timeZone`
defines that civil value. Callbacks retain a complete instant, preserving hidden
units. Keep the time zone alongside submitted civil values when needed. Uncontrolled
fields respond to native form reset; controlled fields reset through host state.
Required/invalid-range errors focus the field and provide an accessible message.
Popover Escape/Done returns focus; outside clicks preserve the new focus target.

The standalone `CelestialScrollPicker` and `CelestialStepper` use the existing
`date`, `defaultDate`, `clock`, `onDateChange` and provider API, alongside the same
units, precision, bounds, size, theme, labels and steps. Their values are always
complete instants. The documentation configurator exposes these options directly,
with copyable code, a real form, independent elements and an optional 3D picker.

## Independent widgets

```tsx
import { EarthClock, MoonClock, OrreryClock } from 'skydial/react'
import 'skydial/style.css'

<EarthClock />
<MoonClock defaultDate={new Date('2026-01-01T12:00:00Z')} />
<OrreryClock planet="saturn" />
```

`EarthClock` displays an observer-centred globe, civil and solar time, the
computed terminator, city lights and sunrise/sunset. `MoonClock` shows the
observer's lunar orientation and actual illumination with phase/rise/set
readings. `OrreryClock` displays planetary positions, the date hand and a
planetary year hand. `planet` accepts Jupiter, Saturn, Uranus or Neptune using
lowercase IDs.

All three accept `date`, `defaultDate`, `clock` and `place`. The dedicated
widgets accept `className` and `style` for their container. Earth and Moon
widgets and the date picker default to Greenwich; the full `CelestialClock`
app falls back to an approximate city for the browser time zone.

```tsx
const singapore = {
  name: 'Singapore', latitude: 1.2903, longitude: 103.852,
  timeZone: 'Asia/Singapore', source: 'custom' as const,
}
<EarthClock place={singapore} />
```

`place` changes are reactive. The full `CelestialClock` also supports controlled
`planet` and `place` through `onPlanetChange` and `onPlaceChange`. Reading the
host page URL, automatic device location and window diagnostics are opt-in
(`useUrl`, `useDeviceLocation`, `diagnostics`), and disabled by default.

## Optional 3D selection windows

```tsx
import { CelestialDatePicker, CelestialTimePicker, CelestialDateTimePicker } from 'skydial/react'

<CelestialDatePicker presentation="popover" includeTime={false} />
<CelestialTimePicker presentation="popover" showDay label="Time & day" />
<CelestialDateTimePicker presentation="popover" defaultPlanet="jupiter" />
```

`presentation="popover"` renders a compact date/time field. Clicking it opens a
modal window containing snapping scroll columns and the matching 3D controls.
Use a mouse wheel, trackpad, touch, click, or Up/Down, Page Up/Down, Home and End.
Selection updates the shared clock and 3D scenes live. Done, Escape or a backdrop
click closes the window and returns focus to the field. Keyboard focus stays
inside the window. The scene mounts only while open; camera choices survive
closing and reopening. Read-only values remain inspectable and disabled fields
cannot open. The initial field also supports server rendering without browser APIs.

`includeTime={false}` makes the date picker date-only: day/month/year scroll
columns and the orrery preserve the existing local time. Month/year changes
clamp dates such as 31 January or 29 February to the last valid day.
`showDay` adds an adjacent civil-day column to the standalone time picker,
covering one year either side of the opening date. Hours and minutes use 24-hour
time. Exact inputs and scrolling remain usable without WebGL.

The existing `presentation="inline"` remains the default for embedding the full
celestial controls in a page. All presentation options work through the React,
Vue, Svelte and vanilla adapters. The documentation picker page demonstrates
all three fields directly and also offers an inline example.

## 3D date selection and synchronized views

```tsx
import { CelestialProvider, CelestialDatePicker, EarthClock, MoonClock } from 'skydial/react'

<CelestialProvider defaultDate={new Date('2026-06-01T12:00:00Z')}>
  <CelestialDatePicker preview="orrery" place={singapore} />
  <EarthClock place={singapore} />
  <MoonClock place={singapore} />
</CelestialProvider>
```

Widgets inherit the nearest provider. Supplying `date`, `defaultDate`, `clock`
or `onDateChange` directly to a widget creates an explicit local time scope.
A provider without a date runs live. `defaultDate` starts paused at that exact
UTC instant. Selecting a date pauses an uncontrolled clock and preserves the
previous local hour, minute and second in the observer's time zone. Supported
UTC dates span 1600–2400. Invalid civil dates are rejected.

With the default `preview="orrery"`, selection happens through the celestial
objects themselves:

- Drag Earth horizontally to rotate it and change the time. One globe-width
  swipe advances 24 hours in Hours mode. Choose Minutes for a slower swipe
  spanning 60 minutes. Drags snap to whole minutes. Type directly into either
  time value (Enter to confirm, Escape to cancel), or use its − / + buttons
  for one-hour or one-minute steps. Crossing midnight advances the civil date.
- Touch or drag the outer calendar ring to choose a printed day. Printed month buttons choose the middle of that month; label clicks use their explicit value rather than a hit beneath the label.
- Touch or drag the gold planetary-year orbit, or click a printed year, to choose a year. Picker year marks use midnight on the selected month/day so the hand reaches that year without rebuilding the scale on every minute edit. The day/month
  and local time are retained (29 February becomes 28 February if necessary).
- Choose Jupiter (default), Saturn, Uranus or Neptune to change the year hand
  and scale. The displayed year window stays stable during selection; its
  earlier/later buttons navigate to another cycle.

Click and keyboard selections animate the bodies through astronomical time;
dragging follows the pointer. Reduced-motion users get immediate selection.
Earth's camera stays fixed while it turns in the picker, whereas the display
widget keeps the observer centred.

The Earth camera offers **Rotate Earth** and **Stay on city**. City view keeps
that city's longitude centered as time changes, with the real terminator and
city lights moving across it. The city selector includes the picker's current
place, a representative local city inferred from the browser time zone (marked
approximate), and the built-in city list. **Use my location** asks for device
coordinates only after an explicit click. An unavailable or timed-out result
retries once with a fresh high-accuracy request. Failure shows a specific message
and a clearly marked approximate city inferred from the browser time zone;
permission alone does not guarantee coordinates. City selection, retry and
manual latitude/longitude entry remain available. The Codex preview was observed
to time out even after site permission; this fallback does not claim device accuracy.

Camera location is separate from `place`: choosing a different city to look at
preserves the selected UTC instant and the clock's civil time zone. Change
`place` as well when the clock itself should use that city's local time.

Both pickers default to city view: the camera follows the selected place while
the Sun's day/night boundary moves. Set `defaultEarthView="rotation"` for a globe
that turns away from the initial place, or use `earthView` (`rotation` / `city`)
with `onEarthViewChange` to control it.
`earthPlace` and `onEarthPlaceChange` control the camera's city. Controlled view
or city props without their callback lock that setting. A read-only date can
still change camera settings; `disabled` locks every picker control.

```tsx
<CelestialTimePicker
  place={singapore}
  defaultEarthView="city"
  earthPlace={{ name: 'Paris', latitude: 48.8566, longitude: 2.3522,
    timeZone: 'Europe/Paris', source: 'city' }}
/>
```

`CelestialDateTimePicker` is an alias for the combined `CelestialDatePicker`.
`CelestialTimePicker` exposes only the rotating Earth control. Earth uses arrow
keys for 15-minute steps in Hours mode, one-minute steps in Minutes mode,
or Shift+arrow for one hour. Up/Down on either time value steps that unit. The calendar and year rings
use arrow keys for one day or one year. Planet choices support arrow, Home and
End keys. Native exact date/time inputs and the day-of-year scrubber are available
in the expandable exact-entry panel, or set `showInputs` to keep them visible.

`preview` also accepts `earth`, `moon` or `false` for the simpler exact-input
picker with an optional display preview. `label` customizes the date label;
`disabled` prevents selection. `defaultPlanet` configures an uncontrolled initial
year planet. Use `planet` with `onPlanetChange` for controlled planet selection.
A `planet` without a change callback is read-only. Standalone `OrreryClock`
also displays planet choices by default; `showPlanetSelector={false}` hides them.

For application state, use a controlled date:

```tsx
const [date, setDate] = useState(new Date('2026-06-01T12:00:00Z'))
<CelestialDatePicker date={date} onDateChange={setDate} place={singapore} />
```

`onDateChange` receives a `Date` throughout direct gestures and animated
selections. Debounce the callback if it starts expensive external work. A controlled `date` without `onDateChange` is read-only. Dates may also
be UTC millisecond numbers; pass a new value to update a controlled widget.
Do not supply both `date` and `clock`.

## Compact website widgets

```tsx
import { EarthWidget, MoonWidget, YearWidget, OrreryWidget } from 'skydial/react'

<EarthWidget size="small" place={singapore} />
<MoonWidget size="small" />
<YearWidget size="medium" planet="jupiter" />
<OrreryWidget size="large" planet="saturn" />
```

These home-screen-style cards are distinct from the full `EarthClock` and
`MoonClock` telemetry panels. Sizes are 176×176 (`small`), 368×176 (`medium`) and
368×368 (`large`), with `max-width: 100%` for narrow containers. `className` and
`style` can customize the container. The generic `CelestialWidget` accepts
`kind="earth" | "moon" | "year" | "orrery"` with the same props.

All cards share the existing per-widget/provider date APIs. The Earth card shows
civil time and a lit globe; the Moon card shows phase and illumination; the year
card uses the selected planet's 3D mesh; the orrery card shows a compact orbital
scene with full 3D planets and hands, omitting the full clock's dense scale labels.
Readings and scenes occupy separate areas; Saturn's rings fit all three sizes.
The documentation widgets page shows all four kinds directly, with inline size
controls, descriptions, synchronized observer/time controls and copyable examples.
Set `planet` in component settings (Jupiter by default). Cards never render a planet selector. The legacy `defaultPlanet` alias remains accepted. All cards accept `styles` and `classNames` for the named `WIDGET_PARTS`, plus CSS variables such as `--widget-radius`.

Paused scenes redraw on state changes. Live or accelerated scenes request frames
at roughly 30 fps while visible and stop continuous drawing while offscreen.
These are embeddable website widgets, not native iOS WidgetKit extensions.

## Compact date/time displays and bodies

`CelestialDisplay` is a read-only inline component for headers, toolbars and dashboards;
it mounts no input, picker, selector or popup. `CelestialDateDisplay` and
`CelestialTimeDisplay` set the other reading to `false` by default. `CelestialBody`
provides a standalone decorative body with a readable image name.

```tsx
import { CelestialDisplay, CelestialDateDisplay, CelestialTimeDisplay, CelestialBody } from 'skydial/react'

<CelestialDisplay
  bodies={['earth', 'moon']}
  dateFormat={{ year: 'numeric', month: '2-digit', day: '2-digit' }}
  timeFormat={{ hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }}
  place={singapore}
  variant="lcd" theme="light"
/>
<CelestialDateDisplay bodies={['jupiter']} dateFormat={{ year: 'numeric' }} />
<CelestialTimeDisplay bodies={['moon']} />
<CelestialBody body="saturn" size={32} />
```

`dateFormat` and `timeFormat` accept `Intl.DateTimeFormatOptions`, or `false` to hide
that reading. `locale` defaults to `en-GB`; the observer's `place.timeZone` always
applies. Default formats use numeric dates and 24-hour minutes in both styles.
The semantic `<time datetime>` contains the complete UTC instant. Both readings
may be hidden for a body-only composition, and `bodies={[]}` gives a text-only one.

`bodies` accepts all eight planet IDs and `moon`, in display order. Artwork uses
real computed orientation and observer-aware Earth/Moon illumination; 3D planet
lighting is illustrative. Bodies inherit the same provider/date/clock contracts
as widgets. LCD uses SVG only; each 3D body uses a demand-rendered canvas.

Displays come in `small`, `medium` and `large` typography/body sizes, with `inline`
or `stacked` layout. They wrap to their container instead of clipping. `colors`,
`style`, `styles`, `className` and `classNames` expose the same customization as
cards. `WIDGET_PARTS` lists the hooks: root, layout, content, label, value, caption,
detail, scene, bodies, body, date and time. CSS variables include
`--display-body-size`, `--display-font-size`, `--display-gap`, `--display-body-gap`,
`--display-padding` and `--display-radius`.

Vanilla and Svelte use `component: 'display'` or `'body'` with the same options;
Vue exports `CelestialDisplay` and `CelestialBody` with an `options` prop. The
widgets page includes a live settings section and copyable examples.

## Simulation and rotation

```tsx
import { SimClock } from 'skydial/clock'

const clock = new SimClock(Date.UTC(2026, 0, 1))
clock.setSpeed('day') // accelerated astronomical motion: one day per second
<EarthClock clock={clock} />
<MoonClock clock={clock} />
```

`new SimClock()` follows real time. `new SimClock(timeMs)` starts paused.
Methods: `now()`, `setTime(ms)`, `setPlaying(boolean)`, `setSpeed(id)`, `goLive()`,
`subscribe(listener)` and `getState()`. Speed IDs are `real`, `day`, `month` and
`year`. `useCelestialClock()` gives React children their provider's clock.

Real astronomical spin is deliberately slow at live speed. Accelerated playback
makes it visible. Body orientation, phase and terminator follow the selected
instant; no painted phase image or artificial constant spin replaces them.

## Three.js without React

```js
import { createPlanetObject, createSunObject, createMoonObject,
  loadCelestialTextures, applyBodyAxes } from 'skydial/three'
import { bodyAxes } from 'skydial/astro'

// Run in a browser after mounting your scene.
const assets = await loadCelestialTextures({ bodies: ['saturn', 'sun', 'moon'] })
const saturn = createPlanetObject('saturn', assets.textures)
const sun = createSunObject(assets.textures)
const moon = createMoonObject(assets.textures)
scene.add(saturn.root)
applyBodyAxes(saturn.body, bodyAxes('Saturn', Date.now()))
// Update the orientation in your own render loop.
// When removing these models:
saturn.dispose()
sun.dispose()
moon.dispose()
assets.dispose()
```

Factories do not require a renderer or DOM. Each returns `root` (translation),
`body` (rotation) and `dispose()`. Saturn includes ring-shadow uniforms; update
its world centre, radius and Sun position if moving or scaling the object.
Disposal releases owned geometry and materials; caller-supplied textures remain
owned by the caller. The Moon factory uses a unit-radius sphere; planet and Sun
sizes use the orrery's exaggerated display radii.

The optional browser texture loader loads only requested bodies and their
associated ring/normal maps, returning `textures`, `failed` and `dispose()`.
Pass `urls` overrides for a custom CDN or restrictive asset policy. Preserve
the packaged CC BY 4.0 attribution and license notice when redistributing maps.

These imperative APIs can be mounted in vanilla JavaScript, Vue, Svelte or
other frameworks. Vue components and a Svelte action are available as described below.

## Vue, Svelte and vanilla integrations

All visual integrations share the React/Three.js renderer. Install the same
renderer peers as `/react`, plus Vue or Svelte when using that integration.
These adapters do not introduce another astronomy or scene implementation.

Vue 3 components accept a typed reactive `options` prop:

```vue
<script setup>
import { ref } from 'vue'
import { CelestialDateTimePicker } from 'skydial/vue'
import 'skydial/style.css'
const date = ref(new Date('2026-06-01T12:00:00Z'))
</script>
<CelestialDateTimePicker :options="{ date, onDateChange: value => date = value }" />
```

Exports: `CelestialInput`, `CelestialPicker`, `CelestialScrollPicker`, `CelestialStepper`, `CelestialDatePicker`, `CelestialDateTimePicker`, `CelestialTimePicker`,
`CelestialWidget`, `CelestialDisplay`, `CelestialBody`, `CelestialClock`, `EarthClock`, `MoonClock`, `OrreryClock`.
The Vue components mount on the client, watch options and destroy on unmount.
Server rendering produces a host container.

Svelte 5 uses a native action with reactive options:

```svelte
<script>
import { celestial } from 'skydial/svelte'
import 'skydial/style.css'
let date = $state(new Date('2026-06-01T12:00:00Z'))
</script>
<div use:celestial={{ component: 'picker', options: { date, onDateChange: value => date = value } }}></div>
```

The action's `component` accepts `field`, `scroll`, `stepper`, `picker`, `time`, `widget`, `display`, `body`, `clock`, `earth`,
`moon` and `orrery`. It updates the existing mount, replaces it if its component
kind changes and tears down on element removal. It does not run during SSR.

For plain JavaScript and other frameworks:

```js
import { mountCelestial } from 'skydial/dom'
import 'skydial/style.css'
const view = mountCelestial(element, 'widget', { kind: 'earth', size: 'small' })
view.update({ kind: 'moon', size: 'medium' })
view.destroy()
```

`update` replaces all props while retaining unchanged component state.
`destroy` is idempotent. A host element cannot be mounted twice simultaneously.
Use `date` to update an existing selected time; `defaultDate` initializes only.

## Server and native use

`/astro` and `/clock` can be imported in Node or a native JavaScript runtime
without loading React or creating a browser canvas. `/three` model factories
also work without DOM access; loading image textures requires a compatible
client environment.

React exports preserve a `use client` boundary. Their initial markup can render
on the server; WebGL rendering and texture loading start on the client. For
matching server/client output, provide an explicit `date` or `defaultDate` and
`place`. Live time and browser-location guesses may differ across environments.

Only the 3D dark visual style is implemented. Reduced-motion preferences disable
CSS transitions/animations; accurate live celestial positions still update.
WebGL2 is required for the 3D views. Unsupported or lost contexts show a text
fallback while exact inputs and astronomical readings stay usable. Chromium,
Firefox and WebKit are exercised by the automated suite; real physical-device
verification remains manual. Code is MIT, with separate texture attribution.


## Accessibility of the form input

The trigger is labelled by the host label, and its description includes the
selected value, required/read-only state and keyboard instructions. Instructions
are available to assistive technology without adding visible copy to the popup.
Wheels use labelled listboxes with an active descendant and selected options;
steppers use labelled spinbuttons. Orbital and Earth sliders expose value text
and arrow-key edits, with exact controls providing an alternative to dragging.
Opening focuses exact controls, Done/Escape restore focus, and Tab can leave the
nonmodal popup. Required and range validation focus the field and announce the
message through an alert. No changes are applied to the host form's submission.

Default labels on the orrery have targets at least 24px in each direction.
Coarse pointers get larger step/action controls. Reduced motion removes selection
interpolation and decorative transitions. Forced-colour styles retain focus,
selected rows and borders. External field labels follow the host's text colour;
`--picker-label-color` or `styles.label` can override it. Small screens put exact
controls before the visual and let popup content scroll, with the footer visible.

See [design and accessibility review](design-accessibility.md) for tested screens,
behaviour, automated checks and limits. Custom colours/layouts require checking
again in their host page; this is not assistive-technology certification.

The LCD artwork is original code, informed by the body characteristics described
in [NASA’s Jupiter facts](https://science.nasa.gov/jupiter/jupiter-facts/),
[Neptune facts](https://science.nasa.gov/neptune/neptune-facts/) and
[ice-giant overview](https://www.nasa.gov/solar-system/examining-ice-giants-with-nasas-webb-telescope/).
No external images or map datasets are included in the LCD rendering.

## Documentation preview settings

Every page shares the 3D/LCD and appearance toolbar. The single Colours panel
contains both palette presets and editable colour values; settings persist for
the browser session. Component settings are in their own collapsible sections,
outside the rendered components. The orrery playground uses `CelestialInput`
with `presentation="inline"` and no legacy range slider.

## Overriding the default stylesheet

Skydial's CSS is a default, not a locked theme. Import it first, then your own
stylesheet. Components render in the regular document, without a shadow root.
Use `className`/`classNames`, stable `data-picker-part`/`data-widget-part` selectors,
CSS variables, or the `style`/`styles` props. Named part styles merge after defaults.
Normal CSS cascade and specificity rules apply to external stylesheets.
Colours, typography, spacing, borders, shadows and layouts are customizable in
both variants. Canvas geometry and colours use `orbitalStyle`; CSS cannot change
the pixels inside a WebGL canvas. Wheel row geometry uses `wheelRowHeight` and
`wheelRows` so the selection and scrolling stay aligned.

Decorative 3D bodies in cards, compact displays and `CelestialBody` share the
same apparent disc size, independent of their physical radius. Saturn reserves
extra room for its complete rings. Rendering quality can be budgeted with
`CelestialRenderProvider`; the astronomical views keep their existing scales.

```tsx
import 'skydial/style.css'
import './my-sky.css'

<CelestialDisplay
  className="my-sky"
  classNames={{ date: 'my-date' }}
  styles={{ label: { fontWeight: 700 } }}
/>
```

```css
.my-sky {
  --display-padding: 10px 18px;
  --display-gap: 16px;
  --display-radius: 12px;
  --widget-radius: 12px;
}
.my-sky .my-date { font-family: Georgia, serif; font-size: 20px; }
```

For standalone bodies, set `--body-background` or use a root background style.
Accessibility preferences such as reduced motion and forced colours remain
honoured by the default stylesheet.


## Scheduling additions in 0.3.0

See [the scheduling guide](scheduling.md) for the additions in 0.3.0:
`CelestialRangeInput`, `CelestialRangePicker`, `CelestialValueInput`, availability
predicates, locale/12-hour/RTL options, the renderer-free `skydial/lcd` React entry,
explicit civil and zoned value helpers, and shared 3D rendering budgets.

New `PICKER_PARTS` include `rangeTabs`, `rangeTab`, `rangeTrack`, `rangeEndpoint`,
`unavailableTrack` and `dayPeriodButton`. Range part callbacks include an
`endpoint` (`start` or `end`) alongside selected/disabled state. Ordinary CSS
can select `data-range-endpoint` too. `wheelRowHeight` is a minimum: scroll rows
expand if enlarged text needs more room, keeping exact selection geometry aligned.

The scheduling APIs require Skydial 0.3.0 or later.
