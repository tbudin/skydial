import { useState } from 'react'
import { locationFailureMessage, type DeviceLocationStatus } from './deviceLocation.js'
import { CITIES, formatLatLon, type Place } from '../astro/places.js'

const SOURCE_LABEL: Record<Place['source'], string> = {
  device: 'Your location',
  city: 'Selected city',
  custom: 'Custom coordinates',
  approximate: 'Approximate, from your time zone',
}

export function LocationPicker({
  place,
  onChange,
  onUseDevice,
  geoStatus,
}: {
  place: Place
  onChange: (p: Place) => void
  onUseDevice: () => void
  geoStatus: DeviceLocationStatus
}) {
  const [custom, setCustom] = useState(false)
  const [lat, setLat] = useState(String(place.latitude.toFixed(4)))
  const [lon, setLon] = useState(String(place.longitude.toFixed(4)))

  const cityValue = place.source === 'city' ? place.name : ''

  return (
    <div className="location">
      <div className="location-now">
        <span className="location-name">{place.name}</span>
        <span className="location-meta">
          {formatLatLon(place.latitude, place.longitude)} ·{' '}
          <span className={place.source === 'approximate' ? 'approx' : undefined}>{SOURCE_LABEL[place.source]}</span>
        </span>
      </div>
      <div className="location-actions">
        <button className="chip" onClick={onUseDevice} disabled={geoStatus === 'pending' || geoStatus === 'retrying'}>
          {geoStatus === 'pending' ? 'Locating…' : geoStatus === 'retrying' ? 'Trying a fresh location…' : 'Use my location'}
        </button>
        <select
          className="select"
          aria-label="City"
          value={cityValue}
          onChange={(e) => {
            const c = CITIES.find((x) => x.name === e.target.value)
            if (c) {
              setCustom(false)
              onChange({ ...c, source: 'city' })
            }
          }}
        >
          <option value="" disabled>
            Choose a city
          </option>
          {CITIES.map((c) => (
            <option key={c.name} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>
        <button className={custom ? 'chip active' : 'chip'} onClick={() => setCustom((v) => !v)}>
          Coordinates
        </button>
      </div>
      {locationFailureMessage(geoStatus) && <p className="location-note" role="status">{locationFailureMessage(geoStatus)} Choose a city or enter coordinates.</p>}
      {custom && (
        <form
          className="coords"
          onSubmit={(e) => {
            e.preventDefault()
            const la = Number(lat)
            const lo = Number(lon)
            if (Number.isFinite(la) && Number.isFinite(lo) && Math.abs(la) <= 90 && Math.abs(lo) <= 180) {
              onChange({ name: formatLatLon(la, lo), latitude: la, longitude: lo, timeZone: place.timeZone, source: 'custom' })
            }
          }}
        >
          <label>
            Latitude
            <input className="year-input mono" inputMode="decimal" value={lat} onChange={(e) => setLat(e.target.value)} />
          </label>
          <label>
            Longitude
            <input className="year-input mono" inputMode="decimal" value={lon} onChange={(e) => setLon(e.target.value)} />
          </label>
          <button className="chip" type="submit">
            Set
          </button>
          <span className="location-note">Civil time stays on {place.timeZone}.</span>
        </form>
      )}
    </div>
  )
}
