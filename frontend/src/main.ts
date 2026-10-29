import './style.css'

const app = document.querySelector<HTMLDivElement>('#app')!
app.innerHTML = `
  <aside class="sidebar">
    <a class="brand" href="#home"><span class="brand-mark">☾</span><span>TSUKUYOMI<small>CELESTIAL FIELD GUIDE</small></span></a>
    <div class="side-label">YOUR OBSERVATORY</div>
    <nav><a class="nav-item active" href="#home"><span>◈</span> Night watch</a><a class="nav-item" href="#events"><span>✧</span> Celestial scroll</a><a class="nav-item" href="#lens"><span>◉</span> Spirit lens</a></nav>
    <div class="sidebar-bottom"><div class="moon-art">☾</div><div class="side-label">TONIGHT'S MOON</div><div class="moon-name" id="moon-name">Loading moon…</div><div class="moon-meta">Illumination <b id="moon-illumination">—</b></div><div class="moon-progress"><i id="moon-progress"></i></div><div class="side-note">“Look up. The universe is<br>closer than it seems.”</div></div>
  </aside>
  <main class="main" id="home">
    <header class="topbar"><div class="breadcrumb">OBSERVATORY <span>/</span> NIGHT WATCH</div><div class="top-right"><span class="live-dot"></span> SKY DATA <b>LIVE</b><div class="avatar">S</div></div></header>
    <section class="welcome"><div class="eyebrow"><span></span> THURSDAY, OCTOBER 29, 2026 <span></span></div><h1>The night is <em>yours.</em></h1><p class="intro">Your guide to the wonders waiting above.</p></section>
    <section class="sky-card"><div class="sky-copy"><div class="card-kicker"><span>◌</span> TONIGHT'S SKY · <span id="place">CHENNAI, INDIA</span></div><h2>Clear skies ahead,<br><em>stargazer.</em></h2><p>Conditions are looking promising. The stars are calling.</p><button class="location-btn" id="location-btn">⌖ &nbsp;Use my location</button></div><div class="sky-score"><div class="score-ring"><div><strong id="score">82</strong><small>/ 100</small></div></div><div class="score-label">NIGHT HONOR SCORE</div><div class="score-status">✦ &nbsp; EXCELLENT VIEWING</div></div><div class="sky-metrics"><div><span>☁</span><small>CLOUD COVER</small><b id="cloud">12%</b></div><div><span>◉</span><small>VISIBILITY</small><b id="visibility">18 km</b></div><div><span>♧</span><small>HUMIDITY</small><b id="humidity">64%</b></div><div><span>◷</span><small>BEST VIEWING</small><b>9 PM – 1 AM</b></div></div></section>
    <div class="section-head" id="events"><div><div class="eyebrow left">MARK YOUR CALENDAR</div><h2>The celestial <em>scroll</em></h2></div><button class="text-button" id="all-events">VIEW ALL EVENTS <span>↗</span></button></div>
    <section class="event-grid" id="event-grid"><p class="event-loading">Loading celestial highlights…</p></section><div class="data-note" id="event-source">Events are illustrative demo data.</div>
    <section class="lens-strip" id="lens"><div class="lens-icon">◉</div><div class="lens-copy"><div class="eyebrow left">THE SPIRIT LENS</div><h2>Bring the cosmos <em>into focus.</em></h2><p>Upload an astronomical image to start exploring.</p></div><button class="lens-button" id="upload-trigger">CHOOSE IMAGE <span>↗</span></button><input id="image-input" type="file" accept="image/*" hidden></section>
    <div class="image-preview" id="image-preview" hidden><img id="preview-image" alt="Your selected astronomical image"><div><b id="preview-name"></b><p>Original image selected. Image restoration can be connected here.</p></div></div>
    <footer>MADE FOR THE ONES WHO LOOK UP <span>✦</span> TSUKUYOMI WATCH</footer>
  </main>
  <div class="toast" id="toast"></div>
`

const toast = (message: string) => {
  const el = document.querySelector<HTMLDivElement>('#toast')!
  el.textContent = message
  el.classList.add('show')
  window.setTimeout(() => el.classList.remove('show'), 2800)
}

function updateSky(data: { cloudCover: number; visibilityKm: number; humidity: number; honorScore: number }, place: string) {
  document.querySelector('#cloud')!.textContent = `${data.cloudCover}%`
  document.querySelector('#visibility')!.textContent = `${data.visibilityKm} km`
  document.querySelector('#humidity')!.textContent = `${data.humidity}%`
  document.querySelector('#score')!.textContent = `${data.honorScore}`
  document.querySelector('#place')!.textContent = place.toUpperCase()
}

document.querySelector('#location-btn')?.addEventListener('click', () => {
  if (!navigator.geolocation) return toast('Location is not available in this browser.')
  toast('Finding your skies…')
  navigator.geolocation.getCurrentPosition(async ({ coords }) => {
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${coords.latitude}&longitude=${coords.longitude}&language=en&format=json`
    try {
      const geoRes = await fetch(geoUrl)
      const geo = geoRes.ok ? await geoRes.json() : null
      const location = geo?.results?.[0]
      const place = location ? `${location.name}, ${location.country}` : `${coords.latitude.toFixed(2)}°, ${coords.longitude.toFixed(2)}°`
      await loadWeather(coords.latitude, coords.longitude, place)
      toast('Live sky conditions updated via Tsukuyomi API.')
    } catch { toast('Could not load live conditions. Check that the backend is running.') }
  }, () => toast('Location permission was not granted. Showing Chennai conditions.'))
})
document.querySelector('#all-events')?.addEventListener('click', () => toast('These are the upcoming event highlights.'))
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


async function loadEvents() {
  const grid = document.querySelector<HTMLDivElement>('#event-grid')!
  try {
    const response = await fetch('/api/events')
    if (!response.ok) throw new Error('Events unavailable')
    const payload = await response.json()
    grid.innerHTML = payload.events.map((event: { day: string; type: string; title: string; detail: string; icon: string }) => `
      <article class="event-card"><div class="event-top"><span class="event-icon">${event.icon}</span><span class="event-day">${event.day}</span></div><div class="event-type">${event.type}</div><h3>${event.title}</h3><p>${event.detail}</p><a href="#events" class="event-link">VIEW DETAILS <span>↗</span></a></article>
    `).join('')
  } catch {
    grid.innerHTML = '<p class="event-loading">Could not load event highlights. Start the backend and refresh.</p>'
  }
}

void loadEvents()


async function loadWeather(latitude: number, longitude: number, place: string) {
  const response = await fetch(`/api/weather?latitude=${latitude}&longitude=${longitude}`)
  if (!response.ok) throw new Error('Weather unavailable')
  updateSky(await response.json(), place)
}

async function loadDefaultWeather() {
  try {
    await loadWeather(13.0827, 80.2707, 'Chennai, India')
  } catch {
    toast('Backend weather unavailable. Start the backend to load live conditions.')
  }
}

async function loadMoon() {
  try {
    const response = await fetch('/api/moon')
    if (!response.ok) throw new Error('Moon data unavailable')
    const moon = await response.json()
    document.querySelector('#moon-name')!.textContent = moon.name
    document.querySelector('#moon-illumination')!.textContent = `${moon.illumination}%`
    document.querySelector<HTMLElement>('#moon-progress')!.style.width = `${moon.illumination}%`
  } catch {
    document.querySelector('#moon-name')!.textContent = 'Moon data unavailable'
  }
}

void loadDefaultWeather()
void loadMoon()
