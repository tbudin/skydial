import { afterEach, describe, expect, it, vi } from 'vitest'
import { MAX_TIME_MS, MIN_TIME_MS, SimClock } from './clock.js'

afterEach(() => vi.restoreAllMocks())

describe('independent simulation clocks', () => {
  it('preserves separate dates and playback states', () => {
    const a = new SimClock(Date.UTC(2026, 0, 1))
    const b = new SimClock(Date.UTC(2026, 6, 1))
    a.setTime(Date.UTC(2027, 0, 1))
    a.setSpeed('year')
    expect(b.now()).toBe(Date.UTC(2026, 6, 1))
    expect(b.getState().playing).toBe(false)
    expect(a.getState().playing).toBe(true)
  })
  it('allows the complete final day of the supported range', () => {
    expect(new SimClock(MAX_TIME_MS).now()).toBe(Date.UTC(2401, 0, 1) - 1)
    expect(new SimClock(MIN_TIME_MS).now()).toBe(MIN_TIME_MS)
  })
  it('rejects invalid dates without corrupting its last valid state', () => {
    const c = new SimClock(Date.UTC(2026, 0, 1))
    for (const value of [NaN, Infinity, MIN_TIME_MS - 1, MAX_TIME_MS + 1]) {
      expect(() => c.setTime(value)).toThrow(RangeError)
    }
    expect(c.now()).toBe(Date.UTC(2026, 0, 1))
  })
  it('pauses at the supported boundary during accelerated playback', () => {
    let realTime = 0
    vi.spyOn(performance, 'now').mockImplementation(() => realTime)
    const c = new SimClock(MAX_TIME_MS - 1000)
    c.setSpeed('day')
    realTime = 100
    expect(c.now()).toBe(MAX_TIME_MS)
    expect(c.getState().playing).toBe(false)
  })
  it('unsubscribes listeners', () => {
    const c = new SimClock()
    const listener = vi.fn()
    const unsubscribe = c.subscribe(listener)
    c.setPlaying(false)
    unsubscribe()
    c.goLive()
    expect(listener).toHaveBeenCalledTimes(1)
  })
})
