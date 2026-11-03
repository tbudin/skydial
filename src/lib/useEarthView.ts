import { useEffect, useRef, useState } from 'react'
import { approximatePlace, type Place } from '../astro/places.js'
import { browserTimeZone, zoneOffsetMs } from '../astro/time.js'
import { acquireDeviceLocation, type DeviceLocationStatus, type DeviceLocationFailure } from '../ui/deviceLocation.js'

export type EarthPickerView = 'rotation' | 'city'

/** Camera settings; the picker's civil-time place and selected instant stay unchanged. */
export interface EarthPickerViewProps {
  earthView?: EarthPickerView
  /** Defaults to city: the selected place stays centred while the terminator moves. */
  defaultEarthView?: EarthPickerView
  onEarthViewChange?: (view: EarthPickerView) => void
  /** City or coordinates to keep centered. Defaults to the picker's place. */
  earthPlace?: Place
  onEarthPlaceChange?: (place: Place) => void
}

export function useEarthView(place: Place, disabled: boolean, props: EarthPickerViewProps) {
  const [internalView, setView] = useState<EarthPickerView>(props.defaultEarthView ?? 'city')
  const [internalPlace, setPlace] = useState<Place | null>(null)
  const [geo, setGeo] = useState<DeviceLocationStatus>('idle')
  const request = useRef(0)
  const cancelLocation = useRef<(() => void) | null>(null)
  const callbacks = useRef(props.onEarthPlaceChange)
  useEffect(() => { callbacks.current = props.onEarthPlaceChange }, [props.onEarthPlaceChange])
  useEffect(() => () => { request.current++; cancelLocation.current?.() }, [])
  const view = props.earthView ?? internalView
  const viewPlace = props.earthPlace ?? internalPlace ?? place
  const viewDisabled = disabled || (props.earthView !== undefined && !props.onEarthViewChange)
  const placeDisabled = disabled || (props.earthPlace !== undefined && !props.onEarthPlaceChange)
  const selectView = (next: EarthPickerView) => {
    if (viewDisabled) return
    request.current++
    cancelLocation.current?.()
    setGeo('idle')
    if (props.earthView === undefined) setView(next)
    props.onEarthViewChange?.(next)
  }
  const selectPlace = (next: Place | null) => {
    if (placeDisabled) return
    request.current++
    cancelLocation.current?.()
    setGeo('idle')
    if (props.earthPlace === undefined) setPlace(next)
    props.onEarthPlaceChange?.(next ?? place)
  }
  const selectLocalCity = () => {
    const timeZone = browserTimeZone()
    selectPlace(approximatePlace(timeZone, zoneOffsetMs(Date.now(), timeZone) / 60000))
  }
  const requestDevice = () => {
    if (placeDisabled) return
    cancelLocation.current?.()
    const ticket = ++request.current
    const fallback = (reason: DeviceLocationFailure) => {
      if (request.current !== ticket) return
      const timeZone = browserTimeZone()
      const approximate = approximatePlace(timeZone, zoneOffsetMs(Date.now(), timeZone) / 60000)
      if (props.earthPlace === undefined) setPlace(approximate)
      callbacks.current?.(approximate)
      setGeo(reason)
    }
    if (!window.isSecureContext) { fallback('insecure'); return }
    if (!navigator.geolocation) { fallback('unsupported'); return }
    setGeo('pending')
    cancelLocation.current = acquireDeviceLocation(navigator.geolocation, {
      retrying: () => { if (request.current === ticket) setGeo('retrying') },
      failure: fallback,
      success: (position) => {
        if (request.current !== ticket) return
        const next: Place = {
          name: 'Your location', latitude: position.coords.latitude, longitude: position.coords.longitude,
          timeZone: browserTimeZone(), source: 'device',
        }
        if (props.earthPlace === undefined) setPlace(next)
        callbacks.current?.(next)
        setGeo('granted')
      },
    })
  }
  return { view, viewPlace, viewDisabled, placeDisabled, selectView, selectPlace, selectLocalCity, requestDevice, geo }
}
