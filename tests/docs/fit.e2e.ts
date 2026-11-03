import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { previewHeader, setDesignStyle, openSettings } from './preview.js'

test('date, time and combined popups fit without scrolling their content', async ({ page }) => {
  test.setTimeout(180000)
  await page.goto('./picker/?style=lcd')
  const field = page.getByRole('button', { name: 'Starts', exact: true })
  for (const screen of [{ width: 1280, height: 720 }, { width: 1440, height: 1000 }, { width: 390, height: 844 }, { width: 320, height: 740 }, { width: 844, height: 390 }]) {
    await page.setViewportSize(screen)
    for (const variant of ['lcd', 'celestial']) {
      await setDesignStyle(page, variant)
      for (const preset of ['Date', 'Time', 'Date & time', 'Seconds']) {
        await page.getByRole('group', { name: 'Picker presets' }).getByRole('button', { name: preset, exact: true }).click()
        await field.click()
        const panel = page.getByRole('dialog', { name: 'Starts', exact: true })
        const layout = await panel.evaluate((el) => {
          const content = el.querySelector<HTMLElement>('[data-picker-part="content"]')!
          const bounds = el.getBoundingClientRect()
          const box = content.getBoundingClientRect()
          return {
            contentOverflow: content.scrollHeight - content.clientHeight,
            widthOverflow: content.scrollWidth - content.clientWidth,
            insideViewport: bounds.top >= 0 && bounds.bottom <= innerHeight + 1,
            clipped: Array.from(content.querySelectorAll<HTMLElement>('[data-picker-part="rangeButton"], [data-picker-part="earthPrecisionButton"], [data-picker-part="stepButton"], [role="listbox"]')).filter((item) => {
              const r = item.getBoundingClientRect()
              return r.top < box.top - 1 || r.bottom > box.bottom + 1 || r.left < box.left - 1 || r.right > box.right + 1
            }).map((item) => item.getAttribute('aria-label') ?? item.getAttribute('data-picker-part')),
          }
        })
        expect.soft(layout, `${screen.width}×${screen.height}/${variant}/${preset}`).toEqual({ contentOverflow: 0, widthOverflow: 0, insideViewport: true, clipped: [] })
        if (preset === 'Date & time' && variant === 'lcd' && screen.width === 390) await page.screenshot({ path: 'screenshots/picker-fit-mobile.png' })
        if (preset === 'Date & time' && variant === 'lcd' && screen.width === 1280) await page.screenshot({ path: 'screenshots/picker-fit-combined.png' })
        await panel.getByRole('button', { name: 'Done', exact: true }).click()
      }
    }
  }
})

test('city-facing Earth retains its geography while the high contrast night hemisphere moves', async ({ page }) => {
  await page.goto('./picker/?style=lcd')
  await page.getByRole('group', { name: 'Picker presets' }).getByRole('button', { name: 'Time', exact: true }).click()
  await openSettings(page)
  const settings = page.getByRole('region', { name: 'Configure your picker' })
  await expect(settings.getByRole('combobox', { name: 'Earth view', exact: true })).toHaveValue('city')
  await settings.getByRole('combobox', { name: 'Time zone / city', exact: true }).selectOption('Singapore')
  await page.getByRole('button', { name: 'Starts', exact: true }).click()
  const panel = page.getByRole('dialog', { name: 'Starts', exact: true })
  const land = panel.locator('[data-lcd-feature="land"]')
  const night = panel.locator('[data-lcd-feature="night"]')
  const geography = await land.getAttribute('d')
  const darkness = await night.getAttribute('d')
  await panel.getByRole('listbox', { name: 'Hours', exact: true }).press('PageUp')
  await expect(land).toHaveAttribute('d', geography!)
  await expect(night).not.toHaveAttribute('d', darkness!)
  await expect(night).toHaveAttribute('fill', 'currentColor')
  // Readability and the selected-row focus cue hold in both appearances.
  for (const theme of ['light', 'dark']) {
    await panel.getByRole('button', { name: 'Done', exact: true }).click()
    await previewHeader(page).getByRole('combobox', { name: 'Appearance', exact: true }).selectOption(theme)
    await page.getByRole('button', { name: 'Starts', exact: true }).click()
    const hours = panel.getByRole('listbox', { name: 'Hours', exact: true })
    await hours.press('ArrowDown')
    await expect(hours).toHaveCSS('outline-style', 'none')
    await expect(panel.locator('[data-unit="hour"] .picker-wheel-selection')).toHaveCSS('outline-style', 'solid')
    const audit = await new AxeBuilder({ page }).include('.picker-form-panel').withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()
    expect(audit.violations.map(({ id }) => id)).toEqual([])
  }
})
