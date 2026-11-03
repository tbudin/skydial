import { expect, it, vi } from 'vitest'
import { TimeMotionController } from './motion.js'

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
