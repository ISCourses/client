'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import AdminSidebar from '@/components/AdminSidebar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import { cmsPagePath, normalizeCmsSlug } from '@/lib/cms'
import CmsHtmlEditor from '@/components/admin/CmsHtmlEditor'

type CmsPage = {
  _id: string
  title: string
  slug: string
  bodyHtml: string
  metaDescription: string
  published: boolean
  archived: boolean
}

export default function EditCmsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const id = typeof params?.id === 'string' ? params.id : ''

  const [loadingPage, setLoadingPage] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [page, setPage] = useState<CmsPage | null>(null)
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  const [bodyHtml, setBodyHtml] = useState('')
  const [metaDescription, setMetaDescription] = useState('')
  const [published, setPublished] = useState(false)

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.push('/')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (!id || user?.role !== 'admin') return
    let cancelled = false
    ;(async () => {
      try {
        const res = await api.get(`/cms-pages/admin/${id}`)
        if (cancelled) return
        const p = res.data as CmsPage
        setPage(p)
        setTitle(p.title)
        setSlug(p.slug)
        setSlugTouched(true)
        setBodyHtml(p.bodyHtml || '')
        setMetaDescription(p.metaDescription || '')
        setPublished(!!p.published)
      } catch {
        toast.error('Page not found')
        router.push('/admin/cms-pages')
      } finally {
        if (!cancelled) setLoadingPage(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [id, user, router])

  const syncSlugFromTitle = () => {
    if (!slugTouched && title.trim() && page) {
      setSlug(normalizeCmsSlug(title))
    }
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id) return
    const s = normalizeCmsSlug(slug || title)
    if (!title.trim()) {
      toast.error('Title is required')
      return
    }
    if (!s) {
      toast.error('Enter a valid URL slug')
      return
    }
    setSubmitting(true)
    try {
      await api.put(`/cms-pages/admin/${id}`, {
        title: title.trim(),
        slug: s,
        bodyHtml,
        metaDescription,
        published
      })
      toast.success('Page saved')
      router.push('/admin/cms-pages')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading || loadingPage) {
    return (
      <div className="min-h-screen bg-white flex">
        <AdminSidebar />
        <div className="flex-1 p-8 animate-pulse h-96 bg-gray-100 rounded m-8" />
      </div>
    )
  }

  if (!user || user.role !== 'admin' || !page) return null

  if (page.archived) {
    return (
      <div className="min-h-screen bg-white flex">
        <AdminSidebar />
        <div className="flex-1 p-8">
          <p className="text-gray-700 mb-4">This page is archived and cannot be edited.</p>
          <Link href="/admin/cms-pages">
            <Button variant="outline">Back</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex">
      <AdminSidebar />
      <div className="flex-1 p-8 max-w-4xl">
        <div className="mb-8">
          <Link href="/admin/cms-pages">
            <Button variant="outline" className="mb-4 bg-white border-gray-300 text-gray-900">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to pages
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Edit page</h1>
          <p className="text-gray-600 mt-1 font-mono text-sm">
            {cmsPagePath(slug || page.slug)}
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-6">
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-gray-900">Details</CardTitle>
              <CardDescription className="text-gray-600">
                Changing the slug updates the public URL. Update any menu links that pointed to the old URL.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Title</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={syncSlugFromTitle}
                  className="bg-white border-gray-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">URL slug</label>
                <Input
                  value={slug}
                  onChange={(e) => {
                    setSlugTouched(true)
                    setSlug(normalizeCmsSlug(e.target.value))
                  }}
                  className="bg-white border-gray-300 font-mono text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Meta description</label>
                <Input
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  className="bg-white border-gray-300"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-900">
                <input
                  type="checkbox"
                  checked={published}
                  onChange={(e) => setPublished(e.target.checked)}
                  className="rounded border-gray-300"
                />
                Published
              </label>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-gray-900">Page content</CardTitle>
              <CardDescription className="text-gray-600">
                Rich editor — headings, lists, links, and formatting. Saved as HTML.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CmsHtmlEditor value={bodyHtml} onChange={setBodyHtml} placeholder="Page body…" />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Link href="/admin/cms-pages">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={submitting} className="bg-red-600 text-white hover:bg-red-700">
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save changes
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
