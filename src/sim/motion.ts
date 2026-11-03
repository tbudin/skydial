import type { SimClock } from './clock.js'

/** Selection commits immediately; a separate clock animates only the illustration. */
export class TimeMotionController {
  private active: (() => void) | null = null
  private targetValue: number | null = null
  private visual: SimClock | null = null
  private listeners = new Set<() => void>()

  get target() { return this.targetValue }
  getVisualClock = () => this.visual
  subscribe = (listener: () => void) => {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }
  private emit() { this.listeners.forEach((listener) => listener()) }

  cancel() {
    const previous = this.active
    this.active = null
    this.targetValue = null
    const changed = this.visual !== null
    this.visual = null
    previous?.()
    if (changed) this.emit()
  }

  start(cancel: () => void, target: number, visualClock?: SimClock) {
    this.cancel()
    this.active = cancel
    this.targetValue = target
    this.visual = visualClock ?? null
    this.emit()
  }

  finish(cancel: () => void) {
    if (this.active !== cancel) return
    this.active = null
    this.targetValue = null
    this.visual = null
    this.emit()
  }
}
