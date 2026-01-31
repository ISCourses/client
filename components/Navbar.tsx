'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { BookOpen, User, LogOut, Settings } from 'lucide-react'
import api from '@/lib/api'

export default function Navbar() {
  const { user, logout } = useAuth()
  const [logo, setLogo] = useState<string | null>(null)

  useEffect(() => {
    fetchLogo()
  }, [])

  const fetchLogo = async () => {
    try {
      const response = await api.get('/settings')
      if (response.data.siteLogo) {
        setLogo(response.data.siteLogo)
      }
    } catch (error) {
      console.error('Failed to fetch logo:', error)
    }
  }

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              {logo ? (
                <img src={logo} alt="Logo" className="h-8 w-auto" />
              ) : (
                <BookOpen className="h-8 w-8 text-red-600" />
              )}
              <span className="text-xl font-bold text-gray-900">NOI LMS</span>
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            <Link href="/courses" className="text-gray-700 hover:text-red-600 transition-colors">
              Courses
            </Link>
            <Link href="/books" className="text-gray-700 hover:text-red-600 transition-colors">
              Books
            </Link>
            <Link href="/blogs" className="text-gray-700 hover:text-red-600 transition-colors">
              Blog
            </Link>
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={logout}
                  className="flex items-center space-x-2"
                >
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
                  <Button size="sm">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
