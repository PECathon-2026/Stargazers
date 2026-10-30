import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import nightScene from './assets/tsukuyomi-night.jpeg'
import './style.css'

const app = document.querySelector<HTMLDivElement>('#app')!
app.innerHTML = `
  <aside class="sidebar">
    <a class="brand" href="#home"><span class="brand-mark" aria-hidden="true"><span>☾</span><i>侍</i></span><span>TSUKUYOMI<small>MOONLIT FIELD JOURNAL</small></span></a>
    <div class="side-label">THE NIGHT WATCH</div>
    <nav aria-label="Field journal sections"><a class="nav-item active" href="#home"><span>◈</span> The watch</a><a class="nav-item" href="#events"><span>✧</span> Moon scroll</a><a class="nav-item" href="#lens"><span>◉</span> Spirit lens</a></nav>
    <div class="sidebar-bottom"><div class="moon-art" id="moon-symbol">☾</div><div class="moon-watch-copy"><div class="side-label">TONIGHT'S MOON</div><div class="moon-name" id="moon-name">Loading moon…</div><div class="moon-meta">Illumination <b id="moon-illumination">—</b></div><div class="moon-progress"><i id="moon-progress"></i></div></div><div class="side-note">“Keep a quiet watch.<br>The stars will answer.”</div></div>
  </aside>
  <main class="main" id="home">
    <header class="topbar"><div class="breadcrumb"><span class="journal-index">夜 · 01</span> FIELD JOURNAL <span>/</span> NIGHT WATCH</div><div class="top-right"><span class="live-dot"></span> SKY DATA <b>LIVE</b><div class="avatar">侍</div></div></header>
    <section class="welcome hero-scene" style="--hero-scene: url('${nightScene}')" aria-label="Moonlit mountain and temple beneath a red moon">
      <div class="hero-content"><div class="eyebrow"><span></span> A SAMURAI'S FIELD JOURNAL · 月読 <span></span></div><h1>Keep watch with <em>Tsukuyomi.</em></h1><p class="intro">Beneath the crimson moon, follow the stars and find your next clear sky.</p><a class="hero-cta" href="#events">Unroll tonight's sky scroll <span>↓</span></a></div>
      <div class="hero-seal" aria-hidden="true"><span>侍</span><i>月読</i><small>NIGHT WATCH</small></div>
    </section>
    <section class="sky-card"><div class="sky-copy"><div class="card-kicker"><span>◌</span> FIELD REPORT · TONIGHT'S SKY</div><div class="place-display"><strong id="place">Chennai, India</strong><small id="place-detail">13.08°, 80.27° · DEFAULT LOCATION</small></div><h2>Clear skies ahead,<br><em>stargazer.</em></h2><p>Conditions are looking promising. The stars are calling.</p><div class="location-actions"><button class="location-btn" id="location-btn">⌖ &nbsp;Use my location</button><button class="location-reset" id="default-location-btn" type="button">Use Chennai</button></div></div><div class="sky-score"><div class="score-ring"><div><strong id="score">82</strong><small>/ 100</small></div></div><div class="score-label">NIGHT WATCH SCORE</div><div class="score-status">✦ &nbsp; EXCELLENT VIEWING</div></div><div class="sky-metrics"><div><span>☁</span><small>CLOUD COVER</small><b id="cloud">12%</b></div><div><span>◉</span><small>VISIBILITY</small><b id="visibility">18 km</b></div><div><span>♧</span><small>HUMIDITY</small><b id="humidity">64%</b></div><div><span>◷</span><small>BEST VIEWING</small><b id="best-view-time">—</b></div></div></section>
    <section class="forecast-panel" aria-labelledby="forecast-title">
      <div class="forecast-header"><div><div class="eyebrow left">LIVE HOURLY OUTLOOK</div><h2 id="forecast-title">The sky by <em>hour</em></h2></div><div class="best-window" id="best-window">Finding the clearest stretch…</div></div>
      <div class="hourly-forecast" id="hourly-forecast" role="list" aria-label="Sky forecast for the next twelve hours"><p class="event-loading">Loading hourly outlook…</p></div>
      <div class="forecast-footnote">Forecast scores are estimates based on cloud cover, visibility, and humidity.</div>
    </section>
    <section class="map-panel" aria-labelledby="map-title">
      <div class="map-header"><div><div class="eyebrow left">LOCAL SKY CONDITIONS</div><h2 id="map-title">Visibility <em>map</em></h2><p>Visibility across the area around your selected location.</p></div><span class="map-status" id="map-status">Loading visibility grid…</span></div>
      <div class="visibility-map" id="visibility-map" role="region" aria-label="Map showing local visibility readings"></div>
      <div class="map-legend"><span>POOR · 0 KM</span><div class="legend-gradient"></div><span>CLEAR · 20+ KM</span></div>
      <div class="map-footnote">Darker red means lower visibility. Select a shaded area to see its reading. Weather grid is approximate.</div>
      <div class="spot-section" aria-labelledby="spots-title">
        <div class="spot-section-header"><div><div class="eyebrow left">NEAR YOUR LOCATION</div><h3 id="spots-title">Stargazing <em>spots</em></h3><p>Look for named outdoor places within 5 km when you need them.</p></div><button class="spot-search-button" id="search-spots-button" type="button">⌖ Find spots · 5 km</button></div>
        <p class="spot-hint" id="nearby-spot-hint" aria-live="polite">Search runs only when you click the button.</p>
        <div class="spot-table-wrap"><table class="spot-table"><thead><tr><th>NEARBY PLACE</th><th>TYPE</th><th>DISTANCE</th></tr></thead><tbody id="nearby-spot-table-body"><tr><td colspan="3" class="spot-empty">Click “Find spots” to search nearby.</td></tr></tbody></table></div>
        <div class="spot-source">Nearby outdoor places from <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap contributors</a>. Access and stargazing suitability are not verified.</div>
        <div class="spot-saved-heading"><div class="eyebrow left">YOUR SAVED LOCATIONS</div><p>Mark your own places to revisit on the map.</p></div>
        <p class="spot-hint" id="spot-hint" aria-live="polite">Add a spot, then click its location on the map.</p>
        <button class="spot-add-button" id="add-spot-button" type="button">＋ Add a spot on the map</button>
        <form class="spot-name-form" id="spot-name-form" hidden>
          <label for="spot-name-input">Name this stargazing spot</label>
          <input id="spot-name-input" name="spotName" maxlength="80" required placeholder="For example, Lakeside lookout">
          <button class="spot-save-button" type="submit">Save spot</button>
          <button class="spot-cancel-button" id="cancel-spot-save" type="button">Cancel</button>
        </form>
        <div class="spot-table-wrap"><table class="spot-table"><thead><tr><th>SPOT</th><th>FROM SELECTED LOCATION</th><th></th></tr></thead><tbody id="spot-table-body"><tr><td colspan="3" class="spot-empty">No saved spots yet. Add one on the map.</td></tr></tbody></table></div>
        <div class="spot-source">Saved only in this browser on this device.</div>
      </div>
    </section>
    <div class="section-head event-section-head" id="events"><div><div class="eyebrow left">THE MOONLIT SCROLL · 月の巻物</div><h2>The celestial <em>scroll</em></h2></div><div class="event-head-actions"><button class="text-button" id="all-events">VIEW ALL GUIDES <span>↗</span></button><div class="event-scroll-controls" aria-label="Scroll event highlights"><button class="event-scroll-button" id="event-scroll-left" type="button" aria-label="Scroll to previous guides">‹</button><button class="event-scroll-button" id="event-scroll-right" type="button" aria-label="Scroll to more guides">›</button></div></div></div>
    <div class="event-filters" role="group" aria-label="Filter celestial guides">
      <button class="event-filter active" type="button" data-event-type="all" aria-pressed="true">All guides</button>
      <button class="event-filter" type="button" data-event-type="meteor-shower" aria-pressed="false">Meteor showers</button>
      <button class="event-filter" type="button" data-event-type="moon-phase" aria-pressed="false">Moon phases</button>
      <button class="event-filter" type="button" data-event-type="iss-pass" aria-pressed="false">ISS passes</button>
      <button class="event-filter" type="button" data-event-type="eclipse" aria-pressed="false">Eclipses</button>
      <button class="event-filter" type="button" data-event-type="launch" aria-pressed="false">Launches</button>
    </div>
    <p class="event-scroll-hint">Swipe, drag, use your mouse wheel, or tap the arrows to browse.</p>
    <section class="event-grid" id="event-grid" tabindex="0" aria-label="Scrollable celestial event highlights" aria-live="polite"><p class="event-loading">Loading celestial highlights…</p></section><div class="data-note" id="event-source">These are illustrative guides, not live event predictions.</div>
    <section class="lens-strip" id="lens"><div class="lens-icon">◉</div><div class="lens-copy"><div class="eyebrow left">THE SPIRIT LENS</div><h2>Bring the cosmos <em>into focus.</em></h2><p>Upload an astronomical image to start exploring.</p></div><button class="lens-button" id="upload-trigger">CHOOSE IMAGE <span>↗</span></button><input id="image-input" type="file" accept="image/*" hidden></section>
    <div class="image-preview" id="image-preview" hidden><img id="preview-image" alt="Your selected astronomical image"><div><b id="preview-name"></b><p>Original image selected. Image restoration can be connected here.</p></div></div>
    <footer>KEEP THE MOONLIT WATCH <span>✦</span> TSUKUYOMI 月読</footer>
  </main>
  <div class="toast" id="toast"></div>
`

const toast = (message: string) => {
  const el = document.querySelector<HTMLDivElement>('#toast')!
  el.textContent = message
  el.classList.add('show')
  window.setTimeout(() => el.classList.remove('show'), 2800)
}

type HourlyForecast = { time: string; cloudCover: number; visibilityKm: number; humidity: number; honorScore: number }
type MoonPhase = { name: string; illumination: number; ageDays: number; phaseFraction: number; asOf: string; source: string }
type BestWindow = { from: string; to: string; averageScore: number; hours: number } | null
type WeatherResponse = { cloudCover: number; visibilityKm: number; humidity: number; honorScore: number; hourly?: HourlyForecast[]; bestWindow?: BestWindow }
type VisibilityPoint = { latitude: number; longitude: number; visibilityKm: number; row: number; column: number }
type StargazingSpot = { id: string; name: string; latitude: number; longitude: number }
type NearbySpot = StargazingSpot & { kind: string; distanceKm: number }
let visibilityMap: L.Map | undefined
let visibilityLayer: L.LayerGroup | undefined
let spotLayer: L.LayerGroup | undefined
let nearbySpotLayer: L.LayerGroup | undefined
let nearbySearchRadiusLayer: L.LayerGroup | undefined
let visibilityHeatLayer: L.Layer | undefined
let visibilityRequest: AbortController | undefined
let activeLocation: { latitude: number; longitude: number } = { latitude: 13.0827, longitude: 80.2707 }
let addingSpot = false
let pendingSpotCoordinates: { latitude: number; longitude: number } | null = null
let stargazingSpots = loadSavedSpots()
let nearbySpots: NearbySpot[] = []
let nearbySearchDone = false

function loadSavedSpots(): StargazingSpot[] {
  try {
    const saved = JSON.parse(localStorage.getItem('tsukuyomi-stargazing-spots') || '[]') as unknown
    if (!Array.isArray(saved)) return []
    return saved.filter((spot): spot is StargazingSpot => typeof spot?.id === 'string' && typeof spot?.name === 'string' && Number.isFinite(spot?.latitude) && Number.isFinite(spot?.longitude))
  } catch {
    return []
  }
}

function saveStargazingSpots() {
  localStorage.setItem('tsukuyomi-stargazing-spots', JSON.stringify(stargazingSpots))
}

function distanceBetweenKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const radians = (degrees: number) => degrees * Math.PI / 180
  const dLat = radians(lat2 - lat1)
  const dLon = radians(lon2 - lon1)
  const value = Math.sin(dLat / 2) ** 2 + Math.cos(radians(lat1)) * Math.cos(radians(lat2)) * Math.sin(dLon / 2) ** 2
  return 6371 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value))
}

function renderStargazingSpots() {
  const body = document.querySelector<HTMLTableSectionElement>('#spot-table-body')!
  body.innerHTML = stargazingSpots.length ? stargazingSpots.map((spot) => `
    <tr>
      <td><button class="spot-name-button" type="button" data-spot-id="${spot.id}"><span class="spot-star">✦</span>${escapeHtml(spot.name)}</button></td>
      <td>${distanceBetweenKm(activeLocation.latitude, activeLocation.longitude, spot.latitude, spot.longitude).toFixed(1)} km</td>
      <td><button class="spot-remove" type="button" data-remove-spot="${spot.id}" aria-label="Remove ${escapeHtml(spot.name)}">Remove</button></td>
    </tr>`).join('') : '<tr><td colspan="3" class="spot-empty">No saved spots yet. Add one on the map.</td></tr>'
  if (!spotLayer) return
  spotLayer.clearLayers()
  for (const [index, spot] of stargazingSpots.entries()) {
    const icon = L.divIcon({ className: 'stargazing-pin', html: '<span>✦</span>', iconSize: [30, 36], iconAnchor: [15, 31] })
    L.marker([spot.latitude, spot.longitude], { icon, zIndexOffset: 1000 + index })
      .bindPopup(`<strong>${escapeHtml(spot.name)}</strong><br>Saved stargazing spot`)
      .addTo(spotLayer!)
  }
}

function renderNearbySpots() {
  const body = document.querySelector<HTMLTableSectionElement>('#nearby-spot-table-body')!
  if (!nearbySpots.length) {
    const message = nearbySearchDone ? 'No named outdoor places were found within 5 km.' : 'Click “Find spots” to search nearby.'
    body.innerHTML = `<tr><td colspan="3" class="spot-empty">${message}</td></tr>`
  } else {
    body.innerHTML = nearbySpots.map((spot) => `
      <tr>
        <td><button class="spot-name-button" type="button" data-nearby-spot-id="${escapeHtml(spot.id)}"><span class="spot-star nearby-star">✦</span>${escapeHtml(spot.name)}</button></td>
        <td>${escapeHtml(spot.kind)}</td>
        <td>${spot.distanceKm.toFixed(1)} km</td>
      </tr>`).join('')
  }
  nearbySpotLayer?.clearLayers()
  if (!nearbySpotLayer) return
  for (const spot of nearbySpots) {
    const icon = L.divIcon({ className: 'nearby-spot-pin', html: '<span>✦</span>', iconSize: [30, 36], iconAnchor: [15, 31] })
    L.marker([spot.latitude, spot.longitude], { icon, zIndexOffset: 1500 })
      .bindPopup(`<strong>${escapeHtml(spot.name)}</strong><br>${escapeHtml(spot.kind)} · ${spot.distanceKm.toFixed(1)} km<br><small>Outdoor place; access and sky quality are not verified.</small>`)
      .addTo(nearbySpotLayer)
  }
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]!)
}

function makeVisibilityHeatLayer(points: VisibilityPoint[]) {
  const HeatOverlay = L.Layer.extend({
    onAdd(map: L.Map) {
      const canvas = L.DomUtil.create('canvas', 'visibility-heat-overlay') as HTMLCanvasElement
      const size = map.getSize()
      canvas.width = size.x * 2
      canvas.height = size.y * 2
      canvas.style.width = `${size.x}px`
      canvas.style.height = `${size.y}px`
      canvas.style.position = 'absolute'
      canvas.style.pointerEvents = 'none'
      const topLeft = map.containerPointToLayerPoint([0, 0])
      L.DomUtil.setPosition(canvas, topLeft)
      map.getPanes().overlayPane.appendChild(canvas)
      const context = canvas.getContext('2d')
      if (!context) return
      context.scale(2, 2)

      const rowStep = points.find((point) => point.row === 1 && point.column === 0)
      const columnStep = points.find((point) => point.row === 0 && point.column === 1)
      const firstPoint = points.find((point) => point.row === 0 && point.column === 0) ?? points[0]
      const firstPosition = map.latLngToContainerPoint([firstPoint.latitude, firstPoint.longitude])
      const horizontalStep = columnStep ? firstPosition.distanceTo(map.latLngToContainerPoint([columnStep.latitude, columnStep.longitude])) : 60
      const verticalStep = rowStep ? firstPosition.distanceTo(map.latLngToContainerPoint([rowStep.latitude, rowStep.longitude])) : horizontalStep
      const radius = Math.max(46, Math.min(115, Math.max(horizontalStep, verticalStep) * 1.25))

      const draw = () => {
        const currentSize = map.getSize()
        canvas.width = currentSize.x * 2
        canvas.height = currentSize.y * 2
        canvas.style.width = `${currentSize.x}px`
        canvas.style.height = `${currentSize.y}px`
        L.DomUtil.setPosition(canvas, map.containerPointToLayerPoint([0, 0]))
        context.setTransform(2, 0, 0, 2, 0, 0)
        context.clearRect(0, 0, currentSize.x, currentSize.y)
        for (const point of points) {
          const position = map.latLngToContainerPoint([point.latitude, point.longitude])
          const gradient = context.createRadialGradient(position.x, position.y, 1, position.x, position.y, radius)
          gradient.addColorStop(0, `${visibilityColor(point.visibilityKm)}b8`)
          gradient.addColorStop(0.48, `${visibilityColor(point.visibilityKm)}78`)
          gradient.addColorStop(1, `${visibilityColor(point.visibilityKm)}00`)
          context.fillStyle = gradient
          context.beginPath()
          context.arc(position.x, position.y, radius, 0, Math.PI * 2)
          context.fill()
        }
      }
      draw()

      const redraw = () => {
        draw()
      }
      map.on('moveend zoomend resize', redraw)
      ;(canvas as HTMLCanvasElement & { _cleanup?: () => void })._cleanup = () => map.off('moveend zoomend resize', redraw)
      this._canvas = canvas
    },
    onRemove() {
      const canvas = this._canvas as (HTMLCanvasElement & { _cleanup?: () => void }) | undefined
      canvas?._cleanup?.()
      canvas?.remove()
    },
    _canvas: undefined as HTMLCanvasElement | undefined,
  })
  return new HeatOverlay()
}

function formatForecastTime(value: string) {
  const hour = Number(value.slice(11, 13))
  if (!Number.isFinite(hour)) return value
  return `${hour % 12 || 12}${hour < 12 ? ' AM' : ' PM'}`
}

function updateSky(data: WeatherResponse, place: string, latitude: number, longitude: number, locationSource: string) {
  activeLocation = { latitude, longitude }
  nearbySpots = []
  nearbySearchDone = false
  nearbySearchRadiusLayer?.clearLayers()
  document.querySelector<HTMLParagraphElement>('#nearby-spot-hint')!.textContent = 'Search runs only when you click the button.'
  renderNearbySpots()
  document.querySelector('#cloud')!.textContent = `${data.cloudCover}%`
  document.querySelector('#visibility')!.textContent = `${data.visibilityKm} km`
  document.querySelector('#humidity')!.textContent = `${data.humidity}%`
  document.querySelector('#score')!.textContent = `${data.honorScore}`
  document.querySelector('#place')!.textContent = place
  document.querySelector('#place-detail')!.textContent = `${latitude.toFixed(2)}°, ${longitude.toFixed(2)}° · ${locationSource}`
  const bestWindow = data.bestWindow
  document.querySelector('#best-view-time')!.textContent = bestWindow ? `${formatForecastTime(bestWindow.from)} – ${formatForecastTime(bestWindow.to)}` : 'Unavailable'
  renderHourlyForecast(data.hourly ?? [], bestWindow ?? null)
  renderStargazingSpots()
  void loadVisibilityMap(latitude, longitude)
}

function renderHourlyForecast(hours: HourlyForecast[], bestWindow: BestWindow) {
  const container = document.querySelector<HTMLDivElement>('#hourly-forecast')!
  const bestWindowLabel = document.querySelector<HTMLDivElement>('#best-window')!
  if (!hours.length) {
    bestWindowLabel.textContent = 'Hourly forecast unavailable'
    container.innerHTML = '<p class="event-loading">Restart the backend to load the hourly forecast.</p>'
    return
  }
  bestWindowLabel.textContent = bestWindow
    ? `CLEAREST ${bestWindow.hours}-HOUR WINDOW · ${formatForecastTime(bestWindow.from)} – ${formatForecastTime(bestWindow.to)} · SCORE ${bestWindow.averageScore}`
    : 'Best window unavailable'
  container.innerHTML = hours.map((hour) => `
    <article class="hour-item" role="listitem" aria-label="${formatForecastTime(hour.time)}: score ${hour.honorScore}, cloud cover ${hour.cloudCover} percent, visibility ${hour.visibilityKm} kilometres">
      <div class="hour-time">${formatForecastTime(hour.time)}</div>
      <div class="hour-bar-track"><i style="height:${Math.max(5, hour.honorScore)}%"></i></div>
      <strong>${hour.honorScore}</strong>
      <small>${hour.cloudCover}% cloud</small>
      <small>${hour.visibilityKm} km vis.</small>
    </article>`).join('')
}

function visibilityColor(visibilityKm: number) {
  const poor = [127, 29, 29]
  const clear = [254, 226, 226]
  const amount = Math.max(0, Math.min(1, visibilityKm / 20))
  const channels = poor.map((start, index) => Math.round(start + (clear[index] - start) * amount))
  return `#${channels.map((channel) => channel.toString(16).padStart(2, '0')).join('')}`
}

function visibilityCondition(visibilityKm: number) {
  return visibilityKm < 5 ? 'Poor' : visibilityKm < 10 ? 'Limited' : visibilityKm < 20 ? 'Good' : 'Clear'
}

function moonGlyph(name: string) {
  const glyphs: Record<string, string> = {
    'New moon': '🌑', 'Waxing crescent': '🌒', 'First quarter': '🌓', 'Waxing gibbous': '🌔',
    'Full moon': '🌕', 'Waning gibbous': '🌖', 'Last quarter': '🌗', 'Waning crescent': '🌘',
  }
  return glyphs[name] ?? '🌙'
}

function renderMoonPhaseGuide(moon: MoonPhase) {
  const cycleDays = 29.530588853
  const majorPhases = [
    { age: 7.38, name: 'First quarter' },
    { age: 14.77, name: 'Full moon' },
    { age: 22.15, name: 'Last quarter' },
    { age: cycleDays, name: 'New moon' },
  ]
  const nextPhase = majorPhases.find((phase) => phase.age > moon.ageDays) ?? { age: cycleDays + 7.38, name: 'First quarter' }
  const daysUntil = nextPhase.age - moon.ageDays
  const nextDate = new Date(Date.parse(moon.asOf) + daysUntil * 86_400_000)
  const dateLabel = nextDate.toLocaleDateString(undefined, { month: 'long', day: 'numeric' })
  return `
    <article class="moon-guide-card">
      <div class="moon-guide-visual" aria-hidden="true">${moonGlyph(moon.name)}</div>
      <div class="moon-guide-content">
        <div class="moon-guide-kicker">CURRENT LUNAR PHASE</div>
        <h3>${moon.name}</h3>
        <p class="moon-guide-summary">The moon is ${moon.illumination}% illuminated and ${moon.ageDays} days into its ${cycleDays.toFixed(1)}-day cycle.</p>
        <div class="moon-guide-stats"><div><small>ILLUMINATION</small><strong>${moon.illumination}%</strong></div><div><small>LUNAR AGE</small><strong>${moon.ageDays} days</strong></div><div><small>NEXT MAJOR PHASE</small><strong>${nextPhase.name}</strong></div></div>
        <p class="moon-guide-next">About ${daysUntil < 1 ? 'less than a day' : `${daysUntil.toFixed(1)} days`} until ${nextPhase.name.toLowerCase()} · around ${dateLabel}.</p>
        <p class="moon-guide-note">Phase timing is an estimate from the average lunar cycle; local sky conditions can affect visibility.</p>
      </div>
    </article>`
}

const meteorShowers = [
  { name: 'Orionids', activeFrom: '2026-10-02', activeTo: '2026-11-07', peakFrom: '2026-10-21', peakTo: '2026-10-22' },
  { name: 'Southern Taurids', activeFrom: '2026-09-20', activeTo: '2026-11-20', peakFrom: '2026-11-04', peakTo: '2026-11-05' },
  { name: 'Northern Taurids', activeFrom: '2026-10-20', activeTo: '2026-12-10', peakFrom: '2026-11-11', peakTo: '2026-11-12' },
  { name: 'Leonids', activeFrom: '2026-11-06', activeTo: '2026-11-30', peakFrom: '2026-11-16', peakTo: '2026-11-17' },
  { name: 'Geminids', activeFrom: '2026-12-04', activeTo: '2026-12-17', peakFrom: '2026-12-13', peakTo: '2026-12-14' },
  { name: 'Ursids', activeFrom: '2026-12-17', activeTo: '2026-12-26', peakFrom: '2026-12-21', peakTo: '2026-12-22' },
  { name: 'Quadrantids', activeFrom: '2026-12-28', activeTo: '2027-01-12', peakFrom: '2027-01-03', peakTo: '2027-01-04' },
  { name: 'Lyrids', activeFrom: '2027-04-14', activeTo: '2027-04-30', peakFrom: '2027-04-21', peakTo: '2027-04-22' },
  { name: 'Eta Aquariids', activeFrom: '2027-04-19', activeTo: '2027-05-28', peakFrom: '2027-05-05', peakTo: '2027-05-06' },
  { name: 'Southern Delta Aquariids', activeFrom: '2027-07-12', activeTo: '2027-08-23', peakFrom: '2027-07-30', peakTo: '2027-07-31' },
  { name: 'Alpha Capricornids', activeFrom: '2027-07-03', activeTo: '2027-08-15', peakFrom: '2027-07-30', peakTo: '2027-07-31' },
  { name: 'Perseids', activeFrom: '2027-07-17', activeTo: '2027-08-24', peakFrom: '2027-08-12', peakTo: '2027-08-13' },
]

function localDateKey(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatMeteorDate(start: string, end: string) {
  const startDate = new Date(`${start}T12:00:00`)
  const endDate = new Date(`${end}T12:00:00`)
  const monthDay = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' })
  const year = startDate.getFullYear() === endDate.getFullYear() ? `, ${endDate.getFullYear()}` : `, ${startDate.getFullYear()}–${endDate.getFullYear()}`
  if (startDate.getMonth() === endDate.getMonth()) {
    return `${new Intl.DateTimeFormat(undefined, { month: 'short' }).format(startDate)} ${startDate.getDate()}–${endDate.getDate()}${year}`
  }
  return `${monthDay.format(startDate)} – ${monthDay.format(endDate)}${year}`
}

function renderMeteorShowerGuide() {
  const today = localDateKey()
  const upcoming = meteorShowers.filter((shower) => shower.activeTo >= today)
  const nextPeak = meteorShowers.find((shower) => shower.peakTo >= today)
  const nextTitle = nextPeak ? nextPeak.name : 'No listed peak ahead'
  const nextDate = nextPeak ? formatMeteorDate(nextPeak.peakFrom, nextPeak.peakTo) : 'Check the updated IMO calendar'
  const rows = upcoming.map((shower) => {
    const isActive = shower.activeFrom <= today && shower.activeTo >= today
    const peakHasPassed = shower.peakTo < today
    const status = isActive ? (peakHasPassed ? 'Active · peak passed' : 'Active now') : 'Upcoming'
    return `<tr><td><strong>${shower.name}</strong></td><td>${formatMeteorDate(shower.activeFrom, shower.activeTo)}</td><td>${formatMeteorDate(shower.peakFrom, shower.peakTo)}</td><td><span class="shower-status${isActive ? ' active' : ''}">${status}</span></td></tr>`
  }).join('')
  return `
    <article class="shower-guide-card">
      <div class="shower-guide-hero"><div class="shower-guide-art" aria-hidden="true">☄</div><div><div class="moon-guide-kicker">NEXT PREDICTED PEAK</div><h3>${nextTitle}</h3><p>${nextDate}</p><span>Peak nights are estimates; local visibility depends on darkness, weather, and radiant altitude.</span></div></div>
      <div class="shower-guide-tips"><strong>Make the most of a shower</strong><span>Choose a dark, open spot and give your eyes about 20–30 minutes to adjust.</span><span>Watch a broad area of sky with your unaided eyes; meteors can appear far from the radiant.</span><span>Check cloud cover and moonlight for your location before heading out.</span></div>
      <div class="shower-calendar-heading"><div><div class="eyebrow left">2026–27 CALENDAR</div><h4>Upcoming shower nights</h4></div><a href="https://www.imo.net/calendar/" target="_blank" rel="noreferrer">International Meteor Organization ↗</a></div>
      <div class="spot-table-wrap shower-table-wrap"><table class="spot-table shower-table"><thead><tr><th>SHOWER</th><th>ACTIVE DATES</th><th>PREDICTED PEAK</th><th>STATUS</th></tr></thead><tbody>${rows || '<tr><td class="spot-empty" colspan="4">No upcoming entries in this calendar edition.</td></tr>'}</tbody></table></div>
      <p class="moon-guide-note">Calendar: IMO 2026/2027 edition. Peak dates are predictions and do not promise a visible display from every location.</p>
    </article>`
}

function renderIssPassGuide() {
  const latitude = activeLocation.latitude
  const longitude = activeLocation.longitude
  const place = document.querySelector('#place')?.textContent?.trim() || 'Selected location'
  const passParams = new URLSearchParams({
    alt: '0',
    cul: 'en',
    lat: latitude.toFixed(5),
    lng: longitude.toFixed(5),
    loc: place,
    satid: '25544',
  })
  const passUrl = `https://www.heavens-above.com/PassSummary.aspx?${passParams}`
  return `
    <article class="iss-guide-card">
      <div class="iss-guide-hero"><div class="iss-orbit-art" aria-hidden="true"><span>✦</span><i></i></div><div><div class="moon-guide-kicker">LOCATION-SPECIFIC SATELLITE PASSES</div><h3>Spot the <em>International Space Station</em></h3><p>Pass predictions for ${escapeHtml(place)}.</p></div></div>
      <div class="iss-guide-location"><div><span>SEARCH LOCATION</span><strong>${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°</strong></div><button type="button" class="iss-copy-button" id="copy-iss-coordinates">Copy coordinates</button></div>
      <a class="iss-pass-link" href="${passUrl}" target="_blank" rel="noreferrer">See upcoming ISS passes for this location <span>↗</span></a>
      <p class="iss-guide-privacy">Clicking this link sends the selected coordinates to Heavens-Above to calculate local passes.</p>
      <div class="iss-guide-tips"><strong>What to expect</strong><p>Visible passes depend on the ISS being sunlit while your location is dark. The pass service shows local times, direction, and highest elevation.</p><p>Pass forecasts are most useful within the next 10 days because orbital predictions become less accurate further ahead.</p></div>
      <a class="iss-guide-source" href="https://www.heavens-above.com/explain.aspx" target="_blank" rel="noreferrer">How ISS pass predictions work ↗</a>
    </article>`
}

const upcomingEclipses = [
  { date: '2027-02-06', endDate: '2027-02-06', kind: 'Solar', type: 'Annular', visibility: 'Annular path: parts of Chile, Argentina, and the South Atlantic. Partial phases span broader regions of South America and Africa.' },
  { date: '2027-02-20', endDate: '2027-02-21', kind: 'Lunar', type: 'Penumbral', visibility: 'Visible across the Americas, Europe, Africa, Asia, Australia, and Antarctica, weather permitting.' },
  { date: '2027-08-02', endDate: '2027-08-02', kind: 'Solar', type: 'Total', visibility: 'Totality: southern Spain, North Africa, Saudi Arabia, and Yemen. Partial phases cover a much wider region.' },
  { date: '2027-08-16', endDate: '2027-08-17', kind: 'Lunar', type: 'Penumbral', visibility: 'Visible across parts of the Americas, Antarctica, West Africa, New Zealand, western Europe, Australia, eastern Russia, and Southeast Asia.' },
]

function renderEclipseGuide() {
  const today = localDateKey()
  const upcoming = upcomingEclipses.filter((eclipse) => eclipse.endDate >= today)
  const next = upcoming[0]
  const daysUntil = next ? Math.max(0, Math.ceil((new Date(`${next.date}T00:00:00`).getTime() - new Date(`${today}T00:00:00`).getTime()) / 86_400_000)) : null
  const nextTitle = next ? `${next.type} ${next.kind.toLowerCase()} eclipse` : 'Check NASA for the next eclipse'
  const nextDate = next ? formatMeteorDate(next.date, next.endDate) : 'Updated eclipse calendar'
  const rows = upcoming.map((eclipse) => `<tr><td><strong>${formatMeteorDate(eclipse.date, eclipse.endDate)}</strong></td><td>${eclipse.type}</td><td>${eclipse.kind}</td><td>${eclipse.visibility}</td></tr>`).join('')
  const place = document.querySelector('#place')?.textContent?.trim() || 'selected location'
  return `
    <article class="eclipse-guide-card">
      <div class="eclipse-guide-hero"><div class="eclipse-art" aria-hidden="true">☼</div><div><div class="moon-guide-kicker">NEXT ECLIPSE WORLDWIDE</div><h3>${nextTitle}</h3><p>${nextDate}${daysUntil === null ? '' : ` · ${daysUntil === 0 ? 'today' : `in ${daysUntil} days`}`}</p><span>The date and visibility region are global references, not a local prediction for ${escapeHtml(place)}.</span></div></div>
      <div class="eclipse-location-note"><strong>Check visibility for your exact location</strong><p>Solar eclipse paths can be narrow, and lunar eclipse visibility depends on whether the Moon is above your horizon. Open NASA’s eclipse maps before making plans.</p><a href="https://science.nasa.gov/eclipses/future-eclipses/" target="_blank" rel="noreferrer">View NASA eclipse maps and local visibility ↗</a></div>
      <div class="shower-calendar-heading"><div><div class="eyebrow left">UPCOMING GLOBAL EVENTS</div><h4>2027 eclipse calendar</h4></div><a href="https://eclipse.gsfc.nasa.gov/OH/OH2027.html" target="_blank" rel="noreferrer">NASA detailed predictions ↗</a></div>
      <div class="spot-table-wrap eclipse-table-wrap"><table class="spot-table eclipse-table"><thead><tr><th>DATE</th><th>TYPE</th><th>CLASS</th><th>MAIN VISIBILITY REGION</th></tr></thead><tbody>${rows || '<tr><td colspan="4" class="spot-empty">No more events listed in this calendar year.</td></tr>'}</tbody></table></div>
      <div class="eclipse-safety"><strong>Solar viewing safety</strong><p>Never look directly at a partial or annular solar eclipse without proper solar viewing protection. Regular sunglasses are not safe eclipse viewers. Follow NASA’s <a href="https://science.nasa.gov/eclipses/safety/" target="_blank" rel="noreferrer">solar eclipse eye-safety guidance ↗</a>.</p></div>
      <p class="moon-guide-note">Dates and visibility regions: NASA. Local timing and whether an eclipse is above your horizon vary by location.</p>
    </article>`
}

type UpcomingLaunch = {
  id: string
  name: string
  net: string | null
  windowStart: string | null
  windowEnd: string | null
  netPrecision: string
  status: string
  provider: string
  rocket: string
  mission: string
  missionDescription: string
  location: string
  pad: string
}

function formatLaunchTime(value: string | null, precision: string) {
  if (!value || !Number.isFinite(Date.parse(value))) return 'Date and time not announced'
  const date = new Date(value)
  const preciseTime = /minute|second|exact|hour/i.test(precision)
  const options: Intl.DateTimeFormatOptions = preciseTime
    ? { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' }
    : { year: 'numeric', month: 'short', day: 'numeric' }
  return new Intl.DateTimeFormat(undefined, options).format(date)
}

function formatLaunchWindow(launch: UpcomingLaunch) {
  if (launch.windowStart && launch.windowEnd && launch.windowStart !== launch.windowEnd) {
    return `${formatLaunchTime(launch.windowStart, launch.netPrecision)} – ${formatLaunchTime(launch.windowEnd, launch.netPrecision)}`
  }
  return formatLaunchTime(launch.net || launch.windowStart, launch.netPrecision)
}

function renderLaunchGuide(payload: { launches: UpcomingLaunch[]; source: string; updatedAt: string; cache: string }) {
  const launches = Array.isArray(payload.launches) ? payload.launches : []
  const cards = launches.map((launch) => `
    <article class="launch-card">
      <div class="launch-card-top"><span class="launch-status">${escapeHtml(launch.status)}</span><span class="launch-date-label">NET · ${escapeHtml(launch.netPrecision || 'date subject to change')}</span></div>
      <h4>${escapeHtml(launch.name)}</h4>
      ${launch.mission ? `<p class="launch-mission">${escapeHtml(launch.mission)}</p>` : ''}
      <div class="launch-card-details"><span><small>NET / LAUNCH WINDOW</small><strong>${escapeHtml(formatLaunchWindow(launch))}</strong></span>
      ${launch.provider ? `<span><small>PROVIDER</small><strong>${escapeHtml(launch.provider)}</strong></span>` : ''}
      ${launch.rocket ? `<span><small>VEHICLE</small><strong>${escapeHtml(launch.rocket)}</strong></span>` : ''}
      ${launch.location ? `<span><small>LAUNCH SITE</small><strong>${escapeHtml([launch.pad, launch.location].filter(Boolean).join(' · '))}</strong></span>` : ''}</div>
      ${launch.missionDescription ? `<p class="launch-description">${escapeHtml(launch.missionDescription)}</p>` : ''}
    </article>`).join('')
  const updated = payload.updatedAt && Number.isFinite(Date.parse(payload.updatedAt))
    ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(payload.updatedAt))
    : 'time unavailable'
  return `
    <article class="launch-guide-card">
      <div class="launch-guide-heading"><div><div class="moon-guide-kicker">UPCOMING SPACEFLIGHT</div><h3>Launch <em>watch</em></h3><p>Follow upcoming orbital and suborbital missions.</p></div><div class="launch-guide-symbol" aria-hidden="true">↗</div></div>
      ${launches.length ? `<div class="launch-list">${cards}</div>` : '<p class="launch-empty">No upcoming launches are listed right now.</p>'}
      <div class="launch-source-row"><span>Source: ${escapeHtml(payload.source || 'Launch Library 2')} · updated ${escapeHtml(updated)} · times use your device timezone when provided.</span><a href="https://ll.thespacedevs.com/docs/" target="_blank" rel="noreferrer">Data source ↗</a></div>
      <p class="moon-guide-note">NET means “no earlier than.” Launch windows can shift or be delayed; check the launch provider’s official updates before planning.</p>
    </article>`
}

function ensureVisibilityMap(latitude: number, longitude: number) {
  if (!visibilityMap) {
    visibilityMap = L.map('visibility-map', { scrollWheelZoom: false, zoomControl: true }).setView([latitude, longitude], 10)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(visibilityMap)
    visibilityLayer = L.layerGroup().addTo(visibilityMap)
    spotLayer = L.layerGroup().addTo(visibilityMap)
    nearbySpotLayer = L.layerGroup().addTo(visibilityMap)
    nearbySearchRadiusLayer = L.layerGroup().addTo(visibilityMap)
    visibilityMap.on('click', (event: L.LeafletMouseEvent) => {
      if (!addingSpot) return
      pendingSpotCoordinates = {
        latitude: Number(event.latlng.lat.toFixed(5)),
        longitude: Number(event.latlng.lng.toFixed(5)),
      }
      addingSpot = false
      document.querySelector<HTMLButtonElement>('#add-spot-button')!.classList.remove('active')
      const form = document.querySelector<HTMLFormElement>('#spot-name-form')!
      const input = document.querySelector<HTMLInputElement>('#spot-name-input')!
      input.value = ''
      form.hidden = false
      document.querySelector<HTMLParagraphElement>('#spot-hint')!.textContent = 'Enter a name for the spot you just marked.'
      form.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      window.setTimeout(() => input.focus(), 250)
    })
  } else {
    visibilityMap.setView([latitude, longitude], visibilityMap.getZoom())
  }
  renderStargazingSpots()
  renderNearbySpots()
  window.setTimeout(() => visibilityMap?.invalidateSize(), 0)
}

document.querySelector<HTMLButtonElement>('#search-spots-button')?.addEventListener('click', async (event) => {
  const button = event.currentTarget as HTMLButtonElement
  const hint = document.querySelector<HTMLParagraphElement>('#nearby-spot-hint')!
  button.disabled = true
  button.textContent = 'Searching within 5 km…'
  hint.textContent = 'Searching OpenStreetMap for named outdoor places near the selected location…'
  ensureVisibilityMap(activeLocation.latitude, activeLocation.longitude)
  nearbySearchRadiusLayer?.clearLayers()
  try {
    const params = new URLSearchParams({ latitude: String(activeLocation.latitude), longitude: String(activeLocation.longitude) })
    const response = await fetch(`/api/stargazing-spots?${params}`, { signal: AbortSignal.timeout(18_000) })
    const payload = await response.json()
    if (!response.ok) throw new Error(payload.error?.message || `Nearby spot search returned ${response.status}.`)
    if (!Array.isArray(payload.spots)) throw new Error('The nearby spots service returned an unexpected response. Please try again.')
    nearbySpots = payload.spots.filter((spot: unknown): spot is NearbySpot => {
      if (!spot || typeof spot !== 'object') return false
      const item = spot as Partial<NearbySpot>
      return typeof item.id === 'string' && typeof item.name === 'string' && typeof item.kind === 'string'
        && Number.isFinite(item.latitude) && Number.isFinite(item.longitude)
        && Number.isFinite(item.distanceKm) && item.distanceKm! >= 0 && item.distanceKm! <= 5
    })
    nearbySearchDone = true
    L.circle([activeLocation.latitude, activeLocation.longitude], {
      radius: 5_000, color: '#83ad8f', weight: 1.5, opacity: 0.9,
      dashArray: '5 6', fillColor: '#83ad8f', fillOpacity: 0.035,
      interactive: false,
    }).addTo(nearbySearchRadiusLayer!)
    renderNearbySpots()
    if (nearbySpots.length) {
      hint.textContent = `Found ${nearbySpots.length} named outdoor ${nearbySpots.length === 1 ? 'place' : 'places'} within 5 km. Check local access before visiting.`
      const bounds = L.latLngBounds([
        [activeLocation.latitude, activeLocation.longitude],
        ...nearbySpots.map((spot) => [spot.latitude, spot.longitude] as [number, number]),
      ])
      visibilityMap?.fitBounds(bounds, { padding: [30, 30], maxZoom: 14 })
    } else {
      hint.textContent = 'No named outdoor places were found within 5 km. Try a nearby town or city center.'
    }
  } catch (error) {
    const message = error instanceof Error && error.name === 'TimeoutError'
      ? 'The nearby search took too long. Check that the backend is running, then try again.'
      : error instanceof Error && error.message === 'Failed to fetch'
        ? 'Could not reach the nearby spots API. Check that the backend is running on port 3001.'
        : error instanceof Error ? error.message : 'Could not search for nearby spots. Please try again.'
    hint.textContent = message
  } finally {
    button.disabled = false
    button.textContent = '⌖ Find spots · 5 km'
  }
})

document.querySelector<HTMLButtonElement>('#add-spot-button')?.addEventListener('click', (event) => {
  if (!visibilityMap) {
    ensureVisibilityMap(activeLocation.latitude, activeLocation.longitude)
    window.setTimeout(() => visibilityMap?.invalidateSize(), 50)
  }
  addingSpot = !addingSpot
  const button = event.currentTarget as HTMLButtonElement
  button.classList.toggle('active', addingSpot)
  document.querySelector<HTMLParagraphElement>('#spot-hint')!.textContent = addingSpot
    ? 'Click the map where you want to save a spot, then give it a name.'
    : 'Add a spot, then click its location on the map.'
})

document.querySelector<HTMLFormElement>('#spot-name-form')?.addEventListener('submit', (event) => {
  event.preventDefault()
  if (!pendingSpotCoordinates) return
  const input = document.querySelector<HTMLInputElement>('#spot-name-input')!
  const name = input.value.trim().slice(0, 80)
  if (!name) {
    input.focus()
    return
  }
  const spot: StargazingSpot = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    ...pendingSpotCoordinates,
  }
  stargazingSpots = [...stargazingSpots, spot]
  try {
    saveStargazingSpots()
    renderStargazingSpots()
    document.querySelector<HTMLParagraphElement>('#spot-hint')!.textContent = `${spot.name} saved. Click its star pin or table row to find it.`
    document.querySelector<HTMLFormElement>('#spot-name-form')!.hidden = true
    pendingSpotCoordinates = null
  } catch {
    stargazingSpots = stargazingSpots.filter((savedSpot) => savedSpot.id !== spot.id)
    document.querySelector<HTMLParagraphElement>('#spot-hint')!.textContent = 'This browser could not save the spot. Check its local storage settings.'
  }
})

document.querySelector<HTMLButtonElement>('#cancel-spot-save')?.addEventListener('click', () => {
  pendingSpotCoordinates = null
  document.querySelector<HTMLFormElement>('#spot-name-form')!.hidden = true
  document.querySelector<HTMLParagraphElement>('#spot-hint')!.textContent = 'Spot not saved. Click “Add a spot on the map” to try again.'
})

document.querySelector<HTMLTableSectionElement>('#spot-table-body')?.addEventListener('click', (event) => {
  const target = event.target as HTMLElement
  const removeButton = target.closest<HTMLButtonElement>('[data-remove-spot]')
  if (removeButton) {
    stargazingSpots = stargazingSpots.filter((spot) => spot.id !== removeButton.dataset.removeSpot)
    try {
      saveStargazingSpots()
    } catch {
      toast('Could not save this change in browser storage.')
    }
    renderStargazingSpots()
    return
  }
  const nameButton = target.closest<HTMLButtonElement>('[data-spot-id]')
  const spot = stargazingSpots.find((item) => item.id === nameButton?.dataset.spotId)
  if (spot) {
    visibilityMap?.flyTo([spot.latitude, spot.longitude], Math.max(visibilityMap.getZoom(), 13), { duration: 0.7 })
    spotLayer?.eachLayer((layer) => {
      if (layer instanceof L.Marker && layer.getLatLng().lat === spot.latitude && layer.getLatLng().lng === spot.longitude) layer.openPopup()
    })
  }
})

document.querySelector<HTMLTableSectionElement>('#nearby-spot-table-body')?.addEventListener('click', (event) => {
  const target = event.target as HTMLElement
  const button = target.closest<HTMLButtonElement>('[data-nearby-spot-id]')
  const spot = nearbySpots.find((item) => item.id === button?.dataset.nearbySpotId)
  if (!spot) return
  visibilityMap?.flyTo([spot.latitude, spot.longitude], Math.max(visibilityMap.getZoom(), 15), { duration: 0.7 })
  nearbySpotLayer?.eachLayer((layer) => {
    if (layer instanceof L.Marker && layer.getLatLng().lat === spot.latitude && layer.getLatLng().lng === spot.longitude) layer.openPopup()
  })
})

async function loadVisibilityMap(latitude: number, longitude: number) {
  const status = document.querySelector<HTMLSpanElement>('#map-status')!
  ensureVisibilityMap(latitude, longitude)
  visibilityRequest?.abort()
  const controller = new AbortController()
  visibilityRequest = controller
  status.textContent = 'Loading nearby visibility…'

  try {
    const params = new URLSearchParams({ latitude: String(latitude), longitude: String(longitude), radiusKm: '30' })
    const response = await fetch(`/api/visibility-map?${params}`, { signal: controller.signal })
    const payload = await response.json()
    if (!response.ok) throw new Error(payload.error?.message || `Visibility map returned ${response.status}.`)
    const points = payload.points as VisibilityPoint[]
    if (!Array.isArray(points) || points.length === 0) throw new Error('No nearby visibility readings were returned.')

    visibilityLayer?.clearLayers()
    visibilityHeatLayer?.remove()
    visibilityHeatLayer = makeVisibilityHeatLayer(points).addTo(visibilityMap!)
    points.forEach((point) => {
      L.circleMarker([point.latitude, point.longitude], {
        radius: 5, color: '#fff4f0', weight: 1.1, opacity: 0.85, fillColor: '#8f2d2d', fillOpacity: 0.8,
      }).bindPopup(`<strong>${visibilityCondition(point.visibilityKm)} visibility</strong><br>${point.visibilityKm.toFixed(1)} km`)
        .addTo(visibilityLayer!)
    })
    L.circleMarker([latitude, longitude], { radius: 5, color: '#f5e7c1', weight: 2, fillColor: '#b89b63', fillOpacity: 1 })
      .bindPopup('Selected observing location').addTo(visibilityLayer!)
    const bounds = L.latLngBounds(points.map((point) => [point.latitude, point.longitude] as [number, number]))
    visibilityMap?.fitBounds(bounds, { padding: [22, 22], maxZoom: 11 })
    status.textContent = `${points.length} local readings · ${payload.radiusKm} km radius`
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') return
    status.textContent = error instanceof Error ? error.message : 'Visibility grid unavailable.'
  }
}

function isLocationError(error: unknown): error is GeolocationPositionError {
  return typeof error === 'object' && error !== null && 'code' in error
}

function requestDeviceLocation(timeout: number) {
  return new Promise<GeolocationPosition>((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout,
      maximumAge: 600_000,
    })
  })
}

document.querySelector('#location-btn')?.addEventListener('click', async () => {
  if (!navigator.geolocation) return toast('Location is unavailable in this browser. Use Chennai instead.')
  const button = document.querySelector<HTMLButtonElement>('#location-btn')!
  button.disabled = true
  toast('Finding your location… Allow location access if your browser asks.')

  try {
    let position: GeolocationPosition
    try {
      position = await requestDeviceLocation(15_000)
    } catch (error) {
      if (!isLocationError(error) || error.code !== 3) throw error
      toast('Still waiting for your device location…')
      position = await requestDeviceLocation(25_000)
    }

    const { latitude, longitude } = position.coords
    let place = 'Your location'

    // Reverse geocoding only improves the label. Weather still loads from coordinates if this lookup fails.
    try {
      const geoUrl = `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${latitude}&longitude=${longitude}&language=en&format=json`
      const geoRes = await fetch(geoUrl, { signal: AbortSignal.timeout(4000) })
      const geo = geoRes.ok ? await geoRes.json() : null
      const location = geo?.results?.[0]
      if (location?.name) place = `${location.name}, ${location.country}`
    } catch { /* Keep the generic location label and continue with coordinates. */ }

    await loadWeather(latitude, longitude, place, 'YOUR CURRENT LOCATION')
    toast(`Sky data updated for ${place} (${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°).`)
  } catch (error) {
    if (isLocationError(error)) {
      if (error.code === 1) toast('Location permission was denied. Allow it for localhost in browser site settings.')
      else if (error.code === 2) toast('Your device cannot determine a location. Use Chennai or check Windows Location Services.')
      else toast('Location timed out twice. Check browser and Windows Location Services, or use Chennai.')
    } else {
      toast(error instanceof Error ? error.message : 'Could not load weather for this location.')
    }
  } finally {
    button.disabled = false
  }
})

document.querySelector('#default-location-btn')?.addEventListener('click', async () => {
  try {
    await loadWeather(13.0827, 80.2707, 'Chennai, India', 'DEFAULT LOCATION')
    toast('Showing sky conditions for Chennai, India.')
  } catch (error) {
    toast(error instanceof Error ? error.message : 'Could not load Chennai weather.')
  }
})
document.querySelector('#all-events')?.addEventListener('click', () => setEventFilter('all'))
function scrollEventHighlights(direction: -1 | 1) {
  const grid = document.querySelector<HTMLDivElement>('#event-grid')
  if (!grid) return
  const step = Math.max(280, grid.clientWidth * 0.82)
  grid.scrollTo({ left: grid.scrollLeft + direction * step, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
}
document.querySelector<HTMLButtonElement>('#event-scroll-left')?.addEventListener('click', () => scrollEventHighlights(-1))
document.querySelector<HTMLButtonElement>('#event-scroll-right')?.addEventListener('click', () => scrollEventHighlights(1))
const eventGrid = document.querySelector<HTMLDivElement>('#event-grid')
eventGrid?.addEventListener('keydown', (event) => {
  if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
  event.preventDefault()
  scrollEventHighlights(event.key === 'ArrowLeft' ? -1 : 1)
})
eventGrid?.addEventListener('wheel', (event) => {
  if (eventGrid.scrollWidth <= eventGrid.clientWidth || Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return
  event.preventDefault()
  eventGrid.scrollLeft += event.deltaY
}, { passive: false })
let eventDragStartX = 0
let eventDragStartScrollLeft = 0
let eventIsDragging = false
eventGrid?.addEventListener('pointerdown', (event) => {
  if (event.pointerType !== 'mouse' || event.button !== 0 || (event.target as HTMLElement).closest('button, a')) return
  eventDragStartX = event.clientX
  eventDragStartScrollLeft = eventGrid.scrollLeft
  eventIsDragging = true
  eventGrid.classList.add('is-dragging')
  eventGrid.setPointerCapture(event.pointerId)
})
eventGrid?.addEventListener('pointermove', (event) => {
  if (eventIsDragging) eventGrid.scrollLeft = eventDragStartScrollLeft - (event.clientX - eventDragStartX)
})
const stopEventDrag = () => {
  eventIsDragging = false
  eventGrid?.classList.remove('is-dragging')
}
eventGrid?.addEventListener('pointerup', stopEventDrag)
eventGrid?.addEventListener('pointercancel', stopEventDrag)
document.querySelector('#upload-trigger')?.addEventListener('click', () => document.querySelector<HTMLInputElement>('#image-input')?.click())
document.querySelector<HTMLInputElement>('#image-input')?.addEventListener('change', (event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  const preview = document.querySelector<HTMLDivElement>('#image-preview')!
  document.querySelector<HTMLImageElement>('#preview-image')!.src = URL.createObjectURL(file)
  document.querySelector('#preview-name')!.textContent = file.name
  preview.hidden = false
  toast('Image loaded into the Spirit Lens.')
})


let activeEventController: AbortController | null = null

const fallbackEventGuides = [
  { day: 'SKY GUIDE', type: 'METEOR SHOWER', eventType: 'meteor-shower', title: 'Meteor shower watching', detail: 'Find a dark location, allow your eyes to adjust, and scan a wide patch of sky.', icon: '✦' },
  { day: 'MOON WATCH', type: 'MOON PHASE', eventType: 'moon-phase', title: 'Track the lunar cycle', detail: 'Use the live phase indicator for tonight’s moon.', icon: '◐' },
  { day: 'ORBITAL GUIDE', type: 'ISS PASS', eventType: 'iss-pass', title: 'Spot the space station', detail: 'ISS visibility is location and time specific; consult a live pass service before planning.', icon: '⌁' },
  { day: 'ECLIPSE GUIDE', type: 'ECLIPSE', eventType: 'eclipse', title: 'Plan an eclipse watch', detail: 'Check a current astronomical almanac for dates, path, and local circumstances.', icon: '☼' },
  { day: 'LAUNCH GUIDE', type: 'ROCKET LAUNCH', eventType: 'launch', title: 'Follow a launch window', detail: 'Launch schedules can change; verify the latest official mission schedule.', icon: '↗' },
]

function renderEventCards(events: typeof fallbackEventGuides) {
  return events.map((event) => `
    <article class="event-card"><div class="event-top"><span class="event-icon">${escapeHtml(event.icon)}</span><span class="event-day">${escapeHtml(event.day)}</span></div><div class="event-type">${escapeHtml(event.type)}</div><h3>${escapeHtml(event.title)}</h3><p>${escapeHtml(event.detail)}</p><button type="button" data-event-guide="${escapeHtml(event.eventType)}" class="event-link">VIEW GUIDE <span>↗</span></button></article>
  `).join('')
}

function setEventFilter(type: string) {
  document.querySelectorAll<HTMLButtonElement>('.event-filter').forEach((button) => {
    const selected = button.dataset.eventType === type
    button.classList.toggle('active', selected)
    button.setAttribute('aria-pressed', String(selected))
  })
  void loadEvents(type)
}

document.querySelector('.event-filters')?.addEventListener('click', (event) => {
  const target = event.target
  if (!(target instanceof Element)) return
  const button = target.closest<HTMLButtonElement>('.event-filter')
  if (button?.dataset.eventType) setEventFilter(button.dataset.eventType)
})

document.querySelector('#event-grid')?.addEventListener('click', (event) => {
  const target = event.target
  if (!(target instanceof Element)) return
  const copyButton = target.closest<HTMLButtonElement>('#copy-iss-coordinates')
  if (copyButton) {
    if (!navigator.clipboard?.writeText) {
      toast('Clipboard is unavailable. Copy the coordinates shown in the guide.')
      return
    }
    void navigator.clipboard.writeText(`${activeLocation.latitude.toFixed(5)}, ${activeLocation.longitude.toFixed(5)}`)
      .then(() => toast('Coordinates copied. Paste them into Heavens-Above.'))
      .catch(() => toast('Could not copy coordinates. You can copy them from the guide.'))
    return
  }
  const guideButton = target.closest<HTMLButtonElement>('[data-event-guide]')
  if (guideButton?.dataset.eventGuide) setEventFilter(guideButton.dataset.eventGuide)
})

async function loadEvents(type = 'all') {
  const grid = document.querySelector<HTMLDivElement>('#event-grid')!
  activeEventController?.abort()
  const controller = new AbortController()
  activeEventController = controller
  grid.scrollTo({ left: 0 })
  grid.innerHTML = '<p class="event-loading">Loading celestial guides…</p>'
  try {
    if (type === 'launch') {
      grid.innerHTML = '<p class="event-loading">Loading the upcoming launch schedule…</p>'
      const response = await fetch('/api/launches', { signal: controller.signal })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error?.message || 'Could not load the launch schedule. Try again shortly.')
      grid.innerHTML = renderLaunchGuide(payload)
      return
    }
    if (type === 'eclipse') {
      grid.innerHTML = renderEclipseGuide()
      return
    }
    if (type === 'iss-pass') {
      grid.innerHTML = renderIssPassGuide()
      return
    }
    if (type === 'meteor-shower') {
      grid.innerHTML = renderMeteorShowerGuide()
      return
    }
    if (type === 'moon-phase') {
      const response = await fetch('/api/moon', { signal: controller.signal })
      const moon = await response.json() as MoonPhase
      if (!response.ok) throw new Error('Moon phase data is unavailable. Check the backend and try again.')
      grid.innerHTML = renderMoonPhaseGuide(moon)
      return
    }
    const params = new URLSearchParams()
    if (type !== 'all') params.set('type', type)
    const query = params.size ? `?${params}` : ''
    const response = await fetch(`/api/events${query}`, { signal: controller.signal })
    const payload = await response.json()
    if (!response.ok) throw new Error(payload.error?.message || 'Could not load event guides.')
    if (!payload.events.length) {
      grid.innerHTML = '<p class="event-loading">No guides match this filter.</p>'
      return
    }
    grid.innerHTML = renderEventCards(payload.events)
    document.querySelector('#event-source')!.textContent = 'Guide cards are illustrative; dates and live viewing predictions are not provided.'
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') return
    const fallback = type === 'all' ? fallbackEventGuides : fallbackEventGuides.filter((guide) => guide.eventType === type)
    if (fallback.length) {
      grid.innerHTML = renderEventCards(fallback)
      document.querySelector('#event-source')!.textContent = 'Showing built-in sample guides because the backend is unavailable. These are not live event predictions.'
      return
    }
    grid.innerHTML = `<p class="event-loading">${error instanceof Error ? error.message : 'Could not load event guides. Check the backend.'}</p>`
  }
}

void loadEvents()


async function loadWeather(latitude: number, longitude: number, place: string, locationSource = 'SELECTED LOCATION') {
  let response: Response
  try {
    response = await fetch(`/api/weather?latitude=${latitude}&longitude=${longitude}`)
  } catch {
    throw new Error('Cannot reach the backend. Make sure its terminal is running on port 3001.')
  }
  if (!response.ok) {
    const payload = await response.json().catch(() => null)
    const message = payload?.error?.message || `Weather service returned an error (${response.status}).`
    throw new Error(message)
  }
  updateSky(await response.json() as WeatherResponse, place, latitude, longitude, locationSource)
}

async function loadDefaultWeather() {
  try {
    await loadWeather(13.0827, 80.2707, 'Chennai, India', 'DEFAULT LOCATION')
  } catch {
    toast('Cannot reach the backend. Make sure its terminal is running on port 3001.')
  }
}

async function loadMoon() {
  try {
    const response = await fetch('/api/moon')
    if (!response.ok) throw new Error('Moon data unavailable')
    const moon = await response.json() as MoonPhase
    document.querySelector('#moon-name')!.textContent = moon.name
    document.querySelector('#moon-symbol')!.textContent = moonGlyph(moon.name)
    document.querySelector('#moon-illumination')!.textContent = `${moon.illumination}%`
    document.querySelector<HTMLElement>('#moon-progress')!.style.width = `${moon.illumination}%`
  } catch {
    document.querySelector('#moon-name')!.textContent = 'Moon data unavailable'
    document.querySelector('#moon-symbol')!.textContent = '☾'
  }
}

void loadDefaultWeather()
void loadMoon()
