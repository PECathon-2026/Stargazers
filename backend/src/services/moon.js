const SYNODIC_MONTH_DAYS = 29.530588853
const KNOWN_NEW_MOON_UTC = Date.UTC(2000, 0, 6, 18, 14)

export function getMoonPhase(date = new Date()) {
  const ageDays = ((date.getTime() - KNOWN_NEW_MOON_UTC) / 86_400_000 % SYNODIC_MONTH_DAYS + SYNODIC_MONTH_DAYS) % SYNODIC_MONTH_DAYS
  const fraction = ageDays / SYNODIC_MONTH_DAYS
  const illumination = Math.round((1 - Math.cos(2 * Math.PI * fraction)) * 50)
  let name
  if (ageDays < 1.85 || ageDays >= 27.68) name = 'New moon'
  else if (ageDays < 5.53) name = 'Waxing crescent'
  else if (ageDays < 9.22) name = 'First quarter'
  else if (ageDays < 12.91) name = 'Waxing gibbous'
  else if (ageDays < 16.61) name = 'Full moon'
  else if (ageDays < 20.30) name = 'Waning gibbous'
  else if (ageDays < 23.99) name = 'Last quarter'
  else name = 'Waning crescent'

  return {
    name,
    illumination,
    ageDays: Math.round(ageDays * 10) / 10,
    phaseFraction: Math.round(fraction * 1000) / 1000,
    asOf: date.toISOString(),
    source: 'approximation',
  }
}
