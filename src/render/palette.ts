export const PALETTE = {
  background: '#04070d',
  orbit: '#8796b0',
  orbitOpacity: 0.22,
  tick: '#7d8aa1',
  tickMajor: '#c9d2e0',
  label: '#8e9ab0',
  labelActive: '#e9eef6',
  earthHand: '#79c99e',
  yearHand: '#d8b46a',
} as const

export type OrreryPalette = { [K in keyof typeof PALETTE]: typeof PALETTE[K] extends number ? number : string }

export const LIGHT_PALETTE: OrreryPalette = {
  background: '#ffffff', orbit: '#64758b', orbitOpacity: 0.3,
  tick: '#697b91', tickMajor: '#384e66', label: '#56677c', labelActive: '#25354b',
  earthHand: '#287652', yearHand: '#946b20',
}
