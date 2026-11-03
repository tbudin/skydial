import { useEffect, useId, useRef, useState, type CSSProperties } from 'react'
import type { PickerTheme } from 'skydial/react'
import ColorSettings from './ColorSettings.js'
import { COLOUR_PRESETS, colourPresetName, coloursForPreset, previewSwatches, useResolvedPreviewTheme } from './previewColors.js'
import { updatePreviewColors, updatePreviewSettings, usePreviewSettings } from './previewSettings.js'

export default function PreviewHeader() {
  const { variant, theme, palettes } = usePreviewSettings()
  const colors = palettes[variant]
  const resolved = useResolvedPreviewTheme(theme)
  const swatches = previewSwatches(variant, resolved, colors)
  const id = useId()
  const panel = useRef<HTMLDivElement>(null)
  const openPicker = useRef<HTMLButtonElement | null>(null)
  const coloursReturn = useRef<HTMLButtonElement | null>(null)
  const pending = useRef(0)
  const [open, setOpen] = useState(false)
  const restorePicker = (trigger: HTMLButtonElement | null) => {
    if (!trigger) return
    window.clearTimeout(pending.current)
    // Let the native dismissal and its queued React toggle settle first. A task
    // also runs when an embedded preview has paused animation frames.
    pending.current = window.setTimeout(() => {
      if (trigger.isConnected && trigger.getAttribute('aria-expanded') === 'false') trigger.click()
    }, 0)
  }
  const compare = (change: () => void) => {
    change()
    restorePicker(openPicker.current)
    openPicker.current = null
  }
  useEffect(() => () => window.clearTimeout(pending.current), [])
  useEffect(() => {
    const root = document.documentElement
    if (theme === 'auto') delete root.dataset.theme
    else root.dataset.theme = theme
    try {
      if (theme === 'auto') localStorage.removeItem('package-site:theme')
      else localStorage.setItem('package-site:theme', theme)
    } catch { /* The live theme does not depend on storage. */ }
    document.querySelector('#g-theme')?.setAttribute('aria-checked', String(resolved === 'dark'))
  }, [theme, resolved])
  return <div className="preview-toolbar" role="group" aria-label="Preview appearance" onPointerDownCapture={() => {
    // Native popovers dismiss on an outside click. Reopen the same preview after
    // a pointer-driven comparison, preserving the component and its selection.
    openPicker.current = document.querySelector<HTMLButtonElement>('[data-picker-part="field"][aria-expanded="true"]')
  }}>
    <span className="preview-toolbar-label">Preview</span>
    <div className="preview-style-switch" role="group" aria-label="Design style">
      <button type="button" aria-pressed={variant === 'celestial'} onMouseDown={(event) => event.preventDefault()} onClick={() => compare(() => updatePreviewSettings({ variant: 'celestial' }))}>3D</button>
      <button type="button" aria-pressed={variant === 'lcd'} onMouseDown={(event) => event.preventDefault()} onClick={() => compare(() => updatePreviewSettings({ variant: 'lcd' }))}>LCD</button>
    </div>
    <label><span className="preview-control-label">Appearance</span><select aria-label="Appearance" value={theme} onChange={(event) => compare(() => updatePreviewSettings({ theme: event.target.value as PickerTheme }))}><option value="light">Light</option><option value="dark">Dark</option><option value="auto">System</option></select></label>
    <label><span className="preview-control-label">Palette</span><select aria-label="Colour palette" value={colourPresetName(colors)} onChange={(event) => compare(() => updatePreviewColors(coloursForPreset(event.target.value, variant)))}><option>Theme defaults</option>{Object.keys(COLOUR_PRESETS).map((name) => <option key={name}>{name}</option>)}<option disabled>Custom</option></select></label>
    <button type="button" className="preview-colours-button" popoverTarget={id} aria-haspopup="dialog" aria-expanded={open} aria-controls={id} onClick={() => { if (!open) coloursReturn.current = openPicker.current; openPicker.current = null }}>
      <span className="preview-colour-swatches" aria-hidden="true" style={{ '--preview-paper': swatches.background, '--preview-ink': swatches.foreground } as CSSProperties}><i /><i /></span>Colours
    </button>
    <div ref={panel} id={id} className="preview-colours-panel" popover="auto" role="dialog" aria-label="Preview colours" onToggle={(event) => {
      setOpen(event.newState === 'open')
      if (event.newState === 'closed') { restorePicker(coloursReturn.current); coloursReturn.current = null }
    }}>
      <div className="preview-colours-heading"><span>Custom colours</span><button type="button" popoverTarget={id} popoverTargetAction="hide">Close</button></div>
      <ColorSettings key={variant} variant={variant} theme={theme} colors={colors} onChange={updatePreviewColors} showPalette={false} />
    </div>
  </div>
}
