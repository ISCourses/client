'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Loader2, MapPin, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  ASR_SCHOOLS,
  CALCULATION_METHODS,
  DEFAULT_LOCATION,
  DEFAULT_SETTINGS,
  PRAYER_NAMES,
  PrayerDay,
  PrayerLocation,
  PrayerSettings,
  currentAndNext,
  fetchPrayerMonth,
  formatCountdown,
  formatGregorian,
  formatHijri,
  formatTime12h,
  gregorianMonthName,
  nowInTimezone,
  searchLocations
} from '@/lib/prayer-times'

const LOCATION_KEY = 'prayerTimes.location'
const SETTINGS_KEY = 'prayerTimes.settings'

function loadSaved<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage unavailable (private browsing): the choice just isn't remembered
  }
}

type Props = {
  // "full" adds the monthly schedule (prayer times page); "compact" is for the homepage
  variant?: 'full' | 'compact'
}

export default function PrayerTimes({ variant = 'full' }: Props) {
  const [location, setLocation] = useState<PrayerLocation>(DEFAULT_LOCATION)
  const [settings, setSettings] = useState<PrayerSettings>(DEFAULT_SETTINGS)
  const [now, setNow] = useState(() => nowInTimezone(DEFAULT_LOCATION.timezone))
  const [todayMonth, setTodayMonth] = useState<PrayerDay[] | null>(null)
  const [error, setError] = useState('')

  const [showSearch, setShowSearch] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  // Restore the visitor's last location and settings
  useEffect(() => {
    const savedLocation = loadSaved<PrayerLocation>(LOCATION_KEY)
    const savedSettings = loadSaved<PrayerSettings>(SETTINGS_KEY)
    if (savedLocation?.timezone) setLocation(savedLocation)
    if (savedSettings) setSettings({ ...DEFAULT_SETTINGS, ...savedSettings })
  }, [])

  // Tick every second for the countdown
  useEffect(() => {
    setNow(nowInTimezone(location.timezone))
    const id = setInterval(() => setNow(nowInTimezone(location.timezone)), 1000)
    return () => clearInterval(id)
  }, [location.timezone])

  useEffect(() => {
    let cancelled = false
    setError('')
    setTodayMonth(null)
    fetchPrayerMonth(location, settings, now.year, now.month)
      .then((days) => !cancelled && setTodayMonth(days))
      .catch(() => !cancelled && setError('Prayer times could not be loaded. Please try again shortly.'))
    return () => {
      cancelled = true
    }
    // Refetch when the location, settings, or month at the location changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location, settings, now.year, now.month])

  const chooseLocation = (loc: PrayerLocation) => {
    setLocation(loc)
    save(LOCATION_KEY, loc)
    setShowSearch(false)
  }

  const updateSettings = (next: PrayerSettings) => {
    setSettings(next)
    save(SETTINGS_KEY, next)
  }

  const today = todayMonth?.find((d) => d.gregorian.day === now.day)
  const tomorrow = todayMonth?.find((d) => d.gregorian.day === now.day + 1)
  const status = today ? currentAndNext(today, now.secondsOfDay, tomorrow) : null
  const method = CALCULATION_METHODS.find((m) => m.id === settings.method) ?? CALCULATION_METHODS[0]
  const school = ASR_SCHOOLS.find((s) => s.id === settings.school) ?? ASR_SCHOOLS[0]

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-8 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Prayer Times in {location.name}</h2>
            <p className="mt-2 text-gray-700">
              {today ? (
                <>
                  {formatGregorian(today.gregorian)} <span className="text-gray-400">|</span>{' '}
                  {formatHijri(today.hijri)}
                </>
              ) : (
                <span className="invisible">Loading date</span>
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowSearch((v) => !v)}
            className="self-start text-sm font-semibold text-gray-900 underline underline-offset-4 hover:text-red-600"
          >
            Change Location
          </button>
        </div>

        {showSearch && <LocationSearch onSelect={chooseLocation} onCancel={() => setShowSearch(false)} />}

        <div className="mt-6">
          {error ? (
            <p className="rounded-lg bg-red-50 p-4 text-red-700">{error}</p>
          ) : !today || !status ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {PRAYER_NAMES.map((name) => (
                <div key={name} className="h-28 rounded-xl bg-gray-100 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {PRAYER_NAMES.map((name) => {
                const isNow = status.current === name
                const isNext = status.next === name
                return (
                  <div
                    key={name}
                    className={`flex flex-col justify-center rounded-xl p-4 min-h-[7rem] ${
                      isNow ? 'bg-red-600 text-white shadow-md' : 'bg-red-50 text-gray-900'
                    }`}
                  >
                    {isNow && (
                      <span className="mb-2 self-start rounded bg-white/20 px-2 py-0.5 text-xs font-semibold">
                        Now
                      </span>
                    )}
                    {isNext && (
                      <span className="mb-2 flex flex-wrap items-center gap-1 text-xs font-semibold">
                        <span className="rounded bg-white px-2 py-0.5 text-red-600 shadow-sm">Next</span>
                        <span className="tabular-nums">in {formatCountdown(status.secondsUntilNext)}</span>
                      </span>
                    )}
                    <span className="text-lg sm:text-xl font-bold">{name}</span>
                    <span className={`mt-1 tabular-nums ${isNow ? 'text-white' : 'text-gray-700'}`}>
                      {formatTime12h(today.times[name])}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="text-sm text-gray-700">
            <p>
              {method.name}{' '}
              <button
                type="button"
                onClick={() => setShowSettings((v) => !v)}
                className="ml-1 font-semibold text-gray-900 underline underline-offset-4 hover:text-red-600"
              >
                Change Settings
              </button>
            </p>
            <p className="mt-1 text-xs text-gray-500">
              {method.detail} · Asr: {school.name}
            </p>
          </div>
          {variant === 'compact' && (
            <Link
              href="/prayer-times"
              className="text-sm font-semibold text-red-600 underline underline-offset-4 hover:text-red-700"
            >
              View monthly schedule
            </Link>
          )}
        </div>

        {showSettings && (
          <div className="mt-4 grid gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-gray-900">Calculation method</span>
              <select
                value={settings.method}
                onChange={(e) => updateSettings({ ...settings, method: Number(e.target.value) })}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                {CALCULATION_METHODS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-gray-900">Asr calculation</span>
              <select
                value={settings.school}
                onChange={(e) => updateSettings({ ...settings, school: Number(e.target.value) as 0 | 1 })}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                {ASR_SCHOOLS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}
      </div>

      {variant === 'full' && (
        <MonthlySchedule location={location} settings={settings} today={now} />
      )}
    </div>
  )
}

function LocationSearch({
  onSelect,
  onCancel
}: {
  onSelect: (loc: PrayerLocation) => void
  onCancel: () => void
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<PrayerLocation[] | null>(null)
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState('')

  const search = async (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim().length < 2) return
    setSearching(true)
    setError('')
    try {
      const found = await searchLocations(query)
      if (found.length === 1) {
        onSelect(found[0])
      } else {
        setResults(found)
      }
    } catch {
      setError('Location search is unavailable right now. Please try again.')
    } finally {
      setSearching(false)
    }
  }

  return (
    <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
      <form onSubmit={search} className="flex flex-col gap-2 sm:flex-row">
        <Input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter a city or ZIP code"
          aria-label="City or ZIP code"
          className="bg-white border-gray-300 text-gray-900 placeholder-gray-400"
        />
        <div className="flex gap-2">
          <Button type="submit" disabled={searching} className="bg-red-600 text-white hover:bg-red-700">
            {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
            {searching ? '' : 'Search'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="bg-white border-gray-300 text-gray-900 hover:bg-gray-100"
          >
            Cancel
          </Button>
        </div>
      </form>
      {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
      {results && results.length === 0 && (
        <p className="mt-3 text-sm text-gray-600">No locations found. Try a different city name or ZIP code.</p>
      )}
      {results && results.length > 0 && (
        <ul className="mt-3 divide-y divide-gray-200 rounded-md border border-gray-200 bg-white">
          {results.map((r) => (
            <li key={`${r.latitude},${r.longitude}`}>
              <button
                type="button"
                onClick={() => onSelect(r)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-900 hover:bg-red-50"
              >
                <MapPin className="h-4 w-4 shrink-0 text-gray-400" />
                {r.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function MonthlySchedule({
  location,
  settings,
  today
}: {
  location: PrayerLocation
  settings: PrayerSettings
  today: { year: number; month: number; day: number }
}) {
  const [view, setView] = useState({ year: today.year, month: today.month })
  const [days, setDays] = useState<PrayerDay[] | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setError('')
    setDays(null)
    fetchPrayerMonth(location, settings, view.year, view.month)
      .then((d) => !cancelled && setDays(d))
      .catch(() => !cancelled && setError('The monthly schedule could not be loaded. Please try again shortly.'))
    return () => {
      cancelled = true
    }
  }, [location, settings, view.year, view.month])

  const shiftMonth = (delta: number) => {
    setView(({ year, month }) => {
      const index = year * 12 + (month - 1) + delta
      return { year: Math.floor(index / 12), month: (index % 12) + 1 }
    })
  }

  const hijriRange = days?.length
    ? [days[0].hijri, days[days.length - 1].hijri]
        .map((h) => formatHijri(h).replace(/^\d+ /, ''))
        .filter((v, i, arr) => arr.indexOf(v) === i)
        .join(' – ')
    : ''

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-8 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => shiftMonth(-1)}
          aria-label="Previous month"
          className="bg-white border-gray-300 text-gray-900 hover:bg-gray-100"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
            {gregorianMonthName(view.month)} {view.year}
          </h2>
          <p className="text-sm text-gray-600 min-h-[1.25rem]">{hijriRange}</p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => shiftMonth(1)}
          aria-label="Next month"
          className="bg-white border-gray-300 text-gray-900 hover:bg-gray-100"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="mt-6 overflow-x-auto">
        {error ? (
          <p className="rounded-lg bg-red-50 p-4 text-red-700">{error}</p>
        ) : !days ? (
          <div className="h-96 rounded-lg bg-gray-100 animate-pulse" />
        ) : (
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-600">
                <th className="py-2 pr-3 font-semibold">Date</th>
                <th className="py-2 pr-3 font-semibold">Islamic Date</th>
                {PRAYER_NAMES.map((name) => (
                  <th key={name} className="py-2 pr-3 font-semibold">
                    {name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {days.map((d) => {
                const isToday =
                  d.gregorian.year === today.year && d.gregorian.month === today.month && d.gregorian.day === today.day
                return (
                  <tr
                    key={d.gregorian.day}
                    className={`border-b border-gray-100 ${isToday ? 'bg-red-50 font-semibold' : ''}`}
                  >
                    <td className="py-2 pr-3 whitespace-nowrap text-gray-900">
                      {d.gregorian.weekday.slice(0, 3)}, {gregorianMonthName(d.gregorian.month).slice(0, 3)}{' '}
                      {d.gregorian.day}
                    </td>
                    <td className="py-2 pr-3 whitespace-nowrap text-gray-700">{formatHijri(d.hijri)}</td>
                    {PRAYER_NAMES.map((name) => (
                      <td key={name} className="py-2 pr-3 whitespace-nowrap tabular-nums text-gray-900">
                        {formatTime12h(d.times[name])}
                      </td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
      <p className="mt-4 text-xs text-gray-500">
        Times are for {location.name} ({location.timezone.replace(/_/g, ' ')}). Islamic dates are calculated and may
        differ by a day from local moon sighting.
      </p>
    </div>
  )
}
