/** Small control symbols prioritise silhouette over the detail used in body illustrations. */
export function SunSymbol() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <circle cx="12" cy="12" r="4.5" fill="currentColor" />
    <path d="M12 1v3m0 16v3M1 12h3m16 0h3M4.2 4.2l2.1 2.1m11.4 11.4 2.1 2.1M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" fill="none" stroke="currentColor" strokeWidth="1.8" />
  </svg>
}
export function MoonSymbol() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d="M21 12.8A9 9 0 1 1 11.2 3A7 7 0 0 0 21 12.8Z" fill="currentColor" />
  </svg>
}
