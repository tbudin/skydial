import { useEffect, useState, useSyncExternalStore, type RefObject } from 'react'
import { useRenderOptions } from './visualRenderer.js'
import { ringMaterialMotion } from './artworkMotion.js'

const subscribeMotion = (notify: () => void) => {
  const media = window.matchMedia('(prefers-reduced-motion: reduce)')
  media.addEventListener('change', notify)
  return () => media.removeEventListener('change', notify)
}
const prefersReduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
export function useArtworkMotion() {
  const { artworkMotion, quality } = useRenderOptions()
  const reduced = useSyncExternalStore(subscribeMotion, prefersReduced, () => true)
  return artworkMotion && quality !== 'low' && !reduced
}

/** Decorative scenes run only while on screen, visible and allowed by the host. */
export function useVisibleArtworkMotion(ref: RefObject<Element | null>, enabled = true) {
  const allowed = useArtworkMotion()
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const element = ref.current
    if (!element || !enabled || !allowed) return
    let intersecting = false
    const update = () => setVisible(intersecting && !document.hidden)
    const observer = new IntersectionObserver(([entry]) => { intersecting = entry.isIntersecting; update() })
    observer.observe(element)
    document.addEventListener('visibilitychange', update)
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', update) }
  }, [ref, enabled, allowed])
  return enabled && allowed && visible
}

/** LCD material updates, with no astronomical clock mutation or offscreen work. */
export function useArtworkRingMotion(ref: RefObject<SVGSVGElement | null>, enabled: boolean) {
  const motion = useArtworkMotion()
  useEffect(() => {
    const element = ref.current
    if (!element || !enabled || !motion) return
    let visible = false, elapsed = 0, previous = performance.now()
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; previous = performance.now() })
    observer.observe(element)
    const timer = window.setInterval(() => {
      const now = performance.now(), delta = Math.min(.2, (now - previous) / 1000)
      previous = now
      if (visible && document.visibilityState !== 'hidden') {
        elapsed += delta
        for (const path of element.querySelectorAll<SVGPathElement>('[data-ring-radius]')) {
          const radius = Number(path.dataset.ringRadius), angle = Number(path.dataset.ringAngle)
          path.setAttribute('stroke-dashoffset', String(elapsed * 2 / Math.pow(radius, 1.5) + ringMaterialMotion(radius, angle, elapsed)))
        }
      }
    }, 100)
    return () => {
      observer.disconnect(); window.clearInterval(timer)
      for (const path of element.querySelectorAll('[data-ring-radius]')) path.removeAttribute('stroke-dashoffset')
    }
  }, [ref, enabled, motion])
}
