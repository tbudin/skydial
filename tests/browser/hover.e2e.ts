import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Locator } from '@playwright/test'
import { calendarScale, yearScale } from 'skydial/astro'

async function ringPoint(ring: Locator, longitude: number) {
  return ring.evaluate((element, lon) => {
    const point = element.ownerSVGElement!.createSVGPoint()
    point.x = Number(element.getAttribute('cx')) + Number(element.getAttribute('r')) * Math.cos(lon)
    point.y = Number(element.getAttribute('cy')) - Number(element.getAttribute('r')) * Math.sin(lon)
    const screen = point.matrixTransform(element.getScreenCTM()!)
    return { x: screen.x, y: screen.y }
  }, longitude)
}

for (const variant of ['celestial', 'lcd']) {
  test(`${variant} orbit previews match selection without changing the value on hover`, async ({ page, browserName }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(`./?input${variant === 'lcd' ? '&lcd' : ''}`)
    await page.getByRole('button', { name: 'Appointment', exact: true }).click()
    const panel = page.getByRole('dialog', { name: 'Appointment', exact: true })
    const day = panel.getByRole('slider', { name: 'Day of year on the calendar ring', exact: true })
    const june = calendarScale(2028, 'Asia/Singapore').ticks.find((tick) => tick.month === 6 && tick.day === 15)!
    const point = await ringPoint(day, june.lon)
    await page.mouse.move(point.x, point.y)
    const preview = panel.getByRole('tooltip')
    await expect(preview).toHaveText(variant === 'lcd' ? '15/06/2028' : '15 Jun 2028')
    await expect(page.getByTestId('input-date')).toHaveText('2028-01-31T15:59:00.000Z')
    expect((await day.getAttribute('aria-describedby'))!.split(' ')).toContain(await preview.getAttribute('id'))
    if (browserName === 'chromium') await panel.screenshot({ path: `screenshots/orbit-day-hover-${variant}.png`, animations: 'disabled' })
    await preview.hover()
    const audit = await new AxeBuilder({ page }).include('.celestial-form-picker').withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()
    expect(audit.violations.map(({ id }) => id)).toEqual([])
    // The accessibility checker opens a temporary tab, ending hover in headed Firefox.
    await page.bringToFront()
    await page.mouse.move(point.x, point.y)
    await preview.hover()
    await expect(preview).toHaveText(variant === 'lcd' ? '15/06/2028' : '15 Jun 2028')
    await page.keyboard.press('Escape')
    await expect(preview).toHaveCount(0)
    await expect(panel).toBeVisible()
    await page.mouse.click(point.x, point.y)
    await expect(page.getByTestId('input-date')).toHaveText('2028-06-15T15:59:00.000Z')
    const year = panel.getByRole('slider', { name: 'Year on Jupiter’s orbit', exact: true })
    const scale = yearScale('jupiter', 2028, 'Asia/Singapore', { month: 6, day: 15, hour: 0, minute: 0, second: 0 })
    for (const [target, expected] of [[2031, '2031-06-15T15:59:00.000Z'], [2038, '2035-12-31T00:00:00.000Z']] as const) {
      const position = await ringPoint(year, scale.markers.find((marker) => marker.year === target)!.lon)
      const before = await page.getByTestId('input-date').textContent()
      await page.mouse.move(position.x, position.y)
      await expect(preview).toHaveText(expected.slice(0, 4))
      await expect(page.getByTestId('input-date')).toHaveText(before!)
      await page.mouse.click(position.x, position.y)
      await expect(page.getByTestId('input-date')).toHaveText(expected)
    }
    await page.mouse.move(1200, 800)
    await expect(preview).toHaveCount(0)
    await page.keyboard.press('Escape')
    await expect(panel).toHaveCount(0)
  })

  test(`${variant} year-only and read-only orbit previews respect the field configuration`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.setViewportSize({ width: 320, height: 740 })
    await page.goto(`./?input&year&dark${variant === 'lcd' ? '&lcd' : ''}`)
    await page.getByRole('button', { name: 'Appointment', exact: true }).click()
    const panel = page.getByRole('dialog', { name: 'Appointment', exact: true })
    const ring = panel.getByRole('slider', { name: 'Year on Jupiter’s orbit', exact: true })
    const marker = yearScale('jupiter', 2028, 'Asia/Singapore', { month: 1, day: 31, hour: 0, minute: 0, second: 0 }).markers.find((marker) => marker.year === 2030)!
    const position = await ringPoint(ring, marker.lon)
    await page.mouse.move(position.x, position.y)
    await expect(panel.getByRole('tooltip')).toHaveText('2030')
    await expect(panel.getByRole('slider')).toHaveCount(1)
    const bounds = (await panel.boundingBox())!
    const tooltip = (await panel.getByRole('tooltip').boundingBox())!
    expect(tooltip.x).toBeGreaterThanOrEqual(bounds.x)
    expect(tooltip.x + tooltip.width).toBeLessThanOrEqual(bounds.x + bounds.width)
    const audit = await new AxeBuilder({ page }).include('.celestial-form-picker').withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()
    expect(audit.violations.map(({ id }) => id)).toEqual([])
    await page.goto(`./?input&readonly${variant === 'lcd' ? '&lcd' : ''}`)
    await page.getByRole('button', { name: 'Appointment', exact: true }).click()
    const readonlyPoint = await ringPoint(ring, marker.lon)
    await page.mouse.move(readonlyPoint.x, readonlyPoint.y)
    await expect(panel.getByRole('tooltip')).toHaveCount(0)
    await expect(page.getByTestId('input-date')).toHaveText('2028-01-31T15:59:00.000Z')
  })
}
