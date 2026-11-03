import type { Page } from '@playwright/test'

export const previewHeader = (page: Page) => page.getByRole('group', { name: 'Preview appearance', exact: true })
export async function setDesignStyle(page: Page, variant: string) {
  await previewHeader(page).getByRole('button', { name: variant === 'lcd' ? 'LCD' : '3D', exact: true }).click()
}
export async function openColours(page: Page) {
  const panel = page.getByRole('dialog', { name: 'Preview colours', exact: true })
  if (!await panel.isVisible()) await previewHeader(page).getByRole('button', { name: 'Colours', exact: true }).click()
  return panel
}
export async function closeColours(page: Page) {
  const panel = page.getByRole('dialog', { name: 'Preview colours', exact: true })
  if (await panel.isVisible()) await panel.getByRole('button', { name: 'Close', exact: true }).click()
}
export async function setPalette(page: Page, name: string) {
  await (await openColours(page)).getByRole('combobox', { name: 'Colour palette', exact: true }).selectOption(name)
  await closeColours(page)
}
export async function openSettings(page: Page, root = '.picker-builder') {
  const details = page.locator(`${root} .component-settings`).first()
  if (await details.getAttribute('open') === null) await details.locator(':scope > summary').click()
}
