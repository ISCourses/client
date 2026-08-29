'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import AdminSidebar from '@/components/AdminSidebar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import { Trash2, Mail, Heart } from 'lucide-react'
import Link from 'next/link'

interface FormSubmission {
  _id: string
  type: 'contact' | 'donate'
  firstName: string
  lastName: string
  phone: string
  email: string
  message?: string
  donationFrequency?: string
  donationAmount?: number
  read: boolean
  createdAt: string
}

export default function FormSubmissionsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [submissions, setSubmissions] = useState<FormSubmission[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [tab, setTab] = useState<'contact' | 'donate'>('contact')

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.push('/')
    }
  }, [user, loading, router])

  const fetchSubmissions = async () => {
    try {
      setLoadingData(true)
      const res = await api.get('/form-submissions/admin/all')
      setSubmissions(res.data)
    } catch {
      toast.error('Failed to load submissions')
    } finally {
      setLoadingData(false)
    }
  }

  useEffect(() => {
    if (user?.role === 'admin') fetchSubmissions()
  }, [user])

  const markRead = async (id: string) => {
    try {
      await api.patch(`/form-submissions/admin/${id}/read`)
      setSubmissions((prev) => prev.map((s) => (s._id === id ? { ...s, read: true } : s)))
    } catch {
      toast.error('Failed to update')
    }
  }

  const deleteSubmission = async (id: string) => {
    if (!confirm('Delete this submission?')) return
    try {
      await api.delete(`/form-submissions/admin/${id}`)
      setSubmissions((prev) => prev.filter((s) => s._id !== id))
      toast.success('Deleted')
    } catch {
      toast.error('Failed to delete')
    }
  }

  const filtered = submissions.filter((s) => s.type === tab)

  if (loading || loadingData) {
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
      <div className="flex-1 p-8">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Form submissions</h1>
            <p className="text-gray-600">View contact and donation form responses</p>
          </div>
          <Link href="/admin/settings/donation-form">
            <Button variant="outline" className="border-gray-300 text-gray-900">
              Edit donation form
            </Button>
          </Link>
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as 'contact' | 'donate')}>
          <TabsList className="mb-6">
            <TabsTrigger value="contact" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Contact ({submissions.filter((s) => s.type === 'contact').length})
            </TabsTrigger>
            <TabsTrigger value="donate" className="flex items-center gap-2">
              <Heart className="h-4 w-4" />
              Donate ({submissions.filter((s) => s.type === 'donate').length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={tab}>
            {filtered.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-gray-500">No submissions yet.</CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filtered.map((s) => (
                  <Card key={s._id} className={!s.read ? 'border-red-200 bg-red-50/30' : ''}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg text-gray-900">
                            {s.firstName} {s.lastName}
                          </CardTitle>
                          <CardDescription>
                            {s.email}
                            {s.phone && ` · ${s.phone}`}
                            {' · '}
                            {new Date(s.createdAt).toLocaleString()}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          {!s.read && <Badge className="bg-red-600">New</Badge>}
                          {!s.read && (
                            <Button size="sm" variant="outline" onClick={() => markRead(s._id)}>
                              Mark read
                            </Button>
                          )}
                          <Button size="sm" variant="outline" className="text-red-600" onClick={() => deleteSubmission(s._id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {s.type === 'contact' && s.message && (
                        <p className="text-gray-700 whitespace-pre-wrap">{s.message}</p>
                      )}
                      {s.type === 'donate' && (
                        <div className="text-gray-700 space-y-1">
                          <p>
                            <strong>Frequency:</strong>{' '}
                            {s.donationFrequency === 'monthly' ? 'Monthly donation' : 'One-time donation'}
                          </p>
                          <p>
                            <strong>Amount:</strong> ${s.donationAmount?.toFixed(2)}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
