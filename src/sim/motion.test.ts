import { expect, it, vi } from 'vitest'
import { TimeMotionController } from './motion.js'
import { SimClock } from './clock.js'

it('new input cancels the previous animation and keeps its own target', () => {
  const motion = new TimeMotionController()
  const old = vi.fn()
  const next = vi.fn()
  motion.start(old, 2026)
  motion.start(next, 2030)
  expect(old).toHaveBeenCalledTimes(1)
  expect(next).not.toHaveBeenCalled()
  motion.finish(old)
  expect(motion.target).toBe(2030)
  motion.cancel()
  expect(next).toHaveBeenCalledTimes(1)
  expect(motion.target).toBeNull()
})

it('finishing an animation clears its target without cancelling a finished frame', () => {
  const motion = new TimeMotionController()
  const cancel = vi.fn()
  motion.start(cancel, 2030)
  motion.finish(cancel)
  motion.cancel()
  expect(cancel).not.toHaveBeenCalled()
  expect(motion.target).toBeNull()
})

it('keeps illustration frames separate from the selected clock and releases subscribers', () => {
  const motion = new TimeMotionController()
  const selected = new SimClock(Date.UTC(2030, 3, 20))
  const visual = new SimClock(Date.UTC(2026, 3, 20))
  const listener = vi.fn()
  const unsubscribe = motion.subscribe(listener)
  const cancel = vi.fn()
  motion.start(cancel, selected.now(), visual)
  expect(motion.getVisualClock()).toBe(visual)
  visual.setTime(Date.UTC(2028, 3, 20))
  expect(selected.now()).toBe(Date.UTC(2030, 3, 20))
  motion.finish(cancel)
  expect(motion.getVisualClock()).toBeNull()
  expect(listener).toHaveBeenCalledTimes(2)
  unsubscribe()
  motion.start(cancel, selected.now(), visual)
  expect(listener).toHaveBeenCalledTimes(2)
})
