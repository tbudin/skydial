import { expect, test } from '@playwright/test'
import { calendarScale, yearScale } from 'skydial/astro'
import { previewHeader, openSettings } from './preview.js'

for (const variant of ['lcd', 'celestial']) test(`${variant} hover previews follow the configured calendar units and can be styled`, async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto(`./picker/?style=${variant}`)
  await openSettings(page)
  const settings = page.getByRole('region', { name: 'Configure your picker' })
  await settings.getByRole('combobox', { name: 'Element to style', exact: true }).selectOption('orbitPreview')
  await settings.getByRole('textbox', { name: 'CSS properties', exact: true }).fill('{"fontSize":14,"borderRadius":0}')
  for (const theme of ['light', 'dark']) {
    await previewHeader(page).getByRole('combobox', { name: 'Appearance', exact: true }).selectOption(theme)
    for (const unit of ['year', 'month', 'day']) {
      await settings.getByRole('checkbox', { name: unit, exact: true }).check()
      for (const other of ['year', 'month', 'day', 'hour', 'minute', 'second'].filter((item) => item !== unit)) await settings.getByRole('checkbox', { name: other, exact: true }).uncheck()
      await page.getByRole('button', { name: 'Starts', exact: true }).click()
      const panel = page.getByRole('dialog', { name: 'Starts', exact: true })
      const ring = panel.getByRole('slider')
      const longitude = unit === 'year'
        ? yearScale('jupiter', 2026, 'Europe/London', { month: 3, day: 20, hour: 0, minute: 0, second: 0 }).markers.find((marker) => marker.year === 2030)!.lon
        : calendarScale(2026, 'Europe/London').ticks.find((tick) => tick.month === (unit === 'month' ? 6 : 3) && tick.day === 15)!.lon
      const point = await ring.evaluate((el, lon) => {
        const p = el.ownerSVGElement!.createSVGPoint()
        p.x = Number(el.getAttribute('cx')) + Number(el.getAttribute('r')) * Math.cos(lon)
        p.y = Number(el.getAttribute('cy')) - Number(el.getAttribute('r')) * Math.sin(lon)
        const screen = p.matrixTransform(el.getScreenCTM()!)
        return { x: screen.x, y: screen.y }
      }, longitude)
      await page.mouse.move(point.x, point.y)
      const preview = panel.getByRole('tooltip')
      await expect(preview).toHaveText({ year: '2030', month: variant === 'lcd' ? '06' : 'Jun', day: '15' }[unit]!)
      await expect(preview).toHaveCSS('font-size', '14px')
      await expect(preview).toHaveCSS('border-radius', '0px')
      if (unit === 'year' && theme === 'light') await panel.screenshot({ path: `screenshots/orbit-hover-${variant}.png`, animations: 'disabled' })
      await panel.getByRole('button', { name: 'Done', exact: true }).click()
    }
  }
})
