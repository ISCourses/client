export type NavItem = {
  label: string
  href: string
  order?: number
  openInNewTab?: boolean
}

export const DEFAULT_NAV_ITEMS: NavItem[] = [
  { label: 'Courses', href: '/courses', order: 0 },
  { label: 'Books', href: '/books', order: 1 },
  { label: 'Blog', href: '/blogs', order: 2 }
]

export function normalizeNavItems(raw: unknown): NavItem[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    return [...DEFAULT_NAV_ITEMS]
  }
  const items = raw
    .filter((i: NavItem) => i?.label?.trim() && i?.href?.trim())
    .map((i: NavItem) => ({
      label: i.label.trim(),
      href: i.href.trim(),
      order: i.order ?? 0,
      openInNewTab: !!i.openInNewTab
    }))
    .sort((a, b) => a.order - b.order)
  return items.length > 0 ? items : [...DEFAULT_NAV_ITEMS]
}

export type FooterLink = { label: string; href: string; order?: number }

export const DEFAULT_FOOTER_QUICK: FooterLink[] = [
  { label: 'Courses', href: '/courses', order: 0 },
  { label: 'Books', href: '/books', order: 1 },
  { label: 'Blog', href: '/blogs', order: 2 },
  { label: 'About Us', href: '/about', order: 3 },
  { label: 'Contact', href: '/contact', order: 4 }
]

export const DEFAULT_FOOTER_SUPPORT: FooterLink[] = [
  { label: 'Help Center', href: '/help', order: 0 },
  { label: 'Privacy Policy', href: '/privacy', order: 1 },
  { label: 'Terms of Service', href: '/terms', order: 2 },
  { label: 'FAQ', href: '/faq', order: 3 }
]

export function normalizeFooterLinks(raw: unknown, fallback: FooterLink[]): FooterLink[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    return [...fallback]
  }
  const items = raw
    .filter((i: FooterLink) => i?.label?.trim() && i?.href?.trim())
    .map((i: FooterLink) => ({
      label: i.label.trim(),
      href: i.href.trim(),
      order: i.order ?? 0
    }))
    .sort((a, b) => a.order - b.order)
  return items.length > 0 ? items : [...fallback]
}
