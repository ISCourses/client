/** Public URL path for a CMS page (matches `app/p/[slug]`) */
export function cmsPagePath(slug: string): string {
  const s = (slug || '').trim().replace(/^\/+/, '')
  if (!s) return '/p'
  return `/p/${encodeURIComponent(s)}`
}

/** Match server `normalizeSlug` for preview fields in admin */
export function normalizeCmsSlug(input: string): string {
  if (!input || typeof input !== 'string') return ''
  return input
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export type CmsPageListItem = {
  _id: string
  title: string
  slug: string
  published?: boolean
  archived?: boolean
  updatedAt?: string
}
