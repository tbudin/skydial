import { expect, test } from '@playwright/test'
import { calendarScale, yearScale, civilParts } from 'skydial/astro'

test('orbital selection reaches its target while the scroll columns follow the animation', async ({ page }) => {
  await page.goto('./?popup')
  await page.getByRole('button', { name: /Choose date/ }).click()
  const dialog = page.getByRole('dialog', { name: 'Choose date', exact: true })
  const clickRing = async (name: RegExp, longitude: number) => {
    const ring = dialog.getByRole('slider', { name })
    await ring.scrollIntoViewIfNeeded()
    const point = await ring.evaluate((element, lon) => {
      const point = element.ownerSVGElement!.createSVGPoint()
      point.x = Number(element.getAttribute('cx')) + Number(element.getAttribute('r')) * Math.cos(lon)
      point.y = Number(element.getAttribute('cy')) - Number(element.getAttribute('r')) * Math.sin(lon)
      const screen = point.matrixTransform(element.getScreenCTM()!)
      return { x: screen.x, y: screen.y }
    }, longitude)
    await page.mouse.click(point.x, point.y)
  }
  const june = calendarScale(2028, 'Asia/Singapore').ticks.find((tick) => tick.month === 6 && tick.day === 15)!
  await clickRing(/Day of year/, june.lon)
  await expect(page.getByTestId('popup-date')).toHaveText('2028-06-15T15:59:00.000Z')
  const year = yearScale('jupiter', 2028, 'Asia/Singapore', civilParts(Date.parse('2028-06-15T15:59:00Z'), 'Asia/Singapore')).markers.find((marker) => marker.year === 2031)!
  await clickRing(/Year on Jupiter/, year.lon)
  await expect(page.getByTestId('popup-date')).toHaveText('2031-06-15T15:59:00.000Z')
})

test('clicking a printed month or year selects that label instead of the orbit underneath it', async ({ page }) => {
  await page.goto('./?popup')
  await page.getByRole('button', { name: /Choose date/ }).click()
  const dialog = page.getByRole('dialog', { name: 'Choose date', exact: true })
  await dialog.getByRole('button', { name: 'Select Jun 2028', exact: true }).click()
  await expect(page.getByTestId('popup-date')).toHaveText(/^2028-06-\d{2}T15:59:00.000Z$/)
  const selected = (await page.getByTestId('popup-date').textContent())!
  await dialog.getByRole('button', { name: 'Select year 2030', exact: true }).click()
  await expect(page.getByTestId('popup-date')).toHaveText(selected.replace('2028-', '2030-'))
  await expect(dialog.locator('[data-label="year-pill"]')).toHaveText('2030')
})
