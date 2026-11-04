import 'skydial/style.css'
export { mountCelestial } from 'skydial/dom'
export { CITIES } from 'skydial/astro'
export { SimClock } from 'skydial/clock'

import { createRoot } from 'react-dom/client'
import { createElement } from 'react'
import PickerConfigurator from './PickerConfigurator.js'
import PreviewHeader from './PreviewHeader.js'
import DisplayConfigurator from './DisplayConfigurator.js'
import OrreryPlayground from './OrreryPlayground.js'
import SchedulingPlayground from './SchedulingPlayground.js'
import type { Place } from 'skydial/astro'
export { getPreviewAppearance, subscribePreviewSettings } from './previewSettings.js'

export function mountPreviewHeader() {
  if (document.querySelector('[data-preview-header]')) return { destroy: () => {} }
  const header = document.querySelector<HTMLElement>('header.top')!
  const element = document.createElement('div')
  element.className = 'preview-header-host'
  element.dataset.previewHeader = ''
  header.append(element)
  document.documentElement.dataset.previewControls = ''
  const root = createRoot(element)
  root.render(createElement(PreviewHeader))
  const measure = () => document.documentElement.style.setProperty('--top-h', `${header.offsetHeight}px`)
  const observer = new ResizeObserver(measure)
  observer.observe(header)
  measure()
  return { destroy: () => { root.unmount(); element.remove(); observer.disconnect(); delete document.documentElement.dataset.previewControls; document.documentElement.style.removeProperty('--top-h') } }
}
export function mountPickerConfigurator(element: HTMLElement) {
  const header = mountPreviewHeader()
  const root = createRoot(element)
  root.render(createElement(PickerConfigurator))
  return { destroy: () => { root.unmount(); header.destroy() } }
}
export function mountDisplayConfigurator(element: HTMLElement, options: { date: Date; place: Place }) {
  const root = createRoot(element)
  const update = (next: typeof options) => root.render(createElement(DisplayConfigurator, next))
  update(options)
  return { update, destroy: () => root.unmount() }
}
export function mountOrreryPlayground(element: HTMLElement) {
  const root = createRoot(element)
  root.render(createElement(OrreryPlayground))
  return { destroy: () => root.unmount() }
}

export function mountSchedulingPlayground(element: HTMLElement) {
  const root = createRoot(element)
  root.render(createElement(SchedulingPlayground))
  return { destroy: () => root.unmount() }
}
