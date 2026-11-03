let supported: boolean | undefined
export function webglAvailable() {
  if (supported !== undefined) return supported
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl2')
    supported = !!gl
    gl?.getExtension('WEBGL_lose_context')?.loseContext()
  } catch { supported = false }
  return supported
}
