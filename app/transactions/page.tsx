'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import { Receipt, Calendar, DollarSign, CheckCircle, XCircle, Clock, BookOpen, ExternalLink } from 'lucide-react'
import Link from 'next/link'

interface Transaction {
  _id: string
  course: {
    _id: string
    title: string
    thumbnail?: string
    price: number
  }
  type: string
  paymentProvider: string
  amount: number
  currency: string
  status: 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled'
  paymentDetails: {
    transactionId?: string
    orderId?: string
    paidAt?: string
  }
  createdAt: string
}

export default function TransactionsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user && !authLoading) {
      fetchTransactions()
    }
  }, [user, authLoading, page])

  const fetchTransactions = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/transactions/my-transactions?page=${page}&limit=10`)
      setTransactions(response.data.transactions)
      setTotalPages(response.data.pagination.pages)
    } catch (error: any) {
      console.error('Error fetching transactions:', error)
      if (error.response?.status !== 401) {
        toast.error('Failed to load transactions')
      }
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-600" />
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-600" />
      case 'refunded':
        return <Receipt className="h-5 w-5 text-blue-600" />
      default:
        return <Clock className="h-5 w-5 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'refunded':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatAmount = (amount: number, currency: string) => {
    const symbol = currency === 'USD' ? '$' : currency
    return `${symbol}${amount.toFixed(2)}`
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-8"></div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">My Transactions</h1>
              <p className="text-gray-600">View your payment history and receipts</p>
            </div>
            <Link href="/profile">
              <Button variant="outline">
                Back to Profile
              </Button>
            </Link>
          </div>
        </div>

        {transactions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Receipt className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No transactions yet</h3>
              <p className="text-gray-600 mb-4">You haven't made any payments yet.</p>
              <Link href="/courses">
                <Button className="bg-red-600 text-white hover:bg-red-700">
                  Browse Courses
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {transactions.map((transaction) => (
              <Card key={transaction._id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        {getStatusIcon(transaction.status)}
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {transaction.course.title}
                          </h3>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                            {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          <span className="font-medium text-gray-900">
                            {formatAmount(transaction.amount, transaction.currency)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(transaction.createdAt)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Receipt className="h-4 w-4" />
                          <span className="uppercase">{transaction.paymentProvider}</span>
                        </div>
                      </div>

                      {transaction.paymentDetails?.transactionId && (
                        <div className="mt-3 text-xs text-gray-500">
                          Transaction ID: {transaction.paymentDetails.transactionId}
                        </div>
                      )}
                    </div>

                    <div className="ml-4 flex flex-col gap-2">
                      <Link href={`/courses/${transaction.course._id}`}>
                        <Button variant="outline" size="sm" className="w-full">
                          <BookOpen className="h-4 w-4 mr-2" />
                          View Course
                        </Button>
                      </Link>
                      {transaction.status === 'completed' && (
                        <Link href={`/courses/${transaction.course._id}/learn`}>
                          <Button size="sm" className="w-full bg-red-600 text-white hover:bg-red-700">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Learn
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8">
                <Button
                  variant="outline"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-600">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}



