'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AdminSidebar from '@/components/AdminSidebar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import api from '@/lib/api'
import toast from 'react-hot-toast'

interface RegistrationField {
  name: string
  label: string
  enabled?: boolean
}

interface UserWithFields {
  _id: string
  name: string
  email: string
  additionalFields?: Record<string, unknown>
  createdAt: string
}

export default function RegistrationResponsesPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [users, setUsers] = useState<UserWithFields[]>([])
  const [fields, setFields] = useState<RegistrationField[]>([])
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.push('/')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user?.role !== 'admin') return
    ;(async () => {
      try {
        setLoadingData(true)
        const [usersRes, settingsRes] = await Promise.all([
          api.get('/users'),
          api.get('/settings/admin/all')
        ])
        const allUsers = usersRes.data as UserWithFields[]
        const withFields = allUsers.filter(
          (u) => u.additionalFields && Object.keys(u.additionalFields).length > 0
        )
        setUsers(withFields)
        const regFields = (settingsRes.data.registrationFormFields || []).filter(
          (f: RegistrationField) => f.enabled !== false
        )
        setFields(regFields)
      } catch {
        toast.error('Failed to load registration responses')
      } finally {
        setLoadingData(false)
      }
    })()
  }, [user])

  const getFieldLabel = (name: string) => {
    const field = fields.find((f) => f.name === name)
    return field?.label || name
  }

  const formatValue = (value: unknown) => {
    if (Array.isArray(value)) return value.join(', ')
    if (typeof value === 'boolean') return value ? 'Yes' : 'No'
    return String(value ?? '—')
  }

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
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Registration responses</h1>
            <p className="text-gray-600">Custom sign-up question answers from registered users</p>
          </div>
          <Link href="/admin/settings/registration-form">
            <Button variant="outline">Edit registration form</Button>
          </Link>
        </div>

        {users.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              No registration responses yet. Custom fields are configured in Settings → Registration form.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {users.map((u) => (
              <Card key={u._id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg text-gray-900">{u.name}</CardTitle>
                  <CardDescription>
                    {u.email} · Registered {new Date(u.createdAt).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {Object.entries(u.additionalFields || {}).map(([key, value]) => (
                      <div key={key} className="bg-gray-50 rounded-lg p-3">
                        <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                          {getFieldLabel(key)}
                        </dt>
                        <dd className="text-gray-900 mt-1">{formatValue(value)}</dd>
                      </div>
                    ))}
                  </dl>
                  <div className="mt-4">
                    <Link href={`/admin/users/${u._id}`}>
                      <Button size="sm" variant="outline">
                        View full profile
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
