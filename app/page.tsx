'use client'

import { Suspense, useEffect, useState } from 'react'
import Hero from '@/components/Hero'
import FeaturedCourses from '@/components/FeaturedCourses'
import FeaturedBooks from '@/components/FeaturedBooks'
import FeaturedBlogs from '@/components/FeaturedBlogs'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import api from '@/lib/api'

export default function Home() {
  const [homepageContent, setHomepageContent] = useState<any>(null)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await api.get('/settings')
      setHomepageContent(response.data.homepageContent)
    } catch (error) {
      console.error('Failed to fetch settings:', error)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main>
        <Hero />
        <Suspense fallback={<div>Loading...</div>}>
          <FeaturedCourses />
        </Suspense>
        <Suspense fallback={<div>Loading...</div>}>
          <FeaturedBooks />
        </Suspense>
        <Suspense fallback={<div>Loading...</div>}>
          <FeaturedBlogs />
        </Suspense>

        {/* About Us Section */}
        {homepageContent?.aboutUs && (
          <section className="py-16 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <Card className="bg-white border-gray-200">
                <CardHeader>
                  <CardTitle className="text-3xl font-bold text-gray-900">About Us</CardTitle>
                </CardHeader>
                <CardContent>
                  <div 
                    className="prose max-w-none text-gray-700"
                    dangerouslySetInnerHTML={{ __html: homepageContent.aboutUs.replace(/\n/g, '<br />') }}
                  />
                </CardContent>
              </Card>
            </div>
          </section>
        )}

        {/* Contact Section */}
        {homepageContent?.contactContent && (
          <section className="py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <Card className="bg-white border-gray-200">
                <CardHeader>
                  <CardTitle className="text-3xl font-bold text-gray-900">Contact Us</CardTitle>
                </CardHeader>
                <CardContent>
                  <div 
                    className="prose max-w-none text-gray-700"
                    dangerouslySetInnerHTML={{ __html: homepageContent.contactContent.replace(/\n/g, '<br />') }}
                  />
                </CardContent>
              </Card>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  )
}
