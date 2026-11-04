import { expect, test } from '@playwright/test'

for (const variant of ['celestial', 'lcd']) for (const control of ['both', 'wheel', 'stepper']) test(`${variant} ${control}: a complete date, time, seconds and AM/PM fit a phone`, async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 })
  await page.goto(`./?scheduling&combined&seconds&h12${variant === 'lcd' ? '&lcd' : ''}${control === 'both' ? '' : `&${control}`}`)
  await page.getByRole('button', { name: 'Booking', exact: true }).click()
  const panel = page.getByRole('dialog', { name: 'Booking', exact: true })
  await expect(panel.locator('[data-picker-part="controlGroup"] > [data-unit]')).toHaveCount(7)
  const clipped = await panel.locator('.picker-wheel-selection').evaluateAll((elements) => elements.filter((element) => element.scrollWidth > element.clientWidth + 1).map((element) => element.closest('[data-unit]')!.getAttribute('data-unit')))
  expect(clipped).toEqual([])
  const tops = await panel.locator('.picker-wheel-selection').evaluateAll((elements) => elements.map((element) => element.getBoundingClientRect().top))
  if (tops.length) expect(Math.max(...tops) - Math.min(...tops)).toBeLessThan(.6)
  const inputClipping = await panel.getByRole('spinbutton').evaluateAll((elements) => {
    const context = document.createElement('canvas').getContext('2d')!
    return elements.filter((element) => {
      const input = element as HTMLInputElement
      const style = getComputedStyle(input)
      context.font = style.font
      return context.measureText(input.value).width > input.clientWidth - Number.parseFloat(style.paddingLeft) - Number.parseFloat(style.paddingRight) + 1
    }).map((element) => element.closest('[data-unit]')!.getAttribute('data-unit'))
  })
  expect(inputClipping).toEqual([])
  const content = panel.locator('[data-picker-part="content"]')
  expect(await content.evaluate((element) => element.scrollHeight - element.clientHeight)).toBeLessThanOrEqual(3)
  await expect(panel.getByRole('button', { name: 'Done', exact: true })).toBeInViewport()
})
