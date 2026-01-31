'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import AdminSidebar from '@/components/AdminSidebar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import { Receipt, DollarSign, TrendingUp, Users, Filter, Search, Download, Eye, Calendar, X, User, BookOpen, CreditCard, Clock } from 'lucide-react'
import Link from 'next/link'

interface Transaction {
  _id: string
  user: {
    _id: string
    name: string
    email: string
  }
  course: {
    _id: string
    title: string
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

interface Stats {
  totalRevenue: number
  totalTransactions: number
  completedTransactions: number
  failedTransactions: number
}

export default function AdminTransactionsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [stats, setStats] = useState<Stats>({
    totalRevenue: 0,
    totalTransactions: 0,
    completedTransactions: 0,
    failedTransactions: 0
  })
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [filters, setFilters] = useState({
    status: '',
    paymentProvider: '',
    search: ''
  })
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [loadingDetails, setLoadingDetails] = useState(false)

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user && user.role === 'admin' && !authLoading) {
      fetchTransactions()
    }
  }, [user, authLoading, page, filters])

  const fetchTransactions = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20'
      })
      
      if (filters.status) params.append('status', filters.status)
      if (filters.paymentProvider) params.append('paymentProvider', filters.paymentProvider)

      const response = await api.get(`/transactions/admin/all?${params.toString()}`)
      setTransactions(response.data.transactions)
      setStats(response.data.stats)
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
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatAmount = (amount: number, currency: string) => {
    const symbol = currency === 'USD' ? '$' : currency
    return `${symbol}${amount.toFixed(2)}`
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPage(1) // Reset to first page when filter changes
  }

  const handleViewDetails = async (transactionId: string) => {
    try {
      setLoadingDetails(true)
      const response = await api.get(`/transactions/${transactionId}`)
      setSelectedTransaction(response.data)
    } catch (error: any) {
      console.error('Error fetching transaction details:', error)
      toast.error('Failed to load transaction details')
    } finally {
      setLoadingDetails(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-white flex">
        <AdminSidebar />
        <div className="flex-1 p-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex">
      <AdminSidebar />
      
      <div className="flex-1 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Transactions</h1>
          <p className="text-gray-600">Manage and view all payment transactions</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${stats.totalRevenue.toFixed(2)}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Transactions</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.totalTransactions}
                  </p>
                </div>
                <Receipt className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Completed</p>
                  <p className="text-2xl font-bold text-green-600">
                    {stats.completedTransactions}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Failed</p>
                  <p className="text-2xl font-bold text-red-600">
                    {stats.failedTransactions}
                  </p>
                </div>
                <Users className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900"
                >
                  <option value="">All Status</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                  <option value="refunded">Refunded</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Provider
                </label>
                <select
                  value={filters.paymentProvider}
                  onChange={(e) => handleFilterChange('paymentProvider', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900"
                >
                  <option value="">All Providers</option>
                  <option value="paypal">PayPal</option>
                  <option value="stripe">Stripe</option>
                  <option value="free">Free</option>
                </select>
              </div>

              <div className="flex items-end">
                <Button
                  onClick={() => {
                    setFilters({ status: '', paymentProvider: '', search: '' })
                    setPage(1)
                  }}
                  variant="outline"
                  className="w-full"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transactions Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <div className="text-center py-12">
                <Receipt className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No transactions found</h3>
                <p className="text-gray-600">No transactions match your filters.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Date</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">User</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Course</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Amount</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Provider</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Transaction ID</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((transaction) => (
                      <tr key={transaction._id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {formatDate(transaction.createdAt)}
                        </td>
                        <td className="py-3 px-4 text-sm">
                          <div>
                            <p className="font-medium text-gray-900">{transaction.user.name}</p>
                            <p className="text-gray-500 text-xs">{transaction.user.email}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm">
                          <Link 
                            href={`/courses/${transaction.course._id}`}
                            className="text-red-600 hover:underline"
                          >
                            {transaction.course.title}
                          </Link>
                        </td>
                        <td className="py-3 px-4 text-sm font-semibold text-gray-900">
                          {formatAmount(transaction.amount, transaction.currency)}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600 uppercase">
                          {transaction.paymentProvider}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                            {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-500 font-mono text-xs">
                          {transaction.paymentDetails?.transactionId || 'N/A'}
                        </td>
                        <td className="py-3 px-4">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleViewDetails(transaction._id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-6">
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
          </CardContent>
        </Card>
      </div>

      {/* Transaction Details Modal */}
      {selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
            <CardHeader className="flex flex-row items-center justify-between border-b">
              <CardTitle className="text-xl">Transaction Details</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedTransaction(null)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {loadingDetails ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                </div>
              ) : (
                <>
                  {/* Transaction Status */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Transaction Status</h3>
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedTransaction.status)}`}>
                        {selectedTransaction.status.charAt(0).toUpperCase() + selectedTransaction.status.slice(1)}
                      </span>
                      <span className="text-sm text-gray-600">
                        {formatDate(selectedTransaction.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* User Information */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <User className="h-4 w-4" />
                      User Information
                    </h3>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                      <div>
                        <p className="text-xs text-gray-500">Name</p>
                        <p className="text-sm font-medium text-gray-900">{selectedTransaction.user.name}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Email</p>
                        <p className="text-sm text-gray-900">{selectedTransaction.user.email}</p>
                      </div>
                      <div>
                        <Link 
                          href={`/admin/users/${selectedTransaction.user._id}`}
                          className="text-sm text-red-600 hover:underline"
                        >
                          View User Profile →
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* Course Information */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      Course Information
                    </h3>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                      <div>
                        <p className="text-xs text-gray-500">Course Title</p>
                        <p className="text-sm font-medium text-gray-900">{selectedTransaction.course.title}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Course Price</p>
                        <p className="text-sm text-gray-900">{formatAmount(selectedTransaction.course.price, selectedTransaction.currency)}</p>
                      </div>
                      <div>
                        <Link 
                          href={`/courses/${selectedTransaction.course._id}`}
                          className="text-sm text-red-600 hover:underline"
                        >
                          View Course →
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* Payment Details */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Payment Details
                    </h3>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-500">Amount</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {formatAmount(selectedTransaction.amount, selectedTransaction.currency)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Payment Provider</p>
                          <p className="text-sm text-gray-900 uppercase">{selectedTransaction.paymentProvider}</p>
                        </div>
                      </div>
                      {selectedTransaction.paymentDetails?.transactionId && (
                        <div>
                          <p className="text-xs text-gray-500">Transaction ID</p>
                          <p className="text-sm font-mono text-gray-900 break-all">
                            {selectedTransaction.paymentDetails.transactionId}
                          </p>
                        </div>
                      )}
                      {selectedTransaction.paymentDetails?.orderId && (
                        <div>
                          <p className="text-xs text-gray-500">Order ID</p>
                          <p className="text-sm font-mono text-gray-900 break-all">
                            {selectedTransaction.paymentDetails.orderId}
                          </p>
                        </div>
                      )}
                      {selectedTransaction.paymentDetails?.paidAt && (
                        <div>
                          <p className="text-xs text-gray-500">Paid At</p>
                          <p className="text-sm text-gray-900">
                            {formatDate(selectedTransaction.paymentDetails.paidAt)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Transaction Type */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Additional Information
                    </h3>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                      <div>
                        <p className="text-xs text-gray-500">Transaction Type</p>
                        <p className="text-sm text-gray-900 capitalize">{selectedTransaction.type}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Transaction ID (Internal)</p>
                        <p className="text-sm font-mono text-gray-900">{selectedTransaction._id}</p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

