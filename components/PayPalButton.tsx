'use client'

import { useEffect, useState } from 'react'
import { PayPalScriptProvider, PayPalButtons, usePayPalScriptReducer } from '@paypal/react-paypal-js'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import toast from 'react-hot-toast'

interface PayPalButtonProps {
  courseId: string
  amount: number
  currency?: string
  onSuccess?: () => void
}

function PayPalButtonComponent({ courseId, amount, currency = 'USD', onSuccess }: PayPalButtonProps) {
  const router = useRouter()
  const [{ isPending }] = usePayPalScriptReducer()
  const [orderId, setOrderId] = useState<string | null>(null)

  const createOrder = async () => {
    try {
      const response = await api.post('/payments/paypal/create-order', {
        courseId
      })
      setOrderId(response.data.orderId)
      return response.data.orderId
    } catch (error: any) {
      console.error('Failed to create PayPal order:', error)
      toast.error(error.response?.data?.message || 'Failed to create payment order')
      throw error
    }
  }

  const onApprove = async (data: any) => {
    try {
      // Capture the payment
      const response = await api.post('/payments/paypal/capture', {
        orderId: data.orderID,
        courseId
      })

      toast.success('Payment successful! You are now enrolled in the course.')
      
      if (onSuccess) {
        onSuccess()
      } else {
        // Redirect to learn page
        router.push(`/courses/${courseId}/learn`)
      }
    } catch (error: any) {
      console.error('Payment capture error:', error)
      toast.error(error.response?.data?.message || 'Payment failed. Please try again.')
    }
  }

  const onError = (err: any) => {
    console.error('PayPal error:', err)
    toast.error('An error occurred with PayPal. Please try again.')
  }

  const onCancel = () => {
    toast.error('Payment was cancelled.')
  }

  if (isPending) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
        <span className="ml-2 text-gray-600">Loading PayPal...</span>
      </div>
    )
  }

  return (
    <PayPalButtons
      createOrder={createOrder}
      onApprove={onApprove}
      onError={onError}
      onCancel={onCancel}
      style={{
        layout: 'vertical',
        color: 'gold',
        shape: 'rect',
        label: 'paypal'
      }}
    />
  )
}

export default function PayPalButton({ courseId, amount, currency = 'USD', onSuccess }: PayPalButtonProps) {
  const [paypalClientId, setPaypalClientId] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch PayPal Client ID from public settings
    const fetchPayPalClientId = async () => {
      try {
        const response = await api.get('/settings/')
        const clientId = response.data.paymentSettings?.paypalClientId
        console.log('PayPal Client ID from settings:', clientId ? 'Found' : 'Not found')
        if (clientId && clientId.trim()) {
          setPaypalClientId(clientId)
        } else {
          console.warn('PayPal Client ID not found in settings. Please configure it in Admin Settings → Payment Settings or set PAYPAL_CLIENT_ID environment variable.')
        }
      } catch (error) {
        console.error('Failed to fetch PayPal settings:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPayPalClientId()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    )
  }

  if (!paypalClientId) {
    return (
      <div className="text-center py-4 space-y-2">
        <p className="text-red-600 text-sm font-medium">PayPal payment is not available.</p>
        <p className="text-gray-600 text-xs">
          Please configure PayPal Client ID in Admin Settings → Payment Settings, or set PAYPAL_CLIENT_ID environment variable.
        </p>
      </div>
    )
  }

  return (
    <PayPalScriptProvider
      options={{
        clientId: paypalClientId,
        currency: currency,
        intent: 'capture'
      }}
    >
      <PayPalButtonComponent
        courseId={courseId}
        amount={amount}
        currency={currency}
        onSuccess={onSuccess}
      />
    </PayPalScriptProvider>
  )
}

