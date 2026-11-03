import { widgetGallery, mountWidgetGallery } from './widgetGallery.js'
import { pickerGallery, mountPickerGallery } from './pickerGallery.js'
let mounted
let generation = 0
async function show(state, main) {
  const ticket = ++generation
  mounted?.destroy()
  mounted = undefined
  const host = main.querySelector('[data-demo]')
  if (!host) return
  const runtime = await import(new URL('../runtime/runtime.js', import.meta.url))
  const { mountCelestial } = runtime
  if (ticket !== generation || !host.isConnected) return
  const options = {
    ...(host.dataset.demo === 'input' ? { defaultValue: new Date('2026-03-20T12:00:00Z'), mode: 'datetime', presentation: 'inline', label: 'Date and time' } : { defaultDate: new Date('2026-03-20T12:00:00Z') }), defaultPlanet: state.planet ?? 'jupiter',

    ...(host.dataset.demo === 'widget' ? { kind: state.kind ?? 'earth', size: state.size ?? 'medium' } : {}),
  }
  const instance = mountCelestial(host, host.dataset.demo, { ...options, ...runtime.getPreviewAppearance() })
  const unsubscribe = runtime.subscribePreviewSettings(() => instance.update({ ...options, ...runtime.getPreviewAppearance() }))
  mounted = { destroy: () => { unsubscribe(); instance.destroy() } }
}
async function showWidgets(_state, main) {
  const ticket = ++generation
  mounted?.destroy()
  mounted = undefined
  const runtime = await import(new URL('../runtime/runtime.js', import.meta.url))
  if (ticket !== generation || !main.isConnected) return
  mounted = mountWidgetGallery(main, runtime)
}
async function showPickers(_state, main) {
  const ticket = ++generation
  mounted?.destroy()
  mounted = undefined
  const runtime = await import(new URL('../runtime/runtime.js', import.meta.url))
  if (ticket !== generation || !main.isConnected) return
  mounted = mountPickerGallery(main, runtime)
}
async function showOrrery(_state, main) {
  const ticket = ++generation
  mounted?.destroy()
  mounted = undefined
  const runtime = await import(new URL('../runtime/runtime.js', import.meta.url))
  if (ticket !== generation || !main.isConnected) return
  mounted = runtime.mountOrreryPlayground(main.querySelector('[data-orrery-playground]'))
}
const preview = (kind) => `<div class="celestial-demo" data-demo="${kind}"><p class="celestial-doc-placeholder">A real 3D celestial ${kind === 'picker' ? 'date and time picker' : 'website widget'} loads here. Positions, illumination and rotation are computed from the selected moment. Exact date and time controls remain available without WebGL.</p></div>`
const css = `import 'skydial/style.css'`

const definitions = [
  {
    id: 'start', group: 'Start', title: 'A small universe. In your hands.',
    description: 'Interactive 3D date and time pickers, compact celestial widgets and shared astronomy for React, Vue, Svelte and vanilla JavaScript.',
    lead: 'Turn Earth to choose a time. Touch its orbital calendar to select a day. Follow Jupiter, Saturn, Uranus or Neptune to choose a year. These are real sphere meshes with surface maps, astronomical orientation and computed illumination—not phase pictures or decorative constant spins.',
    hidePlay: true, before: () => preview('input'), onShow: show,
    code: () => `import { CelestialInput } from 'skydial/react'\n${css}\n\n<CelestialInput presentation="inline" mode="datetime" planet="jupiter" />`,
    after: () => '<p>Install the package and the visual renderer peers: <code>npm install skydial react react-dom three @react-three/fiber @react-three/drei</code>. Astronomy-only and simulation consumers need no renderer peers. Each widget owns its time unless an explicit provider or clock synchronizes it.</p>',
    faq: [{ q: 'Are these native iPhone widgets?', a: 'These are compact website cards with home-screen proportions. A native mobile app is a separate project.' }, { q: 'What does the year hand mean?', a: 'The selected planet points along a scale calibrated to real positions on 1 January of successive years. Jupiter is the default. The displayed cycle removes the ambiguity of repeated revolutions.' }],
  },
  {
    id: 'picker', group: 'Components', title: 'Date & time, directly',
    description: 'Compact date and time inputs open celestial bodies, scrolling columns and precise steps together. Customize the complete light or dark picker.',
    lead: 'A small input in your form. A celestial experience when you open it. Earth’s revolution selects the day, one chosen planet defines the year range, and Earth’s rotation sets the time. Scrollers and precise −/+ controls share the same picker. Choose the year planet and style every element in settings. Use the header to compare 3D and LCD, switch light or dark appearance, and choose colours. Configure the picker’s units and behaviour below.',
    hidePlay: true, before: pickerGallery, onShow: showPickers,
    ref: [['CelestialInput', 'celestial form input', 'Celestial scenes, scrolling columns and exact steps together. scene, interactive, planet and complete form configuration.'], ['CelestialPicker', 'form field', 'Compact popover or inline control; nullable value/defaultValue/onChange; name, form, required, clearable and reset support.'], ['CelestialScrollPicker', 'standalone', 'Reusable native scrolling columns with date/defaultDate/onDateChange or a shared provider.'], ['CelestialStepper', 'standalone', 'Editable units with civil −/+ steps, keyboard support and date rollover.'], ['units / precision', 'date', 'Select any date/time units, including year-only; precision is a convenient finest-unit shorthand.'], ['steps', '1', 'Per-unit increments, including minutes, seconds and years.'], ['min / max', '1600–2400', 'Allowed instants; partial years/months remain selectable when they intersect the range.'], ['variant', 'celestial', 'Textured 3D or a duotone LCD display with flat diagrams and segmented digits.'], ['colors', 'theme defaults', 'Background, text, accent, borders and orbital colours. LCD uses background and foreground as its two inks.'], ['size / theme', 'small / dark', '32px, 40px or 44px fields; light, dark or system themes.'], ['styles / classNames', '—', 'Style every named DOM part, including selected and disabled states. PICKER_PARTS lists the hooks.'], ['orbitalStyle', '—', 'Canvas palette, stroke weights and planet/Sun sizes.'], ['popoverPlacement / popoverOffset', 'auto / 6', 'Preferred alignment and gap, with viewport collision handling.'], ['wheelRowHeight / wheelRows', 'size / 3', 'Scroll geometry; three or five visible rows.'], ['disabled / readOnly', 'false', 'Lock interaction; read-only fields still submit their form value.'], ['place', 'Greenwich', 'Civil-time zone and observer.']],
    after: () => '<p>The form field submits a civil value at the configured precision: a year, year-month, date, time or combined date/time. onChange receives a complete Date or null; hidden units are preserved. Required and range validation integrate with the host form. Controlled fields reset through the host; uncontrolled fields reset to defaultValue. Scroll controls support mouse wheels, trackpads, touch and keyboard input. The 3D components remain available as CelestialDatePicker and CelestialTimePicker, with Jupiter as the default year planet.</p>',

  },
  {
    id: 'widgets', group: 'Components', title: 'A place on your website',
    description: 'Embed compact Earth, Moon, planetary-year and solar-system widgets in small, medium and large home-screen-style website cards.',
    lead: 'Four small windows into the sky. Explore each widget below, try its three sizes, and copy the component into your website. Use the header to switch between textured 3D and duotone LCD, choose colours and change appearance. Every view responds to the moment you choose.',
    hidePlay: true, before: widgetGallery, onShow: showWidgets,
    ref: [['kind', 'earth', 'earth, moon, year or orrery'], ['size', 'small', '176×176, 368×176 or 368×368; constrained by the container width.'], ['date / defaultDate', 'live', 'Controlled or initially paused time.'], ['clock', 'independent', 'Explicit SimClock for synchronization.'], ['planet', 'jupiter', 'Year-hand planet, set through component settings.'], ['styles / classNames', '—', 'Customize every named widget part.'], ['dateFormat / timeFormat', 'Intl options', 'Compact displays accept any Intl date/time format, or false to hide a reading.'], ['bodies', 'earth, moon', 'Compact displays accept any planets and the Moon in display order.'], ['className / style', '—', 'Container customization.']],
    after: () => '<p>Convenience exports include EarthWidget, MoonWidget, YearWidget and OrreryWidget. Full telemetry panels remain available as EarthClock and MoonClock. Configure the year planet through props; cards contain no dropdown. CelestialDisplay, CelestialDateDisplay, CelestialTimeDisplay and CelestialBody provide smaller building blocks with configurable formats and bodies. Paused scenes redraw on changes; live scenes stop continuous drawing while offscreen.</p>',
  },
  {
    id: 'orrery', group: 'Components', title: 'Orrery playground',
    description: 'An interactive solar system to explore dates and planetary years independently of a form input or website widget.',
    lead: 'Explore the orbital calendar on its own. Click month and year labels, drag the calendar ring or follow a planet through its year. Jupiter is the default; choose another planet to change the scale.',
    hidePlay: true, before: () => '<div data-orrery-playground></div>', onShow: showOrrery,

    after: () => '<p>This is the standalone exploration view. For a compact field opening a designed date/time picker with scrollers, use CelestialInput. For small website cards, explore A place on your website.</p>',
  },
  {
    id: 'react', group: 'Frameworks', title: 'React',
    description: 'React components, controlled dates and explicit provider scopes for independent or synchronized astronomical widgets.',
    lead: 'Import components from the React entry and the stylesheet once in your application. Components preserve a client boundary for server-component frameworks; initial text can render on the server. Supply an explicit date and place for deterministic server/client output.',
    render: () => preview('widget'), onShow: show,
    code: () => `import { CelestialProvider, CelestialDateTimePicker, EarthWidget, MoonWidget } from 'skydial/react'\n${css}\n\n<CelestialProvider defaultDate={new Date('2026-06-01T12:00:00Z')}>\n  <CelestialDateTimePicker />\n  <EarthWidget />\n  <MoonWidget />\n</CelestialProvider>`,
    after: () => '<p>A nested provider isolates time. Passing date, defaultDate or clock to an individual widget creates a local scope. Controlled dates without onDateChange are read-only. Selection callbacks may fire throughout gestures and animation; debounce callbacks that start expensive external work.</p>',
  },
  {
    id: 'vue', group: 'Frameworks', title: 'Vue 3',
    description: 'Typed Vue 3 components with reactive options, controlled dates and clean lifecycle teardown using the shared visual renderer.',
    lead: 'Vue components accept one typed options object. Changes to that object update the mounted component, and unmounting releases its scene. Callbacks in options, including onDateChange and onPlanetChange, connect the picker to Vue state.',
    render: () => preview('widget'), onShow: show,
    code: () => `<script setup>\nimport { ref } from 'vue'\nimport { CelestialDateTimePicker } from 'skydial/vue'\n${css}\nconst date = ref(new Date('2026-06-01T12:00:00Z'))\n</script>\n\n<CelestialDateTimePicker :options="{ date, onDateChange: value => date = value }" />`,
    after: () => '<p>The Vue adapter mounts the shared React/Three.js renderer inside a Vue-owned container. Install Vue plus the same visual renderer peers as React. It does not contain a second astronomy or scene implementation. Server rendering produces a host container; the scene mounts on the client.</p>',
  },
  {
    id: 'svelte', group: 'Frameworks', title: 'Svelte',
    description: 'Use the typed celestial action to mount, update and tear down astronomical widgets in Svelte without duplicating rendering logic.',
    lead: 'The celestial action follows Svelte’s native element lifecycle. Supply a component kind and options. Reactive changes update the scene; removing the element destroys its mount. The action supports picker, time, widget, clock, earth, moon and orrery.',
    render: () => preview('widget'), onShow: show,
    code: () => `<script>\nimport { celestial } from 'skydial/svelte'\n${css}\nlet date = $state(new Date('2026-06-01T12:00:00Z'))\n</script>\n\n<div use:celestial={{ component: 'picker', options: { date, onDateChange: value => date = value } }}></div>`,
    after: () => '<p>Install Svelte plus the shared visual renderer peers. The action is browser-only and is not executed during Svelte server rendering. It mounts the same React/Three.js scene used by the other adapters, so visual behavior and astronomical calculations remain consistent.</p>',
  },
  {
    id: 'vanilla', group: 'Frameworks', title: 'Vanilla JavaScript',
    description: 'Mount celestial components into an element, replace props and explicitly destroy them in plain JavaScript or another host framework.',
    lead: 'The DOM entry owns only the element you supply. It returns update and destroy methods; destroying is idempotent. A container cannot be mounted twice until its previous instance is destroyed. Keep this API on the client, after the element exists.',
    render: () => preview('widget'), onShow: show,
    code: () => `import { mountCelestial } from 'skydial/dom'\n${css}\n\nconst widget = mountCelestial(element, 'widget', { kind: 'earth', size: 'small' })\nwidget.update({ kind: 'moon', size: 'medium' })\n// When removing the host element:\nwidget.destroy()`,
    after: () => '<p>Update replaces the props object while retaining unchanged component state. Use controlled date values to change the moment after mount; defaultDate only establishes initial state. Renderer peers are required here too. For direct Three.js scenes without React, use the separate three entry.</p>',
  },
  {
    id: 'astronomy', group: 'Reference', title: 'Astronomy & simulation',
    description: 'Framework-free ephemerides, observer calculations, date selection geometry and simulation time for browser, server and native JavaScript.',
    lead: 'Astronomy depends on Astronomy Engine and has no React or DOM requirement. Simulation time has no dependencies. Actual heliocentric positions, body orientation, lunar illumination and observer readings are calculated for the selected instant; scene radii and distances are exaggerated for readability.',
    code: () => `import { helioEcliptic, bodyAxes, moonView } from 'skydial/astro'\nimport { SimClock } from 'skydial/clock'\n\nconst clock = new SimClock(Date.UTC(2026, 0, 1))\nclock.setSpeed('day')\nconst earth = helioEcliptic('Earth', clock.now())`,
    after: () => '<p>SimClock supports now, setTime, setPlaying, setSpeed, goLive, subscribe and getState. Supported UTC years are 1600–2400. Speeds are real, day, month and year. The Three.js entry exports planet, Sun and Moon mesh factories and an optional browser texture loader. Dispose owned models, then caller-owned textures, when removing a scene.</p>',
    ref: [['astro', 'Astronomy Engine', 'Pure positions, orientation, scales and observer calculations.'], ['clock', 'none', 'Independent monotonic simulation clocks.'], ['three', 'Three.js', 'Meshes, orientation helpers and optional texture loading.']],
  },
  {
    id: 'accessibility', group: 'Reference', title: 'Accessibility & browser support',
    description: 'Keyboard, touch, reduced-motion behavior and readable fallbacks for missing or lost WebGL contexts in celestial views.',
    lead: 'Native exact inputs complement direct celestial selection. The LCD style draws flat diagrams in two configurable inks; the original 3D style remains available. Every manipulation surface has a keyboard-accessible slider role. Planet radios support arrow, Home and End keys. Touch selection preserves its position without focus scrolling. Reduced-motion preference disables interpolated selection.',
    after: () => '<p>WebGL2 is required only for the 3D view. When unavailable or lost, a text fallback replaces the scene while date/time controls and astronomical readings remain usable. Chromium, Firefox and WebKit are included in the automated browser matrix; emulation does not replace testing on physical devices. CelestialInput provides complete light, dark and system themes, including orbital scales and labels. The LCD variant uses flat SVG diagrams and requires no WebGL context or texture fetches. Exact controls, segmented digits and compact widgets share the style. The standalone reference clock retains its dark instrument style. Keep texture attribution when redistributing assets.</p>',
    code: () => `<CelestialDateTimePicker showInputs />\n\n// Deterministic server output:\n<EarthWidget date={Date.UTC(2026, 0, 1)} place={observer} />`,
  },
]


// Every documentation route has the same appearance controls, including reference pages.
export const pages = definitions.map((page) => ({
  ...page,
  onShow: async (state, main) => {
    const runtime = await import(new URL('../runtime/runtime.js', import.meta.url))
    runtime.mountPreviewHeader()
    if (page.onShow) return page.onShow(state, main)
    ++generation
    mounted?.destroy()
    mounted = undefined
  },
}))

// The generated changelog has no onShow callback, but imports this module too.
if (typeof document !== 'undefined') {
  void import(new URL('../runtime/runtime.js', import.meta.url)).then((runtime) => runtime.mountPreviewHeader())
}
