import { createApp, defineComponent, h, ref } from 'vue'
import { mount, unmount } from 'svelte'
import { CelestialWidget, CelestialThemeToggle } from 'skydial/vue'
import { mountCelestial, type PickerTheme } from 'skydial/dom'
import SvelteDemo from './SvelteDemo.svelte'

export function mountAdapterDemos(host: HTMLElement) {
  const variant = new URLSearchParams(location.search).has('lcd') ? 'lcd' : 'celestial'
  host.innerHTML = '<section class="adapter-host" aria-label="Vue adapter"></section><section class="adapter-host" aria-label="Svelte adapter"></section><section class="adapter-host" aria-label="Vanilla adapter"><div data-adapter-theme></div><div data-adapter-widget></div></section>'
  const vue = createApp(defineComponent({
    setup() {
      const date = ref(new Date('2026-06-01T12:00:00Z'))
      const visible = ref(true)
      const theme = ref<PickerTheme>('auto')
      return () => h('div', [
        h(CelestialThemeToggle, { options: { variant, theme: theme.value, onThemeChange: (value: PickerTheme) => { theme.value = value } } }),
        h('button', { onClick: () => { date.value = new Date('2027-06-01T12:00:00Z') } }, 'Change Vue date'),
        h('button', { onClick: () => { visible.value = !visible.value } }, 'Toggle Vue widget'),
        visible.value ? h(CelestialWidget, { options: { kind: 'year', date: date.value, size: 'medium', theme: theme.value, variant } }) : null,
      ])
    },
  }))
  vue.mount(host.children[0])
  const svelte = mount(SvelteDemo, { target: host.children[1] })
  const vanilla = mountCelestial(host.querySelector<HTMLElement>('[data-adapter-widget]')!, 'widget', { kind: 'moon', date: Date.UTC(2026, 5, 1), variant, theme: 'auto' })
  const appearance = mountCelestial(host.querySelector<HTMLElement>('[data-adapter-theme]')!, 'themeToggle', { variant, onThemeChange: (theme) => vanilla.update({ kind: 'moon', date: Date.UTC(2026, 5, 1), theme, variant }) })
  return () => { vue.unmount(); void unmount(svelte); vanilla.destroy(); appearance.destroy() }
}
