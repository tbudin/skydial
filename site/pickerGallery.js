export function pickerGallery() {
  return `<section class="picker-catalogue" aria-label="Try the pickers"><div data-picker-configurator><p>Loading the picker configurator…</p></div></section>`
}

export function mountPickerGallery(main, { mountPickerConfigurator }) {
  return mountPickerConfigurator(main.querySelector('[data-picker-configurator]'))
}
