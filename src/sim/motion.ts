/** One animation owns a provider's time; newer input always interrupts it. */
export class TimeMotionController {
  private active: (() => void) | null = null
  private targetValue: number | null = null

  get target() { return this.targetValue }

  cancel() {
    const previous = this.active
    this.active = null
    this.targetValue = null
    previous?.()
  }

  start(cancel: () => void, target: number) {
    this.cancel()
    this.active = cancel
    this.targetValue = target
  }

  finish(cancel: () => void) {
    if (this.active !== cancel) return
    this.active = null
    this.targetValue = null
  }
}
