'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AdminSidebar from '@/components/AdminSidebar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import { ArrowLeft, Save, Loader2, ExternalLink } from 'lucide-react'

interface DonationFormSettings {
  title: string
  description: string
  thankYouMessage: string
  presetAmounts: number[]
  allowCustomAmount: boolean
  showPhone: boolean
  showFrequency: boolean
  enabled: boolean
}

const DEFAULTS: DonationFormSettings = {
  title: 'Donate',
  description: 'Support our mission with a one-time or monthly donation.',
  thankYouMessage: 'Your donation request has been received. Our team will follow up with next steps.',
  presetAmounts: [25, 50, 100],
  allowCustomAmount: true,
  showPhone: true,
  showFrequency: true,
  enabled: true,
}

export default function DonationFormSettingsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [form, setForm] = useState<DonationFormSettings>(DEFAULTS)
  const [loadingData, setLoadingData] = useState(true)
  const [saving, setSaving] = useState(false)
  const [amountsText, setAmountsText] = useState('25, 50, 100')

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.push('/')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchSettings()
    }
  }, [user])

  const fetchSettings = async () => {
    try {
      setLoadingData(true)
      const response = await api.get('/settings/admin/all')
      const donationForm = { ...DEFAULTS, ...(response.data.donationForm || {}) }
      if (!Array.isArray(donationForm.presetAmounts) || donationForm.presetAmounts.length === 0) {
        donationForm.presetAmounts = DEFAULTS.presetAmounts
      }
      setForm(donationForm)
      setAmountsText(donationForm.presetAmounts.join(', '))
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load donation form settings')
    } finally {
      setLoadingData(false)
    }
  }

  const parseAmounts = (text: string) =>
    text
      .split(',')
      .map((part) => Number(part.trim()))
      .filter((n) => !Number.isNaN(n) && n > 0)

  const onSave = async () => {
    const presetAmounts = parseAmounts(amountsText)
    if (presetAmounts.length === 0 && !form.allowCustomAmount) {
      toast.error('Add at least one preset amount, or allow a custom amount')
      return
    }
    if (!form.title.trim()) {
      toast.error('Title is required')
      return
    }

    setSaving(true)
    try {
      await api.put('/settings', {
        donationForm: {
          ...form,
          title: form.title.trim(),
          description: form.description.trim(),
          thankYouMessage: form.thankYouMessage.trim(),
          presetAmounts: presetAmounts.length ? presetAmounts : DEFAULTS.presetAmounts,
        },
      })
      toast.success('Donation form saved')
      setForm((prev) => ({
        ...prev,
        presetAmounts: presetAmounts.length ? presetAmounts : DEFAULTS.presetAmounts,
      }))
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  if (loading || loadingData) {
    return (
      <div className="min-h-screen bg-white flex">
        <AdminSidebar />
        <div className="flex-1 p-8">
          <div className="animate-pulse h-96 bg-gray-100 rounded" />
        </div>
      </div>
    )
  }

  if (!user || user.role !== 'admin') return null

  return (
    <div className="min-h-screen bg-white flex">
      <AdminSidebar />
      <div className="flex-1 p-8 max-w-3xl">
        <div className="mb-8">
          <Link href="/admin/form-submissions">
            <Button variant="outline" className="mb-4 bg-white border-gray-300 text-gray-900">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to form submissions
            </Button>
          </Link>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Donation form</h1>
              <p className="text-gray-600 mt-1">
                Edit the public donate page. Submissions appear under Form submissions → Donate.
              </p>
            </div>
            <Link href="/donate" target="_blank">
              <Button variant="outline" className="border-gray-300 text-gray-900">
                <ExternalLink className="h-4 w-4 mr-2" />
                View page
              </Button>
            </Link>
          </div>
        </div>

        <Card className="border-gray-200 mb-6">
          <CardHeader>
            <CardTitle className="text-gray-900">Form content</CardTitle>
            <CardDescription className="text-gray-600">
              Title, intro text, and thank-you message shown on /donate
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="flex items-center gap-2 text-sm text-gray-900">
              <input
                type="checkbox"
                checked={form.enabled}
                onChange={(e) => setForm((prev) => ({ ...prev, enabled: e.target.checked }))}
                className="rounded border-gray-300"
              />
              Donation form enabled
            </label>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Title</label>
              <Input
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                className="bg-white border-gray-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Thank-you message</label>
              <textarea
                value={form.thankYouMessage}
                onChange={(e) => setForm((prev) => ({ ...prev, thankYouMessage: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-900"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 mb-6">
          <CardHeader>
            <CardTitle className="text-gray-900">Amounts & fields</CardTitle>
            <CardDescription className="text-gray-600">
              Preset donation amounts and which fields appear on the form
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Preset amounts (comma-separated)
              </label>
              <Input
                value={amountsText}
                onChange={(e) => setAmountsText(e.target.value)}
                placeholder="25, 50, 100"
                className="bg-white border-gray-300"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-900">
              <input
                type="checkbox"
                checked={form.allowCustomAmount}
                onChange={(e) => setForm((prev) => ({ ...prev, allowCustomAmount: e.target.checked }))}
                className="rounded border-gray-300"
              />
              Allow custom amount
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-900">
              <input
                type="checkbox"
                checked={form.showFrequency}
                onChange={(e) => setForm((prev) => ({ ...prev, showFrequency: e.target.checked }))}
                className="rounded border-gray-300"
              />
              Show one-time / monthly frequency
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-900">
              <input
                type="checkbox"
                checked={form.showPhone}
                onChange={(e) => setForm((prev) => ({ ...prev, showPhone: e.target.checked }))}
                className="rounded border-gray-300"
              />
              Show phone field
            </label>
            <p className="text-xs text-gray-500">
              Name and email are always required. This form currently collects donation interest —
              card payment via Stripe is not wired to this page yet.
            </p>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={onSave} disabled={saving} className="bg-red-600 text-white hover:bg-red-700">
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save donation form
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
