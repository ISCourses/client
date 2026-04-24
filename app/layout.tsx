import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import 'react-quill/dist/quill.snow.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { PublicSettingsProvider } from '@/contexts/PublicSettingsContext'
import { Toaster } from 'react-hot-toast'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'NOI LMS - Islamic Learning Management System',
  description: 'A comprehensive Islamic Learning Management System with courses, books, and spiritual growth resources',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <PublicSettingsProvider>
            {children}
            <Toaster position="top-right" />
          </PublicSettingsProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
