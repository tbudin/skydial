import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { openColours, closeColours, previewHeader, setDesignStyle } from './preview.js'

test('compact displays expose formats and all bodies through settings in both styles', async ({ page }) => {
  test.setTimeout(90000)
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('./widgets/?style=lcd')
  const builder = page.locator('.compact-builder')
  const display = builder.locator('.celestial-display')
  await expect(display.locator('time')).toHaveAttribute('datetime', '2026-03-26T12:00:00.000Z')
  await expect(display.locator('input, select, button')).toHaveCount(0)
  await expect(builder.getByRole('combobox', { name: 'Date format', exact: true })).toHaveCount(0)
  await builder.locator('.component-settings > summary').click()
  for (const preset of ['Year', 'Time', 'Date', 'Date & time']) {
    await builder.getByRole('group', { name: 'Compact display presets' }).getByRole('button', { name: preset, exact: true }).click()
    await expect(display.locator('.display-date')).toHaveCount(preset === 'Time' ? 0 : 1)
    await expect(display.locator('.display-time')).toHaveCount(preset === 'Date' || preset === 'Year' ? 0 : 1)
    if (preset === 'Year') { await expect(display.locator('.display-date')).toHaveText('2026'); await expect(display.getByRole('img', { name: 'Jupiter', exact: true })).toHaveCount(1) }
  }
  await builder.getByRole('combobox', { name: 'Time format', exact: true }).selectOption('Seconds')
  await builder.getByRole('combobox', { name: 'Date format', exact: true }).selectOption('Year & month')
  await page.getByRole('combobox', { name: 'Observer city', exact: true }).selectOption('Singapore')
  await expect(display.locator('.display-time .picker-sr-only')).toHaveText('20:00:00')
  for (const body of ['Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Moon']) await builder.getByRole('checkbox', { name: body, exact: true }).check()
  await expect(display.getByRole('img')).toHaveCount(9)
  await expect(display.locator('canvas')).toHaveCount(0)
  for (const theme of ['light', 'dark']) {
    await previewHeader(page).getByRole('combobox', { name: 'Appearance', exact: true }).selectOption(theme)
    const audit = await new AxeBuilder({ page }).include('.compact-builder').withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()
    expect(audit.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((node) => node.failureSummary) }))).toEqual([])
  }
  for (const variant of ['lcd', 'celestial']) {
    await setDesignStyle(page, variant)
    if (variant === 'celestial') await expect(display.locator('canvas')).toHaveCount(9)
    for (const width of [1280, 768, 320]) for (const size of ['small', 'medium', 'large']) {
      await page.setViewportSize({ width, height: 900 })
      await builder.getByRole('combobox', { name: 'Display size', exact: true }).selectOption(size)
      const fits = await display.evaluate((el) => {
        const box = el.getBoundingClientRect()
        return el.scrollWidth <= el.clientWidth + 1 && [...el.querySelectorAll('.display-body, .display-date, .display-time')].every((child) => { const b = child.getBoundingClientRect(); return b.left >= box.left && b.right <= box.right + 1 && b.top >= box.top && b.bottom <= box.bottom + 1 })
      })
      expect(fits, `${variant}/${size}/${width}`).toBe(true)
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    }
  }
  await expect(builder.getByRole('region', { name: 'Compact display code' })).toContainText('"second":"2-digit"')
  expect(errors).toEqual([])
})

test('every page shares one toolbar with palette presets and custom colours together', async ({ page }) => {
  for (const route of ['', 'picker/', 'widgets/', 'orrery/', 'react/', 'vue/', 'svelte/', 'vanilla/', 'astronomy/', 'accessibility/', 'changelog/']) {
    await page.goto(`./${route}?style=lcd`)
    const header = previewHeader(page)
    await expect(header).toHaveCount(1)
    await expect(header.getByRole('button', { name: 'LCD', exact: true })).toBeVisible()
    await expect(header.getByRole('combobox', { name: 'Appearance', exact: true })).toBeVisible()
    await expect(header.getByRole('combobox', { name: 'Colour palette', exact: true })).toHaveCount(0)
    const colours = await openColours(page)
    await expect(colours.getByRole('combobox', { name: 'Colour palette', exact: true })).toBeVisible()
    await expect(colours.getByLabel('LCD ink', { exact: true })).toBeVisible()
    await closeColours(page)
  }
})

test('the orrery uses the inline production picker and separates configuration from selection', async ({ page }) => {
  await page.goto('./orrery/?style=lcd')
  const playground = page.locator('.orrery-playground')
  await expect(playground.locator('.celestial-input-scene')).toBeVisible()
  await expect(playground.locator('input[type="range"], .planet-selector')).toHaveCount(0)
  await expect(playground.getByRole('listbox')).toHaveCount(3)
  await playground.getByRole('listbox', { name: 'Year', exact: true }).press('ArrowDown')
  await expect(playground.locator('input.picker-form-value')).toHaveValue('2027-03-20')
  await playground.locator('.component-settings > summary').click()
  await playground.getByRole('group', { name: 'Year planet', exact: true }).getByRole('button', { name: 'Saturn', exact: true }).click()
  await expect(playground.getByRole('slider', { name: 'Year on Saturn’s orbit', exact: true })).toBeVisible()
  await playground.getByRole('checkbox', { name: 'month', exact: true }).uncheck()
  await playground.getByRole('checkbox', { name: 'day', exact: true }).uncheck()
  await expect(playground.getByRole('listbox')).toHaveCount(1)
  await expect(playground.locator('[data-picker-part="dateBadge"]')).toHaveCount(0)
  await setDesignStyle(page, 'celestial')
  await expect(playground.locator('canvas')).toHaveCount(1)
  await expect(playground.locator('input.picker-form-value')).toHaveValue('2027')
})
