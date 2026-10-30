import { ApiError } from '../http.js'

const WINDOW_MS = 60_000
const DEFAULT_LIMIT = 90
const MAX_CLIENTS = 10_000
const clients = new Map()

const cleanup = setInterval(() => {
  const cutoff = Date.now() - WINDOW_MS
  for (const [key, state] of clients) if (state.startedAt < cutoff) clients.delete(key)
}, WINDOW_MS)
cleanup.unref()

export function checkRateLimit(request, { limit = DEFAULT_LIMIT } = {}) {
  const key = request.socket.remoteAddress || 'unknown'
  const now = Date.now()
  let state = clients.get(key)
  if (!state || now - state.startedAt >= WINDOW_MS) {
    if (!state && clients.size >= MAX_CLIENTS) {
      const oldestKey = clients.keys().next().value
      if (oldestKey !== undefined) clients.delete(oldestKey)
    }
    state = { startedAt: now, count: 0 }
  }
  state.count += 1
  clients.set(key, state)
  if (state.count > limit) {
    const retryAfter = Math.max(1, Math.ceil((state.startedAt + WINDOW_MS - now) / 1000))
    throw new ApiError(429, 'RATE_LIMITED', 'Too many requests. Please wait before trying again.', { retryAfterSeconds: retryAfter })
  }
  return {
    'RateLimit-Limit': String(limit),
    'RateLimit-Remaining': String(Math.max(0, limit - state.count)),
    'RateLimit-Reset': String(Math.ceil((state.startedAt + WINDOW_MS) / 1000)),
  }
}
