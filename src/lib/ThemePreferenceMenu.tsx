import { useId, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import type { PickerTheme } from './themeContext.js'
import type { ThemeTogglePart } from './themeToggle.js'

interface ThemePreferenceMenuProps {
  theme: PickerTheme
  status: string
  resolvedLabel: string
  labels: { light: string; dark: string; system?: string }
  label: string
  disabled: boolean
  showLabel: boolean
  onSelect: (theme: PickerTheme) => void
  part: (name: ThemeTogglePart, base?: string) => { 'data-theme-toggle-part': string; className: string; style: CSSProperties | undefined }
}

/** A top-layer menu keeps the same spacing and keyboard behaviour in both skins. */
export function ThemePreferenceMenu({ theme, status, resolvedLabel, labels, label, disabled, showLabel, onSelect, part }: ThemePreferenceMenuProps) {
  const id = useId()
  const trigger = useRef<HTMLButtonElement>(null)
  const menu = useRef<HTMLSpanElement>(null)
  const openingIndex = useRef<number | null>(null)
  const [open, setOpen] = useState(false)
  const choices = [{ value: 'light', label: labels.light }, { value: 'dark', label: labels.dark }, { value: 'auto', label: labels.system ?? 'System' }] as const
  const close = (restoreFocus = false) => {
    setOpen(false)
    menu.current?.hidePopover()
    if (restoreFocus) trigger.current?.focus({ preventScroll: true })
  }

  useLayoutEffect(() => {
    const element = menu.current
    const button = trigger.current
    if (!element || !button || !open || !element.matches(':popover-open')) return
    if (disabled) { element.hidePopover(); return }
    const visibleButton = button.querySelector<HTMLElement>('.theme-toggle-preference-label') ?? button
    const position = () => {
      const anchor = visibleButton.getBoundingClientRect()
      const bounds = element.getBoundingClientRect()
      const viewport = window.visualViewport
      const left = viewport?.offsetLeft ?? 0
      const top = viewport?.offsetTop ?? 0
      const width = viewport?.width ?? document.documentElement.clientWidth
      const height = viewport?.height ?? window.innerHeight
      const rtl = getComputedStyle(button).direction === 'rtl'
      const x = rtl ? anchor.right - bounds.width : anchor.left
      const below = anchor.bottom + 4
      const y = below + bounds.height <= top + height - 8 ? below : anchor.top - bounds.height - 4
      element.style.left = `${Math.max(left + 8, Math.min(x, left + width - bounds.width - 8))}px`
      element.style.top = `${Math.max(top + 8, Math.min(y, top + height - bounds.height - 8))}px`
    }
    position()
    const items = element.querySelectorAll<HTMLButtonElement>('[role="menuitemradio"]')
    const selected = theme === 'auto' ? 2 : theme === 'dark' ? 1 : 0
    items[openingIndex.current ?? selected]?.focus({ preventScroll: true })
    openingIndex.current = null
    const resize = new ResizeObserver(position)
    resize.observe(button)
    resize.observe(visibleButton)
    resize.observe(element)
    window.addEventListener('resize', position)
    window.addEventListener('scroll', position, true)
    window.visualViewport?.addEventListener('resize', position)
    window.visualViewport?.addEventListener('scroll', position)
    return () => {
      resize.disconnect()
      window.removeEventListener('resize', position)
      window.removeEventListener('scroll', position, true)
      window.visualViewport?.removeEventListener('resize', position)
      window.visualViewport?.removeEventListener('scroll', position)
    }
  }, [open, disabled, theme])

  return <span className="theme-toggle-menu-host">
    <button ref={trigger} {...part('preference', 'theme-toggle-preference')} type="button" disabled={disabled}
      popoverTarget={id} aria-label={label} aria-haspopup="menu" aria-expanded={open} aria-controls={id}
      title={theme === 'auto' ? `${status} · ${resolvedLabel}` : status}
      onClick={(event) => {
        event.preventDefault()
        if (menu.current?.matches(':popover-open')) close()
        else { menu.current?.showPopover(); setOpen(true) }
      }}
      onKeyDown={(event) => {
        if (!['ArrowDown', 'ArrowUp'].includes(event.key)) return
        event.preventDefault()
        openingIndex.current = event.key === 'ArrowDown' ? 0 : 2
        if (!menu.current?.matches(':popover-open')) { menu.current?.showPopover(); setOpen(true) }
        else {
          menu.current.querySelectorAll<HTMLButtonElement>('[role="menuitemradio"]')[openingIndex.current]?.focus()
          openingIndex.current = null
        }
      }}>
      <span className="theme-toggle-preference-label">
        {showLabel && <span {...part('status', 'theme-toggle-status')} aria-hidden="true">{status}</span>}
        <svg viewBox="0 0 12 12" width="10" height="10" aria-hidden="true"><path d="m3 4.5 3 3 3-3" stroke="currentColor" strokeWidth="1.3" fill="none" /></svg>
      </span>
    </button>
    <span ref={menu} id={id} {...part('menu', 'theme-toggle-menu')} popover="auto" role="menu" aria-label={label}
      onToggle={(event) => setOpen(event.newState === 'open')}
      onBlur={(event) => {
        // Safari can blur a button to the document during an internal pointer click.
        // Native light dismissal handles outside clicks; wait for real focus to settle.
        if (!event.relatedTarget || event.currentTarget.contains(event.relatedTarget)) return
        const element = event.currentTarget
        queueMicrotask(() => { if (menu.current === element && !element.contains(document.activeElement)) close() })
      }}
      onKeyDown={(event) => {
        const items = [...event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="menuitemradio"]')]
        const index = items.indexOf(document.activeElement as HTMLButtonElement)
        if (event.key === 'Escape') {
          event.preventDefault()
          event.stopPropagation()
          close(true)
        } else if (event.key === 'Tab') {
          const element = event.currentTarget
          window.setTimeout(() => { if (menu.current === element && !element.contains(document.activeElement)) close() }, 0)
        } else if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
          event.preventDefault()
          const next = event.key === 'Home' ? 0 : event.key === 'End' ? 2 : (index + (event.key === 'ArrowDown' ? 1 : -1) + 3) % 3
          items[next]?.focus()
        } else if (event.key.length === 1 && event.key !== ' ' && !event.ctrlKey && !event.metaKey && !event.altKey) {
          const next = items.find((item, offset) => offset > index && item.textContent?.trim().toLocaleLowerCase().startsWith(event.key.toLocaleLowerCase()))
            ?? items.find((item) => item.textContent?.trim().toLocaleLowerCase().startsWith(event.key.toLocaleLowerCase()))
          if (next) { event.preventDefault(); next.focus() }
        }
      }}>
      {choices.map((choice) => <button key={choice.value} {...part('option', 'theme-toggle-option')} type="button" role="menuitemradio"
        aria-checked={theme === choice.value} tabIndex={-1} disabled={disabled} onClick={() => { onSelect(choice.value); close(true) }}>
        <span>{choice.label}</span>
        <svg {...part('indicator', 'theme-toggle-check')} viewBox="0 0 12 12" width="12" height="12" aria-hidden="true"><path d="m2 6 2.5 2.5L10 3" stroke="currentColor" strokeWidth="1.5" fill="none" /></svg>
      </button>)}
    </span>
  </span>
}
