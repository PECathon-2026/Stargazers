import './style.css'

const events = [
  { day: 'TONIGHT', type: 'METEOR SHOWER', title: 'Orionids peak', detail: 'Look east after midnight · Dark skies recommended', icon: '✦' },
  { day: 'OCT 31', type: 'MOON PHASE', title: 'First quarter moon', detail: 'Illumination 52% · Sets at 11:42 PM', icon: '◐' },
  { day: 'NOV 02', type: 'ISS PASS', title: 'International Space Station', detail: 'Visible for 5 minutes · Magnitude −3.2', icon: '⌁' },
]

const app = document.querySelector<HTMLDivElement>('#app')!
app.innerHTML = `
  <aside class="sidebar">
    <a class="brand" href="#home"><span class="brand-mark">☾</span><span>TSUKUYOMI<small>CELESTIAL FIELD GUIDE</small></span></a>
    <div class="side-label">YOUR OBSERVATORY</div>
    <nav><a class="nav-item active" href="#home"><span>◈</span> Night watch</a><a class="nav-item" href="#events"><span>✧</span> Celestial scroll</a><a class="nav-item" href="#lens"><span>◉</span> Spirit lens</a></nav>
    <div class="sidebar-bottom"><div class="moon-art">☾</div><div class="side-label">TONIGHT'S MOON</div><div class="moon-name">Waxing crescent</div><div class="moon-meta">Illumination <b>23%</b></div><div class="moon-progress"><i></i></div><div class="side-note">“Look up. The universe is<br>closer than it seems.”</div></div>
  </aside>
  <main class="main" id="home">
    <header class="topbar"><div class="breadcrumb">OBSERVATORY <span>/</span> NIGHT WATCH</div><div class="top-right"><span class="live-dot"></span> SKY DATA <b>LIVE</b><div class="avatar">S</div></div></header>
    <section class="welcome"><div class="eyebrow"><span></span> THURSDAY, OCTOBER 29, 2026 <span></span></div><h1>The night is <em>yours.</em></h1><p class="intro">Your guide to the wonders waiting above.</p></section>
    <section class="sky-card"><div class="sky-copy"><div class="card-kicker"><span>◌</span> TONIGHT'S SKY · <span id="place">CHENNAI, INDIA</span></div><h2>Clear skies ahead,<br><em>stargazer.</em></h2><p>Conditions are looking promising. The stars are calling.</p><button class="location-btn" id="location-btn">⌖ &nbsp;Use my location</button></div><div class="sky-score"><div class="score-ring"><div><strong id="score">82</strong><small>/ 100</small></div></div><div class="score-label">NIGHT HONOR SCORE</div><div class="score-status">✦ &nbsp; EXCELLENT VIEWING</div></div><div class="sky-metrics"><div><span>☁</span><small>CLOUD COVER</small><b id="cloud">12%</b></div><div><span>◉</span><small>VISIBILITY</small><b id="visibility">18 km</b></div><div><span>♧</span><small>HUMIDITY</small><b id="humidity">64%</b></div><div><span>◷</span><small>BEST VIEWING</small><b>9 PM – 1 AM</b></div></div></section>
    <div class="section-head" id="events"><div><div class="eyebrow left">MARK YOUR CALENDAR</div><h2>The celestial <em>scroll</em></h2></div><button class="text-button" id="all-events">VIEW ALL EVENTS <span>↗</span></button></div>
    <section class="event-grid">${events.map(e => `<article class="event-card"><div class="event-top"><span class="event-icon">${e.icon}</span><span class="event-day">${e.day}</span></div><div class="event-type">${e.type}</div><h3>${e.title}</h3><p>${e.detail}</p><a href="#events" class="event-link">VIEW DETAILS <span>↗</span></a></article>`).join('')}</section>
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

function updateSky(data: { cloud: number; visibility: number; humidity: number }, place: string) {
  document.querySelector('#cloud')!.textContent = `${data.cloud}%`
  document.querySelector('#visibility')!.textContent = `${Math.round(data.visibility / 1000)} km`
  document.querySelector('#humidity')!.textContent = `${data.humidity}%`
  document.querySelector('#score')!.textContent = `${Math.max(0, Math.round(100 - data.cloud * 0.7 - data.humidity * 0.15))}`
  document.querySelector('#place')!.textContent = place.toUpperCase()
}

document.querySelector('#location-btn')?.addEventListener('click', () => {
  if (!navigator.geolocation) return toast('Location is not available in this browser.')
  toast('Finding your skies…')
  navigator.geolocation.getCurrentPosition(async ({ coords }) => {
    try {
      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${coords.latitude}&longitude=${coords.longitude}&current=relative_humidity_2m,cloud_cover,visibility&timezone=auto`
      const geoUrl = `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${coords.latitude}&longitude=${coords.longitude}&language=en&format=json`
      const [weatherRes, geoRes] = await Promise.all([fetch(weatherUrl), fetch(geoUrl)])
      if (!weatherRes.ok) throw new Error('Weather unavailable')
      const weather = await weatherRes.json()
      const geo = geoRes.ok ? await geoRes.json() : null
      const location = geo?.results?.[0]
      const place = location ? `${location.name}, ${location.country}` : `${coords.latitude.toFixed(2)}°, ${coords.longitude.toFixed(2)}°`
      updateSky({ cloud: weather.current.cloud_cover, visibility: weather.current.visibility, humidity: weather.current.relative_humidity_2m }, place)
      toast('Live sky conditions updated.')
    } catch { toast('Could not load live conditions. Showing demo data.') }
  }, () => toast('Location permission was not granted. Showing demo data.'))
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
