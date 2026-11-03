import 'skydial/style.css'
import 'skydial/picker.css'
import { CelestialPicker as FormOnlyPicker } from 'skydial/pickers'
import { type PickerColors, CelestialInput, CelestialPicker, CelestialScrollPicker, CelestialStepper, CelestialDatePicker, CelestialDateTimePicker, CelestialTimePicker, EarthWidget, YearWidget, CelestialProvider, EarthClock, MoonClock, OrreryClock } from 'skydial/react'
import { SimClock } from 'skydial/clock'
import { civilDateValue, type Place } from 'skydial/astro'
import { createMoonObject, createSunObject, createPlanetObject, loadCelestialTextures } from 'skydial/three'

const colors: PickerColors = { background: '#dcebf1', foreground: '#183747', yearHand: '#905e22' }
const date = new Date('2026-06-01T12:00:00Z')
export const formOnlyExample = <FormOnlyPicker colors={colors} name="year" precision="year" defaultValue={date} style={{ '--picker-radius': '4px', '--picker-accent': '#246' }} />
const clock = new SimClock(Number(date))
const place: Place = { name: 'London', latitude: 51.5, longitude: 0, timeZone: 'Europe/London', source: 'custom' }
export const example = <CelestialProvider clock={clock}>
  <EarthClock place={place} />
  <CelestialInput name="appointment" mode="datetime" defaultValue={date} theme="light" control="both" scene="auto" defaultPlanet="jupiter" defaultEarthView="city" />
  <CelestialInput name="year" precision="year" scene="planet" interactive={false} />
  <CelestialPicker name="year" precision="year" defaultValue={date} onChange={(value) => { const nullable: Date | null = value; void nullable }} required clearable theme="light" size="small" />
  <CelestialPicker name="date" mode="date" defaultValue={date}><CelestialDatePicker place={place} includeTime={false} /></CelestialPicker>
  <CelestialScrollPicker units={['year', 'month']} steps={{ year: 5 }} date={date} min={date} max={Date.UTC(2040, 0)} />
  <CelestialStepper units={['day', 'hour', 'minute', 'second']} steps={{ minute: 15 }} defaultDate={date} />
  <CelestialDateTimePicker defaultDate={date} defaultPlanet="saturn" defaultEarthView="city" earthPlace={place} />
  <CelestialTimePicker date={date} onDateChange={() => {}} earthView="city" onEarthViewChange={(view) => { const mode: 'rotation' | 'city' = view; void mode }} onEarthPlaceChange={(value) => { const city: Place = value; void city }} />
  <EarthWidget colors={colors} size="small" place={place} />
  <YearWidget size="medium" defaultPlanet="jupiter" />
  <MoonClock date={date} />
  <OrreryClock planet="saturn" />
  <CelestialDatePicker date={date} onDateChange={(value: Date) => clock.setTime(value.getTime())} />
  <CelestialDatePicker presentation="popover" includeTime={false} defaultDate={date} />
  <CelestialTimePicker presentation="popover" showDay label="Arrival" defaultDate={date} />
</CelestialProvider>

civilDateValue(Number(date), place.timeZone)
const models = [createPlanetObject('saturn', {}), createSunObject(), createMoonObject()]
models.forEach((model) => model.dispose())
void loadCelestialTextures

import { mountCelestial } from 'skydial/dom'
import { CelestialDateTimePicker as VuePicker } from 'skydial/vue'
import { celestial, type CelestialActionOptions } from 'skydial/svelte'
import { h } from 'vue'
export const vueExample = h(VuePicker, { options: { defaultPlanet: 'jupiter', date } })
export const svelteOptions: CelestialActionOptions = { component: 'picker', options: { defaultPlanet: 'saturn', date } }
export function vanillaExample(element: HTMLElement) {
  const input = mountCelestial(element, 'input', { mode: 'time', theme: 'auto', scene: 'earth', colors }); input.destroy()
  const mounted = mountCelestial(element, 'widget', { kind: 'year', defaultPlanet: 'jupiter' })
  mounted.update({ kind: 'moon', size: 'small' })
  mounted.destroy()
}
void celestial
