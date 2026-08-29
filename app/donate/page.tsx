'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import { Heart, Loader2 } from 'lucide-react'

interface DonationFormConfig {
  title: string
  description: string
  thankYouMessage: string
  presetAmounts: number[]
  allowCustomAmount: boolean
  showPhone: boolean
  showFrequency: boolean
  enabled: boolean
}

const DEFAULT_CONFIG: DonationFormConfig = {
  title: 'Donate',
  description: 'Support our mission with a one-time or monthly donation.',
  thankYouMessage: 'Your donation request has been received. Our team will follow up with next steps.',
  presetAmounts: [25, 50, 100],
  allowCustomAmount: true,
  showPhone: true,
  showFrequency: true,
  enabled: true,
}

export default function DonatePage() {
  const [config, setConfig] = useState<DonationFormConfig>(DEFAULT_CONFIG)
  const [loadingConfig, setLoadingConfig] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [selectedAmount, setSelectedAmount] = useState<number | 'other'>(25)
  const [customAmount, setCustomAmount] = useState('')
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    donationFrequency: 'one-time',
  })

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/settings')
        const donationForm = { ...DEFAULT_CONFIG, ...(res.data.donationForm || {}) }
        if (!Array.isArray(donationForm.presetAmounts) || donationForm.presetAmounts.length === 0) {
          donationForm.presetAmounts = DEFAULT_CONFIG.presetAmounts
        }
        setConfig(donationForm)
        setSelectedAmount(donationForm.presetAmounts[0] ?? 25)
      } catch {
        // Keep defaults
      } finally {
        setLoadingConfig(false)
      }
    }
    load()
  }, [])

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const getDonationAmount = () => {
    if (selectedAmount === 'other') {
      return Number(customAmount)
    }
    return selectedAmount
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const amount = getDonationAmount()
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid donation amount')
      return
    }
    setSubmitting(true)
    try {
      await api.post('/form-submissions/donate', {
        ...form,
        donationFrequency: config.showFrequency ? form.donationFrequency : 'one-time',
        donationAmount: amount,
      })
      setSubmitted(true)
      toast.success('Thank you for your generosity!')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit donation')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        <Card className="border-gray-200">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Heart className="h-8 w-8 text-red-600" />
              <div>
                <CardTitle className="text-2xl text-gray-900">{config.title}</CardTitle>
                <CardDescription className="text-gray-600">{config.description}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loadingConfig ? (
              <div className="py-12 flex justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : !config.enabled ? (
              <p className="text-gray-600 py-8 text-center">
                Donations are temporarily unavailable. Please check back soon.
              </p>
            ) : submitted ? (
              <div className="text-center py-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Thank you!</h2>
                <p className="text-gray-600">{config.thankYouMessage}</p>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">First name *</label>
                    <Input
                      required
                      value={form.firstName}
                      onChange={(e) => handleChange('firstName', e.target.value)}
                      className="bg-white border-gray-300"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">Last name *</label>
                    <Input
                      required
                      value={form.lastName}
                      onChange={(e) => handleChange('lastName', e.target.value)}
                      className="bg-white border-gray-300"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Email *</label>
                  <Input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className="bg-white border-gray-300"
                  />
                </div>

                {config.showPhone && (
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">Phone</label>
                    <Input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      className="bg-white border-gray-300"
                    />
                  </div>
                )}

                {config.showFrequency && (
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">Frequency *</label>
                    <div className="flex gap-3">
                      {(['one-time', 'monthly'] as const).map((freq) => (
                        <button
                          key={freq}
                          type="button"
                          onClick={() => handleChange('donationFrequency', freq)}
                          className={`flex-1 px-4 py-2 rounded-md border text-sm font-medium ${
                            form.donationFrequency === freq
                              ? 'bg-red-600 text-white border-red-600'
                              : 'bg-white text-gray-900 border-gray-300'
                          }`}
                        >
                          {freq === 'one-time' ? 'One-time' : 'Monthly'}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Amount *</label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {config.presetAmounts.map((amount) => (
                      <button
                        key={amount}
                        type="button"
                        onClick={() => setSelectedAmount(amount)}
                        className={`px-4 py-2 rounded-md border text-sm font-medium ${
                          selectedAmount === amount
                            ? 'bg-red-600 text-white border-red-600'
                            : 'bg-white text-gray-900 border-gray-300'
                        }`}
                      >
                        ${amount}
                      </button>
                    ))}
                    {config.allowCustomAmount && (
                      <button
                        type="button"
                        onClick={() => setSelectedAmount('other')}
                        className={`px-4 py-2 rounded-md border text-sm font-medium ${
                          selectedAmount === 'other'
                            ? 'bg-red-600 text-white border-red-600'
                            : 'bg-white text-gray-900 border-gray-300'
                        }`}
                      >
                        Other
                      </button>
                    )}
                  </div>
                  {selectedAmount === 'other' && config.allowCustomAmount && (
                    <Input
                      type="number"
                      min={1}
                      step="0.01"
                      required
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      placeholder="Enter amount"
                      className="bg-white border-gray-300"
                    />
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-red-600 hover:bg-red-700 text-white"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting…
                    </>
                  ) : (
                    'Submit donation interest'
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  )
}
