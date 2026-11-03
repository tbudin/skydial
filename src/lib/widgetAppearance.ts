import type { CSSProperties } from 'react'
import type { CelestialStyle } from './types.js'

export const WIDGET_PARTS = ['root', 'layout', 'content', 'label', 'value', 'caption', 'detail', 'scene', 'bodies', 'body', 'date', 'time'] as const
export type WidgetPart = typeof WIDGET_PARTS[number]
export interface WidgetAppearance {
  styles?: Partial<Record<WidgetPart, CelestialStyle>>
  classNames?: Partial<Record<WidgetPart, string>>
}

export function widgetPart(appearance: WidgetAppearance, part: WidgetPart, className: string, style?: CSSProperties) {
  return {
    'data-widget-part': part,
    className: [className, appearance.classNames?.[part]].filter(Boolean).join(' '),
    style: { ...style, ...appearance.styles?.[part] },
  }
}
