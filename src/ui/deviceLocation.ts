export type DeviceLocationFailure = 'denied' | 'timeout' | 'unavailable' | 'unsupported' | 'insecure'
export type DeviceLocationStatus = 'idle' | 'pending' | 'retrying' | 'granted' | DeviceLocationFailure

/** Retry a failed position acquisition once; a granted permission is not a position fix. */
export function acquireDeviceLocation(provider: Pick<Geolocation, 'getCurrentPosition'>, handlers: {
  success: (position: GeolocationPosition) => void
  failure: (reason: DeviceLocationFailure) => void
  retrying?: () => void
}): () => void {
  let active = true
  let attempt = 0
  const request = () => {
    const current = ++attempt
    const fail = (code: number) => {
      if (!active || current !== attempt) return
      if (code !== 1 && current === 1) { handlers.retrying?.(); request(); return }
      active = false
      handlers.failure(code === 1 ? 'denied' : code === 3 ? 'timeout' : 'unavailable')
    }
    try {
      provider.getCurrentPosition((position) => {
        if (!active || current !== attempt) return
        active = false
        handlers.success(position)
      }, (error) => fail(error.code), {
        enableHighAccuracy: current > 1, maximumAge: current === 1 ? 60000 : 0, timeout: current === 1 ? 15000 : 30000,
      })
    } catch { fail(2) }
  }
  request()
  return () => { active = false }
}

export function locationFailureMessage(status: DeviceLocationStatus): string | null {
  if (status === 'denied') return 'Location access is blocked by this browser or device. Check the site permission and your device’s Location Services.'
  if (status === 'timeout') return 'Your browser could not obtain device coordinates in time.'
  if (status === 'unavailable') return 'Permission alone could not provide a position: this browser or device could not determine your coordinates.'
  if (status === 'unsupported') return 'This browser does not provide device location.'
  if (status === 'insecure') return 'Device location requires HTTPS or localhost.'
  return null
}
