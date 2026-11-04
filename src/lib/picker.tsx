import { useCallback, useContext, useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { ClockScope } from '../sim/react.js'
import { ClockContext } from '../sim/context.js'
import { useSimNow } from '../ui/hooks.js'
import { useCelestialTime } from '../sim/hooks.js'
import { clampPickerTime, pickerBounds, pickerFormValue, pickerUnits, pickerTimeAllowed } from '../astro/picker.js'
import { PickerAppearanceContext, usePickerParts } from './appearance.js'
import { DigitalText } from './DigitalText.js'
import { pickerColorStyle } from './colors.js'
import { DEFAULT_PLACE } from './defaults.js'
import { PickerControls, type CelestialControlProps, type PickerControl } from './PickerControls.js'
import { PickerLocalizationProvider, localizedPickerValue, usePickerLocale } from './localization.js'
import { SelectionGuard } from './SelectionGuard.js'

export interface CelestialPickerProps extends Omit<CelestialControlProps, 'date' | 'defaultDate' | 'onDateChange'> {
  /** Nullable, controlled instant; omitting value creates an uncontrolled form field. */
  value?: Date | number | null
  defaultValue?: Date | number | null
  /** Initial view for an empty field; this does not select or submit a value. */
  referenceDate?: Date | number
  onChange?: (value: Date | null) => void
  /** Optional field formatter; submission remains a stable civil ISO value. */
  formatValue?: (value: Date | null) => string
  /** Host/server validation is applied to the native form and accessible error. */
  validationMessage?: string
  onReset?: () => void
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
  /** Optional controls above the shared selection surface. */
  toolbar?: ReactNode
  presentation?: 'popover' | 'inline'
  description?: string
  /** Preferred side/alignment, with automatic viewport collision handling. */
  popoverPlacement?: 'auto' | 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end'
  popoverOffset?: number
}

/** A production form field. Scrolling and stepping are also available as separate components. */
export function CelestialPicker({ value, defaultValue, onChange, clock, onReset, ...props }: CelestialPickerProps) {
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
    if (bounded && !pickerTimeAllowed(Number(bounded), (props.place ?? DEFAULT_PLACE).timeZone, props)) return
    if (!controlled) setOwned(bounded)
    onChange?.(bounded)
  }
  const time = inherit ? {} : clock ? { clock, onDateChange: (next: Date) => onChange?.(next) }
    : { date: selected === null ? clampPickerTime(Number(props.referenceDate ?? fallback), range) : Number(selected), onDateChange: locked ? undefined : (next: Date) => commit(next) }
  return <PickerLocalizationProvider locale={props.locale} hourCycle={props.hourCycle} dir={props.dir} messages={props.messages} labels={props.labels}><PickerAppearanceContext.Provider value={{ styles: props.styles, classNames: props.classNames, variant: props.variant, colors: props.colors }}><ClockScope {...time}><SelectionGuard configuration={props} timeZone={(props.place ?? DEFAULT_PLACE).timeZone}>
    <FormPicker {...props} empty={empty} locked={Boolean(locked)} canClear={!inherit && !clock} onClear={() => commit(null)}
      onReset={() => { if (!controlled && !inherit && !clock) setOwned(initial.current); onReset?.() }} />
  </SelectionGuard></ClockScope></PickerAppearanceContext.Provider></PickerLocalizationProvider>
}

function FormPicker({ empty, locked, canClear, onClear, onReset, label: customLabel, placeholder: customPlaceholder, name, id, form, formatValue, validationMessage,
  required = false, clearable = false, control = 'wheel', children, toolbar, presentation = 'popover', description, styles: _styles, classNames: _classNames, locale, hourCycle, dir: _dir, messages: _messages, popoverPlacement = 'auto', popoverOffset = 6,
  place = DEFAULT_PLACE, size = 'small', theme = 'dark', variant = 'celestial', colors, className = '', style, disabled = false, ...configuration
}: Omit<CelestialPickerProps, 'value' | 'defaultValue' | 'onChange' | 'clock'> & {
  empty: boolean; locked: boolean; canClear: boolean; onClear: () => void; onReset: () => void
}) {
  const part = usePickerParts()
  const i18n = usePickerLocale()
  const messages = i18n.messages
  const label = customLabel ?? (configuration.mode === 'time' ? messages.time : messages.date)
  const placeholder = customPlaceholder ?? messages.choose
  const now = useSimNow()
  const { readOnly } = useCelestialTime()
  const key = useId()
  const fieldId = id ?? `${key}-field`
  const field = useRef<HTMLButtonElement>(null)
  const input = useRef<HTMLInputElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  const pointerInside = useRef(false)
  const [windowState, setWindowState] = useState({ open: false, disabled, presentation })
  const open = windowState.open
  const setOpen = useCallback((next: boolean) => setWindowState({ open: next, disabled, presentation }), [disabled, presentation, setWindowState])
  if (windowState.disabled !== disabled || windowState.presentation !== presentation) setOpen(false)
  const [attempted, setAttempted] = useState(false)
  const units = pickerUnits(configuration)
  const range = pickerBounds(configuration)
  const value = empty ? '' : pickerFormValue(now, place.timeZone, units)
  const localized = locale || hourCycle && units.includes('hour')
  const displayValue = formatValue ? formatValue(empty ? null : new Date(now)) : localized && value ? localizedPickerValue(now, place.timeZone, units, { locale, hourCycle }, variant === 'lcd') : value.replace('T', ' · ')
  const outside = !empty && (now < range.min || now > range.max)
  const unavailable = !empty && !pickerTimeAllowed(now, place.timeZone, configuration)
  const error = validationMessage || (outside ? messages.range : unavailable ? messages.unavailable : required && empty ? messages.required : '')
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
    pointerInside.current = false
    let pointerTimer: ReturnType<typeof setTimeout> | undefined
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
      const end = popoverPlacement === 'auto' ? i18n.dir === 'rtl' || anchor.left + width > viewLeft + viewWidth - padding : i18n.dir === 'rtl' ? !popoverPlacement.endsWith('end') : popoverPlacement.endsWith('end')
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
    const pointerStart = (event: globalThis.PointerEvent) => {
      clearTimeout(pointerTimer)
      pointerInside.current = event.target instanceof Node && element.contains(event.target)
    }
    const pointerEnd = () => {
      // Safari may blur the current wheel to the document before activating a
      // button. Keep the internal gesture alive through its ensuing click.
      pointerTimer = setTimeout(() => { pointerInside.current = false }, 0)
    }
    const focusOutside = (event: FocusEvent) => {
      if (event.target === document.body || event.target === document.documentElement) return
      if (!pointerInside.current && event.target instanceof Node && !element.contains(event.target) && event.target !== field.current) setOpen(false)
    }
    const escape = (event: KeyboardEvent) => {
      // WebKit may leave keyboard focus on the document after a pointer click.
      // Handle Escape there too, before the native popover dismisses itself.
      if (event.key !== 'Escape' || event.defaultPrevented) return
      const active = document.activeElement
      if (active && active !== document.body && active !== document.documentElement && active !== field.current && !element.contains(active)) return
      event.preventDefault()
      setOpen(false)
      field.current?.focus({ preventScroll: true })
    }
    document.addEventListener('pointerdown', pointerStart, true)
    document.addEventListener('pointerup', pointerEnd, true)
    document.addEventListener('pointercancel', pointerEnd, true)
    document.addEventListener('focusin', focusOutside)
    document.addEventListener('keydown', escape)
    return () => {
      clearTimeout(pointerTimer)
      pointerInside.current = false
      document.removeEventListener('pointerdown', pointerStart, true)
      document.removeEventListener('pointerup', pointerEnd, true)
      document.removeEventListener('pointercancel', pointerEnd, true)
      document.removeEventListener('focusin', focusOutside)
      document.removeEventListener('keydown', escape)
      observer.disconnect()
      window.removeEventListener('resize', position)
      window.visualViewport?.removeEventListener('resize', position)
      window.visualViewport?.removeEventListener('scroll', position)
      window.removeEventListener('scroll', scroll, true)
      if (element.matches(':popover-open')) element.hidePopover()
    }
  }, [open, popoverPlacement, popoverOffset, setOpen, i18n.dir])
  const controls = <>
    {toolbar}
    <div {...part('content', customControls ? 'picker-composed-content' : 'picker-controls-content')}>
      {customControls && <div {...part('visual', 'picker-visual-content')}>{children}</div>}
      <div {...part('controls', 'picker-exact-content')}><PickerControls {...configuration} locale={locale} hourCycle={hourCycle} place={place} disabled={disabled} readOnly={frozen} size={size} control={control} /></div>
    </div>
    <div {...part('footer', 'picker-form-actions')}><span {...part('timezone')}>{place.timeZone}</span><div {...part('actions')}>
      <NowButton disabled={disabled || frozen} configuration={configuration} timeZone={place.timeZone} />
      {clearable && canClear && <button {...part('clearButton', '', undefined, { disabled: disabled || frozen || empty })} type="button" disabled={disabled || frozen || empty} onClick={onClear}>{messages?.clear ?? 'Clear'}</button>}
      {presentation === 'popover' && <button type="button" {...part('doneButton', 'picker-form-done')} onClick={() => close(true)}>{messages?.done ?? 'Done'}</button>}
    </div></div>
  </>
  return <div {...part('root', `celestial-clock celestial-control celestial-form-picker ${className}`, { ...pickerColorStyle(colors, variant), ...style })} dir={i18n.dir} lang={i18n.locale} data-picker-theme={theme} data-picker-size={size} data-picker-style={variant}>
    <label {...part('label', 'picker-form-label')} htmlFor={presentation === 'popover' ? fieldId : undefined}>{label}{required && <span aria-hidden="true"> *</span>}</label>
    <span id={`${key}-keyboard`} className="picker-sr-only">{required ? messages?.requiredHint ?? 'Required. ' : ''}{frozen ? messages?.readOnlyHint ?? 'Read only. ' : ''}{messages?.instructions ?? 'Use arrow keys in each scroll column or the minus and plus buttons. Escape closes the picker.'}</span>
    <input ref={input} className="picker-form-value" type="text" name={name} form={form} value={value} onChange={() => {}} tabIndex={-1} aria-hidden="true" required={required} disabled={disabled}
      onInvalid={(event) => { event.preventDefault(); setAttempted(true); (field.current ?? input.current?.parentElement?.querySelector<HTMLElement>('[role="listbox"], [role="spinbutton"]'))?.focus() }} />
    {presentation === 'popover' ? <>
      <button ref={field} id={fieldId} type="button" {...part('field', 'picker-form-trigger', undefined, { disabled, selected: open })} disabled={disabled}
        aria-haspopup="dialog" aria-expanded={open} aria-controls={open ? `${key}-panel` : undefined} aria-invalid={outside || unavailable || Boolean(validationMessage) || attempted && Boolean(error) || undefined}
        aria-describedby={[`${key}-value`, `${key}-keyboard`, description ? descriptionId : '', attempted && error ? errorId : ''].filter(Boolean).join(' ') || undefined}
        onClick={() => setOpen(!open)} onKeyDown={(event) => { if (event.key === 'ArrowDown') { event.preventDefault(); setOpen(true) } }}>
        <span id={`${key}-value`} {...part('value', empty && !formatValue ? 'picker-form-placeholder' : '')}>{variant === 'lcd' && displayValue ? <DigitalText wrap>{displayValue}</DigitalText> : displayValue || placeholder}</span><svg {...part('indicator', 'picker-form-indicator')} width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m4 6 4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
      {open && <div ref={panel} id={`${key}-panel`} popover="auto" role="dialog" aria-label={label} {...part('panel', `picker-form-panel ${customControls ? 'picker-form-scene-panel' : ''}`)}
        onToggle={(event) => { if ((event.nativeEvent as ToggleEvent).newState === 'closed') setOpen(false) }}
        onKeyDown={(event) => { pointerInside.current = false; if (event.key === 'Escape' && !event.defaultPrevented) { event.preventDefault(); close(true) } }}>
        {controls}
      </div>}
    </> : <div id={fieldId} {...part('panel', 'picker-form-inline')} role="group" aria-label={label}>{controls}</div>}
    {description && <p {...part('description', 'picker-form-description')} id={descriptionId}>{description}</p>}
    {(attempted || validationMessage) && error && <p {...part('error', 'picker-form-error')} id={errorId} role="alert">{error}</p>}
  </div>
}

function NowButton({ disabled, configuration, timeZone }: { disabled: boolean; configuration: CelestialControlProps; timeZone: string }) {
  const [systemNow, setSystemNow] = useState(() => Date.now())
  const { selectDate } = useCelestialTime()
  const { messages } = usePickerLocale()
  const part = usePickerParts()
  useEffect(() => { const timer = setInterval(() => setSystemNow(Date.now()), 1000); return () => clearInterval(timer) }, [])
  const blocked = disabled || !pickerTimeAllowed(clampPickerTime(systemNow, configuration), timeZone, configuration)
  return <button {...part('nowButton', '', undefined, { disabled: blocked })} type="button" disabled={blocked} onClick={() => selectDate(clampPickerTime(Date.now(), configuration))}>{messages.now}</button>
}
