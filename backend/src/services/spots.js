import { MemoryCache } from '../cache.js'
import { ApiError } from '../http.js'

const cache = new MemoryCache()
const SEARCH_RADIUS_METERS = 5_000
const PROVIDER_TIMEOUT_MS = 15_000

function distanceKm(lat1, lon1, lat2, lon2) {
  const radians = (degrees) => degrees * Math.PI / 180
  const dLat = radians(lat2 - lat1)
  const dLon = radians(lon2 - lon1)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(radians(lat1)) * Math.cos(radians(lat2)) * Math.sin(dLon / 2) ** 2
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function classify(tags = {}) {
  if (tags.tourism === 'viewpoint') return 'Viewpoint'
  if (tags.tourism === 'camp_site') return 'Campsite'
  if (tags.leisure === 'nature_reserve') return 'Nature reserve'
  if (tags.natural === 'beach' || tags.leisure === 'beach_resort') return 'Beach'
  if (tags.natural === 'peak') return 'Open landscape'
  return 'Park or outdoor area'
}

async function fetchNearbySpots(latitude, longitude) {
  const query = `[out:json][timeout:12];(nwr(around:${SEARCH_RADIUS_METERS},${latitude},${longitude})[name][tourism~"^(viewpoint|camp_site)$"];nwr(around:${SEARCH_RADIUS_METERS},${latitude},${longitude})[name][leisure~"^(park|nature_reserve|beach_resort)$"];nwr(around:${SEARCH_RADIUS_METERS},${latitude},${longitude})[name][natural~"^(beach|peak)$"];);out center tags;`
  let response
  try {
    response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
      body: new URLSearchParams({ data: query }),
      signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
    })
  } catch (error) {
    if (error?.name === 'TimeoutError' || error?.name === 'AbortError') {
      throw new ApiError(504, 'SPOTS_PROVIDER_TIMEOUT', 'Nearby outdoor spots took too long to load. Please try again.')
    }
    throw new ApiError(502, 'SPOTS_PROVIDER_ERROR', 'Nearby outdoor spots are temporarily unavailable.')
  }
  if (!response.ok) throw new ApiError(502, 'SPOTS_PROVIDER_ERROR', 'Nearby outdoor spots are temporarily unavailable.')

  let payload
  try {
    payload = await response.json()
  } catch {
    throw new ApiError(502, 'SPOTS_DATA_INVALID', 'The nearby spots provider returned invalid data.')
  }
  if (!Array.isArray(payload.elements)) throw new ApiError(502, 'SPOTS_DATA_INVALID', 'The nearby spots provider returned invalid data.')

  const unique = new Map()
  for (const item of payload.elements) {
    const itemLatitude = Number(item.lat ?? item.center?.lat)
    const itemLongitude = Number(item.lon ?? item.center?.lon)
    const name = typeof item.tags?.name === 'string' ? item.tags.name.trim() : ''
    if (!name || !Number.isFinite(itemLatitude) || !Number.isFinite(itemLongitude)) continue
    const distance = distanceKm(latitude, longitude, itemLatitude, itemLongitude)
    if (distance > SEARCH_RADIUS_METERS / 1000) continue
    const spot = {
      id: `${item.type}-${item.id}`,
      name,
      kind: classify(item.tags),
      latitude: itemLatitude,
      longitude: itemLongitude,
      distanceKm: Math.round(distance * 10) / 10,
    }
    unique.set(`${name.toLowerCase()}:${itemLatitude.toFixed(4)}:${itemLongitude.toFixed(4)}`, spot)
  }
  return [...unique.values()].sort((a, b) => a.distanceKm - b.distanceKm).slice(0, 40)
}

export async function getNearbySpots(latitude, longitude) {
  const roundedLatitude = Math.round(latitude * 1000) / 1000
  const roundedLongitude = Math.round(longitude * 1000) / 1000
  const key = `stargazing-spots:5km:${roundedLatitude}:${roundedLongitude}`
  const result = await cache.getOrLoad(key, () => fetchNearbySpots(roundedLatitude, roundedLongitude), {
    ttlMs: 600_000,
    staleMs: 1_800_000,
  })
  return { spots: result.value, radiusKm: SEARCH_RADIUS_METERS / 1000, source: 'OpenStreetMap', cache: result.cache }
}
