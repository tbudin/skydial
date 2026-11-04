import { useRangeSelection } from './rangeSelection.js'
import { useResolvedPickerTheme } from './usePickerTheme.js'
import { CelestialRangePicker, type CelestialRangePickerProps } from './range.js'
import { InputScene, type CelestialInputProps } from './input.js'
import type { EarthPickerViewProps } from './useEarthView.js'

export interface CelestialRangeInputProps extends CelestialRangePickerProps, EarthPickerViewProps {
  scene?: CelestialInputProps['scene']
  interactive?: boolean
  planet?: CelestialInputProps['planet']
  orbitalStyle?: CelestialInputProps['orbitalStyle']
}
export function CelestialRangeInput({ scene = 'auto', interactive = true, planet = 'jupiter', control = 'both', theme = 'auto', ...props }: CelestialRangeInputProps) {
  const { value: _value, defaultValue: _defaultValue, onChange: _onChange, children: _children, ...sceneProps } = props
  return <CelestialRangePicker {...props} theme={theme} control={control}>
    {scene !== false && <RangeScene {...sceneProps} theme={theme} scene={scene} interactive={interactive} planet={planet} />}
  </CelestialRangePicker>
}
function RangeScene(props: CelestialInputProps & { scene: Exclude<CelestialInputProps['scene'], false | undefined>; interactive: boolean; planet: NonNullable<CelestialInputProps['planet']> }) {
  const rangeSelection = useRangeSelection()!
  const theme = useResolvedPickerTheme(props.theme ?? 'auto')
  return <InputScene {...props} theme={theme} rangeSelection={rangeSelection} />
}
