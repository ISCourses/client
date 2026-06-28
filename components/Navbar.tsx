'use client'

import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { usePublicSettings } from '@/contexts/PublicSettingsContext'
import { Button } from '@/components/ui/button'
import { BookOpen, User, LogOut, ChevronDown } from 'lucide-react'
import { NavItem, normalizeNavItems } from '@/lib/site-nav'
import { useState } from 'react'

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

function NavDropdown({ item }: { item: NavItem }) {
  const [open, setOpen] = useState(false)
  const children = item.children || []

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className="flex items-center gap-1 text-gray-700 hover:text-red-600 transition-colors"
        aria-haspopup="true"
        aria-expanded={open}
      >
        {item.label}
        <ChevronDown className="h-4 w-4" />
      </button>
      {open && children.length > 0 && (
        <div className="absolute top-full left-0 pt-1 min-w-[180px] z-50">
          <div className="bg-white border border-gray-200 rounded-lg shadow-lg py-1">
            {children.map((child) => (
              <Link
                key={`${child.href}-${child.label}`}
                href={child.href}
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600"
                {...(child.openInNewTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              >
                {child.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function Navbar() {
  const { user, logout } = useAuth()
  const { loading, settings } = usePublicSettings()

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
                <img src={logo} alt="" className="h-8 w-auto" />
              ) : (
                <BookOpen className="h-8 w-8 text-red-600" />
              )}
              <span className="text-xl font-bold text-gray-900">{siteName}</span>
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) =>
              item.isDropdown && item.children?.length ? (
                <NavDropdown key={`${item.label}-dropdown`} item={item} />
              ) : (
                <Link
                  key={`${item.href}-${item.label}`}
                  href={item.href}
                  className="text-gray-700 hover:text-red-600 transition-colors"
                  {...(item.openInNewTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                >
                  {item.label}
                </Link>
              )
            )}
            {user?.role === 'admin' && (
              <Link href="/admin" className="text-gray-700 hover:text-red-600 transition-colors">
                Admin
              </Link>
            )}
          </div>

          <div className="flex items-center space-x-4">
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
        </div>
      </div>
    </nav>
  )
}
