import type { Action } from 'svelte/action'
import { mountCelestial, type CelestialComponent, type CelestialComponentMap } from '../dom/index.js'

export type CelestialActionOptions = { [K in CelestialComponent]: { component: K; options?: CelestialComponentMap[K] } }[CelestialComponent]

/** Svelte action: `use:celestial={{ component: 'picker', options: { ... } }}`. */
export const celestial: Action<HTMLElement, CelestialActionOptions> = (element, initial) => {
  if (!initial) throw new TypeError('celestial requires a component and options.')
  let kind = initial.component
  let instance = mountCelestial(element, kind, initial.options)
  return {
    update(next) {
      if (next.component !== kind) {
        instance.destroy()
        kind = next.component
        instance = mountCelestial(element, kind, next.options)
      } else instance.update(next.options ?? {})
    },
    destroy() { instance.destroy() },
  }
}
