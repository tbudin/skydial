import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

for (const variant of ['celestial', 'lcd']) {
  test(`${variant} month clicks preserve the day and exact values stay steady during illustration motion`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await page.goto(`./?input${variant === 'lcd' ? '&lcd' : ''}`)
    await page.getByRole('button', { name: 'Appointment', exact: true }).click()
    const panel = page.getByRole('dialog', { name: 'Appointment', exact: true })
    await panel.getByRole('button', { name: 'Select Apr 2028', exact: true }).click()
    await expect(page.getByTestId('input-date')).toHaveText('2028-04-30T15:59:00.000Z')
    const readings = await panel.getByRole('listbox', { name: 'Month', exact: true }).evaluate(async (element) => {
      const seen: string[] = []
      const until = performance.now() + 350
      while (performance.now() < until) {
        seen.push(element.querySelector('[aria-selected="true"]')!.textContent!)
        await new Promise(requestAnimationFrame)
      }
      return [...new Set(seen)]
    })
    expect(readings).toEqual([variant === 'lcd' ? '04' : 'Apr'])
    await panel.getByRole('button', { name: 'Select Jun 2028', exact: true }).click()
    await expect(page.getByTestId('input-date')).toHaveText('2028-06-30T15:59:00.000Z')
  })

  test(`${variant} circular focus, fine dates, focused scrolling and keyboard navigation work together`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(`./?input${variant === 'lcd' ? '&lcd' : ''}`)
    await page.getByRole('button', { name: 'Appointment', exact: true }).click()
    const panel = page.getByRole('dialog', { name: 'Appointment', exact: true })
    const day = panel.getByRole('slider', { name: 'Day of year on the calendar ring', exact: true })
    await day.focus()
    await expect(day).toHaveCSS('outline-style', 'none')
    await expect(panel.locator('.orbit-interaction[data-kind="day"] .orbit-focus-ring')).toHaveCSS('opacity', '1')
    const lens = panel.locator('[data-picker-part="orbitLens"]')
    await expect(lens).toHaveCount(0)
    await day.dispatchEvent('wheel', { deltaY: 40, ctrlKey: true, bubbles: true, cancelable: true })
    await expect(page.getByTestId('input-date')).toHaveText('2028-01-31T15:59:00.000Z')
    const point = await day.evaluate((element) => {
      const p = element.ownerSVGElement!.createSVGPoint()
      p.x = Number(element.getAttribute('cx')) + Number(element.getAttribute('r'))
      p.y = Number(element.getAttribute('cy'))
      return { x: p.matrixTransform(element.getScreenCTM()!).x, y: p.matrixTransform(element.getScreenCTM()!).y }
    })
    await page.mouse.move(point.x, point.y)
    await page.mouse.wheel(0, 40)
    await expect(page.getByTestId('input-date')).toHaveText('2028-02-01T15:59:00.000Z')
    await day.press('PageDown')
    await expect(page.getByTestId('input-date')).toHaveText('2028-03-01T15:59:00.000Z')
    await day.press('Home')
    await expect(page.getByTestId('input-date')).toHaveText('2028-01-01T15:59:00.000Z')
    await day.press('ArrowRight')
    await expect(page.getByTestId('input-date')).toHaveText('2028-01-02T15:59:00.000Z')
    const year = panel.getByRole('slider', { name: 'Year on Jupiter’s orbit', exact: true })
    await year.press('PageDown')
    await expect(page.getByTestId('input-date')).toHaveText('2035-12-31T00:00:00.000Z')
    await expect(lens).toHaveCount(0)
    await expect(panel.locator('.orbit-interaction[data-kind="year"] .orbit-focus-ring')).toHaveCSS('opacity', '1')
    await day.focus()
    const audit = await new AxeBuilder({ page }).include('.celestial-form-picker').withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()
    expect(audit.violations.map(({ id, nodes }) => ({ id, targets: nodes.map(({ target }) => target) }))).toEqual([])
    await page.screenshot({ path: `screenshots/orrery-interaction-${variant}.png` })
  })

  test(`${variant} handles stay touch-sized on a phone and grabbing an edge does not jump the date`, async ({ browser, browserName }) => {
    test.skip(browserName === 'firefox', 'Firefox does not emulate mobile touch contexts.')
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, reducedMotion: 'reduce' })
    const page = await context.newPage()
    await page.goto(`http://127.0.0.1:4175/package-demo/?input${variant === 'lcd' ? '&lcd' : ''}`)
    await page.getByRole('button', { name: 'Appointment', exact: true }).tap()
    const panel = page.getByRole('dialog', { name: 'Appointment', exact: true })
    const handle = panel.locator('.orbit-handle-target[data-orbit-kind="day"]')
    const bounds = (await handle.boundingBox())!
    expect(bounds.width).toBeGreaterThanOrEqual(44)
    expect(bounds.height).toBeGreaterThanOrEqual(44)
    await page.mouse.move(bounds.x + bounds.width / 2 + 10, bounds.y + bounds.height / 2)
    await page.mouse.down()
    await expect(page.getByTestId('input-date')).toHaveText('2028-01-31T15:59:00.000Z')
    const lens = panel.locator('[data-picker-part="orbitLens"]')
    await expect(lens).toBeVisible()
    await page.mouse.move(bounds.x + bounds.width / 2 + 10, bounds.y + bounds.height / 2 + 20, { steps: 5 })
    await expect(page.getByTestId('input-date')).not.toHaveText('2028-01-31T15:59:00.000Z')
    await expect(lens).toBeVisible()
    const box = (await lens.boundingBox())!
    const popup = (await panel.boundingBox())!
    expect(box.x).toBeGreaterThanOrEqual(popup.x)
    expect(box.x + box.width).toBeLessThanOrEqual(popup.x + popup.width)
    expect(await panel.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true)
    await page.mouse.up()
    await expect(lens).toHaveCount(0)
    await context.close()
  })
}
