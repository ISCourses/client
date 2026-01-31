'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Users, BookOpen, FileText, BarChart3, TrendingUp, UserPlus, BookOpenCheck, Eye, ExternalLink, Globe } from 'lucide-react'
import AdminSidebar from '@/components/AdminSidebar'
import api from '@/lib/api'
import Link from 'next/link'
import Cookies from 'js-cookie'

interface DashboardStats {
  totalUsers: number
  totalCourses: number
  totalBlogs: number
  totalEnrollments: number
  recentUsers: any[]
  recentCourses: any[]
}

export default function AdminDashboard() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalCourses: 0,
    totalBlogs: 0,
    totalEnrollments: 0,
    recentUsers: [],
    recentCourses: []
  })

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.push('/')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user?.role === 'admin' && !loading) {
      // Ensure token exists before making API calls
      const token = Cookies.get('token')
      if (token) {
        fetchStats()
      }
    }
  }, [user, loading])

  const fetchStats = async () => {
    try {
      const [usersRes, coursesRes, blogsRes] = await Promise.all([
        api.get('/users'),
        api.get('/courses/admin/all'),
        api.get('/blogs/admin/all')
      ])

      const totalEnrollments = coursesRes.data.reduce((acc: number, course: any) => 
        acc + course.enrolledStudents.length, 0
      )

      setStats({
        totalUsers: usersRes.data.length,
        totalCourses: coursesRes.data.length,
        totalBlogs: blogsRes.data.length,
        totalEnrollments,
        recentUsers: usersRes.data.slice(0, 5),
        recentCourses: coursesRes.data.slice(0, 5)
      })
    } catch (error: any) {
      console.error('Failed to fetch stats:', error)
      // Don't logout on error - let the interceptor handle auth errors
      // Only log the error, don't throw it
      if (error.response?.status === 401) {
        // Auth error will be handled by the interceptor
        console.error('Authentication error in fetchStats')
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex">
        <AdminSidebar />
        <div className="flex-1 p-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-100 rounded w-1/3 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-100 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!user || user.role !== 'admin') {
    return null
  }

  return (
    <div className="min-h-screen bg-white flex">
      <AdminSidebar />
      
      <div className="flex-1 p-8">
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
              <p className="text-gray-600">Welcome back, {user.name}! Here's what's happening with your platform.</p>
            </div>
            <Link href="/" target="_blank">
              <Button className="bg-red-600 text-white hover:bg-red-700">
                <Globe className="h-4 w-4 mr-2" />
                View Website
                <ExternalLink className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-l-4 border-l-white bg-white border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-900">Total Users</CardTitle>
              <Users className="h-5 w-5 text-gray-900" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{stats.totalUsers}</div>
              <p className="text-xs text-gray-600">
                <TrendingUp className="h-3 w-3 inline mr-1" />
                +12% from last month
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-white bg-white border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-900">Total Courses</CardTitle>
              <BookOpen className="h-5 w-5 text-gray-900" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{stats.totalCourses}</div>
              <p className="text-xs text-gray-600">
                <TrendingUp className="h-3 w-3 inline mr-1" />
                +3 new this week
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-white bg-white border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-900">Total Blogs</CardTitle>
              <FileText className="h-5 w-5 text-gray-900" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{stats.totalBlogs}</div>
              <p className="text-xs text-gray-600">
                <TrendingUp className="h-3 w-3 inline mr-1" />
                +5 this month
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-white bg-white border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-900">Enrollments</CardTitle>
              <BookOpenCheck className="h-5 w-5 text-gray-900" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{stats.totalEnrollments}</div>
              <p className="text-xs text-gray-600">
                <TrendingUp className="h-3 w-3 inline mr-1" />
                +25% engagement
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Users */}
          <Card className="bg-white border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center text-gray-900">
                <UserPlus className="h-5 w-5 mr-2" />
                Recent Users
              </CardTitle>
              <CardDescription className="text-gray-600">
                Latest registered users on your platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-200">
                    <TableHead className="text-gray-600">Name</TableHead>
                    <TableHead className="text-gray-600">Email</TableHead>
                    <TableHead className="text-gray-600">Role</TableHead>
                    <TableHead className="text-gray-600">Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.recentUsers.map((user) => (
                    <TableRow key={user._id} className="border-gray-200">
                      <TableCell className="font-medium text-gray-900">{user.name}</TableCell>
                      <TableCell className="text-gray-600">{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className="bg-white text-black">
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Recent Courses */}
          <Card className="bg-white border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center text-gray-900">
                <BookOpen className="h-5 w-5 mr-2" />
                Recent Courses
              </CardTitle>
              <CardDescription className="text-gray-600">
                Latest courses added to your platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-200">
                    <TableHead className="text-gray-600">Title</TableHead>
                    <TableHead className="text-gray-600">Category</TableHead>
                    <TableHead className="text-gray-600">Students</TableHead>
                    <TableHead className="text-gray-600">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.recentCourses.map((course) => (
                    <TableRow key={course._id} className="border-gray-200">
                      <TableCell className="font-medium text-gray-900">{course.title}</TableCell>
                      <TableCell className="text-gray-600">{course.category}</TableCell>
                      <TableCell className="text-gray-600">{course.enrolledStudents.length}</TableCell>
                      <TableCell>
                        <Badge variant={course.isPublished ? 'default' : 'secondary'} className="bg-white text-black">
                          {course.isPublished ? 'Published' : 'Draft'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <Card className="bg-white border-gray-200">
            <CardHeader>
              <CardTitle className="text-gray-900">Quick Actions</CardTitle>
              <CardDescription className="text-gray-600">
                Common administrative tasks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Link href="/admin/courses/new">
                  <Button className="w-full h-20 flex-col space-y-2 bg-white border-gray-300 text-gray-900 hover:bg-gray-100" variant="outline">
                    <BookOpen className="h-6 w-6" />
                    <span>Create Course</span>
                  </Button>
                </Link>
                <Link href="/admin/blogs/new">
                  <Button className="w-full h-20 flex-col space-y-2 bg-white border-gray-300 text-gray-900 hover:bg-gray-100" variant="outline">
                    <FileText className="h-6 w-6" />
                    <span>Write Blog</span>
                  </Button>
                </Link>
                <Link href="/admin/analytics">
                  <Button className="w-full h-20 flex-col space-y-2 bg-white border-gray-300 text-gray-900 hover:bg-gray-100" variant="outline">
                    <BarChart3 className="h-6 w-6" />
                    <span>View Analytics</span>
                  </Button>
                </Link>
                <Link href="/" target="_blank">
                  <Button className="w-full h-20 flex-col space-y-2 bg-red-50 border-red-300 text-red-600 hover:bg-red-100" variant="outline">
                    <Globe className="h-6 w-6" />
                    <span>View Website</span>
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
