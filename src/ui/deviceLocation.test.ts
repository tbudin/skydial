import { describe, expect, it, vi } from 'vitest'
import { acquireDeviceLocation } from './deviceLocation.js'

const position = { coords: { latitude: 1.29, longitude: 103.85 } } as GeolocationPosition
const error = (code: number) => ({ code }) as GeolocationPositionError

describe('device coordinate acquisition', () => {
  it('retries an unavailable fix with fresh high-accuracy coordinates', () => {
    const success = vi.fn()
    const options: PositionOptions[] = []
    const provider = { getCurrentPosition: (ok: PositionCallback, fail: PositionErrorCallback | null | undefined, config?: PositionOptions) => {
      options.push(config!)
      if (options.length === 1) fail!(error(2))
      else ok(position)
    } }
    acquireDeviceLocation(provider, { success, failure: vi.fn() })
    expect(success).toHaveBeenCalledWith(position)
    expect(options).toMatchObject([{ enableHighAccuracy: false }, { enableHighAccuracy: true, maximumAge: 0, timeout: 30000 }])
  })
  it('does not retry denied permission or confuse it with a timeout', () => {
    for (const code of [1, 3]) {
      const failure = vi.fn()
      const getCurrentPosition = vi.fn((_ok: PositionCallback, fail: PositionErrorCallback | null | undefined) => fail!(error(code)))
      acquireDeviceLocation({ getCurrentPosition }, { success: vi.fn(), failure })
      expect(getCurrentPosition).toHaveBeenCalledTimes(code === 1 ? 1 : 2)
      expect(failure).toHaveBeenCalledWith(code === 1 ? 'denied' : 'timeout')
    }
  })
  it('ignores late callbacks after cancellation', () => {
    let respond: PositionCallback | undefined
    const success = vi.fn()
    const cancel = acquireDeviceLocation({ getCurrentPosition: (ok) => { respond = ok } }, { success, failure: vi.fn() })
    cancel()
    respond!(position)
    expect(success).not.toHaveBeenCalled()
  })
})
