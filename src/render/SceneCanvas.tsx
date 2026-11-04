import { webglAvailable } from './capabilities.js'
import { Component, useCallback, useState, useSyncExternalStore, type ReactNode } from 'react'
import { Canvas, type CanvasProps } from '@react-three/fiber'
import { useRenderOptions } from './visualRenderer.js'

const staticCapability = () => () => undefined

function Unavailable() {
  return <div className="celestial-fallback" role="status"><span aria-hidden="true">◌</span><p>3D view unavailable</p><small>Date, time and astronomical readings remain available.</small></div>
}

class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() { return this.state.failed ? <Unavailable /> : this.props.children }
}

/** Text fallback is rendered on the server and if WebGL2 cannot start or is lost. */
export function SceneCanvas({ children, illustration = false, ...props }: CanvasProps & { illustration?: boolean }) {
  const { quality } = useRenderOptions()
  const ready = useSyncExternalStore(staticCapability, webglAvailable, () => false)
  const [lost, setLost] = useState(false)
  const attach = useCallback((host: HTMLDivElement | null) => {
    if (!host) return
    const contextLost = (event: Event) => { event.preventDefault(); setLost(true) }
    host.addEventListener('webglcontextlost', contextLost, true)
    return () => host.removeEventListener('webglcontextlost', contextLost, true)
  }, [])
  if (!ready || lost) return <Unavailable />
  return <div ref={attach} style={{ width: '100%', height: '100%', position: 'relative' }}><SceneBoundary><Canvas {...props} dpr={quality === 'low' ? 1 : [1, quality === 'high' || illustration ? 2 : 1.5]}>{children}</Canvas></SceneBoundary></div>
}
