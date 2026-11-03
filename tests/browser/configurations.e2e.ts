import { expect, test } from '@playwright/test'

const allUnits = ['year', 'month', 'day', 'hour', 'minute', 'second']
const names: Record<string, string> = { year: 'Year', month: 'Month', day: 'Day', hour: 'Hours', minute: 'Minutes', second: 'Seconds' }

for (const variant of ['celestial', 'lcd']) {
  test(`${variant} precision tabs survive pointer focus changes and retain selection`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    for (const units of [['hour', 'minute'], ['minute', 'second'], ['hour', 'minute', 'second'], ['year', 'month', 'day', 'hour', 'minute', 'second']]) {
      await page.goto(`./?input&units=${units.join(',')}${variant === 'lcd' ? '&lcd' : ''}`)
      await page.getByRole('button', { name: 'Appointment', exact: true }).click()
      const panel = page.getByRole('dialog', { name: 'Appointment', exact: true })
      const precision = panel.getByRole('group', { name: 'Earth drag precision', exact: true })
      const before = await page.getByTestId('input-date').textContent()
      // Model browsers that transiently focus the document before a pointer
      // activation focuses its button. The click must still reach the tab.
      await precision.evaluate((element) => {
        element.addEventListener('pointerdown', () => { document.body.tabIndex = -1; document.body.focus() }, { once: true })
      })
      await precision.getByRole('button', { name: 'Minutes', exact: true }).click()
      await expect(panel).toBeVisible()
      await expect(precision.getByRole('button', { name: 'Minutes', exact: true })).toHaveAttribute('aria-pressed', 'true')
      await page.locator('body').focus()
      await expect(panel).toBeVisible()
      for (const unit of units.filter((unit) => ['hour', 'minute', 'second'].includes(unit)).reverse()) {
        const tab = precision.getByRole('button', { name: names[unit], exact: true })
        await tab.click()
        await expect(panel).toBeVisible()
        await expect(tab).toHaveAttribute('aria-pressed', 'true')
      }
      await expect(page.getByTestId('input-date')).toHaveText(before!)
      await panel.getByRole('button', { name: 'Done', exact: true }).focus()
      await page.keyboard.press('Tab')
      await expect(panel).toHaveCount(0)
    }
  })

  test(`${variant} all 63 unit combinations keep internal controls usable`, async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'The full configuration matrix runs once; focus and selection regressions run in all three engines.')
    test.setTimeout(240000)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    for (let mask = 1; mask < 64; mask++) {
      const units = allUnits.filter((_, index) => mask & 1 << index)
      const inline = mask % 2 === 0
      const control = ['both', 'wheel', 'stepper'][mask % 3]
      const placement = ['auto', 'bottom-start', 'bottom-end', 'top-start', 'top-end'][mask % 5]
      await page.setViewportSize(mask % 3 === 0 ? { width: 390, height: 844 } : mask % 3 === 1 ? { width: 1280, height: 720 } : { width: 844, height: 390 })
      await page.goto(`./?input&units=${units.join(',')}&placement=${placement}${variant === 'lcd' ? '&lcd' : ''}${inline ? '&inline' : ''}${control === 'both' ? '' : `&${control}`}${mask % 2 ? '&dark' : ''}${mask % 3 === 0 ? '&large' : mask % 3 === 1 ? '&medium' : ''}`)
      const trigger = page.getByRole('button', { name: 'Appointment', exact: true })
      if (!inline) await trigger.click()
      const panel = inline ? page.locator('.picker-form-inline') : page.getByRole('dialog', { name: 'Appointment', exact: true })
      await expect(panel).toBeVisible()
      await expect(panel.getByRole(control === 'stepper' ? 'spinbutton' : 'listbox')).toHaveCount(units.length)
      const tabs = panel.getByRole('group', { name: 'Earth drag precision', exact: true })
      const time = units.filter((unit) => ['hour', 'minute', 'second'].includes(unit))
      if (time.length) {
        await expect(tabs.getByRole('button')).toHaveCount(time.length)
        for (const unit of time) {
          const tab = tabs.getByRole('button', { name: names[unit], exact: true })
          await tab.click()
          await expect(panel, `${variant}/${units}/${control}`).toBeVisible()
          await expect(tab).toHaveAttribute('aria-pressed', 'true')
        }
      } else await expect(tabs).toHaveCount(0)
      await panel.getByRole('button', { name: 'Clear', exact: true }).click()
      await expect(panel).toBeVisible()
      await expect(page.getByTestId('input-date')).toBeEmpty()
      await panel.getByRole('button', { name: 'Now', exact: true }).click()
      await expect(panel).toBeVisible()
      await expect(page.getByTestId('input-date')).not.toBeEmpty()
      const editable = panel.getByRole(control === 'stepper' ? 'spinbutton' : 'listbox').last()
      await editable.press(control === 'stepper' ? 'ArrowUp' : 'ArrowDown')
      await expect(panel).toBeVisible()
      if (!inline) {
        await panel.getByRole('button', { name: 'Done', exact: true }).click()
        await expect(panel).toHaveCount(0)
        await expect(trigger).toBeFocused()
      }
    }
  })

  test(`${variant} year-first selection keeps the month and day while year ticks stay fixed`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(`./?input${variant === 'lcd' ? '&lcd' : ''}`)
    await page.getByRole('button', { name: 'Appointment', exact: true }).click()
    const panel = page.getByRole('dialog', { name: 'Appointment', exact: true })
    const year = panel.getByRole('slider', { name: 'Year on Jupiter’s orbit', exact: true })
    await year.press('ArrowRight')
    await expect(page.getByTestId('input-date')).toHaveText('2029-01-31T15:59:00.000Z')
    const marker = panel.locator('[data-label="y2031"]')
    const tick = await marker.getAttribute('data-longitude')
    const handle = panel.locator('.orbit-interaction[data-kind="year"] [data-picker-part="orbitHandle"]')
    const position = await handle.getAttribute('transform')
    await panel.getByRole('slider', { name: 'Day of year on the calendar ring', exact: true }).press('PageDown')
    await expect(page.getByTestId('input-date')).toHaveText('2029-02-28T15:59:00.000Z')
    await expect(handle).not.toHaveAttribute('transform', position!)
    await expect(marker).toHaveAttribute('data-longitude', tick!)
    if (variant === 'lcd') {
      const body = panel.locator('[data-lcd-body="jupiter"]')
      const bodyPosition = await body.getAttribute('transform')
      await panel.getByRole('slider', { name: 'Day of year on the calendar ring', exact: true }).press('ArrowRight')
      await expect(body).not.toHaveAttribute('transform', bodyPosition!)
    }
    await panel.getByRole('slider', { name: 'Day of year on the calendar ring', exact: true }).press('End')
    const before = await page.getByTestId('input-date').textContent()
    const target = panel.locator('.orbit-handle-target[data-orbit-kind="year"]')
    const bounds = (await target.boundingBox())!
    await page.mouse.move(bounds.x + bounds.width / 2 + 5, bounds.y + bounds.height / 2)
    await page.mouse.down()
    await expect(page.getByTestId('input-date')).toHaveText(before!)
    await page.mouse.up()
  })
}
