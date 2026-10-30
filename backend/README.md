# Tsukuyomi Watch API

Dependency-free Node.js backend for the hackathon demo. Requires Node 20 or newer. It uses Node's built-in HTTP server and `fetch`, so there is no `npm install` step.

## Run locally

Open a terminal at the repository root and start the API:

```powershell
cd backend
npm start
```

It listens on port 3001 by default. Set `PORT` to change the port.

In another terminal, run the frontend:

```powershell
cd frontend
npm run dev
```

Vite proxies `/api/*` to the backend. For non-local hosting, set `CORS_ORIGINS` to a comma-separated list of exact allowed origins, for example `https://your-demo.example`.

## API

### `GET /api/health`

Returns process health, service name, version, and uptime. It does not claim that upstream providers are healthy.

### `GET /api/weather?latitude=13.08&longitude=80.27`

Both coordinates are required and range checked. Returns current cloud cover, visibility in kilometres, humidity, observation time, provider, cache state, and `honorScore`. It also includes the next 12 hourly readings and `bestWindow`, the clearest consecutive three-hour period (or the best available shorter period).

The score is an explainable demo heuristic: 55% cloud clarity, 30% visibility (capped at 20 km), and 15% inverse humidity. It is not an astronomy forecast. Weather data and its hourly forecast are cached together for five minutes; a previous response can be served stale for up to 20 more minutes if Open-Meteo is unavailable. Concurrent identical requests share one provider request. Coordinates are rounded to two decimals before fetching and caching.

### `GET /api/visibility-map?latitude=13.08&longitude=80.27&radiusKm=30`

Returns a 5×5 grid of nearby visibility readings from Open-Meteo in one multi-location request. `radiusKm` is the map's approximate half-width and must be 5–100. The grid is cached for ten minutes, with stale fallback for up to thirty minutes. The frontend colors poor visibility dark red and clearer visibility pale red; values are approximate model-grid readings, not ground measurements.

The map uses Leaflet with OpenStreetMap tiles and displays tile attribution. The public OSM tile service is best-effort and subject to its [tile usage policy](https://operations.osmfoundation.org/policies/tiles/); it is suitable for this demo, not high-volume production traffic.

### `GET /api/stargazing-spots?latitude=13.08&longitude=80.27`

The frontend calls this endpoint only after the user selects **Find spots · 5 km**. It searches named parks, nature reserves, campsites, viewpoints, beaches, and peaks in OpenStreetMap within 5 km, returns up to 40 nearby results sorted by distance, and caches results for ten minutes with stale fallback. The selected coordinates are sent to the public Overpass API for the lookup. These are candidate outdoor places, not confirmed dark-sky sites; opening hours, access, and night-sky conditions are not verified. The frontend credits OpenStreetMap contributors.

### `GET /api/launches`

Returns up to ten upcoming launch records from The Space Devs Launch Library 2. The frontend requests this only when the user opens the **Launches** guide. Results are cached for 15 minutes, with stale fallback for up to two hours; upstream requests have a nine-second timeout. Launch dates and statuses may change, and are not official launch commitments.

### `GET /api/moon`

Returns approximate phase name, illumination, cycle fraction, age, and calculation time. It uses an average synodic month, so it is suitable for a UI indicator, not precise ephemeris work.

### `GET /api/events`

Returns event-guidance cards with `source: "demo"`. They are not dated live predictions. Optional filters:

- `type`: `meteor-shower`, `moon-phase`, `iss-pass`, `eclipse`, or `launch`
- `limit`: integer from 1 to 20

Example: `/api/events?type=iss-pass&limit=5`

## Reliability and safety

- JSON errors include a stable error code and request ID. Invalid inputs use HTTP 400; unavailable upstream data uses 502 or 504.
- Read-only API requests are rate limited per client IP to 90 requests per minute. The in-memory limiter and weather cache reset when the process restarts and are per process; use shared infrastructure before deploying multiple instances.
- The server logs request ID, method, path, status, and duration. It omits query strings so coordinates are not written to request logs.
- Only local development origins are allowed by default. Configure exact production origins with `CORS_ORIGINS`.
- Event content is intentionally labeled demo. Replace it with a verified astronomy source before presenting it as live event data.
