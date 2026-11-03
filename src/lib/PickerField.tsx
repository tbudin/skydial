import { useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import type { Place } from '../astro/places.js'
import { useSimNow } from '../ui/hooks.js'
import { useCelestialTime } from '../sim/hooks.js'

export type PickerPresentation = 'inline' | 'popover'

/** A compact field with an accessible, top-layer selection window. Changes apply live. */
export function PickerField({ label, mode, place, disabled, children }: {
  label: string; mode: 'date' | 'time' | 'datetime'; place: Place; disabled?: boolean; children: ReactNode
}) {
  const now = useSimNow()
  const { readOnly } = useCelestialTime()
  const [open, setOpen] = useState(false)
  const [previousDisabled, setPreviousDisabled] = useState(disabled)
  if (previousDisabled !== disabled) { setPreviousDisabled(disabled); if (disabled) setOpen(false) }
  const dialog = useRef<HTMLDialogElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const id = useId()
  const date = new Intl.DateTimeFormat('en-GB', { timeZone: place.timeZone, day: 'numeric', month: 'short', year: 'numeric' }).format(now)
  const time = new Intl.DateTimeFormat('en-GB', { timeZone: place.timeZone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(now)
  const value = mode === 'date' ? date : mode === 'time' ? time : `${date} · ${time}`
  const close = () => setOpen(false)
  useLayoutEffect(() => {
    if (!open) return
    const element = dialog.current!
    const returnTo = trigger.current
    element.showModal()
    return () => {
      element.close()
      returnTo?.focus({ preventScroll: true })
    }
  }, [open])
  return <>
    <button ref={trigger} type="button" className="celestial-picker-field" disabled={disabled}
      aria-haspopup="dialog" aria-expanded={open} aria-controls={open ? `${id}-dialog` : undefined}
      onClick={() => setOpen(true)}>
      <span className="picker-field-label">{label}</span>
      <span className="picker-field-value">{value}<span aria-hidden="true">↗</span></span>
      <span className="picker-field-zone">{place.name} · {place.timeZone}{readOnly ? ' · Read only' : ''}</span>
    </button>
    {open && <dialog ref={dialog} id={`${id}-dialog`} className={`celestial-picker-dialog picker-dialog-${mode}`}
      aria-labelledby={`${id}-title`} aria-describedby={`${id}-hint`}
      onCancel={(event) => { event.preventDefault(); close() }} onClose={close}
      onKeyDown={(event) => {
        if (event.key !== 'Tab') return
        const focusable = [...event.currentTarget.querySelectorAll<HTMLElement>('button, input, select, textarea, summary, a[href], [tabindex]')]
          .filter((element) => element.tabIndex >= 0 && !element.matches(':disabled, [aria-disabled="true"]') && element.getClientRects().length > 0)
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
      }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return
        const box = event.currentTarget.getBoundingClientRect()
        if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) close()
      }}>
      <header className="picker-dialog-header">
        <div><h2 id={`${id}-title`}>{label}</h2><p id={`${id}-hint`}>Scroll, swipe or use arrow keys. Selection updates live.</p></div>
        <button type="button" className="picker-done" onClick={close} autoFocus>Done</button>
      </header>
      <div className="picker-dialog-body">{children}</div>
      <footer className="picker-dialog-footer"><output aria-live="polite">{value}</output><span>{place.timeZone}{readOnly ? ' · Read only' : ''}</span></footer>
    </dialog>}
  </>
}
