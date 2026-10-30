import { MemoryCache } from '../cache.js'
import { ApiError } from '../http.js'

const cache = new MemoryCache()
const CACHE_TTL_MS = 15 * 60_000
const STALE_TTL_MS = 2 * 60 * 60_000
const TIMEOUT_MS = 9_000

function text(value, fallback = '') {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

function normalizeLaunch(item) {
  const provider = item.launch_service_provider ?? item.lsp
  const rocket = item.rocket?.configuration ?? item.rocket
  const pad = item.pad
  const mission = item.mission
  return {
    id: String(item.id ?? item.slug ?? item.name),
    name: text(item.name, 'Untitled launch'),
    net: typeof item.net === 'string' ? item.net : null,
    windowStart: typeof item.window_start === 'string' ? item.window_start : null,
    windowEnd: typeof item.window_end === 'string' ? item.window_end : null,
    netPrecision: text(item.net_precision?.name ?? item.net_precision),
    status: text(item.status?.name ?? item.status, 'Status unavailable'),
    provider: text(provider?.name ?? provider, 'Provider unavailable'),
    rocket: text(rocket?.full_name ?? rocket?.name ?? rocket?.configuration?.name),
    mission: text(mission?.name),
    missionDescription: text(mission?.description).slice(0, 240),
    location: text(pad?.location?.name ?? pad?.location),
    pad: text(pad?.name),
    webcastUrl: typeof item.webcast_live === 'string' ? item.webcast_live : null,
  }
}

async function fetchUpcomingLaunches() {
  const query = new URLSearchParams({ limit: '10', mode: 'normal', hide_recent_previous: 'true' })
  let response
  try {
    response = await fetch(`https://ll.thespacedevs.com/2.3.0/launches/upcoming/?${query}`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
  } catch (error) {
    if (error?.name === 'TimeoutError' || error?.name === 'AbortError') {
      throw new ApiError(504, 'LAUNCH_PROVIDER_TIMEOUT', 'The launch schedule took too long to load. Please try again.')
    }
    throw new ApiError(502, 'LAUNCH_PROVIDER_ERROR', 'The launch schedule is temporarily unavailable.')
  }
  if (!response.ok) throw new ApiError(502, 'LAUNCH_PROVIDER_ERROR', 'The launch schedule is temporarily unavailable.')

  let payload
  try {
    payload = await response.json()
  } catch {
    throw new ApiError(502, 'LAUNCH_DATA_INVALID', 'The launch provider returned invalid data.')
  }
  if (!Array.isArray(payload.results)) throw new ApiError(502, 'LAUNCH_DATA_INVALID', 'The launch provider returned invalid data.')

  const launches = payload.results.map(normalizeLaunch)
  return { launches, source: 'The Space Devs Launch Library 2', updatedAt: new Date().toISOString() }
}

export async function getUpcomingLaunches() {
  const result = await cache.getOrLoad('upcoming-launches', fetchUpcomingLaunches, {
    ttlMs: CACHE_TTL_MS,
    staleMs: STALE_TTL_MS,
  })
  return { ...result.value, cache: result.cache }
}
