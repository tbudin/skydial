import { expect, test } from '@playwright/test'

for (const viewport of [{ width: 320, height: 740 }, { width: 390, height: 844 }, { width: 844, height: 390 }, { width: 1280, height: 720 }]) {
  for (const lcd of [false, true]) for (const mode of ['', '&combined', '&combined&seconds']) test(`range surface ${viewport.width}x${viewport.height} ${lcd ? 'LCD' : '3D'} ${mode || 'date'} fits without scrolling`, async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Geometry matrix runs once; interaction runs in all engines.')
    await page.setViewportSize(viewport)
    await page.goto(`./?scheduling${lcd ? '&lcd' : ''}${mode}`)
    await page.getByRole('button', { name: 'Booking', exact: true }).click()
    const panel = page.getByRole('dialog', { name: 'Booking', exact: true })
    const context = `${viewport.width}x${viewport.height}, ${lcd ? 'LCD' : '3D'}, ${mode || 'date'}`
    const box = (await panel.boundingBox())!
    expect(box.x, context).toBeGreaterThanOrEqual(0)
    expect(box.y, context).toBeGreaterThanOrEqual(0)
    expect(box.x + box.width, context).toBeLessThanOrEqual(viewport.width + 1)
    expect(box.y + box.height, context).toBeLessThanOrEqual(viewport.height + 1)
    const overflow = await panel.locator('[data-picker-part="content"]').evaluate((element) => ({ x: element.scrollWidth - element.clientWidth, y: element.scrollHeight - element.clientHeight }))
    expect(overflow.x, context).toBeLessThanOrEqual(2)
    expect(overflow.y, context).toBeLessThanOrEqual(3)
    await expect(panel.getByRole('button', { name: 'Done', exact: true }), context).toBeInViewport()
  })
}

for (const lcd of [false, true]) test(`${lcd ? 'LCD' : '3D'}: doubled text remains readable and controls reachable`, async ({ page }) => {
  await page.setViewportSize({ width: 640, height: 800 })
  await page.goto(`./?scheduling${lcd ? '&lcd' : ''}`)
  await page.getByRole('button', { name: 'Booking', exact: true }).click()
  await page.evaluate(() => {
    const text = [...document.querySelectorAll<HTMLElement>('body *')].filter((element) => !['STYLE', 'SCRIPT', 'LINK'].includes(element.tagName))
      .map((element) => ({ element, size: Number.parseFloat(getComputedStyle(element).fontSize) }))
    for (const { element, size } of text) if (Number.isFinite(size)) element.style.setProperty('font-size', `${size * 2}px`, 'important')
  })
  const panel = page.getByRole('dialog', { name: 'Booking', exact: true })
  await expect(panel.getByRole('button', { name: 'Done', exact: true })).toBeInViewport()
  expect(await panel.evaluate((element) => element.scrollWidth <= element.clientWidth + 1)).toBe(true)
  const clipped = () => panel.locator('[data-picker-part="selection"], [data-picker-part="wheelOption"][aria-selected="true"], [data-picker-part="rangeTab"], [data-picker-part="doneButton"]').evaluateAll((elements) => elements.filter((element) => element.scrollWidth > element.clientWidth + 2).map((element) => element.getAttribute('data-picker-part')))
  await expect.poll(clipped).toEqual([])
  await panel.getByRole('button', { name: 'End', exact: true }).click()
  await panel.getByRole('listbox', { name: 'Day', exact: true }).press('ArrowDown')
  await panel.getByRole('button', { name: 'Done', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Booking', exact: true })).toBeFocused()
})
