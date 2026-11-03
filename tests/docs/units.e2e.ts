import { expect, test, type Page } from '@playwright/test'
import { setDesignStyle, openSettings } from './preview.js'

const allUnits = ['year', 'month', 'day', 'hour', 'minute', 'second']
async function configure(page: Page, units: string[]) {
  await openSettings(page)
  const settings = page.getByRole('region', { name: 'Configure your picker' })
  for (const unit of units) await settings.getByRole('checkbox', { name: unit, exact: true }).check()
  for (const unit of allUnits.filter((unit) => !units.includes(unit))) await settings.getByRole('checkbox', { name: unit, exact: true }).uncheck()
}

test('celestial scenes and precision tabs follow the enabled units in both styles', async ({ page }) => {
  test.setTimeout(120000)
  await page.goto('./picker/')
  for (const variant of ['lcd', 'celestial']) {
    await setDesignStyle(page, variant)
    for (const units of [['year'], ['year', 'month'], ['month'], ['day'], ['hour'], ['minute'], ['second'], ['year', 'second'], ['day', 'hour', 'minute'], allUnits]) {
      await configure(page, units)
      await page.getByRole('button', { name: 'Starts', exact: true }).click()
      const panel = page.getByRole('dialog', { name: 'Starts', exact: true })
      const calendar = units.includes('month') || units.includes('day')
      const year = units.includes('year')
      const time = units.filter((unit) => ['hour', 'minute', 'second'].includes(unit))
      await expect(panel.getByRole('listbox')).toHaveCount(units.length)
      await expect.poll(() => panel.getByRole('listbox').evaluateAll((wheels) => Math.max(...wheels.map((wheel) => {
        const selected = wheel.querySelector('[aria-selected="true"]')!.getBoundingClientRect()
        const band = wheel.parentElement!.querySelector('.picker-wheel-selection')!.getBoundingClientRect()
        return Math.abs(selected.top - band.top)
      })))).toBeLessThan(1)
      await expect(panel.locator('[data-picker-part="monthLabel"]')).toHaveCount(units.includes('month') ? 12 : 0)
      await expect(panel.locator('[data-picker-part="dateBadge"]')).toHaveCount(calendar ? 1 : 0)
      await expect(panel.locator('[data-picker-part="yearBadge"]')).toHaveCount(year ? 1 : 0)
      await expect(panel.locator('[data-picker-part="rangeNavigation"]')).toHaveCount(year ? 1 : 0)
      if (calendar || year) await expect(panel.locator('[data-visible-bodies]')).toHaveAttribute('data-visible-bodies', [calendar ? 'earth' : '', year ? 'jupiter' : ''].filter(Boolean).join(' '))
      const tabs = panel.getByRole('group', { name: 'Earth drag precision', exact: true })
      if (time.length) {
        await expect(tabs.getByRole('button')).toHaveCount(time.length)
        for (const [unit, label] of [['hour', 'Hours'], ['minute', 'Minutes'], ['second', 'Seconds']]) await expect(tabs.getByRole('button', { name: label, exact: true })).toHaveCount(units.includes(unit) ? 1 : 0)
      } else await expect(tabs).toHaveCount(0)
      if (units.length === 1 && year) {
        await expect(panel.getByRole('slider')).toHaveCount(1)
        await panel.getByRole('slider', { name: 'Year on Jupiter’s orbit', exact: true }).press('ArrowRight')
        await expect(panel.getByRole('listbox').getByRole('option', { selected: true })).toHaveText(variant === 'lcd' ? '2027' : '2028')
        await page.screenshot({ path: `screenshots/picker-year-only-${variant}.png`, animations: 'disabled' })
      }
      await panel.getByRole('button', { name: 'Done', exact: true }).click()
    }
  }
})

for (const variant of ['lcd', 'celestial']) test(`${variant} Earth dragging keeps the selection band fixed and supports precise seconds`, async ({ page }) => {
  await page.goto(`./picker/?style=${variant}`)
  await configure(page, ['hour', 'minute', 'second'])
  await page.getByRole('button', { name: 'Starts', exact: true }).click()
  const panel = page.getByRole('dialog', { name: 'Starts', exact: true })
  await panel.getByRole('group', { name: 'Earth drag precision' }).getByRole('button', { name: 'Seconds', exact: true }).click()
  const globe = panel.getByRole('slider', { name: 'Rotate Earth to set time', exact: true })
  await globe.scrollIntoViewIfNeeded()
  const box = (await globe.boundingBox())!
  // Observe painted frames during a real pointer gesture, not just the settled result.
  await page.evaluate(() => {
    const state = { active: true, rows: [] as { band: number; valueOffset: number }[] }
    ;(window as typeof window & { wheelFrames?: typeof state }).wheelFrames = state
    const sample = () => {
      const wheel = document.querySelector<HTMLElement>('.picker-form-panel [data-unit="second"] [role="listbox"]')!
      const band = wheel.parentElement!.querySelector('.picker-wheel-selection')!.getBoundingClientRect()
      const selected = wheel.querySelector('[aria-selected="true"]')!.getBoundingClientRect()
      state.rows.push({ band: band.top, valueOffset: selected.top - band.top })
      if (state.active) requestAnimationFrame(sample)
    }
    requestAnimationFrame(sample)
  })
  await page.mouse.move(box.x + box.width * .25, box.y + box.height * .5)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width * .5, box.y + box.height * .5, { steps: 40 })
  await page.mouse.up()
  await expect(panel.getByRole('listbox', { name: 'Seconds', exact: true }).getByRole('option', { selected: true })).toHaveText('15')
  const frames = await page.evaluate(() => {
    const state = (window as typeof window & { wheelFrames: { active: boolean; rows: { band: number; valueOffset: number }[] } }).wheelFrames
    state.active = false
    return state.rows
  })
  expect(frames.length).toBeGreaterThan(5)
  expect(Math.max(...frames.map((frame) => frame.band)) - Math.min(...frames.map((frame) => frame.band))).toBeLessThan(1)
  expect(Math.max(...frames.map((frame) => Math.abs(frame.valueOffset)))).toBeLessThan(1)
  if (variant === 'lcd') {
    const band = panel.locator('[data-unit="second"] .picker-wheel-selection')
    await expect(band).toHaveCSS('background-color', 'rgb(38, 52, 38)')
    await expect(band).toContainText('15')
    await expect(panel.getByRole('listbox', { name: 'Seconds', exact: true }).getByRole('option', { selected: true })).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
  }
  await globe.press('ArrowRight')
  await expect(panel.getByRole('listbox', { name: 'Seconds', exact: true }).getByRole('option', { selected: true })).toHaveText('16')
  await panel.getByRole('button', { name: 'Done', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Starts', exact: true })).toContainText('12:00:16')
})
