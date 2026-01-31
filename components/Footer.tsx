'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { BookOpen, Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin, Youtube } from 'lucide-react'
import api from '@/lib/api'

interface Settings {
  siteName: string
  siteDescription: string
  siteLogo: string
  contactEmail: string
  contactPhone: string
  contactAddress: string
  socialMedia: {
    facebook: string
    twitter: string
    instagram: string
    linkedin: string
    youtube: string
  }
}

export default function Footer() {
  const [settings, setSettings] = useState<Settings | null>(null)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await api.get('/settings')
      setSettings(response.data)
    } catch (error) {
      console.error('Failed to fetch settings:', error)
      // Use defaults if API fails
      setSettings({
        siteName: 'NOI LMS',
        siteDescription: 'Empowering learners worldwide with authentic Islamic knowledge, comprehensive courses, and spiritual growth.',
        siteLogo: '',
        contactEmail: '',
        contactPhone: '',
        contactAddress: '',
        socialMedia: {
          facebook: '',
          twitter: '',
          instagram: '',
          linkedin: '',
          youtube: ''
        }
      })
    }
  }

  const siteName = settings?.siteName || 'NOI LMS'
  const siteDescription = settings?.siteDescription || 'Empowering learners worldwide with authentic Islamic knowledge, comprehensive courses, and spiritual growth.'
  const contactEmail = settings?.contactEmail || ''
  const contactPhone = settings?.contactPhone || ''
  const contactAddress = settings?.contactAddress || ''
  const socialMedia = settings?.socialMedia || {
    facebook: '',
    twitter: '',
    instagram: '',
    linkedin: '',
    youtube: ''
  }

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              {settings?.siteLogo ? (
                <img src={settings.siteLogo} alt={siteName} className="h-8 w-8" />
              ) : (
                <BookOpen className="h-8 w-8 text-red-600" />
              )}
              <span className="text-xl font-bold">{siteName}</span>
            </div>
            <p className="text-gray-300 mb-4 max-w-md">
              {siteDescription}
            </p>
            <div className="space-y-2">
              {contactEmail && (
                <div className="flex items-center text-gray-300">
                  <Mail className="h-4 w-4 mr-2" />
                  <a href={`mailto:${contactEmail}`} className="hover:text-red-600 transition-colors">
                    {contactEmail}
                  </a>
                </div>
              )}
              {contactPhone && (
                <div className="flex items-center text-gray-300">
                  <Phone className="h-4 w-4 mr-2" />
                  <a href={`tel:${contactPhone}`} className="hover:text-red-600 transition-colors">
                    {contactPhone}
                  </a>
                </div>
              )}
              {contactAddress && (
                <div className="flex items-center text-gray-300">
                  <MapPin className="h-4 w-4 mr-2" />
                  <span>{contactAddress}</span>
                </div>
              )}
            </div>
            {(socialMedia.facebook || socialMedia.twitter || socialMedia.instagram || socialMedia.linkedin || socialMedia.youtube) && (
              <div className="flex items-center space-x-4 mt-4">
                {socialMedia.facebook && (
                  <a href={socialMedia.facebook} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-red-600 transition-colors">
                    <Facebook className="h-5 w-5" />
                  </a>
                )}
                {socialMedia.twitter && (
                  <a href={socialMedia.twitter} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-red-600 transition-colors">
                    <Twitter className="h-5 w-5" />
                  </a>
                )}
                {socialMedia.instagram && (
                  <a href={socialMedia.instagram} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-red-600 transition-colors">
                    <Instagram className="h-5 w-5" />
                  </a>
                )}
                {socialMedia.linkedin && (
                  <a href={socialMedia.linkedin} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-red-600 transition-colors">
                    <Linkedin className="h-5 w-5" />
                  </a>
                )}
                {socialMedia.youtube && (
                  <a href={socialMedia.youtube} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-red-600 transition-colors">
                    <Youtube className="h-5 w-5" />
                  </a>
                )}
              </div>
            )}
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/courses" className="text-gray-300 hover:text-red-600 transition-colors">
                  Courses
                </Link>
              </li>
              <li>
                <Link href="/books" className="text-gray-300 hover:text-red-600 transition-colors">
                  Books
                </Link>
              </li>
              <li>
                <Link href="/blogs" className="text-gray-300 hover:text-red-600 transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-gray-300 hover:text-red-600 transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-300 hover:text-red-600 transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Support</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/help" className="text-gray-300 hover:text-red-600 transition-colors">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-gray-300 hover:text-red-600 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-gray-300 hover:text-red-600 transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-gray-300 hover:text-red-600 transition-colors">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center">
          <p className="text-gray-300">
            © {new Date().getFullYear()} {siteName}. All rights reserved. Made with love by NOI
          </p>
        </div>
      </div>
    </footer>
  )
}
