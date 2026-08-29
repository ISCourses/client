'use client'

import { Suspense, useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, Loader2, XCircle } from 'lucide-react'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import { useAuth } from '@/contexts/AuthContext'

function PaymentSuccessContent() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user, loading: authLoading, refreshUser } = useAuth()
  const courseId = params.id as string
  const sessionId = searchParams.get('session_id')

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('Confirming your payment…')

  useEffect(() => {
    if (authLoading) return

    if (!user) {
      const redirect = encodeURIComponent(
        `/courses/${courseId}/payment-success?session_id=${sessionId || ''}`
      )
      router.push(`/login?redirect=${redirect}`)
      return
    }

    if (!sessionId) {
      setStatus('error')
      setMessage('Missing payment session. If you were charged, contact support with your receipt.')
      return
    }

    let cancelled = false

    const confirm = async () => {
      try {
        await api.post('/payments/stripe/confirm-session', {
          sessionId,
          courseId,
        })
        if (cancelled) return
        await refreshUser()
        setStatus('success')
        setMessage('Payment successful! You are enrolled in this course.')
        toast.success('Enrolled successfully')
      } catch (error: any) {
        if (cancelled) return
        console.error(error)
        setStatus('error')
        setMessage(
          error.response?.data?.message ||
            'Could not confirm payment. If you were charged, contact support.'
        )
        toast.error(error.response?.data?.message || 'Payment confirmation failed')
      }
    }

    confirm()
    return () => {
      cancelled = true
    }
  }, [authLoading, user, sessionId, courseId, router, refreshUser])

  return (
    <Card className="max-w-md w-full border-gray-200">
      <CardHeader className="text-center">
        <CardTitle className="text-gray-900">Course payment</CardTitle>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        {status === 'loading' && (
          <>
            <Loader2 className="h-12 w-12 animate-spin text-red-600 mx-auto" />
            <p className="text-gray-600">{message}</p>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto" />
            <p className="text-gray-900 font-medium">{message}</p>
            <Link href={`/courses/${courseId}/learn`}>
              <Button className="w-full bg-red-600 hover:bg-red-700 text-white">
                Start learning
              </Button>
            </Link>
          </>
        )}
        {status === 'error' && (
          <>
            <XCircle className="h-12 w-12 text-red-600 mx-auto" />
            <p className="text-gray-600">{message}</p>
            <Link href={`/courses/${courseId}`}>
              <Button variant="outline" className="w-full border-gray-300">
                Back to course
              </Button>
            </Link>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default function CoursePaymentSuccessPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <Suspense
          fallback={
            <div className="flex items-center gap-2 text-gray-600">
              <Loader2 className="h-6 w-6 animate-spin" />
              Loading…
            </div>
          }
        >
          <PaymentSuccessContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  )
}
