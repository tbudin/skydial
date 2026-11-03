import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { SimClock } from 'skydial/clock'
import { CelestialInput, CelestialDatePicker } from 'skydial/react'
import { createPlanetObject, createSunObject, createMoonObject, CELESTIAL_TEXTURE_URLS } from 'skydial/three'
import { civilDateValue } from 'skydial/astro'

const manifest = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
for (const entry of Object.values(manifest.exports)) {
  for (const target of typeof entry === 'string' ? [entry] : Object.values(entry)) {
    assert(existsSync(new URL('../' + target, import.meta.url)), `Missing export: ${target}`)
  }
}
for (const url of Object.values(CELESTIAL_TEXTURE_URLS)) assert(existsSync(new URL(url)), `Missing texture: ${url}`)
const date = Date.UTC(2026, 0, 1)
assert.equal(new SimClock(date).now(), date)
assert.equal(civilDateValue(date, 'UTC'), '2026-01-01')
for (const model of [createPlanetObject('saturn', {}), createSunObject(), createMoonObject()]) {
  assert(model.body.children[0].isMesh)
  model.dispose()
}
const markup = renderToStaticMarkup(createElement(CelestialDatePicker, { date, preview: false }))
assert(markup.includes('2026-01-01'))
assert(renderToStaticMarkup(createElement(CelestialInput, { defaultValue: date, name: 'date' })).includes('name="date"'))
assert(readFileSync(new URL('../dist-lib/react.js', import.meta.url), 'utf8').startsWith('"use client";'))
console.info('Package exports, assets, Node imports, SSR and Three.js models verified.')
