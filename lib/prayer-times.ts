// Prayer times data: location search (Open-Meteo geocoding) and monthly
// prayer schedules with Hijri dates (AlAdhan). Both are free and need no API key.

export type PrayerLocation = {
  name: string // e.g. "Chicago, IL"
  latitude: number
  longitude: number
  timezone: string
}

export type PrayerSettings = {
  method: number // AlAdhan calculation method id
  school: 0 | 1 // Asr: 0 = Standard (Shafi, Maliki, Hanbali), 1 = Hanafi
}

export const PRAYER_NAMES = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] as const
export type PrayerName = (typeof PRAYER_NAMES)[number]

export type PrayerDay = {
  gregorian: { day: number; month: number; year: number; weekday: string }
  hijri: { day: number; month: number; year: number }
  times: Record<PrayerName, string> // "HH:MM", 24-hour, in the location's time zone
}

export const DEFAULT_LOCATION: PrayerLocation = {
  name: 'Chicago, IL',
  latitude: 41.85003,
  longitude: -87.65005,
  timezone: 'America/Chicago'
}

export const DEFAULT_SETTINGS: PrayerSettings = { method: 2, school: 0 }

export const CALCULATION_METHODS: { id: number; name: string; detail: string }[] = [
  { id: 2, name: 'Islamic Society of North America', detail: 'Fajr 15.0°, Isha 15.0°' },
  { id: 3, name: 'Muslim World League', detail: 'Fajr 18.0°, Isha 17.0°' },
  { id: 4, name: 'Umm Al-Qura University, Makkah', detail: 'Fajr 18.5°, Isha 90 min after Maghrib' },
  { id: 5, name: 'Egyptian General Authority of Survey', detail: 'Fajr 19.5°, Isha 17.5°' },
  { id: 1, name: 'University of Islamic Sciences, Karachi', detail: 'Fajr 18.0°, Isha 18.0°' },
  { id: 15, name: 'Moonsighting Committee Worldwide', detail: 'Seasonal Fajr and Isha' }
]

export const ASR_SCHOOLS = [
  { id: 0 as const, name: 'Standard (Shafi, Maliki, Hanbali)' },
  { id: 1 as const, name: 'Hanafi' }
]

export const HIJRI_MONTHS = [
  'Muharram',
  'Safar',
  "Rabi' Al-Awwal",
  "Rabi' Al-Thani",
  'Jumada Al-Awwal',
  'Jumada Al-Thani',
  'Rajab',
  "Sha'ban",
  'Ramadan',
  'Shawwal',
  "Dhul Qi'dah",
  'Dhul Hijjah'
]

const US_STATES: Record<string, string> = {
  Alabama: 'AL', Alaska: 'AK', Arizona: 'AZ', Arkansas: 'AR', California: 'CA', Colorado: 'CO',
  Connecticut: 'CT', Delaware: 'DE', 'District of Columbia': 'DC', 'Washington, D.C.': 'DC', Florida: 'FL',
  Georgia: 'GA', Hawaii: 'HI', Idaho: 'ID', Illinois: 'IL', Indiana: 'IN', Iowa: 'IA', Kansas: 'KS',
  Kentucky: 'KY', Louisiana: 'LA', Maine: 'ME', Maryland: 'MD', Massachusetts: 'MA', Michigan: 'MI',
  Minnesota: 'MN', Mississippi: 'MS', Missouri: 'MO', Montana: 'MT', Nebraska: 'NE', Nevada: 'NV',
  'New Hampshire': 'NH', 'New Jersey': 'NJ', 'New Mexico': 'NM', 'New York': 'NY', 'North Carolina': 'NC',
  'North Dakota': 'ND', Ohio: 'OH', Oklahoma: 'OK', Oregon: 'OR', Pennsylvania: 'PA', 'Rhode Island': 'RI',
  'South Carolina': 'SC', 'South Dakota': 'SD', Tennessee: 'TN', Texas: 'TX', Utah: 'UT', Vermont: 'VT',
  Virginia: 'VA', Washington: 'WA', 'West Virginia': 'WV', Wisconsin: 'WI', Wyoming: 'WY', 'Puerto Rico': 'PR'
}

type GeocodeResult = {
  name: string
  latitude: number
  longitude: number
  timezone?: string
  country?: string
  country_code?: string
  admin1?: string
}

function locationName(r: GeocodeResult) {
  if (r.country_code === 'US') {
    const state = r.admin1 ? US_STATES[r.admin1] || r.admin1 : ''
    return state ? `${r.name}, ${state}` : r.name
  }
  return [r.name, r.admin1 && r.admin1 !== r.name ? r.admin1 : '', r.country].filter(Boolean).join(', ')
}

// Search by city name or ZIP code. Five-digit numbers are treated as US ZIP codes.
export async function searchLocations(query: string): Promise<PrayerLocation[]> {
  const q = query.trim()
  if (q.length < 2) return []
  const isUsZip = /^\d{5}$/.test(q)
  // "Chicago, IL" style input: search the city name only
  const name = isUsZip ? q : q.split(',')[0].trim()
  const params = new URLSearchParams({ name, count: '8', language: 'en', format: 'json' })
  if (isUsZip) params.set('countryCode', 'US')

  const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params}`)
  if (!res.ok) throw new Error('Location search failed')
  const data = await res.json()
  const withTimezone: GeocodeResult[] = (data.results || []).filter((r: GeocodeResult) => r.timezone)
  // The search is fuzzy; for city names, keep results whose name contains what was typed
  const nameMatches = isUsZip
    ? withTimezone
    : withTimezone.filter((r) => r.name.toLowerCase().includes(name.toLowerCase()))
  const results = nameMatches.length > 0 ? nameMatches : withTimezone

  // If the user typed a state or country after a comma, prefer matching results
  const qualifier = isUsZip ? '' : q.split(',').slice(1).join(',').trim().toLowerCase()
  const ranked = qualifier
    ? [...results].sort((a, b) => Number(matches(b, qualifier)) - Number(matches(a, qualifier)))
    : results

  return ranked.map((r) => ({
    name: locationName(r),
    latitude: r.latitude,
    longitude: r.longitude,
    timezone: r.timezone as string
  }))
}

function matches(r: GeocodeResult, qualifier: string) {
  const state = r.admin1 ? (US_STATES[r.admin1] || '').toLowerCase() : ''
  return [r.admin1, r.country, r.country_code, state].some((v) => v && v.toLowerCase() === qualifier)
}

const monthCache = new Map<string, PrayerDay[]>()

// Prayer times for every day of a month (month is 1-12)
export async function fetchPrayerMonth(
  location: PrayerLocation,
  settings: PrayerSettings,
  year: number,
  month: number
): Promise<PrayerDay[]> {
  const params = new URLSearchParams({
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    method: String(settings.method),
    school: String(settings.school)
  })
  const url = `https://api.aladhan.com/v1/calendar/${year}/${month}?${params}`
  const cached = monthCache.get(url)
  if (cached) return cached

  const res = await fetch(url)
  if (!res.ok) throw new Error('Could not load prayer times')
  const data = await res.json()
  const days: PrayerDay[] = (data.data || []).map((d: any) => ({
    gregorian: {
      day: Number(d.date.gregorian.day),
      month: Number(d.date.gregorian.month.number),
      year: Number(d.date.gregorian.year),
      weekday: d.date.gregorian.weekday.en
    },
    hijri: {
      day: Number(d.date.hijri.day),
      month: Number(d.date.hijri.month.number),
      year: Number(d.date.hijri.year)
    },
    times: Object.fromEntries(
      PRAYER_NAMES.map((name) => [name, String(d.timings[name]).slice(0, 5)]) // drop " (CDT)"
    ) as Record<PrayerName, string>
  }))
  monthCache.set(url, days)
  return days
}

// Current date and time at the location (not the visitor's own time zone)
export function nowInTimezone(timezone: string) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hourCycle: 'h23'
    })
      .formatToParts(new Date())
      .map((p) => [p.type, p.value])
  )
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    secondsOfDay: Number(parts.hour) * 3600 + Number(parts.minute) * 60 + Number(parts.second)
  }
}

export function toSeconds(time: string) {
  const [h, m] = time.split(':').map(Number)
  return h * 3600 + m * 60
}

// "18:15" -> "06:15 PM"
export function formatTime12h(time: string) {
  const [h, m] = time.split(':').map(Number)
  const suffix = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 === 0 ? 12 : h % 12
  return `${String(hour).padStart(2, '0')}:${String(m).padStart(2, '0')} ${suffix}`
}

export function formatCountdown(totalSeconds: number) {
  const s = Math.max(0, Math.floor(totalSeconds))
  const hh = String(Math.floor(s / 3600)).padStart(2, '0')
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0')
  const ss = String(s % 60).padStart(2, '0')
  return `${hh}:${mm}:${ss}`
}

export function formatHijri(h: PrayerDay['hijri']) {
  return `${h.day} ${HIJRI_MONTHS[h.month - 1]}, ${h.year}`
}

const GREGORIAN_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

export function gregorianMonthName(month: number) {
  return GREGORIAN_MONTHS[month - 1]
}

// "12 October, 2026"
export function formatGregorian(g: PrayerDay['gregorian']) {
  return `${g.day} ${GREGORIAN_MONTHS[g.month - 1]}, ${g.year}`
}

// Which prayer is current and which is next, for a day's times at a given moment.
// Before Fajr, Isha (from the night before) is current.
export function currentAndNext(today: PrayerDay, secondsOfDay: number, tomorrow?: PrayerDay) {
  let currentIndex = -1
  PRAYER_NAMES.forEach((name, i) => {
    if (toSeconds(today.times[name]) <= secondsOfDay) currentIndex = i
  })
  const current: PrayerName = currentIndex === -1 ? 'Isha' : PRAYER_NAMES[currentIndex]

  if (currentIndex < PRAYER_NAMES.length - 1) {
    const next = PRAYER_NAMES[currentIndex + 1]
    return { current, next, secondsUntilNext: toSeconds(today.times[next]) - secondsOfDay }
  }
  // After Isha: next is tomorrow's Fajr
  const fajr = toSeconds((tomorrow ?? today).times.Fajr)
  return { current, next: 'Fajr' as PrayerName, secondsUntilNext: 24 * 3600 - secondsOfDay + fajr }
}
