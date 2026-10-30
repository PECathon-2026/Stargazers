import http from 'node:http'
import { randomUUID } from 'node:crypto'
import { ApiError, sendError, sendJson, validateCoordinates } from './src/http.js'
import { checkRateLimit } from './src/middleware/rate-limit.js'
import { getEvents } from './src/services/events.js'
import { getMoonPhase } from './src/services/moon.js'
import { getNearbySpots } from './src/services/spots.js'
import { getUpcomingLaunches } from './src/services/launches.js'
import { getVisibilityMap, getWeather } from './src/services/weather.js'

const PORT = Number(process.env.PORT || 3001)
if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65_535) throw new Error('PORT must be an integer from 1 to 65535.')
const MAX_URL_LENGTH = 2_048
const configuredOrigins = new Set((process.env.CORS_ORIGINS || '').split(',').map((origin) => origin.trim()).filter(Boolean))

function applyCors(request, response) {
  const origin = request.headers.origin
  if (!origin) return
  const isLocalDevOrigin = /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)
  if (!isLocalDevOrigin && !configuredOrigins.has(origin)) {
    throw new ApiError(403, 'ORIGIN_NOT_ALLOWED', 'This origin is not allowed to access the API.')
  }
  response.setHeader('Access-Control-Allow-Origin', origin)
  response.setHeader('Vary', 'Origin')
}

async function route(request, url) {
  if (request.method !== 'GET' && request.method !== 'OPTIONS') {
    throw new ApiError(405, 'METHOD_NOT_ALLOWED', 'Use GET for this endpoint.')
  }

  if (request.method === 'OPTIONS') return { status: 204, body: null }
  if (url.pathname === '/api/health') {
    return { status: 200, body: { status: 'ok', service: 'Tsukuyomi Watch API', version: '1.0.0', uptimeSeconds: Math.floor(process.uptime()) } }
  }
  if (url.pathname === '/api/weather') {
    const { latitude, longitude } = validateCoordinates(url)
    return { status: 200, body: await getWeather(latitude, longitude) }
  }
  if (url.pathname === '/api/visibility-map') {
    const { latitude, longitude } = validateCoordinates(url)
    const rawRadius = url.searchParams.get('radiusKm')
    const radiusKm = rawRadius === null ? 30 : Number(rawRadius)
    if (!Number.isFinite(radiusKm) || radiusKm < 5 || radiusKm > 100) {
      throw new ApiError(400, 'INVALID_RADIUS', 'radiusKm must be a number from 5 to 100.')
    }
    return { status: 200, body: await getVisibilityMap(latitude, longitude, radiusKm) }
  }
  if (url.pathname === '/api/stargazing-spots') {
    const { latitude, longitude } = validateCoordinates(url)
    return { status: 200, body: await getNearbySpots(latitude, longitude) }
  }
  if (url.pathname === '/api/launches') {
    return { status: 200, body: await getUpcomingLaunches() }
  }
  if (url.pathname === '/api/moon') {
    return { status: 200, body: getMoonPhase() }
  }
  if (url.pathname === '/api/events') {
    return { status: 200, body: getEvents(url) }
  }
  throw new ApiError(404, 'NOT_FOUND', 'Route not found.')
}

const server = http.createServer(async (request, response) => {
  const requestId = randomUUID()
  const startedAt = Date.now()
  let status = 500
  response.setHeader('X-Request-Id', requestId)
  response.setHeader('X-Content-Type-Options', 'nosniff')
  response.setHeader('Referrer-Policy', 'no-referrer')
  response.setHeader('Cache-Control', 'no-store')

  response.on('finish', () => {
    console.log(JSON.stringify({
      level: 'info',
      requestId,
      method: request.method,
      path: (request.url || '/').split('?')[0],
      status: response.statusCode,
      durationMs: Date.now() - startedAt,
    }))
  })

  try {
    applyCors(request, response)
    const rateHeaders = checkRateLimit(request)
    for (const [name, value] of Object.entries(rateHeaders)) response.setHeader(name, value)

    if ((request.url || '').length > MAX_URL_LENGTH) {
      throw new ApiError(414, 'URI_TOO_LONG', 'Request URL is too long.')
    }
    const url = new URL(request.url || '/', 'http://localhost')
    if (request.method === 'OPTIONS') {
      response.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
      response.setHeader('Access-Control-Allow-Headers', 'Content-Type')
      response.setHeader('Access-Control-Max-Age', '600')
    }
    const result = await route(request, url)
    status = result.status
    if (status === 204) {
      response.writeHead(204)
      return response.end()
    }
    return sendJson(response, status, { ...result.body, requestId }, {
      'RateLimit-Limit': response.getHeader('RateLimit-Limit'),
      'RateLimit-Remaining': response.getHeader('RateLimit-Remaining'),
      'RateLimit-Reset': response.getHeader('RateLimit-Reset'),
      'X-Request-Id': requestId,
      ...(result.body.cache === 'stale' ? { Warning: '110 - "Response is stale; upstream unavailable"' } : {}),
    })
  } catch (error) {
    status = error instanceof ApiError ? error.status : 500
    if (!response.headersSent) return sendError(response, requestId, error)
    response.destroy(error)
  }
})

server.requestTimeout = 10_000
server.headersTimeout = 12_000
server.keepAliveTimeout = 5_000
server.maxHeadersCount = 50
server.on('clientError', (_error, socket) => {
  if (socket.writable) socket.end('HTTP/1.1 400 Bad Request\r\nConnection: close\r\n\r\n')
})

server.listen(PORT, '127.0.0.1', () => console.log(`Tsukuyomi API listening on http://localhost:${PORT}`))

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => server.close(() => process.exit(0)))
}
