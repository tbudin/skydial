import { usePickerParts, usePickerVariant } from './appearance.js'
import { DigitalText } from './DigitalText.js'
import type { PickerUnit } from '../astro/picker.js'
import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'

export interface WheelItem { value: string; label: string; textValue?: string; disabled?: boolean }

/** Discrete wheel and swipe steps keep every reading aligned with its fixed selection band. */
export function ScrollWheel({ label, items, value, disabled, onSelect, rowHeight: minimumRowHeight = 44, rows = 5, unit, selectionKey = value }: {
  label: string; items: WheelItem[]; value: string; disabled: boolean; onSelect: (value: string) => void
  rowHeight?: number; rows?: 3 | 5; unit?: PickerUnit; selectionKey?: number | string
}) {
  const part = usePickerParts()
  const variant = usePickerVariant()
  const id = useId()
  const column = useRef<HTMLDivElement>(null)
  const [measuredHeight, setMeasuredHeight] = useState(minimumRowHeight)
  const rowHeight = Math.max(minimumRowHeight, measuredHeight)
  const list = useRef<HTMLDivElement>(null)
  const emitted = useRef<string | null>(null)
  const wheelGesture = useRef({ pixels: 0, at: 0, direction: 0 })
  const pointer = useRef<{ id: number; y: number; startY: number; pixels: number } | null>(null)
  const dragged = useRef(false)
  const wheelInput = useRef<(event: WheelEvent) => void>(() => {})
  const index = Math.max(0, items.findIndex((item) => item.value === value))
  const requested = useRef(index)
  useLayoutEffect(() => {
    const host = column.current!
    const measure = () => {
      const option = host.querySelector('[role="option"][aria-selected="true"]')
      if (!option) return
      const text = getComputedStyle(option)
      const glyph = host.querySelector('.picker-wheel-selection .lcd-digital-text')
      const line = Number.parseFloat(text.lineHeight) || Number.parseFloat(text.fontSize) * 1.2
      const glyphHeight = glyph ? Number.parseFloat(getComputedStyle(glyph).fontSize) : 0
      const height = Math.max(minimumRowHeight, Math.ceil(Math.max(line, glyphHeight) + 6))
      setMeasuredHeight((previous) => previous === height ? previous : height)
    }
    const observer = new ResizeObserver(measure)
    observer.observe(host)
    const label = host.querySelector('[data-picker-part="unitLabel"]')
    if (label) observer.observe(label)
    const digits = host.querySelector('.picker-wheel-selection .lcd-digital-text > [aria-hidden]')
    if (digits) observer.observe(digits)
    measure()
    return () => observer.disconnect()
  }, [minimumRowHeight, value, variant])
  useLayoutEffect(() => {
    const element = list.current!
    // External date/orbit changes cancel the current gesture, including when
    // this unit's value stays the same. Our own steps retain sub-row movement.
    const fromGesture = emitted.current === value
    emitted.current = null
    requested.current = index
    if (!fromGesture) {
      wheelGesture.current.pixels = 0
      pointer.current = null
    }
    const synchronize = () => {
      // Children mount before the parent opens its native popover. Scrolling a
      // hidden list is ignored; observe its first visible layout before paint.
      if (!element.clientHeight || Math.abs(element.scrollTop - index * rowHeight) < .5) return
      element.scrollTo({ top: index * rowHeight, behavior: 'instant' })
    }
    synchronize()
    const observer = new ResizeObserver(synchronize)
    observer.observe(element)
    return () => observer.disconnect()
  }, [value, index, items, rowHeight, rows, selectionKey])
  const select = (next: number, force = false) => {
    if (disabled) return
    const target = Math.min(items.length - 1, Math.max(0, next))
    const item = items[target]
    if (!item || item.disabled) return
    if (target === requested.current && !force) return
    requested.current = target
    emitted.current = item.value === value ? null : item.value
    onSelect(item.value)
  }
  const advance = (steps: number) => {
    const direction = Math.sign(steps)
    let next = requested.current
    for (let n = 0; n < Math.abs(steps); n++) {
      let candidate = next + direction
      while (candidate >= 0 && candidate < items.length && items[candidate].disabled) candidate += direction
      if (candidate < 0 || candidate >= items.length) break
      next = candidate
    }
    select(next)
  }
  useLayoutEffect(() => {
    wheelInput.current = (event) => {
      // Keep browser pinch/zoom gestures available.
      if (disabled || event.ctrlKey || !event.deltaY) return
      event.preventDefault()
      const gesture = wheelGesture.current
      const direction = Math.sign(event.deltaY)
      const at = performance.now()
      if (at - gesture.at > 180 || direction !== gesture.direction) gesture.pixels = 0
      gesture.at = at
      gesture.direction = direction
      gesture.pixels += event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? rows * rowHeight : 1)
      const steps = Math.trunc(gesture.pixels / rowHeight)
      if (steps) {
        gesture.pixels -= steps * rowHeight
        advance(steps)
      }
    }
  })
  useEffect(() => {
    const element = list.current!
    const wheel = (event: WheelEvent) => wheelInput.current(event)
    // React's delegated wheel listeners are passive; prevent native fractional scrolling here.
    element.addEventListener('wheel', wheel, { passive: false })
    return () => element.removeEventListener('wheel', wheel)
  }, [])
  const inset = (rows - 1) / 2 * rowHeight
  return <div ref={column} {...part('wheelColumn', `picker-wheel-column ${items[0]?.value.length === 10 ? 'picker-wheel-wide' : ''}`, undefined, { unit })}>
    <span id={`${id}-label`} {...part('unitLabel', 'picker-wheel-label', undefined, { unit })}>{label}</span>
    <div {...part('wheelFrame', 'picker-wheel-frame', undefined, { unit })}>
      <div ref={list} {...part('wheel', 'picker-wheel', { height: rows * rowHeight, paddingBlock: inset }, { unit, disabled })} role="listbox" tabIndex={disabled ? -1 : 0}
        aria-labelledby={`${id}-label`} aria-activedescendant={`${id}-${index}`} aria-disabled={disabled}
        onPointerDown={(event) => {
          if (disabled || event.button !== 0 || !event.isPrimary) return
          wheelGesture.current.pixels = 0
          dragged.current = false
          pointer.current = { id: event.pointerId, y: event.clientY, startY: event.clientY, pixels: 0 }
          event.currentTarget.focus({ preventScroll: true })
        }}
        onPointerMove={(event) => {
          const gesture = pointer.current
          if (!gesture || gesture.id !== event.pointerId || disabled) return
          gesture.pixels += gesture.y - event.clientY
          gesture.y = event.clientY
          if (Math.abs(event.clientY - gesture.startY) > 4) {
            dragged.current = true
            if (!event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.setPointerCapture(event.pointerId)
          }
          const steps = Math.trunc(gesture.pixels / rowHeight)
          if (steps) {
            gesture.pixels -= steps * rowHeight
            advance(steps)
          }
        }}
        onPointerUp={() => { pointer.current = null }} onPointerCancel={() => { pointer.current = null; dragged.current = false }}
        onLostPointerCapture={(event) => {
          // Touch starts with implicit capture on the option. Its bubbled loss
          // must not cancel the gesture when capture transfers to the list.
          if (event.target === event.currentTarget) pointer.current = null
        }}
        onClickCapture={(event) => { if (dragged.current) { event.preventDefault(); event.stopPropagation(); dragged.current = false } }}
        onScroll={(event) => {
          const element = event.currentTarget
          if (Math.abs(element.scrollTop - index * rowHeight) < .5) return
          const next = Math.round(element.scrollTop / rowHeight)
          // Scrollbar/assistive-technology scroll requests use the same exact-row path.
          element.scrollTo({ top: index * rowHeight, behavior: 'instant' })
          select(next)
        }} onKeyDown={(event) => {
          const delta = event.key === 'ArrowDown' ? 1 : event.key === 'ArrowUp' ? -1 : event.key === 'PageDown' ? 5 : event.key === 'PageUp' ? -5 : 0
          if (delta || event.key === 'Home' || event.key === 'End') {
            event.preventDefault()
            wheelGesture.current.pixels = 0
            pointer.current = null
            dragged.current = false
            let next = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : requested.current + delta
            const direction = event.key === 'End' ? -1 : delta < 0 ? -1 : 1
            while (next >= 0 && next < items.length && items[next].disabled) next += direction
            if (next >= 0 && next < items.length) select(next, true)
          }
        }}>
        {items.map((item, i) => <div key={item.value} id={`${id}-${i}`} {...part('wheelOption', 'picker-wheel-option', { height: rowHeight }, { unit, selected: i === index, disabled: item.disabled || disabled })} role="option"
          aria-disabled={item.disabled || undefined} aria-label={item.textValue}
          aria-selected={i === index} onClick={() => select(i, true)}>{item.label}</div>)}
      </div>
      <span {...part('selection', 'picker-wheel-selection', { top: inset, height: rowHeight }, { unit })} aria-hidden="true">{variant === 'lcd' && <DigitalText>{items[index]?.label}</DigitalText>}</span>
    </div>
  </div>
}
