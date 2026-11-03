import { setPalette } from './preview.js'
import { mkdir, writeFile } from 'node:fs/promises'
import { expect, test } from '@playwright/test'

test('lunar illumination matches the displayed phase through a lunation', async ({ page }) => {
  await page.goto('./widgets/?style=lcd')
  const moon = page.locator('[data-widget-example="moon"] .celestial-card')
  await expect(moon.locator('svg.lcd-body')).toHaveCount(1)
  for (const date of ['2026-03-19', '2026-03-26', '2026-04-02', '2026-04-10']) {
    await page.getByLabel('Date (UTC)', { exact: true }).fill(date)
    await page.getByLabel('Date (UTC)', { exact: true }).press('Tab')
    await expect(page.locator('[data-widget-example="moon"] pre')).toContainText(date)
    const percent = Number.parseFloat(await moon.locator('.widget-value').innerText()) / 100
    const path = await moon.locator('[data-lcd-feature="illuminated"]').getAttribute('d')
    const paintedFraction = await page.evaluate(async (d) => {
      const canvas = document.createElement('canvas')
      canvas.width = canvas.height = 240
      const context = canvas.getContext('2d')!
      const image = new Image()
      image.src = 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240"><rect width="240" height="240" fill="black"/><path d="${d}" fill="white"/></svg>`)
      await image.decode()
      context.drawImage(image, 0, 0)
      const pixels = context.getImageData(0, 0, 240, 240).data
      let light = 0
      for (let i = 0; i < pixels.length; i += 4) if (pixels[i] > 127) light++
      return light / (Math.PI * 86 ** 2)
    }, path)
    expect(Math.abs(paintedFraction - percent), date).toBeLessThan(.02)
  }
})

test('detailed LCD bodies stay compact, rotate and retain two configurable inks', async ({ page }) => {
  const textures: string[] = []
  page.on('request', (request) => { if (/\.(png|jpg)(\?|$)/.test(request.url())) textures.push(request.url()) })
  await page.goto('./widgets/?style=lcd')
  const year = page.locator('[data-widget-example="year"]')
  await year.locator('.component-settings > summary').click()
  const artwork: { name: string; svg: string }[] = []
  const capture = async (kind: string, name: string) => {
    const svg = page.locator(`[data-widget-example="${kind}"] svg.lcd-body`)
    const markup = await svg.evaluate((el) => el.outerHTML)
    expect(markup).not.toMatch(/NaN|Infinity|<image/)
    expect(await svg.locator('*').count()).toBeLessThan(150)
    artwork.push({ name, svg: markup })
  }
  await capture('earth', 'Earth')
  for (const planet of ['jupiter', 'saturn', 'uranus', 'neptune']) {
    await year.getByRole('group', { name: 'Year hand planet', exact: true }).getByRole('button', { name: planet[0].toUpperCase() + planet.slice(1), exact: true }).click()
    await expect(year.locator('svg.lcd-body')).toHaveAttribute('data-lcd-body', planet)
    await capture('year', planet[0].toUpperCase() + planet.slice(1))
    if (planet === 'saturn' || planet === 'uranus') await expect(year.locator('[data-lcd-feature="rings-front"]')).toHaveCount(1)
  }
  await page.getByLabel('Date (UTC)', { exact: true }).fill('2026-04-02')
  await page.getByLabel('Date (UTC)', { exact: true }).press('Tab')
  await expect(page.locator('[data-widget-example="moon"] pre')).toContainText('2026-04-02')
  await capture('moon', 'Moon')
  const before = await year.locator('[data-lcd-feature="atmosphere"]').getAttribute('d')
  await page.getByLabel('Time (UTC)', { exact: true }).fill('16:00')
  await page.getByLabel('Time (UTC)', { exact: true }).press('Tab')
  await expect(year.locator('[data-lcd-feature="atmosphere"]')).not.toHaveAttribute('d', before!)
  for (const appearance of ['light', 'dark']) {
    await page.getByRole('combobox', { name: 'Appearance', exact: true }).selectOption(appearance)
    await setPalette(page, 'Ice blue')
    await expect(year.locator('.lcd-body')).toHaveCSS('color', 'rgb(24, 55, 71)')
    await expect(year.locator('.lcd-paper-fill').first()).toHaveCSS('fill', 'rgb(220, 235, 241)')
  }
  const glyphs = await page.locator('[data-widget-example="orrery"] [data-lcd-body]').evaluateAll((els) => els.map((el) => ({ name: el.getAttribute('data-lcd-body')!, svg: `<svg viewBox="-16 -16 32 32" aria-hidden="true" stroke="currentColor" fill="none">${el.innerHTML}</svg>` })))
  expect(glyphs).toHaveLength(8)
  expect(textures).toEqual([])
  await expect(page.locator('canvas')).toHaveCount(0)

  // A review sheet uses the actual package-rendered SVGs, at a readable scale.
  await mkdir('site-dist/lcd-body-review', { recursive: true })
  await writeFile('site-dist/lcd-body-review/index.html', `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>LCD celestial bodies</title><style>
    *{box-sizing:border-box}body{margin:0;padding:32px 48px;background:#f1f2e9;color:#263426;font-family:ui-monospace,monospace}h1{font-size:26px;font-weight:500;margin:0 0 10px}p{font-size:12px;line-height:1.7;margin:0 0 24px}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}figure{margin:0;background:#c9cfb4;border:1px solid #263426;padding:12px;text-align:center;--lcd-paper:#c9cfb4}figure>svg{display:block;width:100%;height:260px}figcaption{font-size:12px;letter-spacing:.12em;text-transform:uppercase}.lcd-paper-fill{fill:var(--lcd-paper)}.glyphs{display:flex;justify-content:space-around;gap:10px;margin-top:20px}.glyphs figure{border:0;background:transparent;padding:0}.glyphs svg{height:42px;width:56px}.glyphs figcaption{font-size:9px}footer{margin-top:20px;font-size:10px}@media(max-width:600px){body{padding:20px}.grid{grid-template-columns:repeat(2,1fr)}figure>svg{height:180px}.glyphs{flex-wrap:wrap}}
    </style><h1>A little more of the universe.</h1><p>Original duotone studies · projected surface detail, two configurable inks.<br>Earth and lunar illumination follow the selected moment; planetary markings are illustrative.</p><div class="grid">${artwork.map(({ name, svg }) => `<figure>${svg}<figcaption>${name}</figcaption></figure>`).join('')}</div><div class="glyphs">${glyphs.map(({ name, svg }) => `<figure>${svg}<figcaption>${name}</figcaption></figure>`).join('')}</div><footer>skydial · LCD body review</footer></html>`)
  await page.goto('./lcd-body-review/')
  await page.setViewportSize({ width: 1280, height: 1000 })
  await page.screenshot({ path: 'screenshots/lcd-bodies-detailed-review.png', fullPage: true })
})
