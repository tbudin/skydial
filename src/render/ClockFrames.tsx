import { useEffect, useRef, useSyncExternalStore } from 'react'
import { useThree } from '@react-three/fiber'
import { useVisualClock } from '../sim/hooks.js'
import { useRenderOptions } from './visualRenderer.js'

/** Paused widgets draw on change; moving clocks draw only while visible. */
export function ClockFrames() {
  const { maxFps } = useRenderOptions()
  const clock = useVisualClock()
  const state = useSyncExternalStore(clock.subscribe, clock.getState, clock.getState)
  const { invalidate, gl } = useThree()
  const visible = useRef(true)
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      visible.current = entry.isIntersecting
      if (entry.isIntersecting) invalidate()
    })
    observer.observe(gl.domElement)
    return () => observer.disconnect()
  }, [gl, invalidate])
  useEffect(() => {
    invalidate()
    return clock.subscribe(invalidate)
  }, [clock, invalidate])
  useEffect(() => {
    if (!state.playing) return
    const timer = window.setInterval(() => { if (visible.current && document.visibilityState !== 'hidden') invalidate() }, 1000 / maxFps)
    return () => window.clearInterval(timer)
  }, [state.playing, invalidate, maxFps])
  return null
}
