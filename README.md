# Skydial

A package for 3D and duotone LCD astronomical clocks, Earth and Moon widgets, and date selectors
that show celestial positions. React components, Vue components, a Svelte action and a vanilla mount API
share one renderer. Astronomy, simulation time and Three.js models are also
available independently.

**Skydial 0.1.0** · [Documentation and live examples](https://tbudin.github.io/skydial/)

Install `skydial` plus the peers required by your chosen entry. The celestial
React entry needs `react react-dom three @react-three/fiber @react-three/drei`;
the form-only entry needs `react react-dom`. Astronomy and clock consumers can
install `skydial` alone.
The native mobile app remains a separate next project.

For regular website forms, use the form-only entry (React and React DOM; no
Three.js peers required):

```tsx
import { CelestialPicker, CelestialScrollPicker, CelestialStepper } from 'skydial/pickers'
import 'skydial/picker.css'

<CelestialPicker name="startsAt" mode="datetime" required clearable theme="light" />
<CelestialPicker name="year" precision="year" control="stepper" />
<CelestialScrollPicker units={['year', 'month']} />
<CelestialStepper units={['day', 'hour', 'minute']} steps={{ minute: 15 }} />
```

The field defaults to a 32px control with an anchored popover. Select units,
per-unit steps, bounds, size and theme; use standalone elements inline or share
one provider. Native form validation, submission, reset, empty values and
controlled values are supported. The documentation picker configurator exposes
these options in the UI and includes a real form with its submitted value.

The designed date/time input shows an orbital calendar, scrolling columns and −/+
steps together when opened. Light and dark themes cover the entire popup:

```tsx
import { CelestialInput } from 'skydial/react'
import 'skydial/style.css'

<CelestialInput name="startsAt" label="Date" mode="date" theme="auto" defaultValue={new Date('2026-03-20T12:00:00Z')} />
<CelestialInput name="time" mode="time" precision="second" steps={{ minute: 15 }} />
<CelestialInput name="year" precision="year" planet="jupiter" />
```

`scene="auto"` shows the Sun, Earth and one year planet (Jupiter by default). Earth’s revolution selects the day; the year planet defines the year range. Combined date/time inputs add rotating Earth for time. Set `planet` in host settings; the popup contains no planet selector or repeated date/title/help text. Use
`interactive={false}` for a decorative orbital view alongside precise controls. Optional `earth`, `moon` and `planet` scenes remain available; `scene={false}` hides the visual.
The default `control="both"` places −/+ buttons beneath the scrollers; wheel-only
and editable-stepper alternatives are available. The selected moment is shared
by the scene, controls and native form value. Use the same `CelestialInput` in Vue,
the Svelte `input` action or `mountCelestial(element, 'input', options)`.

Customize every visible element with `styles` and `classNames`, keyed by the
exported `PICKER_PARTS`. Styles can depend on selected/disabled state or unit.
Use `orbitalStyle` for canvas colours, stroke weights and body sizes;
`wheelRowHeight`/`wheelRows` for scroll geometry; and `popoverPlacement`/`popoverOffset`
for positioning. The live builder exposes these settings and exports the code.

A second style uses a duotone LCD display, vector segmented digits and flat
celestial diagrams, with the same date, time and form behaviour:

```tsx
<CelestialInput variant="lcd" mode="datetime" planet="jupiter" theme="light" />
<EarthWidget variant="lcd" theme="light" size="medium" />
```

Use `variant="celestial"` for textured 3D (the default). LCD scenes use SVG and do
not start WebGL or fetch textures. Both styles support light, dark and system
appearance. Set `colors={{ background: '#dcebf1', foreground: '#183747' }}` to
recolour the LCD display. The same `colors` option works on compact widgets and
standalone scroll/step controls. The live builders provide swatches, colour codes
and presets; [colour configuration](docs/package-api.md#colour-configuration)
lists the 3D palette options.
The visual entry still uses the documented renderer peer dependencies; the
form-only entry remains separate.

The 3D views also work inline:

```tsx
import { EarthWidget, MoonWidget, OrreryWidget, CelestialDateTimePicker } from 'skydial/react'
import 'skydial/style.css'

<CelestialDateTimePicker />
<EarthWidget size="small" />
<MoonWidget size="medium" />
<OrreryWidget size="large" />
```

Turn the 3D Earth to choose hours (crossing midnight changes the day). Touch or
drag the orrery's calendar ring to select a day, or its gold year orbit to select
a year. The visible planet selector defaults to Jupiter and also offers Saturn,
Uranus and Neptune. Click selections animate through astronomical time.

For smaller readouts in a header or toolbar:

```tsx
import { CelestialDisplay, CelestialDateDisplay, CelestialTimeDisplay, CelestialBody } from 'skydial/react'

<CelestialDisplay bodies={['earth', 'moon']} variant="lcd" theme="light" />
<CelestialDateDisplay bodies={['jupiter']} dateFormat={{ year: 'numeric' }} />
<CelestialTimeDisplay timeFormat={{ hour: '2-digit', minute: '2-digit', second: '2-digit' }} />
<CelestialBody body="saturn" size={32} />
```

These read-only displays have no input or popup. Date and time formats accept
`Intl.DateTimeFormatOptions` or `false`; `place` sets the time zone, and `bodies`
chooses any planets and the Moon. Both styles support custom colours, CSS
variables and named part styles/classes through `WIDGET_PARTS`.

Compact website widgets come in small, medium and large sizes, with Earth,
Moon, orrery and planetary-year variants. Configure `planet` through props; cards contain no selector. Each size reserves separate reading and artwork areas. Each standalone widget owns its time. Wrap widgets in `CelestialProvider` to
synchronize them. Textures ship in the package and load relative to its assets;
there is no public-folder copying step. Surface textures are mapped onto real
sphere meshes; orientation and lighting come from the astronomy calculations.

[API and examples](docs/package-api.md) · [Roadmap](docs/package-roadmap.md)

Try the **Date & time, directly** documentation page to configure form controls
and click the date input to open celestial visuals and precise controls together. The **Orrery playground** page provides a separate exploration view. **A place on your website** shows all
four widgets with visible size controls and examples.

Try the built-package playground:

```bash
npm install
npm run build:consumer
npm run preview:consumer
# http://127.0.0.1:4175/package-demo/
```

Run `npm run check` for lint, unit/server tests, both builds, consumer types and
package import/asset checks. Run `npm run test:release` for the full release
suite: archive/type validation, clean installs, documentation and three-browser
checks. `npm run test:browser` builds the consumer and runs
Chromium, Firefox and WebKit checks; install them once with `npx playwright install`.
Run `npm pack` to create a local installable archive. Code is MIT, copyright
Plain Matter Pte Ltd; texture licenses remain separate.

Run `npm run docs` for the package-site documentation on port 4323. See
[framework integrations and API](docs/package-api.md) and the
[release guide](docs/releasing.md).

## Reference clock app

An astronomical clock that tells the time from the real positions of the Sun, Earth, Moon and planets.
Look at Earth to read the date. Look at Jupiter to read the year. Look at the Sun's light on Earth to read the hour.

Live: https://celestial-clock.vercel.app

## Using it

Each reading has one colour and one hand, and the hand ends in a window showing the value:

| Reading | Colour | Where to look |
| --- | --- | --- |
| Hour | blue | Earth panel: the hand on the 24-hour dial (noon at the top) |
| Day and month | green | Orrery: the hand from the Sun through Earth to the calendar ring |
| Year | gold | Orrery: the hand from the Sun through the selected planet to its year scale |

The strip at the top repeats the four readings and names the body each one comes from.

- **Earth panel:** the globe faces your location (green ring, always centred). The terminator comes from the Sun's computed direction. The 24-hour dial has noon at the top and a numeral for every hour: the blue hand is civil time, the gold dot is local apparent solar time, the gold arc is daylight (sunrise to sunset).
- **Moon panel:** the Moon as it stands in your sky, zenith up. Phase, the angle of the bright limb, libration and northern/southern-hemisphere orientation all come from the geometry.
- **Orrery:** green hand Sun → Earth → calendar ring reads the date; gold hand Sun → planet reads the year. Choose Jupiter, Saturn, Uranus or Neptune for the year hand.
- **Location:** uses your device location only if permission is already granted (or you tap "Use my location"). Otherwise it uses a representative city for your time zone and labels it "Approximate". You can pick a city or type coordinates. Civil time follows the location's time zone; custom coordinates keep the current zone.

### URL options

| Parameter | Example | Effect |
| --- | --- | --- |
| `view` | `full` (default), `ambient`, `orrery`, `earth`, `moon` | Which parts to show. `ambient` is a full-screen display with no controls. |
| `lat`, `lon` | `lat=51.5074&lon=-0.1278` | Observer location |
| `tz` | `Europe/London` | Time zone for civil time and the calendar |
| `name` | `London` | Label for the location |
| `planet` | `saturn` | Year-hand planet |
| `t` | `2026-03-20T14:46:00Z` | Start paused at this instant |

Embed in any site:

```html
<iframe src="https://celestial-clock.vercel.app/?view=orrery" style="width:100%;aspect-ratio:1;border:0;background:#04070d"></iframe>
```

The site is installable (web app manifest): "Add to Home Screen" on iOS/Android or "Install" in desktop Chrome opens straight into ambient mode.

## Develop

```bash
npm install
npm run dev
npm test             # astronomy, geometry, models and component tests
npm run build        # site, to dist/
npm run build:lib    # packages, to dist-lib/
```

Visual and alignment check (Python Playwright, headless Chromium with software WebGL):

```bash
npm run build && npx vite preview --port 4173 &
python3 scripts/visual-check.py http://localhost:4173/ screenshots
```

It captures phone (390 × 844), tablet (768 × 1024) and desktop (1440 × 900) screenshots, measures alignment in screen pixels from the rendered objects via `window.__celestialClock.verify()`, checks the hands' readings on known dates (leap day, equinox, solstice, 1969, 2100), renders the Earth and Moon panels for Singapore, London, New York and Sydney, and exercises location permission (granted, denied), city choice and playback.

## Architecture

| Module | Path | Depends on |
| --- | --- | --- |
| Astronomy core | `src/astro/` | astronomy-engine only (no React, no Three) |
| Clock geometry | `src/geometry/projection.ts` | astronomy core |
| Simulation clock | `src/sim/clock.ts` | nothing |
| 3D renderer | `src/render/` | Three.js, React Three Fiber |
| UI | `src/ui/`, `src/App.tsx` | everything above |

### Package entries

See [the package API](docs/package-api.md) for the component, astronomy,
simulation-clock and Three.js entries. The native app can reuse `/astro` and
`/clock` without React, Three.js, DOM access or browser assets.

### How alignment is guaranteed

One projection maps heliocentric ecliptic longitude λ and in-plane distance ρ to the scene: `(f(ρ)·cos λ, 0, −f(ρ)·sin λ)`. Planets, orbit paths, hands, calendar ticks, year ticks and labels all go through it. `f` is a monotone cubic radial compression, so angles are exact and orbits never cross. The orrery camera is orthographic, straight down the ecliptic pole.

The Earth and Moon panels work in the J2000 equatorial frame: each body carries its IAU orientation, the camera sits where the observer is, and the only light is the Sun's computed direction. Nothing about phase or terminator is drawn by hand.

### Calendar and year scales

- **Calendar ring:** a tick at Earth's longitude at each local midnight (365 or 366 days). Not uniform: early-January days are about 7% wider than July days. Recomputed per year and time zone.
- **Year scale:** the planet's longitude on 1 January of each year, starting at the current year and running forward, always shorter than one orbit, so each position maps to one year (Jupiter 2026 to 2036, Saturn to 2054, Uranus to 2109, Neptune to 2189). Jupiter labelled every year, Saturn every 5, Uranus every 10, Neptune every 20, with yearly minor ticks.

### Labels never overlap

All orrery labels live in one DOM layer above the canvas and are placed every frame by `src/geometry/labelLayout.ts`. Each label offers candidate positions; a position is used only if it stays inside the orrery and clears every placed label, the Sun, every planet (Saturn including its rings) and both hands. The hand windows are placed first and always shown; a scale label with no free position is hidden until one frees up. The visual check reads the real label boxes from the page and fails on any overlap, including in samples taken during fast playback for every year planet at phone and desktop sizes.

## Accuracy

- Ephemeris: [Astronomy Engine](https://github.com/cosinekitty/astronomy) (VSOP87 for planets, about 1 arcminute; its lunar theory for the Moon).
- Orientation: IAU WGCCRE 2015 rotation models. For Earth this simplified model is about 0.5° from the full precession-nutation model, which shifts the globe by about 1 to 2 px at panel size.
- Tested: Earth at equinoxes and solstices (within 0.02°); equinox and solstice times (within 2 min); five oppositions (within 1°); London sunrise and sunset on the 2026 solstice (within 2 min); polar night in Tromsø; equation of time; full and new Moon dates; the rendered bright limb against Meeus' bright-limb and parallactic-angle formulas in four cities (within 0.6°).
- Supported range: years 1600 to 2400.
- Not shown: ecliptic latitude in the orrery (the top-down view flattens it), atmospheric refraction in the Moon view, real-time clouds.

This is a clock, not an observatory tool.

## Known limitations

- Planet sizes are enlarged and distances compressed; only directions are to scale.
- The night-side city lights date from NASA's 2000s composite.
- Device location uses the browser's time zone for civil time.
- Three.js is about 190 kB gzipped; it is split into its own cached chunk.

## Credits

Textures: Solar System Scope (CC BY 4.0) and NASA Earth at night (public domain). See `public/textures/ATTRIBUTION.md`.
