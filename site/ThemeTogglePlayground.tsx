import { useEffect, useState, type CSSProperties } from 'react'
import { CelestialThemeToggle, type PickerColors, type PickerTheme } from 'skydial/react'
import { updatePreviewSettings, usePreviewSettings } from './previewSettings.js'

function Example({ variant, colors, theme, size, disabled, rtl, showLabel, showMenu, lcdArtwork = 'symbols' }: { variant: 'celestial' | 'lcd'; colors: PickerColors; theme: PickerTheme; size: 'small' | 'medium' | 'large'; disabled: boolean; rtl: boolean; showLabel: boolean; showMenu: boolean; lcdArtwork?: 'symbols' | 'illustrations' }) {
  const name = variant === 'celestial' ? '3D' : lcdArtwork === 'symbols' ? 'LCD symbols' : 'LCD illustrated'
  return <article className="theme-toggle-example" dir={rtl ? 'rtl' : 'ltr'} aria-label={`${name} toggle example`}>
    <h3>{name}</h3>
    <CelestialThemeToggle theme={theme} onThemeChange={(next) => updatePreviewSettings({ theme: next })} appearance={theme} variant={variant} colors={colors} size={size} disabled={disabled} showLabel={showLabel} showMenu={showMenu} lcdArtwork={lcdArtwork} />
  </article>
}

export default function ThemeTogglePlayground() {
  useEffect(() => { if (location.hash === '#theme-toggle') document.getElementById('theme-toggle')?.scrollIntoView() }, [])
  const { palettes, theme: appearance, variant } = usePreviewSettings()
  const [size, setSize] = useState<'small' | 'medium' | 'large'>('medium')
  const [disabled, setDisabled] = useState(false)
  const [rtl, setRtl] = useState(false)
  const [showLabel, setShowLabel] = useState(true)
  const [showMenu, setShowMenu] = useState(true)
  return <section className="theme-toggle-playground" id="theme-toggle" aria-labelledby="theme-toggle-title">
    <span className="widget-setting-label">UI elements</span><h2 id="theme-toggle-title">A little switch between day and night.</h2>
    <p>Switch between day and night, or choose System to follow your device. Try any toggle to change this page’s theme.</p>
    <div className="theme-toggle-examples" style={{ '--toggle-demo-gap': '16px' } as CSSProperties}>
      {variant === 'celestial' && <Example variant="celestial" colors={palettes.celestial} theme={appearance} {...{ size, disabled, rtl, showLabel, showMenu }} />}
      <Example variant="lcd" colors={palettes.lcd} theme={appearance} {...{ size, disabled, rtl, showLabel, showMenu }} />
      <Example variant="lcd" lcdArtwork="illustrations" colors={palettes.lcd} theme={appearance} {...{ size, disabled, rtl, showLabel, showMenu }} />
    </div>
    <details className="component-settings"><summary>Toggle settings</summary><div className="theme-toggle-settings">
      <div role="group" aria-label="Toggle size">{(['small', 'medium', 'large'] as const).map((value) => <button key={value} type="button" aria-pressed={size === value} onClick={() => setSize(value)}>{value}</button>)}</div>
      <label><input type="checkbox" checked={disabled} onChange={(event) => setDisabled(event.target.checked)} /> Disabled</label>
      <label><input type="checkbox" checked={rtl} onChange={(event) => setRtl(event.target.checked)} /> Right to left</label>
      <label><input type="checkbox" checked={showLabel} onChange={(event) => setShowLabel(event.target.checked)} /> Show current theme</label>
      <label><input type="checkbox" checked={showMenu} onChange={(event) => setShowMenu(event.target.checked)} /> Show theme menu</label>
    </div></details>
    <pre className="orrery-code"><code>{`import { CelestialThemeToggle } from 'skydial/react'\nimport 'skydial/style.css'\n\n<CelestialThemeToggle\n  theme={theme}\n  onThemeChange={setTheme}\n  appearance="${appearance}"\n  variant="${variant}"\n  size="${size}"${Object.keys(palettes[variant]).length ? `\n  colors={${JSON.stringify(palettes[variant])}}` : ''}${!showLabel ? '\n  showLabel={false}' : ''}${!showMenu ? '\n  showMenu={false}' : ''}${disabled ? '\n  disabled' : ''}${rtl ? '\n  dir="rtl"' : ''}\n/>\n\n<CelestialThemeToggle\n  variant="lcd"\n  lcdArtwork="illustrations"\n  theme={theme}\n  onThemeChange={setTheme}${!showMenu ? '\n  showMenu={false}' : ''}\n/>`}</code></pre>
  </section>
}
