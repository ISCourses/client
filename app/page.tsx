'use client'

import { Suspense, useMemo } from 'react'
import Hero from '@/components/Hero'
import HomeCarousel, { type CarouselSlide } from '@/components/HomeCarousel'
import FeaturedCourses from '@/components/FeaturedCourses'
import FeaturedBooks from '@/components/FeaturedBooks'
import FeaturedBlogs from '@/components/FeaturedBlogs'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { usePublicSettings } from '@/contexts/PublicSettingsContext'

function HomepageCmsSkeleton() {
  return (
    <section
      className="min-h-[380px] md:min-h-[480px] bg-gradient-to-b from-gray-100 to-white"
      aria-busy="true"
      aria-label="Loading homepage content"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="mx-auto max-w-3xl text-center space-y-6">
          <div className="h-8 w-48 mx-auto rounded-lg bg-gray-200 animate-pulse" />
          <div className="h-14 w-full max-w-2xl mx-auto rounded-lg bg-gray-200 animate-pulse" />
          <div className="h-6 w-full max-w-xl mx-auto rounded bg-gray-200 animate-pulse" />
          <div className="h-6 w-4/5 max-w-lg mx-auto rounded bg-gray-200 animate-pulse" />
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <div className="h-11 w-48 mx-auto rounded-md bg-gray-200 animate-pulse" />
            <div className="h-11 w-48 mx-auto rounded-md bg-gray-200 animate-pulse" />
          </div>
        </div>
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="text-center space-y-3">
              <div className="h-16 w-16 rounded-full bg-gray-200 animate-pulse mx-auto" />
              <div className="h-5 w-3/4 mx-auto rounded bg-gray-200 animate-pulse" />
              <div className="h-4 w-full rounded bg-gray-200 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default function Home() {
  const { loading, settings } = usePublicSettings()
  const homepageContent = (settings?.homepageContent || null) as Record<string, unknown> | null

  const carouselSlides = homepageContent?.carouselSlides as CarouselSlide[] | undefined
  const hasCarousel =
    Array.isArray(carouselSlides) &&
    carouselSlides.some((s) => {
      const url = typeof s === 'object' && s !== null && 'imageUrl' in s ? String((s as CarouselSlide).imageUrl || '') : ''
      return url.trim().length > 0
    })

  const additionalSections = useMemo(() => {
    const raw = homepageContent?.additionalSections
    if (!Array.isArray(raw)) return []
    return [...raw]
      .filter((s: { title?: string; bodyHtml?: string }) => {
        const x = s as { title?: string; bodyHtml?: string }
        return x.title?.trim() || x.bodyHtml?.trim()
      })
      .sort((a: { order?: number }, b: { order?: number }) => (a.order ?? 0) - (b.order ?? 0))
  }, [homepageContent])

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main>
        {loading ? (
          <HomepageCmsSkeleton />
        ) : hasCarousel ? (
          <HomeCarousel slides={carouselSlides ?? []} />
        ) : (
          <Hero initialContent={homepageContent} />
        )}

        <Suspense fallback={<div className="py-8 text-center text-gray-500">Loading...</div>}>
          <FeaturedCourses />
        </Suspense>
        <Suspense fallback={<div className="py-8 text-center text-gray-500">Loading...</div>}>
          <FeaturedBooks />
        </Suspense>
        <Suspense fallback={<div className="py-8 text-center text-gray-500">Loading...</div>}>
          <FeaturedBlogs />
        </Suspense>

        {!loading && String(homepageContent?.aboutUs ?? '').trim() && (
          <section className="py-16 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <Card className="bg-white border-gray-200">
                <CardHeader>
                  <CardTitle className="text-3xl font-bold text-gray-900">About Us</CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    className="prose max-w-none text-gray-700"
                    dangerouslySetInnerHTML={{
                      __html: String(homepageContent!.aboutUs).replace(/\n/g, '<br />')
                    }}
                  />
                </CardContent>
              </Card>
            </div>
          </section>
        )}

        {!loading && String(homepageContent?.contactContent ?? '').trim() && (
          <section className="py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <Card className="bg-white border-gray-200">
                <CardHeader>
                  <CardTitle className="text-3xl font-bold text-gray-900">Contact Us</CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    className="prose max-w-none text-gray-700"
                    dangerouslySetInnerHTML={{
                      __html: String(homepageContent!.contactContent).replace(/\n/g, '<br />')
                    }}
                  />
                </CardContent>
              </Card>
            </div>
          </section>
        )}

        {!loading &&
          additionalSections.map((section: { title?: string; bodyHtml?: string }, i: number) => (
            <section key={i} className="py-16 bg-white">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <Card className="bg-white border-gray-200">
                  {section.title?.trim() && (
                    <CardHeader>
                      <CardTitle className="text-3xl font-bold text-gray-900">{section.title}</CardTitle>
                    </CardHeader>
                  )}
                  <CardContent>
                    <div
                      className="prose max-w-none text-gray-700"
                      dangerouslySetInnerHTML={{
                        __html: (section.bodyHtml || '').replace(/\n/g, '<br />')
                      }}
                    />
                  </CardContent>
                </Card>
              </div>
            </section>
          ))}
      </main>
      <Footer />
    </div>
  )
}
