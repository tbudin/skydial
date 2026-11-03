import { afterAll, describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { mkdir, writeFile } from 'node:fs/promises'
import process from 'node:process'
import { ClockScope } from '../../src/sim/react.js'
import { LcdBody } from '../../src/render/LcdBody.js'
import { LcdEarth } from '../../src/render/LcdEarth.js'

const location = { latitude: 51.4769, longitude: .0005 }
const artwork: { name: string; svg: string }[] = []
describe('server-rendered LCD surfaces', () => {
  for (const body of ['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'moon'] as const) {
    it(`renders ${body} without a browser, raster textures or non-finite geometry`, () => {
      const svg = renderToStaticMarkup(<ClockScope date={Date.parse(body === 'moon' ? '2026-04-02T12:00:00Z' : '2026-03-26T12:00:00Z')}>
        {body === 'earth' ? <LcdEarth location={location} /> : <LcdBody body={body} location={location} />}
      </ClockScope>)
      expect(svg).toContain(`data-lcd-body="${body}"`)
      expect(svg).not.toMatch(/NaN|Infinity|<image|<canvas/)
      expect(svg.length).toBeLessThan(250000)
      artwork.push({ name: body[0].toUpperCase() + body.slice(1), svg })
    })
  }
})

// Opt-in output for visual review; normal package checks write no artwork.
afterAll(async () => {
  if (process.env.CELESTIAL_ART_REVIEW !== '1') return
  await mkdir('screenshots', { recursive: true })
  await writeFile('screenshots/lcd-artwork.json', JSON.stringify(artwork))
})
