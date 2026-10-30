import { MemoryCache } from '../cache.js'
import { ApiError } from '../http.js'

const cache = new MemoryCache()
const WEATHER_TIMEOUT_MS = 7_000
const RETRIES = 1

function scoreViewingConditions(cloudCover, visibilityKm, humidity) {
  const cloudScore = 100 - cloudCover
  const visibilityScore = Math.min(100, (visibilityKm / 20) * 100)
  const humidityScore = 100 - humidity
  return Math.round(cloudScore * 0.55 + visibilityScore * 0.30 + humidityScore * 0.15)
}

async function fetchCurrentWeather(latitude, longitude) {
  const query = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: 'relative_humidity_2m,cloud_cover,visibility',
    hourly: 'relative_humidity_2m,cloud_cover,visibility',
    forecast_hours: '12',
    timezone: 'auto',
  })

  let lastError
  for (let attempt = 0; attempt <= RETRIES; attempt += 1) {
    try {
      const upstream = await fetch(`https://api.open-meteo.com/v1/forecast?${query}`, {
        signal: AbortSignal.timeout(WEATHER_TIMEOUT_MS),
        headers: { Accept: 'application/json' },
      })
      if (!upstream.ok) {
        if (upstream.status >= 500 && attempt < RETRIES) continue
        throw new ApiError(502, 'WEATHER_PROVIDER_ERROR', 'The weather provider is temporarily unavailable.')
      }
      const payload = await upstream.json()
      const current = payload.current
      const cloudCover = current?.cloud_cover == null ? NaN : Number(current.cloud_cover)
      const humidity = current?.relative_humidity_2m == null ? NaN : Number(current.relative_humidity_2m)
      const visibilityMeters = current?.visibility == null ? NaN : Number(current.visibility)
      if (![cloudCover, humidity, visibilityMeters].every(Number.isFinite)
        || cloudCover < 0 || cloudCover > 100 || humidity < 0 || humidity > 100 || visibilityMeters < 0) {
        throw new ApiError(502, 'WEATHER_DATA_INVALID', 'The weather provider returned incomplete or invalid data.')
      }
      const visibilityKm = Math.round((visibilityMeters / 1000) * 10) / 10
      const hourly = buildHourlyForecast(payload.hourly)
      return {
        cloudCover,
        visibilityKm,
        humidity,
        honorScore: scoreViewingConditions(cloudCover, visibilityKm, humidity),
        observedAt: current.time ?? null,
        hourly,
        bestWindow: findBestWindow(hourly),
        source: 'Open-Meteo',
        scoreMethod: '55% cloud clarity, 30% visibility (capped at 20 km), 15% inverse humidity; weighted score from 0–100.',
      }
    } catch (error) {
      lastError = error
      if (error instanceof ApiError) throw error
      if (attempt >= RETRIES) break
    }
  }
  if (lastError?.name === 'TimeoutError' || lastError?.name === 'AbortError') {
    throw new ApiError(504, 'WEATHER_PROVIDER_TIMEOUT', 'The weather provider took too long to respond.')
  }
  throw new ApiError(502, 'WEATHER_PROVIDER_ERROR', 'Could not retrieve live weather right now.')
}

function buildHourlyForecast(data) {
  if (!data || !Array.isArray(data.time) || !Array.isArray(data.cloud_cover)
    || !Array.isArray(data.visibility) || !Array.isArray(data.relative_humidity_2m)) return []

  return data.time.slice(0, 12).flatMap((time, index) => {
    const rawCloudCover = data.cloud_cover[index]
    const rawVisibility = data.visibility[index]
    const rawHumidity = data.relative_humidity_2m[index]
    if (rawCloudCover == null || rawVisibility == null || rawHumidity == null) return []
    const cloudCover = Number(rawCloudCover)
    const visibilityMeters = Number(rawVisibility)
    const humidity = Number(rawHumidity)
    if (typeof time !== 'string' || !Number.isFinite(cloudCover) || cloudCover < 0 || cloudCover > 100
      || !Number.isFinite(visibilityMeters) || visibilityMeters < 0
      || !Number.isFinite(humidity) || humidity < 0 || humidity > 100) return []
    const visibilityKm = Math.round((visibilityMeters / 1000) * 10) / 10
    return [{
      time,
      cloudCover,
      visibilityKm,
      humidity,
      honorScore: scoreViewingConditions(cloudCover, visibilityKm, humidity),
    }]
  })
}

function findBestWindow(hours, length = 3) {
  if (!hours.length) return null
  if (hours.length < length) {
    const bestHour = hours.reduce((best, hour) => hour.honorScore > best.honorScore ? hour : best)
    return { from: bestHour.time, to: bestHour.time, averageScore: bestHour.honorScore, hours: 1 }
  }

  let best = null
  for (let start = 0; start <= hours.length - length; start += 1) {
    const window = hours.slice(start, start + length)
    const averageScore = Math.round(window.reduce((sum, hour) => sum + hour.honorScore, 0) / length)
    if (!best || averageScore > best.averageScore) {
      best = { from: window[0].time, to: window.at(-1).time, averageScore, hours: length }
    }
  }
  return best
}

export async function getWeather(latitude, longitude) {
  // Weather forecasts are grid based; rounding improves cache reuse without materially changing results.
  const roundedLatitude = Math.round(latitude * 100) / 100
  const roundedLongitude = Math.round(longitude * 100) / 100
  const key = `weather:${roundedLatitude}:${roundedLongitude}`
  const result = await cache.getOrLoad(key, () => fetchCurrentWeather(roundedLatitude, roundedLongitude))
  return { ...result.value, cache: result.cache }
}

const MAP_GRID_SIZE = 5
const MAP_TIMEOUT_MS = 8_000

function createVisibilityGrid(latitude, longitude, radiusKm) {
  const latitudeRadius = radiusKm / 111.32
  const longitudeRadius = radiusKm / (111.32 * Math.max(Math.abs(Math.cos(latitude * Math.PI / 180)), 0.2))
  const latitudes = []
  const longitudes = []
  for (let row = 0; row < MAP_GRID_SIZE; row += 1) {
    const lat = Math.max(-89.9, Math.min(89.9, latitude - latitudeRadius + row * (2 * latitudeRadius / (MAP_GRID_SIZE - 1))))
    for (let column = 0; column < MAP_GRID_SIZE; column += 1) {
      const lon = Math.max(-180, Math.min(180, longitude - longitudeRadius + column * (2 * longitudeRadius / (MAP_GRID_SIZE - 1))))
      latitudes.push(Number(lat.toFixed(4)))
      longitudes.push(Number(lon.toFixed(4)))
    }
  }
  return { latitudes, longitudes }
}

async function fetchVisibilityGrid(latitude, longitude, radiusKm) {
  const { latitudes, longitudes } = createVisibilityGrid(latitude, longitude, radiusKm)
  const query = new URLSearchParams({ latitude: latitudes.join(','), longitude: longitudes.join(','), current: 'visibility', timezone: 'auto' })
  let lastError
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const upstream = await fetch(`https://api.open-meteo.com/v1/forecast?${query}`, {
        signal: AbortSignal.timeout(MAP_TIMEOUT_MS),
        headers: { Accept: 'application/json' },
      })
      if (!upstream.ok) {
        if (upstream.status >= 500 && attempt === 0) continue
        throw new ApiError(502, 'VISIBILITY_PROVIDER_ERROR', 'The visibility provider is temporarily unavailable.')
      }
      const payload = await upstream.json()
      const locations = Array.isArray(payload) ? payload : [payload]
      const points = locations.flatMap((item, index) => {
        const rawVisibility = item?.current?.visibility
        if (rawVisibility == null || !Number.isFinite(Number(rawVisibility)) || Number(rawVisibility) < 0) return []
        return [{
          latitude: Number(item.latitude ?? latitudes[index]),
          longitude: Number(item.longitude ?? longitudes[index]),
          visibilityKm: Math.round((Number(rawVisibility) / 1000) * 10) / 10,
          row: Math.floor(index / MAP_GRID_SIZE),
          column: index % MAP_GRID_SIZE,
        }]
      })
      if (points.length < 9) throw new ApiError(502, 'VISIBILITY_DATA_INVALID', 'The visibility provider returned too few usable map points.')
      return { points, source: 'Open-Meteo', radiusKm, gridSize: MAP_GRID_SIZE }
    } catch (error) {
      lastError = error
      if (error instanceof ApiError || attempt > 0) throw error
    }
  }
  if (lastError?.name === 'TimeoutError' || lastError?.name === 'AbortError') {
    throw new ApiError(504, 'VISIBILITY_PROVIDER_TIMEOUT', 'The visibility map took too long to load.')
  }
  throw new ApiError(502, 'VISIBILITY_PROVIDER_ERROR', 'Could not retrieve visibility data right now.')
}

export async function getVisibilityMap(latitude, longitude, radiusKm = 30) {
  const centerLat = Math.round(latitude * 100) / 100
  const centerLon = Math.round(longitude * 100) / 100
  const key = `visibility-map:${centerLat}:${centerLon}:${radiusKm}`
  const result = await cache.getOrLoad(key, () => fetchVisibilityGrid(centerLat, centerLon, radiusKm), { ttlMs: 600_000, staleMs: 1_800_000 })
  return { ...result.value, cache: result.cache }
}
