import type { PlanetId } from '../astro/bodies.js'

/** Deliberately simplified silhouettes retain each world's character at dial size. */
export function LcdPlanetGlyph({ body }: { body: PlanetId }) {
  const radius = body === 'earth' ? 4.5 : 7
  return <g data-lcd-feature="planet-glyph" strokeWidth=".8" strokeLinecap="round">
    {body === 'saturn' && <g transform="rotate(-25)"><ellipse rx="13" ry="4.5" /><ellipse rx="11" ry="3.3" /></g>}
    {body === 'uranus' && <ellipse rx="3.4" ry="10.5" transform="rotate(-20)" />}
    <circle r={radius} className="lcd-paper-fill" strokeWidth="1.2" />
    {body === 'mercury' && <><circle cx="-2" cy="-2" r="1.6" /><circle cx="2.4" cy="1.5" r="1.2" /><path d="M-3 3l1 1M2-4h1" /></>}
    {body === 'venus' && <path d="M-4-4Q2-3 4-1M-6 0Q-2-2 1 1T5 3M-3 4q3-1 5 0" />}
    {body === 'earth' && <path d="M-3-2l2-1 1 1-1 2-2 1M1 1l2-1 0 2-1 2" />}
    {body === 'mars' && <><path d="M-3-5q3 2 6 0M-4 0l2-2 2 2-2 3M2 2l2 1" /><path d="M-1 4h2" /></>}
    {body === 'jupiter' && <><path d="M-4-4Q0-5 4-4M-6-1Q0-2 6-1M-6 2Q0 3 6 2M-3 5h6" /><ellipse cx="2" cy="1.5" rx="2" ry="1" className="lcd-paper-fill" /></>}
    {body === 'saturn' && <><path d="M-5-3h10M-6 0h12M-4 3h8" /><g transform="rotate(-25)"><path d="M-13 0A13 4.5 0 0 0 13 0M-11 0A11 3.3 0 0 0 11 0" strokeWidth="1.1" /></g></>}
    {body === 'uranus' && <><path d="M-3-5L-1 5M0-5L2 5" strokeDasharray="1 1.8" /><path d="M-3.4 0A3.4 10.5 0 0 0 3.4 0" transform="rotate(-20)" /></>}
    {body === 'neptune' && <><path d="M-4-4h8M-6-1h12M-4 4h8" strokeDasharray="1 1" /><ellipse cx="-1.5" cy="1.5" rx="2" ry="1" fill="currentColor" /></>}
  </g>
}
