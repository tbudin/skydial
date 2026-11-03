import { defineComponent, h, onMounted, onBeforeUnmount, ref, watch, type PropType } from 'vue'
import { mountCelestial, type CelestialComponent, type CelestialComponentMap, type CelestialMount } from '../dom/index.js'

function adapter<K extends CelestialComponent>(name: string, kind: K) {
  return defineComponent({
    name,
    props: { options: { type: Object as PropType<CelestialComponentMap[K]>, default: () => ({}) } },
    setup(props) {
      const host = ref<HTMLElement | null>(null)
      let instance: CelestialMount<K> | undefined
      onMounted(() => { if (host.value) instance = mountCelestial(host.value, kind, props.options) })
      watch(() => props.options, (options) => instance?.update(options), { deep: true })
      onBeforeUnmount(() => instance?.destroy())
      return () => h('div', { ref: host })
    },
  })
}

export const CelestialDatePicker = adapter('CelestialDatePicker', 'picker')
export const CelestialInput = adapter('CelestialInput', 'input')
export const CelestialPicker = adapter('CelestialPicker', 'field')
export const CelestialScrollPicker = adapter('CelestialScrollPicker', 'scroll')
export const CelestialStepper = adapter('CelestialStepper', 'stepper')
export const CelestialDateTimePicker = CelestialDatePicker
export const CelestialTimePicker = adapter('CelestialTimePicker', 'time')
export const CelestialWidget = adapter('CelestialWidget', 'widget')
export const CelestialDisplay = adapter('CelestialDisplay', 'display')
export const CelestialBody = adapter('CelestialBody', 'body')
export const CelestialClock = adapter('CelestialClock', 'clock')
export const EarthClock = adapter('EarthClock', 'earth')
export const MoonClock = adapter('MoonClock', 'moon')
export const OrreryClock = adapter('OrreryClock', 'orrery')
