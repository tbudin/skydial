import { usePickerParts, usePickerVariant } from './appearance.js'
import { DigitalText } from './DigitalText.js'
import type { PickerUnit } from '../astro/picker.js'
import { useEffect, useId, useLayoutEffect, useRef } from 'react'

export interface WheelItem { value: string; label: string; disabled?: boolean }

/** Native scrolling with an explicit guard for programmatic synchronization. */
export function ScrollWheel({ label, items, value, disabled, onSelect, rowHeight = 44, rows = 5, unit, selectionKey = value }: {
  label: string; items: WheelItem[]; value: string; disabled: boolean; onSelect: (value: string) => void
  rowHeight?: number; rows?: 3 | 5; unit?: PickerUnit; selectionKey?: number | string
}) {
  const part = usePickerParts()
  const variant = usePickerVariant()
  const id = useId()
  const list = useRef<HTMLDivElement>(null)
  const emitted = useRef<string | null>(null)
  const syncing = useRef(false)
  const settle = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const index = Math.max(0, items.findIndex((item) => item.value === value))
  useLayoutEffect(() => {
    const element = list.current!
    // Consume a native-scroll update once. A change from another unit must stop
    // the previous wheel's momentum, even when this unit's value is unchanged.
    const fromScroll = emitted.current === value
    emitted.current = null
    const synchronize = () => {
      // Children mount before the parent opens its native popover. Scrolling a
      // hidden list is ignored; observe its first visible layout before paint.
      if (!element.clientHeight || fromScroll && Math.round(element.scrollTop / rowHeight) === index) return
      syncing.current = true
      element.scrollTo({ top: index * rowHeight, behavior: 'instant' })
    }
    synchronize()
    const observer = new ResizeObserver(synchronize)
    observer.observe(element)
    return () => observer.disconnect()
  }, [value, index, items, rowHeight, rows, selectionKey])
  useEffect(() => () => clearTimeout(settle.current), [value, items])
  const select = (next: number) => {
    if (disabled) return
    const target = Math.min(items.length - 1, Math.max(0, next))
    const item = items[target]
    if (!item || item.disabled) return
    emitted.current = null
    syncing.current = true
    list.current!.scrollTo({ top: target * rowHeight, behavior: 'instant' })
    onSelect(item.value)
  }
  const inset = (rows - 1) / 2 * rowHeight
  return <div {...part('wheelColumn', `picker-wheel-column ${items[0]?.value.length === 10 ? 'picker-wheel-wide' : ''}`, undefined, { unit })}>
    <span id={`${id}-label`} {...part('unitLabel', 'picker-wheel-label', undefined, { unit })}>{label}</span>
    <div {...part('wheelFrame', 'picker-wheel-frame', undefined, { unit })}>
      <div ref={list} {...part('wheel', 'picker-wheel', { height: rows * rowHeight, paddingBlock: inset }, { unit, disabled })} role="listbox" tabIndex={disabled ? -1 : 0}
        aria-labelledby={`${id}-label`} aria-activedescendant={`${id}-${index}`} aria-disabled={disabled}
        onWheelCapture={() => { syncing.current = false }} onPointerDown={() => { syncing.current = false }}
        onScroll={(event) => {
          if (disabled || syncing.current) return
          clearTimeout(settle.current)
          const item = items[Math.min(items.length - 1, Math.max(0, Math.round(event.currentTarget.scrollTop / rowHeight)))]
          if (!item) return
          if (item.disabled) {
            const element = event.currentTarget
            settle.current = setTimeout(() => { syncing.current = true; element.scrollTop = index * rowHeight }, 120)
            return
          }
          if (item.value === value) return
          emitted.current = item.value
          onSelect(item.value)
        }} onKeyDown={(event) => {
          const delta = event.key === 'ArrowDown' ? 1 : event.key === 'ArrowUp' ? -1 : event.key === 'PageDown' ? 5 : event.key === 'PageUp' ? -5 : 0
          if (delta || event.key === 'Home' || event.key === 'End') {
            event.preventDefault()
            let next = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : index + delta
            const direction = event.key === 'End' ? -1 : delta < 0 ? -1 : 1
            while (next >= 0 && next < items.length && items[next].disabled) next += direction
            if (next >= 0 && next < items.length) select(next)
          }
        }}>
        {items.map((item, i) => <div key={item.value} id={`${id}-${i}`} {...part('wheelOption', 'picker-wheel-option', { height: rowHeight }, { unit, selected: i === index, disabled: item.disabled || disabled })} role="option"
          aria-disabled={item.disabled || undefined}
          aria-selected={i === index} onClick={() => select(i)}>{item.label}</div>)}
      </div>
      <span {...part('selection', 'picker-wheel-selection', { top: inset, height: rowHeight }, { unit })} aria-hidden="true">{variant === 'lcd' && <DigitalText>{items[index]?.label}</DigitalText>}</span>
    </div>
  </div>
}
