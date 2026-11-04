import { useLayoutEffect, useRef } from 'react'

const segments = [
  '2,1 10,1 12,3 10,5 2,5 0,3', '11,4 13,6 13,14 11,16 9,14 9,6',
  '11,17 13,19 13,27 11,29 9,27 9,19', '2,28 10,28 12,30 10,32 2,32 0,30',
  '0,17 2,19 2,27 0,29 -2,27 -2,19', '0,4 2,6 2,14 0,16 -2,14 -2,6',
  '2,14 10,14 12,16 10,18 2,18 0,16',
]
const digits = ['1111110', '0110000', '1101101', '1111001', '0110011', '1011011', '1011111', '1110000', '1111111', '1111011']

/** Vector LCD segments with a single readable text alternative. No font download. */
export function DigitalText({ children, fit = false }: { children: string; fit?: boolean }) {
  const host = useRef<HTMLSpanElement>(null)
  const reading = useRef<HTMLSpanElement>(null)
  useLayoutEffect(() => {
    const root = host.current
    const line = reading.current
    if (!fit || !root || !line) return
    const measure = () => {
      const available = root.clientWidth
      const natural = line.scrollWidth
      if (!available || !natural) return
      const scale = String(Math.min(1, available / natural))
      if (root.style.getPropertyValue('--lcd-fit-scale') !== scale) root.style.setProperty('--lcd-fit-scale', scale)
    }
    const observer = new ResizeObserver(measure)
    observer.observe(root)
    observer.observe(line)
    measure()
    let active = true
    document.fonts?.ready.then(() => { if (active) measure() }).catch(() => {})
    return () => { active = false; observer.disconnect() }
  }, [children, fit])
  if (!/\d/.test(children)) return children
  // The screen-reader value stays complete; only field artwork scales to fit.
  return <span ref={host} className={`lcd-digital-text${fit ? ' lcd-text-fit' : ''}`}><span className="picker-sr-only">{children}</span><span ref={reading} aria-hidden="true" dir={fit ? 'ltr' : undefined}>{glyphs(fit ? children.replace(/[\u200e\u200f\u061c]/g, '') : children)}</span></span>
}

function glyphs(text: string) {
  return [...text].map((char, index) => /\d/.test(char)
    ? <svg key={index} viewBox="-2 0 16 33" className="lcd-digit" focusable="false">{segments.map((points, part) => digits[Number(char)][part] === '1' && <polygon key={part} points={points} />)}</svg>
    : <span key={index} className="lcd-punctuation">{char}</span>)
}
