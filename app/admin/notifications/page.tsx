'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Send, Loader2, Users, BookOpen, CheckCircle2 } from 'lucide-react'
import AdminSidebar from '@/components/AdminSidebar'
import api from '@/lib/api'
import toast from 'react-hot-toast'

interface User {
  _id: string
  name: string
  email: string
  role: string
}

interface Course {
  _id: string
  title: string
  enrolledStudents: User[]
}

export default function NotificationsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [sending, setSending] = useState(false)
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [recipientType, setRecipientType] = useState<'all' | 'enrolled' | 'selected'>('all')
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [selectedCourse, setSelectedCourse] = useState('')
  const [users, setUsers] = useState<User[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [loadingCourses, setLoadingCourses] = useState(false)

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.push('/')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user?.role === 'admin') {
      if (recipientType === 'selected') {
        fetchUsers()
      } else if (recipientType === 'enrolled') {
        fetchCourses()
      }
    }
  }, [user, recipientType])

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true)
      const response = await api.get('/notifications/users')
      setUsers(response.data)
    } catch (error) {
      console.error('Failed to fetch users:', error)
      toast.error('Failed to load users')
    } finally {
      setLoadingUsers(false)
    }
  }

  const fetchCourses = async () => {
    try {
      setLoadingCourses(true)
      const response = await api.get('/notifications/courses')
      setCourses(response.data)
    } catch (error) {
      console.error('Failed to fetch courses:', error)
      toast.error('Failed to load courses')
    } finally {
      setLoadingCourses(false)
    }
  }

  const handleUserToggle = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const handleSend = async () => {
    if (!subject.trim()) {
      toast.error('Subject is required')
      return
    }

    if (!message.trim()) {
      toast.error('Message is required')
      return
    }

    if (recipientType === 'selected' && selectedUsers.length === 0) {
      toast.error('Please select at least one user')
      return
    }

    if (recipientType === 'enrolled' && !selectedCourse) {
      toast.error('Please select a course')
      return
    }

    setSending(true)
    try {
      const payload: any = {
        subject,
        message,
        recipientType
      }

      if (recipientType === 'selected') {
        payload.userIds = selectedUsers
      } else if (recipientType === 'enrolled') {
        payload.courseId = selectedCourse
      }

      const response = await api.post('/notifications/send', payload)
      
      toast.success(`Notification sent to ${response.data.sent} users!`)
      
      // Reset form
      setSubject('')
      setMessage('')
      setSelectedUsers([])
      setSelectedCourse('')
      setRecipientType('all')
    } catch (error: any) {
      console.error('Failed to send notification:', error)
      toast.error(error.response?.data?.message || 'Failed to send notification')
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex">
        <AdminSidebar />
        <div className="flex-1 p-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-100 rounded w-1/3 mb-8"></div>
            <div className="h-96 bg-gray-100 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!user || user.role !== 'admin') {
    return null
  }

  const getRecipientCount = () => {
    switch (recipientType) {
      case 'all':
        return 'All users'
      case 'enrolled':
        const course = courses.find(c => c._id === selectedCourse)
        return course ? `${course.enrolledStudents.length} enrolled users` : 'Select a course'
      case 'selected':
        return `${selectedUsers.length} selected user${selectedUsers.length !== 1 ? 's' : ''}`
      default:
        return ''
    }
  }

  return (
    <div className="min-h-screen bg-white flex">
      <AdminSidebar />
      
      <div className="flex-1 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Send Notifications</h1>
          <p className="text-gray-600">Send email notifications to users</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle className="text-gray-900">Compose Notification</CardTitle>
                <CardDescription className="text-gray-600">
                  Create and send email notifications to users
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Recipient Type
                  </label>
                  <Tabs value={recipientType} onValueChange={(value) => setRecipientType(value as any)}>
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="all">All Users</TabsTrigger>
                      <TabsTrigger value="enrolled">Enrolled Users</TabsTrigger>
                      <TabsTrigger value="selected">Selected Users</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                {/* Enrolled Users Selection */}
                {recipientType === 'enrolled' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Select Course
                    </label>
                    {loadingCourses ? (
                      <div className="text-gray-600">Loading courses...</div>
                    ) : (
                      <select
                        value={selectedCourse}
                        onChange={(e) => setSelectedCourse(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                      >
                        <option value="">Select a course</option>
                        {courses.map((course) => (
                          <option key={course._id} value={course._id}>
                            {course.title} ({course.enrolledStudents.length} students)
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                )}

                {/* Selected Users */}
                {recipientType === 'selected' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Select Users
                    </label>
                    {loadingUsers ? (
                      <div className="text-gray-600">Loading users...</div>
                    ) : (
                      <div className="border rounded-lg p-4 max-h-64 overflow-y-auto">
                        {users.length === 0 ? (
                          <p className="text-gray-600">No users found</p>
                        ) : (
                          <div className="space-y-2">
                            {users.map((user) => (
                              <label
                                key={user._id}
                                className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedUsers.includes(user._id)}
                                  onChange={() => handleUserToggle(user._id)}
                                  className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                                />
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-gray-900">{user.name}</p>
                                  <p className="text-xs text-gray-600">{user.email}</p>
                                </div>
                                <span className="text-xs text-gray-500 capitalize">{user.role}</span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Subject *
                  </label>
                  <Input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Enter email subject"
                    className="bg-white border-gray-300 text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Message *
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Enter your message here..."
                    rows={12}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                  <p className="mt-1 text-xs text-gray-600">
                    You can use line breaks. The message will be formatted as HTML.
                  </p>
                </div>

                <Button
                  onClick={handleSend}
                  disabled={sending}
                  className="w-full bg-red-600 text-white hover:bg-red-700"
                >
                  {sending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Notification
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-6">
            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle className="text-gray-900">Recipient Info</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Users className="h-5 w-5 text-red-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Recipients</p>
                      <p className="text-sm text-gray-600">{getRecipientCount()}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle className="text-gray-900">Email Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Make sure your email settings are configured in the Settings page before sending notifications.
                </p>
                <Button
                  variant="outline"
                  onClick={() => router.push('/admin/settings')}
                  className="w-full bg-white border-gray-300 text-gray-900 hover:bg-gray-100"
                >
                  Configure Email Settings
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle className="text-gray-900">Tips</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start">
                    <CheckCircle2 className="h-4 w-4 mr-2 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Test with a small group first</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-4 w-4 mr-2 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Keep messages clear and concise</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-4 w-4 mr-2 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Use line breaks for better readability</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-4 w-4 mr-2 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Bulk emails are sent in batches</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

