export class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message)
    this.status = status
    this.code = code
    this.details = details
  }
}

export function sendJson(response, status, body, headers = {}) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'X-Content-Type-Options': 'nosniff',
    'Cache-Control': 'no-store',
    ...headers,
  })
  response.end(JSON.stringify(body))
}

export function sendError(response, requestId, error) {
  const status = error instanceof ApiError ? error.status : 500
  const body = {
    error: {
      code: error instanceof ApiError ? error.code : 'INTERNAL_ERROR',
      message: status === 500 ? 'An unexpected server error occurred.' : error.message,
      ...(error instanceof ApiError && error.details ? { details: error.details } : {}),
    },
    requestId,
  }
  const headers = error instanceof ApiError && error.status === 429 && error.details?.retryAfterSeconds
    ? { 'Retry-After': String(error.details.retryAfterSeconds) }
    : {}
  return sendJson(response, status, body, headers)
}

export function getQueryString(url, name) {
  const values = url.searchParams.getAll(name)
  if (values.length > 1) throw new ApiError(400, 'DUPLICATE_PARAMETER', `Provide the ${name} parameter once.`)
  return values[0] ?? null
}

export function validateCoordinates(url) {
  const rawLatitude = getQueryString(url, 'latitude')
  const rawLongitude = getQueryString(url, 'longitude')
  const errors = {}

  if (rawLatitude === null || rawLatitude.trim() === '') errors.latitude = 'Required; use a number from -90 to 90.'
  else {
    const latitude = Number(rawLatitude)
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) errors.latitude = 'Must be a number from -90 to 90.'
  }
  if (rawLongitude === null || rawLongitude.trim() === '') errors.longitude = 'Required; use a number from -180 to 180.'
  else {
    const longitude = Number(rawLongitude)
    if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) errors.longitude = 'Must be a number from -180 to 180.'
  }
  if (Object.keys(errors).length) throw new ApiError(400, 'VALIDATION_ERROR', 'Invalid query parameters.', errors)
  return { latitude: Number(rawLatitude), longitude: Number(rawLongitude) }
}
