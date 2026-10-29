import http from 'node:http'

const PORT = Number(process.env.PORT || 3001)
const WEATHER_TIMEOUT_MS = 8_000
const SYNODIC_MONTH_DAYS = 29.530588853
const KNOWN_NEW_MOON_UTC = Date.UTC(2000, 0, 6, 18, 14)

// These are presentation examples for the hackathon demo, not a live ephemeris.
const demoEvents = [
  { id: 'meteor-shower', day: 'SKY GUIDE', type: 'METEOR SHOWER', title: 'Meteor shower watching', detail: 'Find a dark location and let your eyes adjust.', icon: '✦' },
  { id: 'moon-watch', day: 'MOON WATCH', type: 'MOON PHASE', title: 'Track the lunar cycle', detail: 'Use the live phase indicator for tonight’s moon.', icon: '◐' },
  { id: 'iss-watch', day: 'ORBITAL GUIDE', type: 'ISS PASS', title: 'Spot the space station', detail: 'Check a trusted pass predictor for local timings.', icon: '⌁' },
]

function send(response, status, body) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  })
  response.end(JSON.stringify(body))
}

function phaseFor(date = new Date()) {
  const age = ((date.getTime() - KNOWN_NEW_MOON_UTC) / 86_400_000 % SYNODIC_MONTH_DAYS + SYNODIC_MONTH_DAYS) % SYNODIC_MONTH_DAYS
  const fraction = age / SYNODIC_MONTH_DAYS
  const illumination = Math.round((1 - Math.cos(2 * Math.PI * fraction)) * 50)
  let name
  if (age < 1.85 || age >= 27.68) name = 'New moon'
  else if (age < 5.53) name = 'Waxing crescent'
  else if (age < 9.22) name = 'First quarter'
  else if (age < 12.91) name = 'Waxing gibbous'
  else if (age < 16.61) name = 'Full moon'
  else if (age < 20.30) name = 'Waning gibbous'
  else if (age < 23.99) name = 'Last quarter'
  else name = 'Waning crescent'
  return { name, illumination, ageDays: Math.round(age * 10) / 10, source: 'approximation' }
}

function parseCoordinates(url) {
  const rawLatitude = url.searchParams.get('latitude')
  const rawLongitude = url.searchParams.get('longitude')
  if (rawLatitude === null || rawLatitude.trim() === '' || rawLongitude === null || rawLongitude.trim() === '') {
    return { error: 'Both latitude and longitude are required.' }
  }
  const latitude = Number(rawLatitude)
  const longitude = Number(rawLongitude)
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
    return { error: 'Latitude must be a number from -90 to 90.' }
  }
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    return { error: 'Longitude must be a number from -180 to 180.' }
  }
  return { latitude, longitude }
}

async function getWeather(latitude, longitude) {
  const query = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: 'relative_humidity_2m,cloud_cover,visibility',
    timezone: 'auto',
  })
  const upstream = await fetch(`https://api.open-meteo.com/v1/forecast?${query}`, {
    signal: AbortSignal.timeout(WEATHER_TIMEOUT_MS),
    headers: { Accept: 'application/json' },
  })
  if (!upstream.ok) throw new Error(`Weather provider responded ${upstream.status}`)
  const payload = await upstream.json()
  const current = payload.current
  const cloudCover = Number(current?.cloud_cover)
  const humidity = Number(current?.relative_humidity_2m)
  const visibilityMeters = Number(current?.visibility)
  if (![cloudCover, humidity, visibilityMeters].every(Number.isFinite)) {
    throw new Error('Weather provider returned incomplete data')
  }
  const honorScore = Math.max(0, Math.min(100, Math.round(100 - cloudCover * 0.7 - humidity * 0.15)))
  return {
    cloudCover,
    visibilityKm: Math.round((visibilityMeters / 1000) * 10) / 10,
    humidity,
    honorScore,
    observedAt: current.time ?? null,
    source: 'Open-Meteo',
    scoreMethod: '100 - (cloud cover × 0.7) - (humidity × 0.15); capped at 0–100',
  }
}

const server = http.createServer(async (request, response) => {
  let url
  try {
    url = new URL(request.url || '/', 'http://localhost')
  } catch {
    return send(response, 400, { error: 'Malformed request URL.' })
  }

  if (request.method === 'OPTIONS') {
    response.writeHead(204, { 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' })
    return response.end()
  }

  if (url.pathname === '/api/health') {
    if (request.method !== 'GET') return send(response, 405, { error: 'Method not allowed. Use GET.' })
    return send(response, 200, { status: 'ok', service: 'Tsukuyomi Watch API' })
  }

  if (url.pathname === '/api/moon') {
    if (request.method !== 'GET') return send(response, 405, { error: 'Method not allowed. Use GET.' })
    return send(response, 200, phaseFor())
  }

  if (url.pathname === '/api/events') {
    if (request.method !== 'GET') return send(response, 405, { error: 'Method not allowed. Use GET.' })
    return send(response, 200, { source: 'demo', events: demoEvents })
  }

  if (url.pathname === '/api/weather') {
    if (request.method !== 'GET') return send(response, 405, { error: 'Method not allowed. Use GET.' })
    const coordinates = parseCoordinates(url)
    if (coordinates.error) return send(response, 400, { error: coordinates.error })
    try {
      const weather = await getWeather(coordinates.latitude, coordinates.longitude)
      return send(response, 200, weather)
    } catch (error) {
      const timedOut = error?.name === 'TimeoutError' || error?.name === 'AbortError'
      const message = timedOut ? 'Weather provider timed out. Please try again.' : 'Live weather is temporarily unavailable.'
      return send(response, 502, { error: message, source: 'Open-Meteo' })
    }
  }

  return send(response, 404, { error: 'Route not found.' })
})

server.requestTimeout = 10_000
server.headersTimeout = 12_000
server.listen(PORT, '0.0.0.0', () => console.log(`Tsukuyomi API listening on http://localhost:${PORT}`))
