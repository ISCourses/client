'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import api from '@/lib/api'

/** Shape of GET /settings (public) — loose for optional CMS fields */
export type PublicSiteSettings = Record<string, unknown> & {
  siteName?: string
  siteLogo?: string
  siteDescription?: string
  navMenu?: unknown
  footerSettings?: unknown
  homepageContent?: Record<string, unknown>
  contactEmail?: string
  contactPhone?: string
  contactAddress?: string
  socialMedia?: Record<string, string>
}

type PublicSettingsContextValue = {
  /** True until the first /settings request finishes (success or failure) */
  loading: boolean
  /** Response body on success; null if the request failed */
  settings: PublicSiteSettings | null
}

const PublicSettingsContext = createContext<PublicSettingsContextValue | undefined>(undefined)

export function PublicSettingsProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState<PublicSiteSettings | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await api.get('/settings')
        if (!cancelled) setSettings(res.data as PublicSiteSettings)
      } catch (e) {
        console.error('Public settings fetch failed:', e)
        if (!cancelled) setSettings(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const value = useMemo(() => ({ loading, settings }), [loading, settings])

  return (
    <PublicSettingsContext.Provider value={value}>{children}</PublicSettingsContext.Provider>
  )
}

export function usePublicSettings() {
  const ctx = useContext(PublicSettingsContext)
  if (ctx === undefined) {
    throw new Error('usePublicSettings must be used within PublicSettingsProvider')
  }
  return ctx
}
