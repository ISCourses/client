'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter, useParams } from 'next/navigation'
import AdminSidebar from '@/components/AdminSidebar'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import { ArrowLeft, User, Mail, Calendar, BookOpen, Receipt, Shield, Edit } from 'lucide-react'
import Link from 'next/link'

interface UserDetails {
  _id: string
  name: string
  email: string
  role: string
  enrolledCourses: Array<{
    course: {
      _id: string
      title: string
      thumbnail?: string
    }
    enrolledAt: string
    progress: number
  }>
  quizAttempts: Array<{
    quiz: {
      _id: string
      title: string
    }
    score: number
    totalQuestions: number
    attemptedAt: string
  }>
  createdAt: string
}

export default function UserDetailPage() {
  const { user: currentUser, loading: authLoading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const userId = params.id as string
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [transactions, setTransactions] = useState<any[]>([])

  useEffect(() => {
    if (!authLoading && (!currentUser || currentUser.role !== 'admin')) {
      router.push('/login')
    }
  }, [currentUser, authLoading, router])

  useEffect(() => {
    if (currentUser?.role === 'admin' && userId) {
      fetchUserDetails()
      fetchUserTransactions()
    }
  }, [currentUser, userId])

  const fetchUserDetails = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/users/${userId}`)
      setUserDetails(response.data)
    } catch (error: any) {
      console.error('Error fetching user details:', error)
      if (error.response?.status === 404) {
        toast.error('User not found')
        router.push('/admin/users')
      } else {
        toast.error('Failed to load user details')
      }
    } finally {
      setLoading(false)
    }
  }

  const fetchUserTransactions = async () => {
    try {
      const response = await api.get(`/transactions/admin/all?userId=${userId}&limit=10`)
      setTransactions(response.data.transactions || [])
    } catch (error) {
      console.error('Error fetching transactions:', error)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-white flex">
        <AdminSidebar />
        <div className="flex-1 p-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-8"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!userDetails) {
    return (
      <div className="min-h-screen bg-white flex">
        <AdminSidebar />
        <div className="flex-1 p-8">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-600">User not found</p>
              <Link href="/admin/users">
                <Button className="mt-4">Back to Users</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex">
      <AdminSidebar />
      
      <div className="flex-1 p-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/admin/users">
            <Button variant="outline" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Users
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">User Profile</h1>
          <p className="text-gray-600">View user details and activity</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User Info Card */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>User Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center">
                    <User className="h-8 w-8 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{userDetails.name}</h3>
                    <Badge className={userDetails.role === 'admin' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}>
                      {userDetails.role}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t">
                  <div className="flex items-center space-x-3">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-500">Email</p>
                      <p className="text-sm text-gray-900">{userDetails.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-500">Joined</p>
                      <p className="text-sm text-gray-900">{formatDate(userDetails.createdAt)}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <BookOpen className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-500">Enrolled Courses</p>
                      <p className="text-sm font-semibold text-gray-900">{userDetails.enrolledCourses?.length || 0}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Receipt className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-500">Transactions</p>
                      <p className="text-sm font-semibold text-gray-900">{transactions.length}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Enrolled Courses */}
            <Card>
              <CardHeader>
                <CardTitle>Enrolled Courses</CardTitle>
                <CardDescription>
                  Courses this user is enrolled in
                </CardDescription>
              </CardHeader>
              <CardContent>
                {userDetails.enrolledCourses?.length === 0 ? (
                  <div className="text-center py-8">
                    <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No enrolled courses</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {userDetails.enrolledCourses.map((enrollment) => (
                      <div
                        key={enrollment.course._id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex-1">
                          <Link href={`/courses/${enrollment.course._id}`}>
                            <h4 className="font-medium text-gray-900 hover:text-red-600">
                              {enrollment.course.title}
                            </h4>
                          </Link>
                          <p className="text-sm text-gray-600 mt-1">
                            Enrolled on {formatDate(enrollment.enrolledAt)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{enrollment.progress}%</p>
                          <p className="text-xs text-gray-600">Progress</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Transactions */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>
                  Payment transactions for this user
                </CardDescription>
              </CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <div className="text-center py-8">
                    <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No transactions found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {transactions.map((transaction) => (
                      <div
                        key={transaction._id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex-1">
                          <Link href={`/courses/${transaction.course._id}`}>
                            <h4 className="font-medium text-gray-900 hover:text-red-600">
                              {transaction.course.title}
                            </h4>
                          </Link>
                          <p className="text-sm text-gray-600 mt-1">
                            {formatDate(transaction.createdAt)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-gray-900">
                            ${transaction.amount.toFixed(2)}
                          </p>
                          <Badge className={transaction.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                            {transaction.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quiz Attempts */}
            {userDetails.quizAttempts && userDetails.quizAttempts.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Quiz Attempts</CardTitle>
                  <CardDescription>
                    Recent quiz attempts and scores
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {userDetails.quizAttempts.slice(0, 5).map((attempt, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{attempt.quiz.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {formatDate(attempt.attemptedAt)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`text-lg font-bold ${attempt.score >= 70 ? 'text-green-600' : 'text-red-600'}`}>
                            {attempt.score}%
                          </p>
                          <p className="text-xs text-gray-600">
                            {attempt.score}/{attempt.totalQuestions} correct
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}



