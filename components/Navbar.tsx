'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { usePublicSettings } from '@/contexts/PublicSettingsContext'
import { Button } from '@/components/ui/button'
import { BookOpen, User, LogOut, ChevronDown, Menu, X } from 'lucide-react'
import { NavItem, normalizeNavItems } from '@/lib/site-nav'
import { useEffect, useState } from 'react'

// A menu link is current when the page is that link or a page under it (e.g. /courses/123 → Courses)
function isActivePath(pathname: string, href: string) {
  if (!href.startsWith('/')) return false // external links
  const path = href.split(/[?#]/)[0].replace(/\/$/, '') || '/'
  if (path === '/') return pathname === '/'
  return pathname === path || pathname.startsWith(`${path}/`)
}

function navLinkClass(active: boolean) {
  return active
    ? 'text-red-600 font-semibold transition-colors'
    : 'text-gray-700 hover:text-red-600 transition-colors'
}

function MobileNavLink({
  href,
  label,
  active,
  openInNewTab,
  indent
}: {
  href: string
  label: string
  active: boolean
  openInNewTab?: boolean
  indent?: boolean
}) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={`block rounded-md px-3 py-2 text-base ${indent ? 'pl-6' : ''} ${
        active ? 'bg-red-50 text-red-600 font-semibold' : 'text-gray-700 hover:bg-gray-50 hover:text-red-600'
      }`}
      {...(openInNewTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      {label}
    </Link>
  )
}

function NavbarSkeleton() {
  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50" aria-busy="true" aria-label="Loading navigation">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded bg-gray-200 animate-pulse" />
            <div className="h-6 w-36 rounded bg-gray-200 animate-pulse" />
          </div>
          <div className="hidden md:flex items-center space-x-8">
            <div className="h-4 w-16 rounded bg-gray-200 animate-pulse" />
            <div className="h-4 w-14 rounded bg-gray-200 animate-pulse" />
          </div>
        </div>
      </div>
    </nav>
  )
}

function NavDropdown({ item, pathname }: { item: NavItem; pathname: string }) {
  const [open, setOpen] = useState(false)
  const children = item.children || []
  const active = children.some((child) => isActivePath(pathname, child.href))

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className={`flex items-center gap-1 ${navLinkClass(active)}`}
        aria-haspopup="true"
        aria-expanded={open}
      >
        {item.label}
        <ChevronDown className="h-4 w-4" />
      </button>
      {open && children.length > 0 && (
        <div className="absolute top-full left-0 pt-1 min-w-[180px] z-50">
          <div className="bg-white border border-gray-200 rounded-lg shadow-lg py-1">
            {children.map((child) => {
              const childActive = isActivePath(pathname, child.href)
              return (
                <Link
                  key={`${child.href}-${child.label}`}
                  href={child.href}
                  aria-current={childActive ? 'page' : undefined}
                  className={`block px-4 py-2 text-sm hover:bg-red-50 hover:text-red-600 ${
                    childActive ? 'text-red-600 font-semibold' : 'text-gray-700'
                  }`}
                  {...(child.openInNewTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                >
                  {child.label}
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default function Navbar() {
  const { user, logout } = useAuth()
  const { loading, settings } = usePublicSettings()
  const pathname = usePathname() || '/'
  const [mobileOpen, setMobileOpen] = useState(false)

  // Close the phone menu after navigating
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  if (loading) {
    return <NavbarSkeleton />
  }

  const logo = settings?.siteLogo || null
  const siteName = (settings?.siteName as string) || 'NOI LMS'
  const navItems: NavItem[] = normalizeNavItems(settings?.navMenu)

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              {logo ? (
                <img src={logo} alt="" className="h-8 w-auto max-w-[10rem] shrink-0 object-contain" />
              ) : (
                <BookOpen className="h-8 w-8 shrink-0 text-red-600" />
              )}
              <span className="text-xl font-bold text-gray-900">{siteName}</span>
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) =>
              item.isDropdown && item.children?.length ? (
                <NavDropdown key={`${item.label}-dropdown`} item={item} pathname={pathname} />
              ) : (
                <Link
                  key={`${item.href}-${item.label}`}
                  href={item.href}
                  aria-current={isActivePath(pathname, item.href) ? 'page' : undefined}
                  className={navLinkClass(isActivePath(pathname, item.href))}
                  {...(item.openInNewTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                >
                  {item.label}
                </Link>
              )
            )}
            {user?.role === 'admin' && (
              <Link
                href="/admin"
                aria-current={isActivePath(pathname, '/admin') ? 'page' : undefined}
                className={navLinkClass(isActivePath(pathname, '/admin'))}
              >
                Admin
              </Link>
            )}
          </div>

          {/* Desktop account buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                <Link href="/profile">
                  <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span>{user.name}</span>
                  </Button>
                </Link>
                <Button variant="outline" size="sm" onClick={logout} className="flex items-center space-x-2">
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    Login
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm">Sign Up</Button>
                </Link>
              </div>
            )}
          </div>

          {/* Phone: Sign Up (when logged out) and the menu button */}
          <div className="flex items-center gap-2 md:hidden">
            {!user && (
              <Link href="/register">
                <Button size="sm">Sign Up</Button>
              </Link>
            )}
            <button
              type="button"
              onClick={() => setMobileOpen((open) => !open)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-md text-gray-700 hover:bg-gray-100"
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
              aria-controls="mobile-menu"
            >
              {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div id="mobile-menu" className="md:hidden border-t border-gray-200 bg-white max-h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="px-4 py-3 space-y-1">
            {navItems.map((item) =>
              item.isDropdown && item.children?.length ? (
                <div key={`${item.label}-dropdown`} className="py-1">
                  <p className="px-3 py-2 text-sm font-semibold text-gray-500">{item.label}</p>
                  {item.children.map((child) => (
                    <MobileNavLink
                      key={`${child.href}-${child.label}`}
                      href={child.href}
                      label={child.label}
                      active={isActivePath(pathname, child.href)}
                      openInNewTab={child.openInNewTab}
                      indent
                    />
                  ))}
                </div>
              ) : (
                <MobileNavLink
                  key={`${item.href}-${item.label}`}
                  href={item.href}
                  label={item.label}
                  active={isActivePath(pathname, item.href)}
                  openInNewTab={item.openInNewTab}
                />
              )
            )}
            {user?.role === 'admin' && (
              <MobileNavLink href="/admin" label="Admin" active={isActivePath(pathname, '/admin')} />
            )}
          </div>
          <div className="border-t border-gray-200 px-4 py-3 space-y-1">
            {user ? (
              <>
                <MobileNavLink href="/profile" label={user.name} active={isActivePath(pathname, '/profile')} />
                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false)
                    logout()
                  }}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-base text-gray-700 hover:bg-red-50 hover:text-red-600"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </>
            ) : (
              <MobileNavLink href="/login" label="Login" active={isActivePath(pathname, '/login')} />
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
