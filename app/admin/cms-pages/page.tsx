'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AdminSidebar from '@/components/AdminSidebar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Plus, Edit, ExternalLink, Archive } from 'lucide-react'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import { cmsPagePath } from '@/lib/cms'

type CmsRow = {
  _id: string
  title: string
  slug: string
  published: boolean
  archived: boolean
  updatedAt: string
}

export default function AdminCmsPagesList() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [rows, setRows] = useState<CmsRow[]>([])
  const [loadingList, setLoadingList] = useState(true)

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.push('/')
    }
  }, [user, loading, router])

  const fetchPages = async () => {
    try {
      setLoadingList(true)
      const res = await api.get('/cms-pages/admin/all?includeArchived=true')
      setRows(res.data || [])
    } catch (e) {
      console.error(e)
      toast.error('Failed to load pages')
    } finally {
      setLoadingList(false)
    }
  }

  useEffect(() => {
    if (user?.role === 'admin') fetchPages()
  }, [user])

  const handleArchive = async (id: string, title: string) => {
    if (!confirm(`Archive “${title}”? It will be hidden from the site and menus. The record stays in the database.`)) return
    try {
      await api.patch(`/cms-pages/admin/${id}/archive`)
      toast.success('Page archived')
      fetchPages()
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to archive')
    }
  }

  if (loading || loadingList) {
    return (
      <div className="min-h-screen bg-white flex">
        <AdminSidebar />
        <div className="flex-1 p-8">
          <div className="animate-pulse h-8 bg-gray-100 rounded w-1/3 mb-8" />
          <div className="animate-pulse h-64 bg-gray-100 rounded" />
        </div>
      </div>
    )
  }

  if (!user || user.role !== 'admin') return null

  return (
    <div className="min-h-screen bg-white flex">
      <AdminSidebar />
      <div className="flex-1 p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Site pages (CMS)</h1>
            <p className="text-gray-600 mt-1">
              Create custom pages and add them to the header or footer from{' '}
              <Link href="/admin/settings" className="text-red-600 hover:underline">
                Settings → Menus &amp; footer
              </Link>
              .
            </p>
          </div>
          <Link href="/admin/cms-pages/new">
            <Button className="bg-red-600 text-white hover:bg-red-700">
              <Plus className="h-4 w-4 mr-2" />
              New page
            </Button>
          </Link>
        </div>

        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-900">All pages</CardTitle>
            <CardDescription className="text-gray-600">
              Public URL pattern: <code className="text-sm bg-gray-100 px-1 rounded">/p/your-slug</code>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Slug / URL</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-gray-500 py-12">
                      No pages yet. Create one to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((r) => (
                    <TableRow key={r._id}>
                      <TableCell className="font-medium text-gray-900">{r.title}</TableCell>
                      <TableCell>
                        <code className="text-sm text-gray-700">{cmsPagePath(r.slug)}</code>
                      </TableCell>
                      <TableCell>
                        {r.archived ? (
                          <Badge variant="secondary">Archived</Badge>
                        ) : r.published ? (
                          <Badge className="bg-green-600">Published</Badge>
                        ) : (
                          <Badge variant="outline">Draft</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        {!r.archived && r.published && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={cmsPagePath(r.slug)} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4 mr-1 inline" />
                              View
                            </a>
                          </Button>
                        )}
                        {!r.archived && (
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/admin/cms-pages/${r._id}/edit`}>
                              <Edit className="h-4 w-4 mr-1 inline" />
                              Edit
                            </Link>
                          </Button>
                        )}
                        {!r.archived && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-amber-800 border-amber-200"
                            onClick={() => handleArchive(r._id, r.title)}
                          >
                            <Archive className="h-4 w-4 mr-1" />
                            Archive
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
