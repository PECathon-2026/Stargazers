import { ApiError, getQueryString } from '../http.js'

// These records are guidance cards for the demo, not scheduled astronomical predictions.
const events = [
  { id: 'meteor-shower', day: 'SKY GUIDE', type: 'METEOR SHOWER', eventType: 'meteor-shower', title: 'Meteor shower watching', detail: 'Find a dark location, allow your eyes to adjust, and scan a wide patch of sky.', icon: '✦', source: 'demo' },
  { id: 'moon-watch', day: 'MOON WATCH', type: 'MOON PHASE', eventType: 'moon-phase', title: 'Track the lunar cycle', detail: 'Use the live phase indicator for tonight’s moon.', icon: '◐', source: 'demo' },
  { id: 'iss-watch', day: 'ORBITAL GUIDE', type: 'ISS PASS', eventType: 'iss-pass', title: 'Spot the space station', detail: 'ISS visibility is location and time specific; consult a live pass service before planning.', icon: '⌁', source: 'demo' },
  { id: 'eclipse-watch', day: 'ECLIPSE GUIDE', type: 'ECLIPSE', eventType: 'eclipse', title: 'Plan an eclipse watch', detail: 'Check a current astronomical almanac for dates, path, and local circumstances.', icon: '☼', source: 'demo' },
  { id: 'launch-watch', day: 'LAUNCH GUIDE', type: 'ROCKET LAUNCH', eventType: 'launch', title: 'Follow a launch window', detail: 'Launch schedules can change; verify the latest official mission schedule.', icon: '↗', source: 'demo' },
]
const allowedTypes = new Set(events.map((event) => event.eventType))

export function getEvents(url) {
  const requestedType = getQueryString(url, 'type')
  if (requestedType && !allowedTypes.has(requestedType)) {
    throw new ApiError(400, 'INVALID_EVENT_TYPE', 'Unknown event type.', { allowedTypes: [...allowedTypes] })
  }
  const rawLimit = getQueryString(url, 'limit')
  const limit = rawLimit === null ? 20 : Number(rawLimit)
  if (!Number.isInteger(limit) || limit < 1 || limit > 20) {
    throw new ApiError(400, 'INVALID_LIMIT', 'Limit must be a whole number from 1 to 20.')
  }
  const filtered = requestedType ? events.filter((event) => event.eventType === requestedType) : events
  return { source: 'demo', events: filtered.slice(0, limit), total: filtered.length }
}
