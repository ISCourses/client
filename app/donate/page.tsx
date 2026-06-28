'use client'

import { useState } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import { Heart, Loader2 } from 'lucide-react'

const PRESET_AMOUNTS = [25, 50, 100]

export default function DonatePage() {
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [selectedAmount, setSelectedAmount] = useState<number | 'other'>(25)
  const [customAmount, setCustomAmount] = useState('')
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    donationFrequency: 'one-time'
  })

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
        donationAmount: amount
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
                <CardTitle className="text-2xl text-gray-900">Donate</CardTitle>
                <CardDescription className="text-gray-600">
                  Support our mission with a one-time or monthly donation.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {submitted ? (
              <div className="text-center py-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Thank you!</h2>
                <p className="text-gray-600">
                  Your donation request has been received. Our team will follow up with next steps.
                </p>
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
                  <label className="block text-sm font-medium text-gray-900 mb-2">Phone number</label>
                  <Input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    className="bg-white border-gray-300"
                  />
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

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-3">Donation frequency *</label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-gray-900 cursor-pointer">
                      <input
                        type="radio"
                        name="frequency"
                        value="one-time"
                        checked={form.donationFrequency === 'one-time'}
                        onChange={(e) => handleChange('donationFrequency', e.target.value)}
                        className="text-red-600"
                      />
                      This is a ONE time donation
                    </label>
                    <label className="flex items-center gap-2 text-gray-900 cursor-pointer">
                      <input
                        type="radio"
                        name="frequency"
                        value="monthly"
                        checked={form.donationFrequency === 'monthly'}
                        onChange={(e) => handleChange('donationFrequency', e.target.value)}
                        className="text-red-600"
                      />
                      This is a MONTHLY donation
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-3">Donation amount *</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                    {PRESET_AMOUNTS.map((amount) => (
                      <button
                        key={amount}
                        type="button"
                        onClick={() => setSelectedAmount(amount)}
                        className={`px-4 py-3 rounded-lg border text-center font-medium transition-colors ${
                          selectedAmount === amount
                            ? 'border-red-600 bg-red-50 text-red-700'
                            : 'border-gray-300 bg-white text-gray-900 hover:border-gray-400'
                        }`}
                      >
                        ${amount}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setSelectedAmount('other')}
                      className={`px-4 py-3 rounded-lg border text-center font-medium transition-colors ${
                        selectedAmount === 'other'
                          ? 'border-red-600 bg-red-50 text-red-700'
                          : 'border-gray-300 bg-white text-gray-900 hover:border-gray-400'
                      }`}
                    >
                      Other
                    </button>
                  </div>
                  {selectedAmount === 'other' && (
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                      <Input
                        type="number"
                        min="1"
                        step="0.01"
                        required
                        value={customAmount}
                        onChange={(e) => setCustomAmount(e.target.value)}
                        placeholder="Enter amount"
                        className="bg-white border-gray-300 pl-7"
                      />
                    </div>
                  )}
                </div>

                <Button type="submit" disabled={submitting} className="w-full bg-red-600 hover:bg-red-700 text-white">
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting…
                    </>
                  ) : (
                    'Submit donation'
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
