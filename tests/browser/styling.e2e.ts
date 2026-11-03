import { expect, test } from '@playwright/test'

for (const variant of ['celestial', 'lcd']) test(`${variant} defaults accept consumer stylesheets and named part overrides`, async ({ page }) => {
  await page.goto(`?styling${variant === 'lcd' ? '&lcd' : ''}`)
  await expect(page.getByRole('button', { name: 'Custom date', exact: true })).toHaveCSS('border-radius', '19px')
  await expect(page.locator('.consumer-field')).toHaveCSS('border-color', 'rgb(128, 81, 42)')
  await expect(page.locator('.consumer-label')).toHaveCSS('font-size', '13px')
  await expect(page.locator('.consumer-card .widget-value')).toHaveCSS('font-size', '27px')
  await expect(page.locator('.consumer-card')).toHaveCSS('background-color', 'rgb(242, 228, 204)')
  await expect(page.locator('.consumer-card')).toHaveCSS('border-radius', '17px')
  await expect(page.locator('.consumer-display')).toHaveCSS('padding-left', '23px')
  await expect(page.locator('.consumer-display')).toHaveCSS('border-radius', '15px')
  await expect(page.locator('.consumer-date')).toHaveCSS('font-size', '21px')
  await expect(page.getByRole('img', { name: 'Moon', exact: true })).toHaveCSS('background-color', 'rgb(242, 228, 204)')
  await expect(page.getByRole('img', { name: 'Moon', exact: true })).toHaveCSS('border-radius', '8px')
  await expect(page.getByRole('img', { name: 'Mars', exact: true })).toHaveCSS('background-color', 'rgb(220, 230, 240)')
})
