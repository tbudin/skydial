import * as Astronomy from 'astronomy-engine'

export type EarthCameraView = 'observer' | 'rotation'

/** City-following cameras share Earth's rotation; rotation mode retains its initial world direction. */
export function earthCameraVector(observer: Astronomy.Observer, timeMs: number, view: EarthCameraView, rotationEpochMs: number) {
  return Astronomy.ObserverVector(Astronomy.MakeTime(new Date(view === 'rotation' ? rotationEpochMs : timeMs)), observer, false)
}
