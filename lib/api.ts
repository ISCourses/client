import axios from 'axios'
import Cookies from 'js-cookie'
import { API_BASE_URL } from './utils'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    // Get token from cookies - ensure we're in browser environment
    if (typeof window !== 'undefined') {
      try {
        // Try js-cookie first
        let token = Cookies.get('token')
        
        // If not found, try document.cookie as fallback
        if (!token && typeof document !== 'undefined') {
          const cookieString = document.cookie
          const tokenMatch = cookieString.match(/token=([^;]+)/)
          if (tokenMatch && tokenMatch[1]) {
            token = tokenMatch[1]
            console.log('Found token in document.cookie, using it')
          }
        }
        
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        } else {
          // Log warning if token is missing for protected routes (helpful for debugging)
          const protectedRoutes = ['/users/profile', '/auth/me', '/users', '/courses/admin', '/blogs/admin', '/books/admin', '/cms-pages/admin', '/upload/']
          if (protectedRoutes.some(route => config.url?.includes(route))) {
            console.warn('Token not found in cookies for protected route:', config.url)
            console.warn('Available cookies:', typeof document !== 'undefined' ? document.cookie : 'N/A')
          }
        }
      } catch (error) {
        console.error('Error reading token from cookies:', error)
      }
    }
    // Don't set Content-Type for FormData - let axios set it automatically with boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type']
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only auto-logout on 401 if it's not from a protected endpoint that handles its own errors
    // This prevents logout loops and allows components to handle errors gracefully
    if (error.response?.status === 401) {
      const url = error.config?.url || ''
      const pathname = typeof window !== 'undefined' ? window.location.pathname : ''
      
      // Don't auto-logout for these endpoints - let components handle errors
      const protectedEndpoints = [
        '/enroll', 
        '/users/profile', 
        '/auth/me',
        '/users',           // Admin users endpoint
        '/courses/admin/all',  // Admin courses endpoint
        '/blogs/admin/all',    // Admin blogs endpoint
        '/books/admin/all',    // Admin books endpoint
        '/settings/admin/all', // Admin settings endpoint
        '/categories/admin/all', // Admin categories endpoint
        '/upload/', // Image/file uploads (admin)
        '/cms-pages/admin' // CMS pages (admin)
      ]
      const isProtectedEndpoint = protectedEndpoints.some(endpoint => url.includes(endpoint))
      
      // For protected endpoints, don't auto-logout - let the component handle it
      if (isProtectedEndpoint) {
        // Just return the error, don't modify cookies or redirect
        return Promise.reject(error)
      }
      
      // Only auto-logout for non-protected endpoints
      // But also check if we're on admin or profile pages - don't logout there
      const isAdminPage = pathname.startsWith('/admin')
      const isProfilePage = pathname.startsWith('/profile')
      
      if (pathname !== '/login' && pathname !== '/register' && !isAdminPage && !isProfilePage) {
        const errorMessage = error.response?.data?.message || ''
        // Only logout if it's a clear auth failure
        if (errorMessage.includes('token') || errorMessage.includes('authorization') || errorMessage.includes('denied') || errorMessage.includes('No token')) {
          Cookies.remove('token')
          // Only redirect if not already navigating
          if (pathname !== '/login' && pathname !== '/register') {
            window.location.href = '/login'
          }
        }
      }
    }
    return Promise.reject(error)
  }
)

export default api
