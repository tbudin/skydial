import { CITIES, formatLatLon, type Place } from '../astro/places.js'
import { locationFailureMessage } from '../ui/deviceLocation.js'
import { useRef, useState } from 'react'
import type { EarthPickerView, useEarthView } from './useEarthView.js'

export function EarthViewControls({ place, settings }: { place: Place; settings: ReturnType<typeof useEarthView> }) {
  const { view, viewPlace, viewDisabled, placeDisabled, selectView, selectPlace, selectLocalCity, requestDevice, geo } = settings
  const [coordinates, setCoordinates] = useState(false)
  const failure = locationFailureMessage(geo)
  const city = CITIES.find((candidate) => candidate.latitude === viewPlace.latitude && candidate.longitude === viewPlace.longitude)
  const value = viewPlace === place ? 'current' : viewPlace.source === 'device' ? 'device' : viewPlace.source === 'approximate' ? 'local' : city?.name ?? 'custom'
  return <div className="earth-view-controls">
    <label className="earth-view-select"><span>Earth view</span>
      <select value={view} disabled={viewDisabled} onChange={(event) => selectView(event.target.value as EarthPickerView)}>
        <option value="rotation">Rotate Earth</option>
        <option value="city">Stay on city</option>
      </select>
    </label>
    {view === 'city' && <>
      <label className="earth-view-select"><span>City in view</span>
        <select value={value} disabled={placeDisabled} onChange={(event) => {
          const next = event.target.value
          if (next === 'current') selectPlace(null)
          else if (next === 'local') selectLocalCity()
          else {
            const chosen = CITIES.find((candidate) => candidate.name === next)
            if (chosen) selectPlace({ ...chosen, source: 'city' })
          }
        }}>
          <option value="current">Current place · {place.name}</option>
          <option value="local">Local city (from time zone)</option>
          {value === 'device' && <option value="device">Your location</option>}
          {value === 'custom' && <option value="custom">{viewPlace.name}</option>}
          {CITIES.map((candidate) => <option key={candidate.name} value={candidate.name}>{candidate.name}</option>)}
        </select>
      </label>
      <button className="earth-use-location" type="button" onClick={requestDevice} disabled={placeDisabled || geo === 'pending' || geo === 'retrying'}>
        {geo === 'pending' ? 'Locating…' : geo === 'retrying' ? 'Trying a fresh location…' : 'Use my location'}
      </button>
      <p className="earth-view-location" role="status">{viewPlace.name} · {formatLatLon(viewPlace.latitude, viewPlace.longitude)}{viewPlace.source === 'approximate' ? ' · approximate' : ''}</p>
      {failure && <p className="earth-location-note" role="status">{failure} Showing {viewPlace.name} from your time zone as an approximate fallback. Choose a city, retry, or enter coordinates.</p>}
      <button className="earth-coordinates-toggle" type="button" disabled={placeDisabled} aria-expanded={coordinates} onClick={() => setCoordinates(!coordinates)}>Enter coordinates</button>
      {coordinates && <CoordinateEntry place={viewPlace} disabled={placeDisabled} onChange={selectPlace} />}

    </>}
  </div>
}

function CoordinateEntry({ place, disabled, onChange }: { place: Place; disabled: boolean; onChange: (next: Place) => void }) {
  const latitude = useRef<HTMLInputElement>(null)
  const longitude = useRef<HTMLInputElement>(null)
  const apply = () => {
    if (disabled || !latitude.current?.reportValidity() || !longitude.current?.reportValidity()) return
    onChange({ name: 'Custom location', latitude: Number(latitude.current.value), longitude: Number(longitude.current.value), source: 'custom', timeZone: place.timeZone })
  }
  return <div className="earth-coordinates" role="group" aria-label="Custom camera coordinates" onKeyDown={(event) => {
    if (event.key === 'Enter') { event.preventDefault(); apply() }
  }}>
    <label>Latitude<input ref={latitude} type="number" min={-90} max={90} step="any" required defaultValue={place.latitude} disabled={disabled} /></label>
    <label>Longitude<input ref={longitude} type="number" min={-180} max={180} step="any" required defaultValue={place.longitude} disabled={disabled} /></label>
    <button className="earth-use-location" type="button" disabled={disabled} onClick={apply}>Use coordinates</button>
  </div>
}
