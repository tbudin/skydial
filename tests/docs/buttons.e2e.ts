import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { previewHeader } from './preview.js'

for (const variant of ['lcd', 'celestial']) test(`${variant} month labels and step buttons stay aligned across themes and screen sizes`, async ({ page }) => {
  // Each case checks four screen/theme combinations, including an axe scan.
  test.setTimeout(120000)
  await page.goto(`./picker/?style=${variant}`)
  const presets = page.getByRole('group', { name: 'Picker presets' })
  for (const width of [1280, 320]) for (const theme of ['light', 'dark']) {
    await page.setViewportSize({ width, height: 900 })
    await previewHeader(page).getByRole('combobox', { name: 'Appearance', exact: true }).selectOption(theme)
    await presets.getByRole('button', { name: width === 320 ? 'Date & time' : 'Date', exact: true }).click()
    await page.getByRole('button', { name: 'Starts', exact: true }).click()
    const panel = page.getByRole('dialog', { name: 'Starts', exact: true })
    const month = panel.getByRole('listbox', { name: 'Month', exact: true })
    if (variant === 'lcd') {
      const adjacentFont = await month.getByRole('option', { selected: true }).evaluate((el) => getComputedStyle(el).font)
      await expect(panel.locator('[data-unit="month"] .picker-wheel-selection')).toHaveCSS('font', adjacentFont)
    }
    const alignment = await panel.locator('.picker-step-buttons button').evaluateAll((buttons) => buttons.map((button) => {
      const bounds = button.getBoundingClientRect()
      const glyph = button.querySelector('svg')!.getBoundingClientRect()
      return Math.max(Math.abs(bounds.x + bounds.width / 2 - glyph.x - glyph.width / 2), Math.abs(bounds.y + bounds.height / 2 - glyph.y - glyph.height / 2))
    }))
    expect(Math.max(...alignment)).toBeLessThan(.5)
    const increase = panel.getByRole('button', { name: 'Increase month', exact: true })
    const before = await increase.boundingBox()
    const background = await increase.evaluate((el) => getComputedStyle(el).backgroundColor)
    await increase.hover()
    await expect(increase).not.toHaveCSS('background-color', background)
    await expect(increase).toHaveCSS('outline-style', 'none')
    expect(await increase.boundingBox()).toEqual(before)
    await page.mouse.down()
    if (variant === 'lcd') await expect(increase).not.toHaveCSS('box-shadow', 'none')
    expect(await increase.boundingBox()).toEqual(before)
    await page.mouse.move(0, 0)
    await page.mouse.up()
    await month.focus()
    await month.press('Tab')
    const decrease = panel.getByRole('button', { name: 'Decrease month', exact: true })
    await expect(decrease).toBeFocused()
    await expect(decrease).toHaveCSS('outline-style', 'solid')
    await decrease.press('Enter')
    await expect(month.getByRole('option', { selected: true })).toHaveText(variant === 'lcd' ? '02' : 'Feb')
    await increase.click()
    await expect(month.getByRole('option', { selected: true })).toHaveText(variant === 'lcd' ? '03' : 'Mar')
    const audit = await new AxeBuilder({ page }).include('.picker-form-panel:popover-open').withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()
    expect(audit.violations.map(({ id }) => id)).toEqual([])
    await panel.screenshot({ path: `screenshots/picker-buttons-${variant}-${theme}-${width}.png`, animations: 'disabled' })
    await panel.getByRole('button', { name: 'Done', exact: true }).click()
  }
})
