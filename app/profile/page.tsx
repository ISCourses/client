'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { BookOpen, Trophy, Clock, User, Edit3, Receipt } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import api from '@/lib/api'
import toast from 'react-hot-toast'

interface UserProfile {
  id: string
  name: string
  email: string
  role: string
  enrolledCourses: any[]
  quizAttempts: any[]
}

export default function ProfilePage() {
  const { user, loading, updateUser } = useAuth()
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: ''
  })

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user && !loading) {
      // Fetch profile - API interceptor will handle token automatically
      fetchProfile()
      setFormData({
        name: user.name,
        email: user.email
      })
    }
  }, [user, loading])

  const fetchProfile = async () => {
    try {
      const response = await api.get('/users/profile')
      setProfile(response.data.user)
    } catch (error: any) {
      console.error('Failed to fetch profile:', error)
      if (error.response?.status === 401) {
        const errorMessage = error.response?.data?.message || ''
        // If it's a "No token" error, the token might have been removed
        if (errorMessage.includes('No token') || errorMessage.includes('authorization denied')) {
          toast.error('Session expired. Please login again.')
          router.push('/login')
        } else {
          toast.error('Failed to load profile. Please try again.')
        }
      } else {
        toast.error('Failed to load profile. Please try again.')
      }
    }
  }

  const handleSave = async () => {
    try {
      await api.put('/users/profile', formData)
      updateUser(formData)
      setEditing(false)
      toast.success('Profile updated successfully!')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update profile')
    }
  }

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || ''
    })
    setEditing(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1">
                <div className="h-64 bg-gray-200 rounded"></div>
              </div>
              <div className="lg:col-span-2 space-y-4">
                <div className="h-32 bg-gray-200 rounded"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-600">Manage your account and view your progress</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Info */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Profile Information</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditing(!editing)}
                  >
                    <Edit3 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {editing ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Name
                      </label>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                    <div className="flex space-x-2">
                      <Button onClick={handleSave} size="sm">
                        Save
                      </Button>
                      <Button variant="outline" onClick={handleCancel} size="sm">
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="bg-red-100 w-12 h-12 rounded-full flex items-center justify-center">
                        <User className="h-6 w-6 text-red-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{user.name}</h3>
                        <p className="text-gray-600">{user.email}</p>
                        <span className="inline-block bg-red-100 text-red-600 px-2 py-1 rounded-full text-xs mt-1">
                          {user.role}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <BookOpen className="h-8 w-8 text-red-600" />
                    <div>
                      <p className="text-2xl font-bold">{profile?.enrolledCourses?.length || 0}</p>
                      <p className="text-sm text-gray-600">Enrolled Courses</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push('/transactions')}>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <Receipt className="h-8 w-8 text-red-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Transactions</p>
                      <p className="text-xs text-gray-600">View payment history</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <Trophy className="h-8 w-8 text-red-600" />
                    <div>
                      <p className="text-2xl font-bold">{profile?.quizAttempts?.length || 0}</p>
                      <p className="text-sm text-gray-600">Quiz Attempts</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <Clock className="h-8 w-8 text-red-600" />
                    <div>
                      <p className="text-2xl font-bold">
                        {profile?.enrolledCourses?.reduce((acc, course) => acc + (course.progress || 0), 0) || 0}%
                      </p>
                      <p className="text-sm text-gray-600">Average Progress</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Enrolled Courses */}
            <Card>
              <CardHeader>
                <CardTitle>My Courses</CardTitle>
                <CardDescription>
                  Courses you're currently enrolled in
                </CardDescription>
              </CardHeader>
              <CardContent>
                {profile?.enrolledCourses?.length === 0 ? (
                  <div className="text-center py-8">
                    <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">You haven't enrolled in any courses yet.</p>
                    <Button className="mt-4" onClick={() => router.push('/courses')}>
                      Browse Courses
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {profile?.enrolledCourses?.map((enrollment) => (
                      <div 
                        key={enrollment.course._id} 
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => router.push(`/courses/${enrollment.course._id}`)}
                      >
                        <div className="flex-1">
                          <h4 className="font-medium">{enrollment.course.title}</h4>
                          <p className="text-sm text-gray-600">
                            Enrolled on {new Date(enrollment.enrolledAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center space-x-4" onClick={(e) => e.stopPropagation()}>
                          <div className="text-right">
                            <p className="text-sm font-medium">{enrollment.progress}%</p>
                            <p className="text-xs text-gray-600">Progress</p>
                          </div>
                          <Button 
                            size="sm" 
                            onClick={() => router.push(`/courses/${enrollment.course._id}/learn`)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Continue
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quiz Attempts */}
            <Card>
              <CardHeader>
                <CardTitle>Quiz History</CardTitle>
                <CardDescription>
                  Your recent quiz attempts and scores
                </CardDescription>
              </CardHeader>
              <CardContent>
                {profile?.quizAttempts?.length === 0 ? (
                  <div className="text-center py-8">
                    <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No quiz attempts yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {profile?.quizAttempts?.slice(0, 5).map((attempt, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium">{attempt.quiz.title}</h4>
                          <p className="text-sm text-gray-600">
                            Attempted on {new Date(attempt.attemptedAt).toLocaleDateString()}
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
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
