'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
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

export default function NewCmsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
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

  const syncSlugFromTitle = () => {
    if (!slugTouched && title.trim()) {
      setSlug(normalizeCmsSlug(title))
    }
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const s = normalizeCmsSlug(slug || title)
    if (!title.trim()) {
      toast.error('Title is required')
      return
    }
    if (!s) {
      toast.error('Enter a valid URL slug (letters, numbers, hyphens)')
      return
    }
    setSubmitting(true)
    try {
      await api.post('/cms-pages/admin', {
        title: title.trim(),
        slug: s,
        bodyHtml,
        metaDescription,
        published
      })
      toast.success('Page created')
      router.push('/admin/cms-pages')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create page')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex">
        <AdminSidebar />
        <div className="flex-1 p-8 animate-pulse h-96 bg-gray-100 rounded m-8" />
      </div>
    )
  }

  if (!user || user.role !== 'admin') return null

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
          <h1 className="text-3xl font-bold text-gray-900">New site page</h1>
          <p className="text-gray-600 mt-1">
            Page will be available at{' '}
            <span className="font-mono text-sm">{slug ? cmsPagePath(slug) : '/p/your-slug'}</span>
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-6">
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-gray-900">Details</CardTitle>
              <CardDescription className="text-gray-600">
                Slug is used in the URL. You can add the page to menus in Settings after publishing.
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
                  placeholder="About our institute"
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
                  placeholder="about-our-institute"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Meta description (optional)</label>
                <Input
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  className="bg-white border-gray-300"
                  placeholder="Short summary for search engines"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-900">
                <input
                  type="checkbox"
                  checked={published}
                  onChange={(e) => setPublished(e.target.checked)}
                  className="rounded border-gray-300"
                />
                Published (visible on the website)
              </label>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-gray-900">Page content</CardTitle>
              <CardDescription className="text-gray-600">
                Use the toolbar for headings, lists, links, and formatting. Content is saved as HTML for the public page.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CmsHtmlEditor
                value={bodyHtml}
                onChange={setBodyHtml}
                placeholder="Start writing your page…"
              />
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
                  Create page
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
