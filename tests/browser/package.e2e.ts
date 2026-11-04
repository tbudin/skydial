import { expect, test, type Locator } from '@playwright/test'
import { calendarScale, yearScale, civilParts } from 'skydial/astro'

async function pointOnRing(ring: Locator, longitude: number) {
  await ring.scrollIntoViewIfNeeded()
  return ring.evaluate((element, lon) => {
    const svg = element.ownerSVGElement!
    const cx = Number(element.getAttribute('cx'))
    const cy = Number(element.getAttribute('cy'))
    const radius = Number(element.getAttribute('r'))
    const point = svg.createSVGPoint()
    point.x = cx + radius * Math.cos(lon)
    point.y = cy - radius * Math.sin(lon)
    const screen = point.matrixTransform(element.getScreenCTM()!)
    return { x: screen.x, y: screen.y }
  }, longitude)
}

test('calendar ring and year orbit select the actual date, with visible planet choices', async ({ page }) => {
  // This case checks exact targets across six synchronized scenes; animation is
  // exercised independently in composable.e2e.ts without software-GPU contention.
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const errors: string[] = []
  const missing: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('response', (response) => { if (response.status() >= 400) missing.push(response.url()) })
  await page.goto('./')
  const picker = page.getByTestId('selected')
  await expect(picker.getByRole('radio', { name: /Jupiter/ })).toHaveAttribute('aria-checked', 'true')
  const tick = calendarScale(2026, 'Asia/Singapore').ticks.find((t) => t.month === 6 && t.day === 15)!
  const dayPoint = await pointOnRing(picker.getByRole('slider', { name: 'Day of year on the calendar ring' }), tick.lon)
  await page.mouse.click(dayPoint.x, dayPoint.y)
  await expect(page.getByTestId('selected-date')).toHaveText('2026-06-15T12:00:00.000Z')
  await expect(picker.locator('[data-label="date-pill"]')).toHaveText('15 JUN')
  const year = yearScale('jupiter', 2026, 'Asia/Singapore', civilParts(Date.parse('2026-06-15T12:00:00Z'), 'Asia/Singapore')).markers.find((m) => m.year === 2030)!
  const yearPoint = await pointOnRing(picker.getByRole('slider', { name: /Year on Jupiter/ }), year.lon)
  await page.mouse.click(yearPoint.x, yearPoint.y)
  await expect(page.getByTestId('selected-date')).toHaveText('2030-06-15T12:00:00.000Z')
  await expect(picker.locator('[data-label="year-pill"]')).toHaveText('2030')
  await picker.getByRole('radio', { name: /Saturn/ }).click()
  await expect(picker.getByRole('slider', { name: /Year on Saturn/ })).toBeVisible()
  await expect(picker.getByText('Year from Saturn')).toBeVisible()
  await expect(page.locator('.warning')).toHaveCount(0)
  expect(missing).toEqual([])
  expect(errors).toEqual([])
})

test('turning Earth selects hours, crosses midnight and updates synchronized cards', async ({ page }) => {
  await page.goto('./')
  const earth = page.getByRole('slider', { name: 'Rotate Earth to set time' })
  await expect(earth).toBeVisible()
  const independent = page.getByTestId('independent').locator('.widget-caption')
  const before = await independent.innerText()
  await earth.scrollIntoViewIfNeeded()
  const box = (await earth.boundingBox())!
  await page.mouse.move(box.x + box.width * .25, box.y + box.height * .5)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width * .5, box.y + box.height * .5, { steps: 12 })
  await page.mouse.up()
  // Engines quantize pointer coordinates differently; one pixel spans several minutes.
  await expect.poll(async () => Math.abs(Date.parse((await page.getByTestId('selected-date').textContent())!) - Date.parse('2026-03-20T18:00:00Z'))).toBeLessThan(300000)
  await expect(page.getByTestId('selected').locator('.picker-selected-date')).toHaveText('21 March 2026')
  await expect(independent).toHaveText(before)
  await page.getByText('Enter an exact date and time', { exact: true }).click()
  await page.getByLabel('Time', { exact: true }).fill('02:00')
  await expect(page.getByTestId('selected-date')).toHaveText('2026-03-20T18:00:00.000Z')
  await expect(earth).toHaveAttribute('aria-valuenow', '120')
  await expect(page.getByLabel('earth widget').locator('.widget-value')).toHaveText('02:00')
  await earth.focus()
  await page.keyboard.press('ArrowRight')
  await expect(page.getByTestId('selected-date')).toHaveText('2026-03-20T18:15:00.000Z')
})

test('standalone orrery defaults to Jupiter and can switch to all other year planets', async ({ page }) => {
  await page.goto('./')
  const widget = page.getByTestId('standalone')
  await expect(widget.getByRole('radio', { name: /Jupiter/ })).toHaveAttribute('aria-checked', 'true')
  for (const name of ['Saturn', 'Uranus', 'Neptune']) {
    await widget.getByRole('radio', { name: new RegExp(name) }).click()
    await expect(widget.getByRole('radio', { name: new RegExp(name) })).toHaveAttribute('aria-checked', 'true')
    await expect(widget.locator('.reading')).toContainText(name)
  }
})

test('home-screen cards have compact sizes and leave host styles intact', async ({ page }) => {
  await page.goto('./')
  const small = await page.getByLabel('earth widget').boundingBox()
  const medium = await page.getByLabel('Jupiter year widget').boundingBox()
  const large = await page.getByLabel('orrery widget', { exact: true }).boundingBox()
  expect(small!.width).toBe(176)
  expect(small!.height).toBe(176)
  expect(medium!.width).toBe(368)
  expect(medium!.height).toBe(176)
  expect(large!.height).toBe(368)
  expect(await page.locator('body').evaluate((el) => getComputedStyle(el).backgroundColor)).toBe('rgb(244, 241, 234)')
  await expect(page.locator('.loading')).toHaveCount(0)
  await expect(page.getByTestId('selected').locator('[data-label="date-pill"]')).toHaveCSS('opacity', '1', { timeout: 15000 })
  await page.screenshot({ path: 'screenshots/package-desktop.png', fullPage: true, animations: 'disabled' })
  await page.setViewportSize({ width: 390, height: 844 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await page.screenshot({ path: 'screenshots/package-mobile.png', fullPage: true, animations: 'disabled' })
})

test('exact inputs, keyboard orbital selection and widget remount work', async ({ page }) => {
  await page.goto('./?uncontrolled')
  const calendar = page.getByRole('slider', { name: 'Day of year on the calendar ring' })
  await calendar.focus()
  await page.keyboard.press('ArrowRight')
  await expect(calendar).toHaveAttribute('aria-valuetext', 'Saturday, 21 March 2026')
  await page.getByText('Enter an exact date and time', { exact: true }).click()
  await page.getByLabel('Date', { exact: true }).fill('2026-06-15')
  await page.getByLabel('Time', { exact: true }).fill('09:30')
  await expect(page.getByRole('slider', { name: 'Rotate Earth to set time' })).toHaveAttribute('aria-valuenow', '570')
  await page.goto('./')
  await page.getByRole('button', { name: 'Toggle Moon' }).click()
  await expect(page.getByTestId('independent').locator('canvas')).toHaveCount(0)
  await page.getByRole('button', { name: 'Toggle Moon' }).click()
  await expect(page.getByTestId('independent').locator('canvas')).toHaveCount(1)
  expect(await page.evaluate(() => '__celestialClock' in window || '__celestialClockSim' in window)).toBe(false)
})

test('orbital touch selection works on a narrow screen with reduced motion', async ({ browser }) => {
  test.skip(browser.browserType().name() === 'firefox', 'Firefox does not support mobile touch emulation.')
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, reducedMotion: 'reduce' })
  const page = await context.newPage()
  await page.goto('http://127.0.0.1:4175/package-demo/')
  const ring = page.getByRole('slider', { name: 'Day of year on the calendar ring' })
  const tick = calendarScale(2026, 'Asia/Singapore').ticks.find((t) => t.month === 9 && t.day === 10)!
  const point = await pointOnRing(ring, tick.lon)
  await page.touchscreen.tap(point.x, point.y)
  await expect(page.getByTestId('selected-date')).toHaveText('2026-09-10T12:00:00.000Z')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await context.close()
})
