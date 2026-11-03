import { useContext, useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { ClockScope } from '../sim/react.js'
import { ClockContext } from '../sim/context.js'
import { useSimNow } from '../ui/hooks.js'
import { useCelestialTime } from '../sim/hooks.js'
import { clampPickerTime, pickerBounds, pickerFormValue, pickerUnits } from '../astro/picker.js'
import { PickerAppearanceContext, usePickerParts } from './appearance.js'
import { DigitalText } from './DigitalText.js'
import { pickerColorStyle } from './colors.js'
import { DEFAULT_PLACE } from './defaults.js'
import { PickerControls, type CelestialControlProps, type PickerControl } from './PickerControls.js'

export interface CelestialPickerProps extends Omit<CelestialControlProps, 'date' | 'defaultDate' | 'onDateChange'> {
  /** Nullable, controlled instant; omitting value creates an uncontrolled form field. */
  value?: Date | number | null
  defaultValue?: Date | number | null
  onChange?: (value: Date | null) => void
  label?: string
  placeholder?: string
  name?: string
  id?: string
  form?: string
  required?: boolean
  clearable?: boolean
  control?: PickerControl
  /** Celestial content displayed alongside synchronized scroll/step controls. */
  children?: ReactNode
  presentation?: 'popover' | 'inline'
  description?: string
  /** Preferred side/alignment, with automatic viewport collision handling. */
  popoverPlacement?: 'auto' | 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end'
  popoverOffset?: number
  /** Localized action text; unit labels are configured separately with labels. */
  messages?: { now?: string; clear?: string; done?: string; required?: string; range?: string; instructions?: string; requiredHint?: string; readOnlyHint?: string }
}

/** A production form field. Scrolling and stepping are also available as separate components. */
export function CelestialPicker({ value, defaultValue, onChange, clock, ...props }: CelestialPickerProps) {
  const parent = useContext(ClockContext)
  const inherit = Boolean(parent && value === undefined && defaultValue === undefined && !clock && !onChange)
  const controlled = value !== undefined
  const [owned, setOwned] = useState<Date | number | null>(defaultValue ?? null)
  const initial = useRef(defaultValue ?? null)
  const range = pickerBounds(props)
  const [fallback] = useState(() => clampPickerTime(Date.now(), range))
  if (clock && controlled) throw new Error('Provide either clock or value, not both.')
  const selected = controlled ? value : owned
  if (selected !== null && !Number.isFinite(Number(selected))) throw new RangeError('Expected a valid picker value.')
  const empty = !inherit && !clock && selected === null
  const locked = props.readOnly || (controlled && !onChange)
  const commit = (next: Date | null) => {
    if (locked || props.disabled) return
    const bounded = next === null ? null : new Date(clampPickerTime(Number(next), range))
    if (!controlled) setOwned(bounded)
    onChange?.(bounded)
  }
  const time = inherit ? {} : clock ? { clock, onDateChange: (next: Date) => onChange?.(next) }
    : { date: selected === null ? fallback : Number(selected), onDateChange: locked ? undefined : (next: Date) => commit(next) }
  return <PickerAppearanceContext.Provider value={{ styles: props.styles, classNames: props.classNames, variant: props.variant, colors: props.colors }}><ClockScope {...time}>
    <FormPicker {...props} empty={empty} locked={Boolean(locked)} canClear={!inherit && !clock} onClear={() => commit(null)}
      onReset={() => { if (!controlled && !inherit && !clock) setOwned(initial.current) }} />
  </ClockScope></PickerAppearanceContext.Provider>
}

function FormPicker({ empty, locked, canClear, onClear, onReset, label = 'Date', placeholder = 'Choose a value', name, id, form,
  required = false, clearable = false, control = 'wheel', children, presentation = 'popover', description, styles: _styles, classNames: _classNames, messages, popoverPlacement = 'auto', popoverOffset = 6,
  place = DEFAULT_PLACE, size = 'small', theme = 'dark', variant = 'celestial', colors, className = '', style, disabled = false, ...configuration
}: Omit<CelestialPickerProps, 'value' | 'defaultValue' | 'onChange' | 'clock'> & {
  empty: boolean; locked: boolean; canClear: boolean; onClear: () => void; onReset: () => void
}) {
  const part = usePickerParts()
  const now = useSimNow()
  const { selectDate, readOnly } = useCelestialTime()
  const key = useId()
  const fieldId = id ?? `${key}-field`
  const field = useRef<HTMLButtonElement>(null)
  const input = useRef<HTMLInputElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  const [windowState, setWindowState] = useState({ open: false, disabled, presentation })
  const open = windowState.open
  const setOpen = (next: boolean) => setWindowState({ open: next, disabled, presentation })
  if (windowState.disabled !== disabled || windowState.presentation !== presentation) setOpen(false)
  const [attempted, setAttempted] = useState(false)
  const units = pickerUnits(configuration)
  const range = pickerBounds(configuration)
  const value = empty ? '' : pickerFormValue(now, place.timeZone, units)
  const outside = !empty && (now < range.min || now > range.max)
  const error = outside ? messages?.range ?? 'Choose a value within the allowed range.' : required && empty ? messages?.required ?? 'Choose a value.' : ''
  const frozen = locked || readOnly
  const customControls = children != null && children !== false
  const close = (restore = false) => { setOpen(false); if (restore) field.current?.focus({ preventScroll: true }) }
  const descriptionId = `${key}-description`
  const errorId = `${key}-error`
  useEffect(() => { input.current?.setCustomValidity(error) }, [error])
  const reset = useRef(onReset)
  useEffect(() => { reset.current = onReset }, [onReset])
  useEffect(() => {
    const element = input.current?.form
    if (!element) return
    // A task (not a microtask) lets delegated React/ancestor handlers cancel reset.
    const pending = new Set<ReturnType<typeof setTimeout>>()
    const handler = (event: Event) => {
      const timer = setTimeout(() => {
        pending.delete(timer)
        if (!event.defaultPrevented) { reset.current(); setAttempted(false); setWindowState((previous) => ({ ...previous, open: false })) }
      }, 0)
      pending.add(timer)
    }
    element.addEventListener('reset', handler)
    return () => { element.removeEventListener('reset', handler); pending.forEach(clearTimeout) }
  }, [form])
  useLayoutEffect(() => {
    if (!open) return
    const element = panel.current!
    element.showPopover()
    const position = () => {
      const anchor = field.current!.getBoundingClientRect()
      const padding = 8
      const topPadding = Math.max(padding, Number.parseFloat(getComputedStyle(element).getPropertyValue('--picker-viewport-inset-top')) || 0)
      const offset = Math.max(0, popoverOffset)
      const width = element.getBoundingClientRect().width
      const viewport = window.visualViewport
      const viewTop = viewport?.offsetTop ?? 0
      const viewLeft = viewport?.offsetLeft ?? 0
      const viewHeight = viewport?.height ?? window.innerHeight
      const viewWidth = viewport?.width ?? window.innerWidth
      const below = Math.max(0, viewTop + viewHeight - anchor.bottom - offset - padding)
      const above = Math.max(0, anchor.top - viewTop - offset - topPadding)
      const viewportSpace = Math.max(0, viewHeight - topPadding - padding)
      // Measure the responsive layout against the whole viewport first. A popup
      // that fits there can shift away from its anchor instead of cropping it.
      element.style.setProperty('--picker-available-height', `${viewportSpace}px`)
      const content = element.querySelector<HTMLElement>('[data-picker-part="content"]')
      const border = element.offsetHeight - element.clientHeight
      const naturalHeight = element.scrollHeight + Math.max(0, (content?.scrollHeight ?? 0) - (content?.clientHeight ?? 0)) + border
      const preferredTop = popoverPlacement.startsWith('top')
      const fitsPreferred = (preferredTop ? above : below) >= naturalHeight
      const topSide = fitsPreferred ? preferredTop : above > below
      const useViewport = Math.max(above, below) < naturalHeight
      const available = useViewport ? viewportSpace : topSide ? above : below
      element.style.setProperty('--picker-available-height', `${available}px`)
      const height = element.getBoundingClientRect().height
      const end = popoverPlacement.endsWith('end') || popoverPlacement === 'auto' && anchor.left + width > viewLeft + viewWidth - padding
      const left = end ? anchor.right - width : anchor.left
      element.style.left = `${Math.max(viewLeft + padding, Math.min(left, viewLeft + viewWidth - width - padding))}px`
      const desiredTop = topSide ? anchor.top - offset - height : anchor.bottom + offset
      element.style.top = `${Math.max(viewTop + topPadding, Math.min(desiredTop, viewTop + viewHeight - height - padding))}px`
      element.dataset.placement = `${useViewport ? 'viewport' : topSide ? 'top' : 'bottom'}-${end ? 'end' : 'start'}`
    }
    position()
    const observer = new ResizeObserver(position)
    observer.observe(element)
    observer.observe(field.current!)
    window.addEventListener('resize', position)
    window.visualViewport?.addEventListener('resize', position)
    window.visualViewport?.addEventListener('scroll', position)
    const scroll = (event: Event) => { if (!(event.target instanceof Node) || !element.contains(event.target)) position() }
    window.addEventListener('scroll', scroll, true)
    // Focus precise controls first; decorative/orbital controls remain keyboard reachable.
    const initial = element.querySelector<HTMLElement>('[role="listbox"][tabindex="0"]') ?? element.querySelector<HTMLElement>('input:not(:disabled), button:not(:disabled)')
    initial?.focus({ preventScroll: true })
    initial?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', position)
      window.visualViewport?.removeEventListener('resize', position)
      window.visualViewport?.removeEventListener('scroll', position)
      window.removeEventListener('scroll', scroll, true)
      if (element.matches(':popover-open')) element.hidePopover()
    }
  }, [open, popoverPlacement, popoverOffset])
  const controls = <>
    <div {...part('content', customControls ? 'picker-composed-content' : 'picker-controls-content')}>
      {customControls && <div {...part('visual', 'picker-visual-content')}>{children}</div>}
      <div {...part('controls', 'picker-exact-content')}><PickerControls {...configuration} place={place} disabled={disabled} readOnly={frozen} size={size} control={control} /></div>
    </div>
    <div {...part('footer', 'picker-form-actions')}><span {...part('timezone')}>{place.timeZone}</span><div {...part('actions')}>
      <button {...part('nowButton', '', undefined, { disabled: disabled || frozen })} type="button" disabled={disabled || frozen} onClick={() => selectDate(clampPickerTime(Date.now(), range))}>{messages?.now ?? 'Now'}</button>
      {clearable && canClear && <button {...part('clearButton', '', undefined, { disabled: disabled || frozen || empty })} type="button" disabled={disabled || frozen || empty} onClick={onClear}>{messages?.clear ?? 'Clear'}</button>}
      {presentation === 'popover' && <button type="button" {...part('doneButton', 'picker-form-done')} onClick={() => close(true)}>{messages?.done ?? 'Done'}</button>}
    </div></div>
  </>
  return <div {...part('root', `celestial-clock celestial-control celestial-form-picker ${className}`, { ...pickerColorStyle(colors, variant), ...style })} data-picker-theme={theme} data-picker-size={size} data-picker-style={variant}>
    <label {...part('label', 'picker-form-label')} htmlFor={presentation === 'popover' ? fieldId : undefined}>{label}{required && <span aria-hidden="true"> *</span>}</label>
    <span id={`${key}-keyboard`} className="picker-sr-only">{required ? messages?.requiredHint ?? 'Required. ' : ''}{frozen ? messages?.readOnlyHint ?? 'Read only. ' : ''}{messages?.instructions ?? 'Use arrow keys in each scroll column or the minus and plus buttons. Escape closes the picker.'}</span>
    <input ref={input} className="picker-form-value" type="text" name={name} form={form} value={value} onChange={() => {}} tabIndex={-1} aria-hidden="true" required={required} disabled={disabled}
      onInvalid={(event) => { event.preventDefault(); setAttempted(true); (field.current ?? input.current?.parentElement?.querySelector<HTMLElement>('[role="listbox"], [role="spinbutton"]'))?.focus() }} />
    {presentation === 'popover' ? <>
      <button ref={field} id={fieldId} type="button" {...part('field', 'picker-form-trigger', undefined, { disabled, selected: open })} disabled={disabled}
        aria-haspopup="dialog" aria-expanded={open} aria-controls={open ? `${key}-panel` : undefined} aria-invalid={outside || attempted && Boolean(error) || undefined}
        aria-describedby={[`${key}-value`, `${key}-keyboard`, description ? descriptionId : '', attempted && error ? errorId : ''].filter(Boolean).join(' ') || undefined}
        onClick={() => setOpen(!open)} onKeyDown={(event) => { if (event.key === 'ArrowDown') { event.preventDefault(); setOpen(true) } }}>
        <span id={`${key}-value`} {...part('value', empty ? 'picker-form-placeholder' : '')}>{variant === 'lcd' && value ? <DigitalText>{value.replace('T', ' · ')}</DigitalText> : value ? value.replace('T', ' · ') : placeholder}</span><svg {...part('indicator', 'picker-form-indicator')} width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m4 6 4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
      {open && <div ref={panel} id={`${key}-panel`} popover="auto" role="dialog" aria-label={label} {...part('panel', `picker-form-panel ${customControls ? 'picker-form-scene-panel' : ''}`)}
        onBlurCapture={(event) => { if (event.relatedTarget instanceof Node && !event.currentTarget.contains(event.relatedTarget) && event.relatedTarget !== field.current) close() }}
        onToggle={(event) => { if ((event.nativeEvent as ToggleEvent).newState === 'closed') setOpen(false) }}
        onKeyDown={(event) => { if (event.key === 'Escape' && !event.defaultPrevented) { event.preventDefault(); close(true) } }}>
        {controls}
      </div>}
    </> : <div id={fieldId} {...part('panel', 'picker-form-inline')} role="group" aria-label={label}>{controls}</div>}
    {description && <p {...part('description', 'picker-form-description')} id={descriptionId}>{description}</p>}
    {attempted && error && <p {...part('error', 'picker-form-error')} id={errorId} role="alert">{error}</p>}
  </div>
}
