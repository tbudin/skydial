import { createApp, defineComponent, h, ref } from 'vue'
import { mount, unmount } from 'svelte'
import { CelestialWidget } from 'skydial/vue'
import { mountCelestial } from 'skydial/dom'
import SvelteDemo from './SvelteDemo.svelte'

export function mountAdapterDemos(host: HTMLElement) {
  host.innerHTML = '<section class="adapter-host" aria-label="Vue adapter"></section><section class="adapter-host" aria-label="Svelte adapter"></section><section class="adapter-host" aria-label="Vanilla adapter"></section>'
  const vue = createApp(defineComponent({
    setup() {
      const date = ref(new Date('2026-06-01T12:00:00Z'))
      const visible = ref(true)
      return () => h('div', [
        h('button', { onClick: () => { date.value = new Date('2027-06-01T12:00:00Z') } }, 'Change Vue date'),
        h('button', { onClick: () => { visible.value = !visible.value } }, 'Toggle Vue widget'),
        visible.value ? h(CelestialWidget, { options: { kind: 'year', date: date.value, size: 'medium' } }) : null,
      ])
    },
  }))
  vue.mount(host.children[0])
  const svelte = mount(SvelteDemo, { target: host.children[1] })
  const vanilla = mountCelestial(host.children[2] as HTMLElement, 'widget', { kind: 'moon', date: Date.UTC(2026, 5, 1) })
  return () => { vue.unmount(); void unmount(svelte); vanilla.destroy() }
}
