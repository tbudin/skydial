import { expect, test } from '@playwright/test'

for (const variant of ['celestial', 'lcd']) test(`${variant} Vue, Svelte and vanilla theme switches update their host-controlled widgets`, async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' })
  await page.goto(`?adapters${variant === 'lcd' ? '&lcd' : ''}`)
  for (const name of ['Vue adapter', 'Svelte adapter', 'Vanilla adapter']) {
    const region = page.getByLabel(name, { exact: true })
    const control = region.getByRole('switch', { name: 'Dark mode', exact: true })
    const widget = region.locator('.celestial-card')
    for (const theme of ['dark', 'light']) {
      await control.click()
      await expect(widget).toHaveAttribute('data-picker-theme', theme)
      await expect(widget).toHaveAttribute('data-picker-style', variant)
    }
  }
  await page.getByLabel('Vue adapter').getByRole('button', { name: 'Change Vue date' }).click()
  await page.getByLabel('Svelte adapter').getByRole('button', { name: 'Change Svelte date' }).click()
  if (variant === 'celestial') {
    await expect(page.getByLabel('Vue adapter').locator('.widget-value')).toHaveText('2027')
    await expect(page.getByLabel('Svelte adapter').locator('.widget-value')).toHaveText('2027')
  }
})
