import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { closeColours, openColours, previewHeader, setDesignStyle } from './preview.js'

const tags = ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']
const summary = (issues: Awaited<ReturnType<AxeBuilder['analyze']>>['violations']) => issues.map((issue) => ({ id: issue.id, nodes: issue.nodes.map((node) => ({ target: node.target, reason: node.failureSummary })) }))

test('the live builder exposes LCD, custom inks and all precision presets', async ({ page }) => {
  await page.goto('./picker/?style=lcd')
  const example = page.getByRole('region', { name: 'Website form example' })
  const field = example.getByRole('button', { name: 'Starts', exact: true })
  await expect(previewHeader(page).getByRole('button', { name: 'LCD', exact: true })).toHaveAttribute('aria-pressed', 'true')
  for (const preset of ['Year', 'Year & month', 'Date', 'Time', 'Day & time', 'Date & time', 'Seconds']) {
    await page.getByRole('group', { name: 'Picker presets' }).getByRole('button', { name: preset, exact: true }).click()
    await field.click()
    const panel = page.getByRole('dialog', { name: 'Starts', exact: true })
    await expect(panel.locator('canvas')).toHaveCount(0)
    await expect(panel.getByRole('listbox').first()).toBeFocused()
    await panel.getByRole('listbox').last().press('ArrowUp')
    await panel.getByRole('button', { name: 'Done', exact: true }).click()
  }
  const colours = await openColours(page)
  await colours.getByLabel('LCD ink', { exact: true }).fill('#102f38')
  await colours.getByLabel('LCD screen', { exact: true }).fill('#cdebe0')
  await closeColours(page)
  await field.click()
  const panel = page.getByRole('dialog', { name: 'Starts', exact: true })
  await expect(panel).toHaveCSS('background-color', 'rgb(205, 235, 224)')
  await expect(panel.locator('.lcd-orrery')).toHaveCSS('color', 'rgb(16, 47, 56)')
  await panel.getByRole('button', { name: 'Done', exact: true }).click()
  await expect(page.getByRole('region', { name: 'Your component code' })).toContainText('variant="lcd"')
  await expect(page.getByRole('region', { name: 'Your component code' })).toContainText('"foreground":"#102f38"')
  await (await openColours(page)).getByRole('button', { name: 'Use theme colours', exact: true }).click()
  await closeColours(page)
  for (const theme of ['light', 'dark']) {
    await page.setViewportSize({ width: 1440, height: 1100 })
    await previewHeader(page).getByRole('combobox', { name: 'Appearance', exact: true }).selectOption(theme)
    await page.getByRole('group', { name: 'Picker presets' }).getByRole('button', { name: 'Date & time', exact: true }).click()
    await field.click()
    await expect(page.locator('.scale-label.date-pill')).toHaveAttribute('data-visible', 'true')
    await page.screenshot({ path: `screenshots/lcd-${theme}-website.png`, animations: 'disabled' })
    await page.getByRole('dialog').getByRole('button', { name: 'Done', exact: true }).click()
    const audit = await new AxeBuilder({ page }).include('.picker-builder').withTags(tags).analyze()
    expect(summary(audit.violations)).toEqual([])
  }
})

test('widgets stay readable and accessible in both styles, themes and three sizes', async ({ page }) => {
  test.setTimeout(180000)
  await page.goto('./widgets/?style=lcd')
  for (const kind of ['earth', 'moon', 'year', 'orrery']) await page.locator(`[data-widget-example="${kind}"] .component-settings > summary`).click()
  for (const width of [1440, 768, 320]) {
    await page.setViewportSize({ width, height: 1000 })
    for (const variant of ['celestial', 'lcd']) for (const theme of ['light', 'dark']) {
      await setDesignStyle(page, variant)
      await page.getByRole('combobox', { name: 'Appearance', exact: true }).selectOption(theme)
      for (const size of ['Small', 'Medium', 'Large']) {
        for (const kind of ['earth', 'moon', 'year', 'orrery']) {
          const example = page.locator(`[data-widget-example="${kind}"]`)
          await example.getByRole('button', { name: size, exact: true }).click()
          const card = example.locator('.celestial-card')
          const layout = await card.evaluate((element) => {
            const bounds = element.getBoundingClientRect()
            const host = element.parentElement!.getBoundingClientRect()
            const reading = element.querySelector('.widget-copy')!.getBoundingClientRect()
            const scene = element.querySelector('.widget-scene')!.getBoundingClientRect()
            const overlap = reading.left < scene.right - 1 && reading.right > scene.left + 1 && reading.top < scene.bottom - 1 && reading.bottom > scene.top + 1
            return { fits: bounds.width <= host.width + 1, overlap, clippedText: [...element.querySelectorAll<HTMLElement>('.widget-copy > *, select')].filter((el) => getComputedStyle(el).display !== 'none').filter((el) => {
              const box = el.getBoundingClientRect()
              return box.width > 0 && (box.left < bounds.left || box.right > bounds.right + 1 || box.top < bounds.top || box.bottom > bounds.bottom + 1 || el.scrollWidth > el.clientWidth + 1)
            }).map((el) => el.className || el.tagName) }
          })
          expect(layout, `${variant}/${theme}/${size}/${kind}/${width}`).toEqual({ fits: true, overlap: false, clippedText: [] })
          if (variant === 'lcd') await expect(card.locator('canvas')).toHaveCount(0)
        }
        const audit = await new AxeBuilder({ page }).include('[data-gallery-host]').withTags(tags).analyze()
        expect(summary(audit.violations)).toEqual([])
        if (width === 1440 && variant === 'lcd' && size === 'Medium') await page.locator('[data-widget-example="earth"] .widget-preview-panel').screenshot({ path: `screenshots/lcd-widget-earth-${theme}.png` })
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    }
  }
})

test('standalone orbital controls retain keyboard access and adequate targets', async ({ page }) => {
  await page.goto('./orrery/')
  const control = page.getByRole('region', { name: 'Orbital date picker', exact: true })
  await expect(control).toBeVisible()
  const audit = await new AxeBuilder({ page }).include('.orrery-playground').withTags(tags).analyze()
  expect(summary(audit.violations)).toEqual([])
  await control.getByRole('slider', { name: 'Year on Jupiter’s orbit', exact: true }).press('ArrowRight')
  await expect(control.getByRole('slider', { name: 'Year on Jupiter’s orbit', exact: true })).toHaveAttribute('aria-valuenow', '2027')
})
