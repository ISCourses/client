'use client'

import Link from 'next/link'
import { BookOpen, Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin, Youtube } from 'lucide-react'
import { usePublicSettings } from '@/contexts/PublicSettingsContext'
import {
  DEFAULT_FOOTER_QUICK,
  DEFAULT_FOOTER_SUPPORT,
  FooterLink,
  normalizeFooterLinks
} from '@/lib/site-nav'

function FooterSkeleton() {
  return (
    <footer className="bg-gray-900 text-white" aria-busy="true" aria-label="Loading footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2 space-y-4">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded bg-gray-700 animate-pulse" />
              <div className="h-6 w-40 rounded bg-gray-700 animate-pulse" />
            </div>
            <div className="space-y-2 max-w-md">
              <div className="h-3 w-full rounded bg-gray-700 animate-pulse" />
              <div className="h-3 w-full rounded bg-gray-700 animate-pulse" />
              <div className="h-3 w-2/3 rounded bg-gray-700 animate-pulse" />
            </div>
          </div>
          <div className="space-y-3">
            <div className="h-5 w-28 rounded bg-gray-700 animate-pulse" />
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-4 w-24 rounded bg-gray-700 animate-pulse" />
            ))}
          </div>
          <div className="space-y-3">
            <div className="h-5 w-24 rounded bg-gray-700 animate-pulse" />
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-4 w-28 rounded bg-gray-700 animate-pulse" />
            ))}
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-8 flex justify-center">
          <div className="h-4 w-64 rounded bg-gray-700 animate-pulse" />
        </div>
      </div>
    </footer>
  )
}

const emptySocial = {
  facebook: '',
  twitter: '',
  instagram: '',
  linkedin: '',
  youtube: ''
}

export default function Footer() {
  const { loading, settings } = usePublicSettings()

  if (loading) {
    return <FooterSkeleton />
  }

  const data = settings || {
    siteName: 'NOI LMS',
    siteDescription:
      'Empowering learners worldwide with authentic Islamic knowledge, comprehensive courses, and spiritual growth.',
    siteLogo: '',
    contactEmail: '',
    contactPhone: '',
    contactAddress: '',
    socialMedia: { ...emptySocial }
  }

  const siteName = (data.siteName as string) || 'NOI LMS'
  const siteDescription =
    (data.siteDescription as string) ||
    'Empowering learners worldwide with authentic Islamic knowledge, comprehensive courses, and spiritual growth.'
  const contactEmail = (data.contactEmail as string) || ''
  const contactPhone = (data.contactPhone as string) || ''
  const contactAddress = (data.contactAddress as string) || ''
  const socialMedia = { ...emptySocial, ...(data.socialMedia || {}) }

  const fs = data.footerSettings as
    | {
        quickLinksTitle?: string
        supportTitle?: string
        quickLinks?: FooterLink[]
        supportLinks?: FooterLink[]
        copyrightLine?: string
      }
    | undefined

  const quickTitle = fs?.quickLinksTitle?.trim() || 'Quick Links'
  const supportTitle = fs?.supportTitle?.trim() || 'Support'
  const quickLinks = normalizeFooterLinks(fs?.quickLinks, DEFAULT_FOOTER_QUICK)
  const supportLinks = normalizeFooterLinks(fs?.supportLinks, DEFAULT_FOOTER_SUPPORT)
  const copyrightLine =
    fs?.copyrightLine?.trim() ||
    `© ${new Date().getFullYear()} ${siteName}. All rights reserved. Made with love by NOI`

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              {data.siteLogo ? (
                <img src={data.siteLogo as string} alt="" className="h-8 w-8" />
              ) : (
                <BookOpen className="h-8 w-8 text-red-600" />
              )}
              <span className="text-xl font-bold">{siteName}</span>
            </div>
            <p className="text-gray-300 mb-4 max-w-md">{siteDescription}</p>
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
            {(socialMedia.facebook ||
              socialMedia.twitter ||
              socialMedia.instagram ||
              socialMedia.linkedin ||
              socialMedia.youtube) && (
              <div className="flex items-center space-x-4 mt-4">
                {socialMedia.facebook && (
                  <a
                    href={socialMedia.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-300 hover:text-red-600 transition-colors"
                  >
                    <Facebook className="h-5 w-5" />
                  </a>
                )}
                {socialMedia.twitter && (
                  <a
                    href={socialMedia.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-300 hover:text-red-600 transition-colors"
                  >
                    <Twitter className="h-5 w-5" />
                  </a>
                )}
                {socialMedia.instagram && (
                  <a
                    href={socialMedia.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-300 hover:text-red-600 transition-colors"
                  >
                    <Instagram className="h-5 w-5" />
                  </a>
                )}
                {socialMedia.linkedin && (
                  <a
                    href={socialMedia.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-300 hover:text-red-600 transition-colors"
                  >
                    <Linkedin className="h-5 w-5" />
                  </a>
                )}
                {socialMedia.youtube && (
                  <a
                    href={socialMedia.youtube}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-300 hover:text-red-600 transition-colors"
                  >
                    <Youtube className="h-5 w-5" />
                  </a>
                )}
              </div>
            )}
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">{quickTitle}</h3>
            <ul className="space-y-2">
              {quickLinks.map((item) => (
                <li key={`${item.href}-${item.label}`}>
                  <Link href={item.href} className="text-gray-300 hover:text-red-600 transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">{supportTitle}</h3>
            <ul className="space-y-2">
              {supportLinks.map((item) => (
                <li key={`${item.href}-${item.label}`}>
                  <Link href={item.href} className="text-gray-300 hover:text-red-600 transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center">
          <p className="text-gray-300">{copyrightLine}</p>
        </div>
      </div>
    </footer>
  )
}
