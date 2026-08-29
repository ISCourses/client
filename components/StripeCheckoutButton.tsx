'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { CreditCard, Loader2 } from 'lucide-react'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

interface StripeCheckoutButtonProps {
  courseId: string
  amount: number
  className?: string
}

export default function StripeCheckoutButton({
  courseId,
  amount,
  className = '',
}: StripeCheckoutButtonProps) {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const startCheckout = async () => {
    if (!user) {
      toast.error('Please login to enroll')
      router.push('/login')
      return
    }

    setLoading(true)
    try {
      const response = await api.post('/payments/stripe/create-checkout-session', {
        courseId,
      })
      const url = response.data.url
      if (!url) {
        throw new Error('No checkout URL returned')
      }
      window.location.href = url
    } catch (error: any) {
      console.error('Stripe checkout error:', error)
      toast.error(
        error.response?.data?.message ||
          'Unable to start card payment. Check Stripe keys in Admin Settings.'
      )
      setLoading(false)
    }
  }

  return (
    <Button
      type="button"
      onClick={startCheckout}
      disabled={loading || !amount}
      className={`w-full bg-red-600 hover:bg-red-700 text-white ${className}`}
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Redirecting to Stripe…
        </>
      ) : (
        <>
          <CreditCard className="h-4 w-4 mr-2" />
          Pay ${amount.toFixed(2)} with card
        </>
      )}
    </Button>
  )
}
