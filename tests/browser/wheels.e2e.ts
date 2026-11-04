import { expect, test, type Locator } from '@playwright/test'

async function expectAligned(wheel: Locator) {
  await expect.poll(() => wheel.evaluate((element) => {
    const option = element.querySelector('[aria-selected="true"]')!.getBoundingClientRect()
    const band = element.parentElement!.querySelector('.picker-wheel-selection')!.getBoundingClientRect()
    return Math.abs(option.top - band.top)
  })).toBeLessThan(.6)
}

const configurations = [
  { name: 'date', units: 'year,month,day', control: 'both', inline: false },
  { name: 'time', units: 'hour,minute', control: 'wheel', inline: true },
  { name: 'seconds', units: 'hour,minute,second', control: 'both', inline: false },
  { name: 'date and time', units: 'year,month,day,hour,minute,second', control: 'both', inline: false },
  { name: 'year', units: 'year', control: 'wheel', inline: false },
  { name: 'year and month', units: 'year,month', control: 'stepper', inline: true },
  { name: 'month and day', units: 'month,day', control: 'both', inline: true },
  { name: 'day and time', units: 'day,hour,minute', control: 'wheel', inline: false },
]

for (const variant of ['celestial', 'lcd']) {
  for (const configuration of configurations) test(`${variant}: ${configuration.name} columns have even spacing on desktop and phone`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    for (const width of [1280, 320]) {
      await page.setViewportSize({ width, height: 900 })
      await page.goto(`./?input&units=${configuration.units}${variant === 'lcd' ? '&lcd' : ''}${configuration.inline ? '&inline' : ''}${configuration.control === 'both' ? '' : `&${configuration.control}`}`)
      if (!configuration.inline) await page.getByRole('button', { name: 'Appointment', exact: true }).click()
      const panel = page.locator(configuration.inline ? '.picker-form-inline' : '.picker-form-panel:popover-open')
      const geometry = await panel.locator('[data-picker-part="controlGroup"]').evaluate((group) => {
        const rows: DOMRect[][] = []
        for (const unit of group.children) {
          const box = unit.getBoundingClientRect()
          let row = rows.find((row) => Math.abs(row[0].top - box.top) < 1)
          if (!row) { row = []; rows.push(row) }
          row.push(box)
        }
        return rows.map((row) => ({ widths: row.map((box) => box.width), gaps: row.slice(1).map((box, index) => box.left - row[index].right) }))
      })
      for (const row of geometry) {
        expect(Math.max(...row.widths) - Math.min(...row.widths)).toBeLessThan(.6)
        if (row.gaps.length) {
          expect(Math.min(...row.gaps)).toBeGreaterThanOrEqual(3.5)
          expect(Math.max(...row.gaps) - Math.min(...row.gaps)).toBeLessThan(.6)
        }
      }
      expect(await panel.evaluate((element) => element.scrollWidth <= element.clientWidth + 1)).toBe(true)
      for (const wheel of await panel.getByRole('listbox').all()) await expectAligned(wheel)
    }
  })

  test(`${variant}: wheel, trackpad, drag and external changes keep exact rows and a stationary band`, async ({ page }) => {
    await page.goto(`./?input&timeonly&seconds&wheel${variant === 'lcd' ? '&lcd' : ''}`)
    await page.getByRole('button', { name: 'Appointment', exact: true }).click()
    const panel = page.getByRole('dialog', { name: 'Appointment', exact: true })
    const seconds = panel.getByRole('listbox', { name: 'Seconds', exact: true })
    const selected = seconds.getByRole('option', { selected: true })
    const band = panel.locator('[data-unit="second"] .picker-wheel-selection')
    const box = (await seconds.boundingBox())!
    const height = (await selected.boundingBox())!.height
    const originalBand = await band.boundingBox()
    await seconds.hover()
    await page.mouse.wheel(0, height)
    await expect(selected).toHaveText('01')
    await expectAligned(seconds)
    // Fine trackpad deltas accumulate without moving any text between rows.
    await seconds.dispatchEvent('wheel', { deltaY: height / 2, bubbles: true, cancelable: true })
    await expect(selected).toHaveText('01')
    await expectAligned(seconds)
    await seconds.dispatchEvent('wheel', { deltaY: height / 2, bubbles: true, cancelable: true })
    await expect(selected).toHaveText('02')
    await expectAligned(seconds)
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.mouse.down()
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2 - height * 1.2, { steps: 6 })
    await page.mouse.up()
    await expect(selected).toHaveText('03')
    await expectAligned(seconds)
    expect(await band.boundingBox()).toEqual(originalBand)
    await seconds.press('Home')
    await seconds.dispatchEvent('wheel', { deltaY: height / 2, bubbles: true, cancelable: true })
    await panel.getByRole('listbox', { name: 'Minutes', exact: true }).press('ArrowUp')
    await seconds.dispatchEvent('wheel', { deltaY: height / 2, bubbles: true, cancelable: true })
    await expect(selected).toHaveText('00')
    await expectAligned(seconds)
    await seconds.dispatchEvent('wheel', { deltaY: height / 2, bubbles: true, cancelable: true })
    await expect(selected).toHaveText('01')
    // Assistive/native scroll requests also land on a complete option.
    await seconds.evaluate((element, rowHeight) => { element.scrollTop += rowHeight }, height)
    await expect(selected).toHaveText('02')
    await expectAligned(seconds)
    await seconds.press('Home')
    await seconds.evaluate((element, rowHeight) => {
      for (let n = 0; n < 3; n++) element.dispatchEvent(new WheelEvent('wheel', { deltaY: rowHeight, bubbles: true, cancelable: true }))
    }, height)
    await expect(selected).toHaveText('03')
    await seconds.evaluate((element, rowHeight) => {
      for (const deltaY of [rowHeight, -rowHeight]) element.dispatchEvent(new WheelEvent('wheel', { deltaY, bubbles: true, cancelable: true }))
    }, height)
    await expect(selected).toHaveText('03')
    await expectAligned(seconds)
    await seconds.dispatchEvent('wheel', { deltaY: height / 2, bubbles: true, cancelable: true })
    await panel.getByRole('listbox', { name: 'Minutes', exact: true }).press('ArrowUp')
    await seconds.dispatchEvent('wheel', { deltaY: height / 2, bubbles: true, cancelable: true })
    await expect(selected).toHaveText('03')
    await panel.getByRole('button', { name: 'Clear', exact: true }).click()
    await expect(page.getByTestId('input-date')).toBeEmpty()
    await seconds.getByRole('option', { selected: true }).click()
    await expect(page.getByTestId('input-date')).not.toBeEmpty()
    await panel.getByRole('button', { name: 'Done', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Appointment', exact: true })).toBeFocused()
  })

  test(`${variant}: the form-only picker and standalone wheels use the same snapping`, async ({ page }) => {
    await page.goto(`./?form${variant === 'lcd' ? '&lcd' : ''}`)
    await page.getByRole('button', { name: 'Starts', exact: true }).click()
    const panel = page.getByRole('dialog', { name: 'Starts', exact: true })
    const minutes = panel.getByRole('listbox', { name: 'Minutes', exact: true })
    await minutes.press('Home')
    await minutes.hover()
    await page.mouse.wheel(0, 36)
    await expect(minutes.getByRole('option', { selected: true })).toHaveText('15')
    await expectAligned(minutes)
    await panel.getByRole('button', { name: 'Done', exact: true }).click()
    const year = page.getByRole('region', { name: 'Reusable controls' }).getByRole('listbox', { name: 'Year', exact: true })
    await year.press('Home')
    await year.hover()
    await page.mouse.wheel(0, 36)
    await expect(year.getByRole('option', { selected: true })).toHaveText('1601')
    await expectAligned(year)
  })
}

test('touch swipes select full rows without momentum or an extra click', async ({ browser, browserName }) => {
  test.skip(browserName !== 'chromium', 'Native touch sequences use Chromium’s touch input protocol.')
  const context = await browser.newContext({ hasTouch: true, viewport: { width: 390, height: 844 } })
  const page = await context.newPage()
  const input = await context.newCDPSession(page)
  for (const lcd of [false, true]) {
    await page.goto(`./?input&timeonly&seconds&wheel${lcd ? '&lcd' : ''}`)
    await page.getByRole('button', { name: 'Appointment', exact: true }).click()
    const seconds = page.getByRole('dialog').getByRole('listbox', { name: 'Seconds', exact: true })
    const box = (await seconds.boundingBox())!
    const rowHeight = (await seconds.getByRole('option', { selected: true }).boundingBox())!.height
    const x = box.x + box.width / 2
    const y = box.y + box.height / 2
    await input.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] })
    for (let step = 1; step <= 6; step++) await input.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y - rowHeight * 1.2 * step / 6 }] })
    await input.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
    await expect(seconds.getByRole('option', { selected: true })).toHaveText('01')
    await expectAligned(seconds)
    await page.getByRole('dialog').getByRole('button', { name: 'Done', exact: true }).click()
  }
  await context.close()
})
