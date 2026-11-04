import { expect, test } from '@playwright/test'

for (const variant of ['lcd', 'celestial']) test(`${variant}: changing the year preserves month/day and the dial centre`, async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto(`./?input${variant === 'lcd' ? '&lcd' : ''}`)
  await page.getByRole('button', { name: 'Appointment', exact: true }).click()
  const panel = page.getByRole('dialog', { name: 'Appointment', exact: true })
  const stage = panel.locator('.orrery-control-stage')
  const original = (await stage.boundingBox())!
  const year = panel.getByRole('listbox', { name: 'Year', exact: true })
  for (const next of [2029, 2030]) {
    await year.press('ArrowDown')
    await expect(page.getByTestId('input-date')).toHaveText(`${next}-01-31T15:59:00.000Z`)
    const box = (await stage.boundingBox())!
    expect(Math.abs(box.x + box.width / 2 - original.x - original.width / 2)).toBeLessThan(1)
    expect(Math.abs(box.y + box.height / 2 - original.y - original.height / 2)).toBeLessThan(1)
    expect(box.width).toBeCloseTo(original.width, 0)
  }
})
