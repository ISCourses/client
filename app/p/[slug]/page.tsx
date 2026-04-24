'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { Button } from '@/components/ui/button'
import api from '@/lib/api'

type CmsPage = {
  title: string
  slug: string
  bodyHtml: string
  metaDescription?: string
}

export default function CmsPublicPage() {
  const params = useParams()
  const slug = typeof params?.slug === 'string' ? params.slug : ''
  const [page, setPage] = useState<CmsPage | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!slug) {
      setLoading(false)
      setNotFound(true)
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const res = await api.get(`/cms-pages/public/slug/${encodeURIComponent(slug)}`)
        if (!cancelled) setPage(res.data)
      } catch {
        if (!cancelled) setNotFound(true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [slug])

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Navbar />
        <main className="flex-1 max-w-4xl mx-auto px-4 py-16 w-full">
          <div className="animate-pulse space-y-4">
            <div className="h-10 w-2/3 max-w-md rounded-lg bg-gray-200" />
            <div className="h-4 w-full rounded bg-gray-100" />
            <div className="h-4 w-full rounded bg-gray-100" />
            <div className="h-4 w-4/5 rounded bg-gray-100" />
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (notFound || !page) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Navbar />
        <main className="flex-1 max-w-4xl mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Page not found</h1>
          <p className="text-gray-600 mb-8">This page does not exist or is not published.</p>
          <Button asChild className="bg-red-600 hover:bg-red-700">
            <Link href="/">Back to home</Link>
          </Button>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        <article>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">{page.title}</h1>
          <div
            className="prose prose-lg max-w-none text-gray-800"
            dangerouslySetInnerHTML={{ __html: page.bodyHtml || '<p></p>' }}
          />
        </article>
      </main>
      <Footer />
    </div>
  )
}
