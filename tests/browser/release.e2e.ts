import { expect, test } from '@playwright/test'

test('Vue, Svelte and vanilla integrations mount, react to props and unmount', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('./?adapters')
  const vue = page.getByLabel('Vue adapter')
  const svelte = page.getByLabel('Svelte adapter')
  await expect(vue.locator('.widget-value')).toHaveText('2026')
  await vue.getByRole('button', { name: 'Change Vue date' }).click()
  await expect(vue.locator('.widget-value')).toHaveText('2027')
  await svelte.getByRole('button', { name: 'Change Svelte date' }).click()
  await expect(svelte.locator('.widget-value')).toHaveText('2027')
  await vue.getByRole('button', { name: 'Toggle Vue widget' }).click()
  await expect(vue.locator('.celestial-card')).toHaveCount(0)
  await vue.getByRole('button', { name: 'Toggle Vue widget' }).click()
  await expect(vue.locator('.widget-value')).toHaveText('2027')
  await expect(page.getByLabel('Vanilla adapter').locator('.widget-caption')).not.toBeEmpty()
  expect(errors).toEqual([])
})

test('missing WebGL preserves useful readings and exact date/time controls', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function (kind: string, ...args: unknown[]) {
      if (kind.includes('webgl')) return null
      return original.apply(this, [kind, ...args] as Parameters<typeof original>)
    } as typeof original
  })
  await page.goto('./')
  await expect(page.getByTestId('selected').getByText('3D view unavailable').first()).toBeVisible()
  await page.getByText('Enter an exact date and time', { exact: true }).click()
  await page.getByLabel('Date', { exact: true }).fill('2027-06-15')
  await expect(page.getByTestId('selected-date')).toHaveText('2027-06-15T12:00:00.000Z')
  await expect(page.getByLabel('earth widget').locator('.widget-value')).toHaveText('20:00')
  expect(errors).toEqual([])
})

test('losing a WebGL context falls back while leaving selection usable', async ({ page }) => {
  await page.goto('./?uncontrolled')
  const earth = page.getByRole('slider', { name: 'Rotate Earth to set time' })
  const canvas = earth.locator('canvas')
  await expect(canvas).toBeVisible()
  await canvas.evaluate((element) => element.dispatchEvent(new Event('webglcontextlost', { cancelable: true })))
  await expect(earth.getByText('3D view unavailable')).toBeVisible()
  await page.getByText('Enter an exact date and time', { exact: true }).click()
  await page.getByLabel('Time', { exact: true }).fill('09:30')
  await expect(earth).toHaveAttribute('aria-valuenow', '570')
})
