import { codeBox } from './ui.js'

const sizes = { small: [176, 176], medium: [368, 176], large: [368, 368] }
const widgets = [
  { kind: 'earth', name: 'Earth clock', component: 'EarthWidget', number: '01', title: 'A little window into your day.', description: 'Local time, the date and daylight at your chosen city. The globe stays on that place while the real day–night boundary moves across it.', note: 'Choose a city in the preview toolbar. The time changes to that city’s local time; the shared moment stays the same.', size: 'medium' },
  { kind: 'moon', name: 'Moon phase', component: 'MoonWidget', number: '02', title: 'The Moon, as it is.', description: 'The correct lunar phase and illumination for the observer, shown as a 3D sphere or a flat LCD diagram. The percentage tells you how much of its visible face is lit.', note: 'A new Moon is almost dark. Change the date to watch the crescent grow, rather than expecting the same bright image every day.', size: 'medium' },
  { kind: 'year', name: 'Planetary year', component: 'YearWidget', number: '03', title: 'See the year at another pace.', description: 'A rotating planet pairs the calendar year with its orbital period. Choose Jupiter, Saturn, Uranus or Neptune in the component settings.', note: 'The large number is the Earth calendar year. The period below it is the number of Earth years that planet takes to travel once around the Sun.', size: 'medium' },
  { kind: 'orrery', name: 'Solar system', component: 'OrreryWidget', number: '04', title: 'The whole system, at a glance.', description: 'Eight planets, the Sun and their real orbital positions, composed in 3D or a flat LCD display. The green hand follows Earth; the gold hand follows your selected year planet.', note: 'Positions are calculated for the preview moment. Planet sizes and orbital distances are compressed for readability. Use the large card when the orbits are the focus.', size: 'large' },
]
const initialDate = '2026-03-26T12:00:00.000Z'
const cities = ['Greenwich', 'Singapore', 'New York', 'Paris', 'Tokyo', 'Sydney']
const defaultPlace = { name: 'Greenwich', latitude: 51.4769, longitude: 0.0005, timeZone: 'Europe/London', source: 'city' }
const snippet = (widget, size, date = initialDate, planet = 'jupiter', place = defaultPlace, variant = 'celestial', theme = 'dark', colors = {}) => `import { ${widget.component} } from 'skydial/react'\nimport 'skydial/style.css'\n\n<${widget.component}\n  size="${size}"\n  variant="${variant}"\n  theme="${theme}"${Object.keys(colors).length ? `\n  colors={${JSON.stringify(colors)}}` : ''}\n  date={new Date('${date}')}\n${widget.kind === 'year' || widget.kind === 'orrery' ? `  planet="${planet}"\n` : ''}  place={${JSON.stringify(place)}}\n/>`

export function widgetGallery() {
  return `<div class="widget-catalog">
    <div class="widget-jump" role="group" aria-label="Jump to a widget">${widgets.map((widget) => `<button type="button" data-widget-jump="${widget.kind}" aria-controls="widget-${widget.kind}">${widget.name} <span>↓</span></button>`).join('')}</div>
    <section class="widget-moment" aria-labelledby="widget-moment-title">
      <div><h2 id="widget-moment-title">One moment. Every view.</h2><p>Every example below shows the same moment. Change the date, time or city to explore.</p></div>
      <div class="widget-moment-fields">
        <label>Date (UTC)<input data-gallery-date type="date" min="1600-01-01" max="2400-12-31" value="2026-03-26" /></label>
        <label>Time (UTC)<input data-gallery-time type="time" value="12:00" /></label>
        <label>Observer city<select data-gallery-city>${cities.map((city) => `<option>${city}</option>`).join('')}</select></label>
        <button class="btn" data-gallery-now type="button">Now</button>
      </div>
    </section>
    <section class="compact-section" id="compact-displays" aria-labelledby="compact-title"><span class="widget-setting-label">Compact components</span><h2 id="compact-title">Small enough for everyday UI.</h2><p>A date, a time, a year, or any combination. Choose the format and bodies in the settings; the component itself stays a clean, read-only display. The header switches both styles and colours.</p><div data-compact-configurator></div></section>
    ${widgets.map((widget) => `<section class="widget-example" id="widget-${widget.kind}" aria-labelledby="widget-heading-${widget.kind}" data-widget-example="${widget.kind}">
      <header class="widget-example-heading"><span>${widget.number} / ${widget.name}</span><h2 id="widget-heading-${widget.kind}" tabindex="-1">${widget.name}</h2><p>${widget.description}</p></header>
      <div class="widget-example-row">
        <div class="widget-preview-panel"><div data-gallery-host="${widget.kind}"><p>Loading the ${widget.name.toLowerCase()}…</p></div></div>
        <details class="component-settings widget-example-options"><summary>Component settings</summary><div class="widget-settings-content">
          <span class="widget-setting-label">Size</span>
          <div class="widget-size-choices" role="group" aria-label="${widget.name} size">${Object.keys(sizes).map((size) => `<button type="button" data-widget-size="${size}" aria-pressed="${size === widget.size}">${size[0].toUpperCase() + size.slice(1)}</button>`).join('')}</div>
          <output class="widget-size-caption" data-gallery-dimensions>${sizes[widget.size].join(' × ')} px</output>
          ${widget.kind === 'year' || widget.kind === 'orrery' ? `<fieldset class="widget-planet-settings"><legend>Year hand planet</legend><div class="widget-size-choices" role="group" aria-label="Year hand planet">${['jupiter', 'saturn', 'uranus', 'neptune'].map((id) => `<button type="button" data-widget-planet="${id}" aria-pressed="${id === 'jupiter'}">${id[0].toUpperCase() + id.slice(1)}</button>`).join('')}</div></fieldset>` : ''}
          <p>${widget.note}</p>
          <p class="widget-example-component"><code>${widget.component}</code> · React, Vue, Svelte & vanilla</p>
        </div></details>
      </div>
      ${codeBox(snippet(widget, widget.size)).replace('<pre', '<pre tabindex="0" role="region" aria-label="Component code"')}
    </section>`).join('')}
    <section class="widget-footprints" aria-labelledby="widget-footprints-heading"><h2 id="widget-footprints-heading">Three sizes. The same sky.</h2>
      <p>Small is a glance, medium adds context, large gives the scene room. Cards shrink to fit their container.</p>
      <div class="widget-footprint-row">${Object.entries(sizes).map(([size, [width, height]]) => `<figure><div style="width:${width / 2}px;height:${height / 2}px"></div><figcaption>${size[0].toUpperCase() + size.slice(1)} <span>${width} × ${height} px</span></figcaption></figure>`).join('')}</div>
    </section>
  </div>`
}

export function mountWidgetGallery(main, runtime) {
  const controller = new AbortController()
  let date = new Date(initialDate)
  const header = runtime.mountPreviewHeader()
  let { variant, theme, colors } = runtime.getPreviewAppearance()
  let place = { ...runtime.CITIES.find((city) => city.name === 'Greenwich'), source: 'city' }
  const compact = runtime.mountDisplayConfigurator(main.querySelector('[data-compact-configurator]'), { date, place })
  const mounted = widgets.map((widget) => {
    const section = main.querySelector(`[data-widget-example="${widget.kind}"]`)
    let size = widget.size
    let planet = 'jupiter'
    let instance
    const options = () => ({ kind: widget.kind, size, variant, theme, colors, date, place, planet })
    const update = () => {
      instance.update(options())
      section.querySelector('pre').textContent = snippet(widget, size, date.toISOString(), planet, place, variant, theme, colors)
      section.querySelector('[data-gallery-dimensions]').textContent = `${sizes[size].join(' × ')} px`
    }
    instance = runtime.mountCelestial(section.querySelector('[data-gallery-host]'), 'widget', options())
    section.querySelector('pre').textContent = snippet(widget, size, date.toISOString(), planet, place, variant, theme, colors)
    section.querySelectorAll('[data-widget-size]').forEach((button) => button.addEventListener('click', () => {
      size = button.dataset.widgetSize
      section.querySelectorAll('[data-widget-size]').forEach((choice) => choice.setAttribute('aria-pressed', String(choice === button)))
      update()
    }, { signal: controller.signal }))
    section.querySelectorAll('[data-widget-planet]').forEach((button) => button.addEventListener('click', () => {
      planet = button.dataset.widgetPlanet
      section.querySelectorAll('[data-widget-planet]').forEach((choice) => choice.setAttribute('aria-pressed', String(choice === button)))
      update()
    }, { signal: controller.signal }))
    return { update, destroy: () => instance.destroy() }
  })
  const unsubscribe = runtime.subscribePreviewSettings(() => {
    const appearance = runtime.getPreviewAppearance()
    variant = appearance.variant; theme = appearance.theme; colors = appearance.colors
    mounted.forEach((instance) => instance.update())
  })
  main.querySelectorAll('[data-widget-jump]').forEach((button) => button.addEventListener('click', () => {
    const heading = main.querySelector(`#widget-heading-${button.dataset.widgetJump}`)
    heading.focus({ preventScroll: true })
    heading.scrollIntoView({ behavior: 'auto', block: 'start' })
  }, { signal: controller.signal }))
  const dateField = main.querySelector('[data-gallery-date]')
  const timeField = main.querySelector('[data-gallery-time]')
  const updateMoment = () => {
    const selected = Date.parse(`${dateField.value}T${timeField.value}:00Z`)
    if (!Number.isFinite(selected) || !dateField.validity.valid || !timeField.validity.valid) return
    date = new Date(selected)
    compact.update({ date, place })
    mounted.forEach((instance) => instance.update())
  }
  dateField.addEventListener('change', updateMoment, { signal: controller.signal })
  timeField.addEventListener('change', updateMoment, { signal: controller.signal })
  main.querySelector('[data-gallery-city]').addEventListener('change', (event) => {
    place = { ...runtime.CITIES.find((city) => city.name === event.target.value), source: 'city' }
    compact.update({ date, place })
    mounted.forEach((instance) => instance.update())
  }, { signal: controller.signal })
  main.querySelector('[data-gallery-now]').addEventListener('click', () => {
    const current = new Date().toISOString()
    dateField.value = current.slice(0, 10)
    timeField.value = current.slice(11, 16)
    updateMoment()
  }, { signal: controller.signal })
  return { destroy: () => { controller.abort(); unsubscribe(); compact.destroy(); header.destroy(); mounted.forEach((instance) => instance.destroy()) } }
}
