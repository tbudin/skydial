import { createRoot } from 'react-dom/client'
import { CelestialInput, CelestialRangeInput, CelestialValueInput, CelestialBody } from 'skydial/lcd'
import 'skydial/style.css'

createRoot(document.getElementById('root')!).render(<main style={{ padding: 24, maxWidth: 500 }}>
  <h1>LCD without a 3D renderer</h1>
  <CelestialInput label="Date" defaultValue={Date.UTC(2026, 10, 9, 10)} theme="light" />
  <CelestialRangeInput label="Trip" defaultValue={{ start: Date.UTC(2026, 10, 9, 10), end: Date.UTC(2026, 10, 10, 10) }} theme="light" />
  <CelestialValueInput label="Birthday" valueKind="date" defaultValue={{ year: 1990, month: 6, day: 15 }} theme="light" />
  <CelestialBody body="saturn" size={64} theme="light" />
</main>)
