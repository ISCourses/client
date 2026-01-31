'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import Cookies from 'js-cookie'
import api from '@/lib/api'

interface User {
  id: string
  name: string
  email: string
  role: 'user' | 'admin'
  enrolledCourses?: any[]
  quizAttempts?: any[]
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<User>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
  updateUser: (userData: Partial<User>) => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    // Only fetch user on initial load if we don't already have a user
    if (!isInitialized) {
      const token = Cookies.get('token')
      if (token && !user) {
        fetchUser()
      } else {
        setLoading(false)
        setIsInitialized(true)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run once on mount

  const fetchUser = async () => {
    try {
      const response = await api.get('/auth/me')
      setUser(response.data.user)
    } catch (error: any) {
      console.error('Failed to fetch user:', error)
      // Only remove token if it's a clear authentication error AND we don't have a user
      // This prevents removing token right after login
      if (error.response?.status === 401 && !user) {
        const errorMessage = error.response?.data?.message || ''
        if (errorMessage.includes('token') || errorMessage.includes('authorization') || errorMessage.includes('denied') || errorMessage.includes('No token')) {
          Cookies.remove('token')
          setUser(null)
        }
      }
      // If we have a user but fetch fails, don't remove token - might be temporary network issue
    } finally {
      setLoading(false)
      setIsInitialized(true)
    }
  }

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { email, password })
      const { token, user: userData } = response.data
      
      // Try multiple methods to set the cookie
      let cookieSet = false
      
      // Method 1: Try with all options
      try {
        Cookies.set('token', token, { 
          expires: 7,
          sameSite: 'lax' as const,
          path: '/'
        })
        cookieSet = !!Cookies.get('token')
      } catch (e) {
        console.warn('Failed to set cookie with options:', e)
      }
      
      // Method 2: Try without sameSite if first method failed
      if (!cookieSet) {
        try {
          Cookies.set('token', token, { 
            expires: 7,
            path: '/'
          })
          cookieSet = !!Cookies.get('token')
        } catch (e) {
          console.warn('Failed to set cookie without sameSite:', e)
        }
      }
      
      // Method 3: Try with minimal options
      if (!cookieSet) {
        try {
          Cookies.set('token', token, { expires: 7 })
          cookieSet = !!Cookies.get('token')
        } catch (e) {
          console.warn('Failed to set cookie with minimal options:', e)
        }
      }
      
      // Method 4: Try using document.cookie directly as last resort
      if (!cookieSet && typeof document !== 'undefined') {
        try {
          const expiryDate = new Date()
          expiryDate.setTime(expiryDate.getTime() + (7 * 24 * 60 * 60 * 1000))
          document.cookie = `token=${token}; expires=${expiryDate.toUTCString()}; path=/`
          cookieSet = !!document.cookie.match(/token=([^;]+)/)
        } catch (e) {
          console.error('Failed to set cookie using document.cookie:', e)
        }
      }
      
      if (!cookieSet) {
        console.error('All methods to set cookie failed. Token:', token ? 'exists' : 'missing')
      }
      
      // Set user immediately after login - don't wait for fetchUser
      setUser(userData)
      setLoading(false) // Set loading to false since we have the user
      setIsInitialized(true) // Mark as initialized so we don't refetch
      return userData // Return user data for redirect logic
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Login failed')
    }
  }

  const register = async (name: string, email: string, password: string) => {
    try {
      const response = await api.post('/auth/register', { name, email, password })
      const { token, user: userData } = response.data
      
      // Try multiple methods to set the cookie (same as login)
      let cookieSet = false
      
      // Method 1: Try with all options
      try {
        Cookies.set('token', token, { 
          expires: 7,
          sameSite: 'lax' as const,
          path: '/'
        })
        cookieSet = !!Cookies.get('token')
      } catch (e) {
        console.warn('Failed to set cookie with options:', e)
      }
      
      // Method 2: Try without sameSite if first method failed
      if (!cookieSet) {
        try {
          Cookies.set('token', token, { 
            expires: 7,
            path: '/'
          })
          cookieSet = !!Cookies.get('token')
        } catch (e) {
          console.warn('Failed to set cookie without sameSite:', e)
        }
      }
      
      // Method 3: Try with minimal options
      if (!cookieSet) {
        try {
          Cookies.set('token', token, { expires: 7 })
          cookieSet = !!Cookies.get('token')
        } catch (e) {
          console.warn('Failed to set cookie with minimal options:', e)
        }
      }
      
      // Method 4: Try using document.cookie directly as last resort
      if (!cookieSet && typeof document !== 'undefined') {
        try {
          const expiryDate = new Date()
          expiryDate.setTime(expiryDate.getTime() + (7 * 24 * 60 * 60 * 1000))
          document.cookie = `token=${token}; expires=${expiryDate.toUTCString()}; path=/`
          cookieSet = !!document.cookie.match(/token=([^;]+)/)
        } catch (e) {
          console.error('Failed to set cookie using document.cookie:', e)
        }
      }
      
      if (!cookieSet) {
        console.error('All methods to set cookie failed. Token:', token ? 'exists' : 'missing')
      }
      
      // Set user immediately after registration - don't wait for fetchUser
      setUser(userData)
      setLoading(false) // Set loading to false since we have the user
      setIsInitialized(true) // Mark as initialized so we don't refetch
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Registration failed')
    }
  }

  const logout = () => {
    Cookies.remove('token')
    setUser(null)
    setIsInitialized(false) // Reset so we can fetch user again on next login
  }

  const updateUser = (userData: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...userData } : null)
  }

  const refreshUser = async () => {
    try {
      const response = await api.get('/auth/me')
      setUser(response.data.user)
    } catch (error) {
      console.error('Failed to refresh user:', error)
    }
  }

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      register,
      logout,
      updateUser,
      refreshUser
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
