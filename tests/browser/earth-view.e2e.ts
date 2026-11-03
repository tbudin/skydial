import { expect, test } from '@playwright/test'

test('city view follows a chosen longitude without changing the clock place or selected instant', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('./')
  const picker = page.getByRole('region', { name: 'Earth time picker' })
  await picker.getByRole('combobox', { name: 'Earth view', exact: true }).selectOption('city')
  await expect(picker.locator('.earth-view-location')).toContainText('Singapore')
  await picker.getByRole('combobox', { name: 'City in view', exact: true }).selectOption('Tokyo')
  await expect(picker.locator('.earth-view-location')).toHaveText('Tokyo · 35.68° N, 139.65° E')
  await expect(page.getByTestId('selected-date')).toHaveText('2026-03-20T12:00:00.000Z')
  await expect(picker.locator('.earth-city-reticle')).toBeVisible()
  await picker.getByRole('button', { name: 'Increase hours' }).click()
  await expect(page.getByTestId('selected-date')).toHaveText('2026-03-20T13:00:00.000Z')
  await expect(picker.getByRole('combobox', { name: 'City in view', exact: true })).toHaveValue('Tokyo')
  await expect(page.getByLabel('earth widget').locator('.widget-value')).toHaveText('21:00')
  await expect(picker.locator('.picker-zone')).toContainText('Time in Singapore')
  await picker.getByRole('combobox', { name: 'Earth view', exact: true }).selectOption('rotation')
  await expect(picker.getByRole('combobox', { name: 'City in view', exact: true })).toHaveCount(0)
  await picker.getByRole('combobox', { name: 'Earth view', exact: true }).selectOption('city')
  await expect(picker.getByRole('combobox', { name: 'City in view', exact: true })).toHaveValue('Tokyo')
  await picker.screenshot({ path: `screenshots/earth-city-${page.context().browser()!.browserType().name()}.png`, animations: 'disabled' })
  expect(errors).toEqual([])
})

test('local city uses the browser time zone and precise location is requested only on a click', async ({ browser }) => {
  const context = await browser.newContext({ timezoneId: 'Asia/Tokyo', viewport: { width: 320, height: 1000 } })
  const page = await context.newPage()
  await page.addInitScript(() => {
    Object.assign(window, { geoRequests: 0 })
    Object.defineProperty(navigator, 'geolocation', { value: {
      getCurrentPosition(success: PositionCallback) {
        const state = window as unknown as { geoRequests: number }
        state.geoRequests++
        success({ coords: { latitude: 40.7128, longitude: -74.006 } } as GeolocationPosition)
      },
    } })
  })
  await page.goto('http://127.0.0.1:4175/package-demo/?time')
  await page.getByRole('combobox', { name: 'Earth view', exact: true }).selectOption('city')
  await page.getByRole('combobox', { name: 'City in view', exact: true }).selectOption('local')
  await expect(page.locator('.earth-view-location')).toHaveText('Tokyo · 35.68° N, 139.65° E · approximate')
  expect(await page.evaluate(() => (window as unknown as { geoRequests: number }).geoRequests)).toBe(0)
  await page.getByRole('button', { name: 'Use my location' }).click()
  await expect(page.locator('.earth-view-location')).toHaveText('Your location · 40.71° N, 74.01° W')
  expect(await page.evaluate(() => (window as unknown as { geoRequests: number }).geoRequests)).toBe(1)
  await expect(page.getByRole('spinbutton', { name: 'Hours', exact: true })).toHaveValue('20')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.screenshot({ path: `screenshots/earth-city-local-${browser.browserType().name()}-mobile.png`, fullPage: true, animations: 'disabled' })
  await context.close()
})

test('location errors keep city selection usable and late device results cannot replace a newer city', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'geolocation', { value: { getCurrentPosition(_success: PositionCallback, error: PositionErrorCallback) {
      error({ code: 1, PERMISSION_DENIED: 1 } as GeolocationPositionError)
    } } })
  })
  await page.goto('./?time')
  await page.getByRole('combobox', { name: 'Earth view', exact: true }).selectOption('city')
  await page.getByRole('button', { name: 'Use my location' }).click()
  await expect(page.getByText(/Location access is blocked/)).toBeVisible()
  await page.evaluate(() => {
    navigator.geolocation.getCurrentPosition = (success) => {
      Object.assign(window, { lateLocation: () => success({ coords: { latitude: 40.7128, longitude: -74.006 } } as GeolocationPosition) })
    }
  })
  await page.getByRole('button', { name: 'Use my location' }).click()
  await expect(page.getByRole('button', { name: 'Locating…' })).toBeDisabled()
  await page.getByRole('combobox', { name: 'City in view', exact: true }).selectOption('London')
  await page.evaluate(() => (window as unknown as { lateLocation: () => void }).lateLocation())
  await expect(page.locator('.earth-view-location')).toHaveText('London · 51.51° N, 0.13° W')
  await expect(page.getByRole('combobox', { name: 'City in view', exact: true })).toHaveValue('London')
})

test('view and camera place support controlled props and remain available for a read-only date', async ({ page }) => {
  await page.goto('./?time&controlledview')
  await page.getByRole('combobox', { name: 'Earth view', exact: true }).selectOption('city')
  await expect(page.getByTestId('camera-view')).toHaveText('city')
  await page.getByRole('combobox', { name: 'City in view', exact: true }).selectOption('Paris')
  await expect(page.getByTestId('camera-place')).toHaveText('Paris')
  await page.getByRole('button', { name: 'Show London from host' }).click()
  await expect(page.locator('.earth-view-location')).toHaveText('London · 51.51° N, 0.13° W')
  await expect(page.getByRole('combobox', { name: 'City in view', exact: true })).toHaveValue('London')
  await page.goto('./?time&readonly')
  await expect(page.getByRole('spinbutton', { name: 'Hours', exact: true })).toBeDisabled()
  await page.getByRole('combobox', { name: 'Earth view', exact: true }).selectOption('city')
  await page.getByRole('combobox', { name: 'City in view', exact: true }).selectOption('Sydney')
  await expect(page.locator('.earth-view-location')).toHaveText('Sydney · 33.87° S, 151.21° E')
  await page.goto('./?time&disabled')
  await expect(page.getByRole('combobox', { name: 'Earth view', exact: true })).toBeDisabled()
})

test('a permitted but unavailable position retries, then provides an honest fallback and coordinates', async ({ page }) => {
  await page.addInitScript(() => {
    Object.assign(window, { geoAttempts: [] })
    Object.defineProperty(navigator, 'geolocation', { value: { getCurrentPosition(_success: PositionCallback, fail: PositionErrorCallback, options: PositionOptions) {
      (window as unknown as { geoAttempts: PositionOptions[] }).geoAttempts.push(options)
      fail({ code: 2 } as GeolocationPositionError)
    } } })
  })
  await page.goto('./?time')
  await page.getByRole('combobox', { name: 'Earth view', exact: true }).selectOption('city')
  await page.getByRole('button', { name: 'Use my location' }).click()
  await expect(page.getByText(/Permission alone could not provide a position/)).toBeVisible()
  await expect(page.locator('.earth-view-location')).toContainText('approximate')
  const attempts = await page.evaluate(() => (window as unknown as { geoAttempts: PositionOptions[] }).geoAttempts)
  expect(attempts).toHaveLength(2)
  expect(attempts[1]).toMatchObject({ enableHighAccuracy: true, maximumAge: 0 })
  await page.getByRole('button', { name: 'Enter coordinates' }).click()
  await page.getByRole('spinbutton', { name: 'Latitude', exact: true }).fill('48.8566')
  await page.getByRole('spinbutton', { name: 'Longitude', exact: true }).fill('2.3522')
  await page.getByRole('button', { name: 'Use coordinates', exact: true }).click()
  await expect(page.locator('.earth-view-location')).toHaveText('Custom location · 48.86° N, 2.35° E')
  await expect(page.getByRole('spinbutton', { name: 'Hours', exact: true })).toHaveValue('20')
})
