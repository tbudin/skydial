import { expect, test } from '@playwright/test'

for (const mode of ['', '&combined&seconds&h12', '&combined&seconds&h12&locale=ar-EG']) test(`LCD range field preserves both endpoints on phones ${mode || 'date'}`, async ({ page }) => {
  await page.goto(`./?scheduling&lcd${mode}`)
  const field = page.getByRole('button', { name: 'Booking', exact: true })
  await page.addStyleTag({ content: 'main > form { max-width: 240px; }' })
  for (const width of [320, 390, 768]) {
    await page.setViewportSize({ width, height: 844 })
    const layout = await field.evaluate((element) => {
      const value = element.querySelector<HTMLElement>('[data-picker-part="value"]')!
      const box = value.getBoundingClientRect()
      const indicator = element.querySelector('[data-picker-part="indicator"]')!.getBoundingClientRect()
      const glyphs = [...value.querySelectorAll<HTMLElement>('.lcd-digit, .lcd-punctuation')]
      const centres = glyphs.map((glyph) => { const rect = glyph.getBoundingClientRect(); return (rect.top + rect.bottom) / 2 })
      return {
        fontSize: getComputedStyle(value.querySelector('.lcd-digital-text')!).fontSize,
        oneLine: Math.max(...centres) - Math.min(...centres) < .5,
        overflow: value.scrollWidth - value.clientWidth,
        clipped: glyphs.filter((glyph) => {
          const rect = glyph.getBoundingClientRect()
          return rect.left < box.left - 1 || rect.right > box.right + 1 || rect.top < box.top - 1 || rect.bottom > box.bottom + 1
        }).length,
        overlapsIndicator: glyphs.some((glyph) => {
          const rect = glyph.getBoundingClientRect()
          return rect.left < indicator.right && rect.right > indicator.left && rect.top < indicator.bottom && rect.bottom > indicator.top
        }),
      }
    })
    await page.screenshot({ path: `screenshots/lcd-range-field-${mode ? mode.includes('ar-EG') ? 'rtl' : 'seconds' : 'date'}-${width}.png` })
    expect(layout, `${width}px`).toEqual({ fontSize: '16px', overflow: 0, clipped: 0, overlapsIndicator: false, oneLine: true })
  }
  await field.click()
  const panel = page.getByRole('dialog', { name: 'Booking', exact: true })
  await panel.getByRole('button', { name: mode.includes('ar-EG') ? 'النهاية' : 'End', exact: true }).click()
  await panel.getByRole('button', { name: mode.includes('ar-EG') ? 'تم' : 'Done', exact: true }).click()
  await expect(field).toBeFocused()
})

for (const part of ['field', 'value', 'variable']) test(`LCD field typography respects the consumer's ${part} override`, async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 844 })
  await page.goto(`./?scheduling&lcd&combined&seconds&fieldfont=${part}`)
  const field = page.getByRole('button', { name: 'Booking', exact: true })
  const reading = field.locator('.lcd-digital-text')
  await expect(reading).toHaveCSS('font-size', '20px')
  expect(await reading.evaluate((element) => {
    const box = element.getBoundingClientRect()
    return [...element.querySelectorAll('.lcd-digit, .lcd-punctuation')].every((glyph) => {
      const rect = glyph.getBoundingClientRect()
      return rect.left >= box.left - 1 && rect.right <= box.right + 1 && rect.top >= box.top - 1 && rect.bottom <= box.bottom + 1
    })
  })).toBe(true)
  await page.setViewportSize({ width: 768, height: 844 })
  await expect.poll(() => reading.locator('.lcd-digit').first().evaluate((glyph) => glyph.getBoundingClientRect().height)).toBeCloseTo(20, 1)
  await page.setViewportSize({ width: 320, height: 844 })
  await expect.poll(() => reading.locator('.lcd-digit').first().evaluate((glyph) => glyph.getBoundingClientRect().height)).toBeLessThan(20)
  if (part === 'variable') {
    await page.addStyleTag({ content: '[data-picker-part="field"] { --picker-field-font-size: 14px; }' })
    await expect(reading).toHaveCSS('font-size', '14px')
  }
})
