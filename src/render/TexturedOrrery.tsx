import { useEffect, useState } from 'react'
import { Orrery } from './Orrery.js'
import { loadTextures, type TextureLoadResult, type TextureKey } from './textures.js'
import { usePickerLocale } from '../lib/localization.js'
import type { VisualRenderer } from './visualRenderer.js'

export const TexturedOrrery: VisualRenderer['Orrery'] = (props) => {
  const [assets, setAssets] = useState<TextureLoadResult | null>(null)
  const { messages } = usePickerLocale()
  const key = props.visibleBodies?.join(',')
  useEffect(() => {
    let active = true
    const keys = key ? ['sun', ...key.split(','), ...(key.includes('saturn') ? ['saturnRing'] : [])] as TextureKey[] : undefined
    loadTextures(keys).then((result) => { if (active) setAssets(result) })
    return () => { active = false }
  }, [key])
  return assets ? <><Orrery {...props} textures={assets.textures} />{assets.failed.length > 0 && <span className="picker-sr-only" role="status">{messages.textures}</span>}</> : <div className="loading" role="status">{messages.loading}</div>
}
