import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

const accessibilityTags = ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']

test('picker contrast, names and roles meet automated accessibility checks', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  for (const lcd of [false, true]) for (const dark of [false, true]) {
    await page.goto(`./?input&combined${lcd ? '&lcd' : ''}${dark ? '&dark' : ''}`)
    await page.getByRole('button', { name: 'Appointment', exact: true }).click()
    await expect(page.locator('.scale-label.date-pill')).toHaveAttribute('data-visible', 'true')
    await page.screenshot({ path: `screenshots/picker-${lcd ? 'lcd' : 'celestial'}-${dark ? 'dark' : 'light'}-desktop.png`, animations: 'disabled' })
    const audit = await new AxeBuilder({ page }).include('.celestial-form-picker').withTags(accessibilityTags).analyze()
    expect(audit.violations.map((issue) => ({ id: issue.id, impact: issue.impact, nodes: issue.nodes.map((node) => ({ target: node.target, summary: node.failureSummary })) }))).toEqual([])
  }
})

for (const variant of ['celestial', 'lcd'] as const) {
  test(`${variant} keyboard selection, descriptions and focus dismissal work end to end`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(`./?input&combined${variant === 'lcd' ? '&lcd' : ''}`)
    const field = page.getByRole('button', { name: 'Appointment', exact: true })
    await expect(field).toHaveAccessibleDescription('2028-01-31 · 23:59 Required. Use arrow keys in each scroll column or the minus and plus buttons. Escape closes the picker.')
    await field.press('Enter')
    const panel = page.getByRole('dialog', { name: 'Appointment', exact: true })
    const year = panel.getByRole('listbox', { name: 'Year', exact: true })
    await expect(year).toBeFocused()
    await year.press('ArrowDown')
    await panel.getByRole('slider', { name: 'Day of year on the calendar ring', exact: true }).press('ArrowRight')
    await expect(panel.getByRole('slider', { name: 'Day of year on the calendar ring', exact: true })).toHaveCSS('outline-style', 'none')
    await expect(panel.locator('.orbit-interaction[data-kind="day"] .orbit-focus-ring')).toHaveCSS('opacity', '1')
    await panel.getByRole('button', { name: 'Increase day', exact: true }).click()
    await panel.getByRole('slider', { name: 'Rotate Earth to set time', exact: true }).press('ArrowRight')
    await expect(page.getByTestId('input-date')).toHaveText('2029-02-02T16:14:00.000Z')
    await panel.getByRole('button', { name: 'Done', exact: true }).click()
    await expect(field).toBeFocused()
    await field.press('ArrowDown')
    await panel.getByRole('button', { name: 'Done', exact: true }).focus()
    await page.keyboard.press('Tab')
    await expect(panel).toHaveCount(0)
    // Safari can skip buttons in normal Tab navigation according to the OS preference.
    await expect(page.locator('form :focus')).toHaveCount(1)
    await expect(field).not.toBeFocused()
    await page.getByRole('button', { name: 'Submit appointment', exact: true }).press('Enter')
    await expect(page.getByTestId('input-result')).toContainText('"when":"2029-02-03T00:14"')
    await field.press('Enter')
    await panel.press('Escape')
    await expect(field).toBeFocused()
  })

  test(`${variant} supports system colour changes, reduced motion and forced colours`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'light' })
    await page.goto(`./?input&system&timeonly${variant === 'lcd' ? '&lcd' : ''}`)
    await page.getByRole('button', { name: 'Appointment', exact: true }).click()
    const panel = page.getByRole('dialog')
    const light = await panel.evaluate((element) => getComputedStyle(element).backgroundColor)
    await page.emulateMedia({ colorScheme: 'dark' })
    await expect.poll(() => panel.evaluate((element) => getComputedStyle(element).backgroundColor)).not.toBe(light)
    await expect(page.locator('.picker-form-indicator')).toHaveCSS('transition-duration', '0s')
    await page.emulateMedia({ forcedColors: 'active' })
    await panel.getByRole('listbox', { name: 'Hours', exact: true }).focus()
    await panel.getByRole('listbox', { name: 'Hours', exact: true }).press('ArrowUp')
    await expect(panel.locator('[data-unit="hour"] .picker-wheel-selection')).toHaveCSS('outline-style', 'solid')
    await expect(panel.getByRole('listbox', { name: 'Hours', exact: true }).getByRole('option', { selected: true })).toHaveAccessibleName('22')
    await page.screenshot({ path: `screenshots/${variant}-forced-colours.png` })
  })
}

test('LCD remains interactive without WebGL or texture requests', async ({ page }) => {
  const images: string[] = []
  page.on('request', (request) => { if (/\.(jpg|png)(\?|$)/.test(request.url())) images.push(request.url()) })
  await page.addInitScript(() => { HTMLCanvasElement.prototype.getContext = () => null })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('./?input&lcd&combined')
  await page.getByRole('button', { name: 'Appointment', exact: true }).click()
  const panel = page.getByRole('dialog')
  await expect(panel.locator('[data-renderer="lcd"]')).toHaveCount(2)
  await expect(panel.locator('canvas')).toHaveCount(0)
  await expect(panel).not.toContainText('3D view unavailable')
  await panel.getByRole('slider', { name: 'Year on Jupiter’s orbit', exact: true }).press('ArrowRight')
  await expect(panel.getByRole('listbox', { name: 'Year', exact: true }).getByRole('option', { selected: true })).toHaveAccessibleName('2029')
  await panel.getByRole('slider', { name: 'Rotate Earth to set time', exact: true }).press('ArrowRight')
  await expect(panel.getByRole('listbox', { name: 'Hours', exact: true }).getByRole('option', { selected: true })).toHaveAccessibleName('00')
  expect(images).toEqual([])
})

const screens = [
  { name: 'narrow-phone', width: 320, height: 740 },
  { name: 'phone', width: 390, height: 844 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 1000 },
  { name: 'landscape', width: 844, height: 390 },
]
for (const variant of ['celestial', 'lcd'] as const) for (const dark of [false, true]) for (const screen of screens) {
  test(`${variant} ${dark ? 'dark' : 'light'} reflows on ${screen.name}`, async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'The viewport matrix runs in Chromium; keyboard/state flows run in all three engines.')
    await page.setViewportSize(screen)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    for (const mode of ['date', 'timeonly', 'combined', 'year']) {
      await page.goto(`./?input&${mode}${variant === 'lcd' ? '&lcd' : ''}${dark ? '&dark' : ''}`)
      const field = page.getByRole('button', { name: 'Appointment', exact: true })
      await field.click()
      const panel = page.getByRole('dialog')
      const box = (await panel.boundingBox())!
      const anchor = (await field.boundingBox())!
      expect(box.x).toBeGreaterThanOrEqual(7)
      expect(box.x + box.width).toBeLessThanOrEqual(screen.width - 7)
      expect(box.y).toBeGreaterThanOrEqual(7)
      expect(box.y + box.height).toBeLessThanOrEqual(screen.height - 7)
      if (!(await panel.getAttribute('data-placement'))?.startsWith('viewport')) expect(box.y + box.height <= anchor.y - 5 || box.y >= anchor.y + anchor.height + 5).toBe(true)
      expect(await panel.evaluate((element) => element.scrollWidth <= element.clientWidth + 1)).toBe(true)
      expect(await panel.locator('[data-picker-part="content"]').evaluate((element) => element.scrollHeight - element.clientHeight)).toBeLessThanOrEqual(1)
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
      await expect(panel.getByRole('button', { name: 'Done', exact: true })).toBeInViewport()
      await panel.getByRole('listbox').last().press('ArrowUp')
      await expect(panel.getByRole('listbox').last()).toBeInViewport()
      if (mode === 'combined') {
        // Check the celestial views and precise controls in the same fitted window.
        await panel.getByRole('slider', { name: 'Rotate Earth to set time', exact: true }).scrollIntoViewIfNeeded()
        const audit = await new AxeBuilder({ page }).include('.celestial-form-picker').withTags(accessibilityTags).analyze()
        expect(audit.violations.map((issue) => ({ id: issue.id, targets: issue.nodes.map((node) => node.target) }))).toEqual([])
        await page.screenshot({ path: `screenshots/${variant}-${dark ? 'dark' : 'light'}-${screen.name}.png`, animations: 'disabled' })
      }
      await panel.getByRole('button', { name: 'Done', exact: true }).click()
    }
  })
}

for (const variant of ['celestial', 'lcd'] as const) {
  test(`${variant} inline, wheel-only and editable stepper presentations work in a narrow host`, async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Cross-engine form/input suites cover the shared controls.')
    await page.emulateMedia({ reducedMotion: 'reduce' })
    for (const inline of [false, true]) for (const control of ['both', 'wheel', 'stepper']) {
      await page.goto(`./?input&combined${variant === 'lcd' ? '&lcd' : ''}${inline ? '&inline' : ''}${control === 'both' ? '' : `&${control}`}`)
      if (!inline) await page.getByRole('button', { name: 'Appointment', exact: true }).click()
      const panel = inline ? page.locator('.picker-form-inline') : page.getByRole('dialog')
      expect(await panel.evaluate((element) => element.scrollWidth <= element.clientWidth + 1)).toBe(true)
      expect(await panel.locator('[data-picker-part="content"]').evaluate((element) => element.scrollHeight)).toBeLessThan(1400)
      if (control === 'stepper') {
        await panel.getByRole('spinbutton', { name: 'Year', exact: true }).fill('2030')
        await panel.getByRole('spinbutton', { name: 'Year', exact: true }).press('Tab')
      } else await panel.getByRole('listbox', { name: 'Year', exact: true }).press('ArrowDown')
      const audit = await new AxeBuilder({ page }).include('.celestial-form-picker').withTags(accessibilityTags).analyze()
      expect(audit.violations.map((issue) => ({ id: issue.id, targets: issue.nodes.map((node) => node.target) }))).toEqual([])
    }
  })
}
