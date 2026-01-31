'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3, Globe, Eye, TrendingUp, BookOpen, FileText, GraduationCap } from 'lucide-react'
import AdminSidebar from '@/components/AdminSidebar'
import api from '@/lib/api'
import toast from 'react-hot-toast'

interface AnalyticsData {
  totalViews: number
  viewsByType: Array<{ _id: string; count: number }>
  topCountries: Array<{ _id: string; count: number }>
  topCourses: Array<{
    _id: string
    title: string
    category: string
    views: number
    enrolledStudents: number
  }>
  dailyViews: Array<{ _id: string; count: number }>
}

export default function AdminAnalyticsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loadingAnalytics, setLoadingAnalytics] = useState(true)
  const [days, setDays] = useState(30)

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.push('/')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchAnalytics()
    }
  }, [user, days])

  const fetchAnalytics = async () => {
    try {
      setLoadingAnalytics(true)
      const response = await api.get(`/analytics/dashboard?days=${days}`)
      setAnalytics(response.data)
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
      toast.error('Failed to load analytics')
    } finally {
      setLoadingAnalytics(false)
    }
  }

  const getPageTypeIcon = (type: string) => {
    switch (type) {
      case 'course':
        return <GraduationCap className="h-5 w-5" />
      case 'book':
        return <BookOpen className="h-5 w-5" />
      case 'blog':
        return <FileText className="h-5 w-5" />
      default:
        return <Eye className="h-5 w-5" />
    }
  }

  const getPageTypeLabel = (type: string) => {
    switch (type) {
      case 'course':
        return 'Courses'
      case 'book':
        return 'Books'
      case 'blog':
        return 'Blogs'
      case 'home':
        return 'Home'
      default:
        return 'Other'
    }
  }

  if (loading || loadingAnalytics) {
    return (
      <div className="min-h-screen bg-white flex">
        <AdminSidebar />
        <div className="flex-1 p-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-100 rounded w-1/3 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-100 rounded"></div>
              ))}
            </div>
            <div className="h-96 bg-gray-100 rounded"></div>
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
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
              <p className="text-gray-600">Track your platform performance</p>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className="px-4 py-2 bg-white border border-gray-300 rounded-md text-gray-900"
              >
                <option value={7}>Last 7 days</option>
                <option value={30}>Last 30 days</option>
                <option value={90}>Last 90 days</option>
                <option value={365}>Last year</option>
              </select>
            </div>
          </div>
        </div>

        {analytics && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="bg-white border-gray-200">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-gray-900">Total Page Views</CardTitle>
                  <Eye className="h-5 w-5 text-gray-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900">{analytics.totalViews.toLocaleString()}</div>
                  <p className="text-sm text-gray-600 mt-2">In the last {days} days</p>
                </CardContent>
              </Card>

              <Card className="bg-white border-gray-200">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-gray-900">Top Countries</CardTitle>
                  <Globe className="h-5 w-5 text-gray-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900">{analytics.topCountries.length}</div>
                  <p className="text-sm text-gray-600 mt-2">Countries tracked</p>
                </CardContent>
              </Card>

              <Card className="bg-white border-gray-200">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-gray-900">Top Courses</CardTitle>
                  <TrendingUp className="h-5 w-5 text-gray-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900">{analytics.topCourses.length}</div>
                  <p className="text-sm text-gray-600 mt-2">Most viewed courses</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Page Views by Type */}
              <Card className="bg-white border-gray-200">
                <CardHeader>
                  <CardTitle className="text-gray-900">Page Views by Type</CardTitle>
                  <CardDescription className="text-gray-600">
                    Breakdown of views by content type
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics.viewsByType.map((item) => (
                      <div key={item._id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="text-gray-600">
                            {getPageTypeIcon(item._id)}
                          </div>
                          <span className="text-gray-900 font-medium">
                            {getPageTypeLabel(item._id)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="w-32 bg-gray-100 rounded-full h-2">
                            <div
                              className="bg-white h-2 rounded-full"
                              style={{
                                width: `${(item.count / analytics.totalViews) * 100}%`
                              }}
                            />
                          </div>
                          <span className="text-gray-900 font-bold w-16 text-right">
                            {item.count.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Top Countries */}
              <Card className="bg-white border-gray-200">
                <CardHeader>
                  <CardTitle className="text-gray-900">Top Countries</CardTitle>
                  <CardDescription className="text-gray-600">
                    Visitors by country
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics.topCountries.map((country, index) => (
                      <div key={country._id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-gray-900 font-bold">
                            {index + 1}
                          </div>
                          <span className="text-gray-900 font-medium">{country._id}</span>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="w-32 bg-gray-100 rounded-full h-2">
                            <div
                              className="bg-white h-2 rounded-full"
                              style={{
                                width: `${(country.count / analytics.totalViews) * 100}%`
                              }}
                            />
                          </div>
                          <span className="text-gray-900 font-bold w-16 text-right">
                            {country.count.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Most Viewed Courses */}
            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle className="text-gray-900">Most Viewed Courses</CardTitle>
                <CardDescription className="text-gray-600">
                  Top courses by page views
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.topCourses.length === 0 ? (
                    <p className="text-gray-600 text-center py-8">No course views tracked yet</p>
                  ) : (
                    analytics.topCourses.map((course, index) => (
                      <div key={course._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center space-x-4 flex-1">
                          <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-gray-900 font-bold">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <h3 className="text-gray-900 font-medium">{course.title}</h3>
                            <p className="text-sm text-gray-600">{course.category}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-6">
                          <div className="text-right">
                            <p className="text-gray-900 font-bold">{course.views.toLocaleString()}</p>
                            <p className="text-xs text-gray-600">views</p>
                          </div>
                          <div className="text-right">
                            <p className="text-gray-900 font-bold">{course.enrolledStudents}</p>
                            <p className="text-xs text-gray-600">enrolled</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Daily Views Chart */}
            <Card className="bg-white border-gray-200 mt-6">
              <CardHeader>
                <CardTitle className="text-gray-900">Daily Views</CardTitle>
                <CardDescription className="text-gray-600">
                  Page views over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analytics.dailyViews.length === 0 ? (
                    <p className="text-gray-600 text-center py-8">No data available</p>
                  ) : (
                    analytics.dailyViews.map((day) => {
                      const maxViews = Math.max(...analytics.dailyViews.map(d => d.count))
                      return (
                        <div key={day._id} className="flex items-center space-x-4">
                          <div className="w-24 text-sm text-gray-600">
                            {new Date(day._id).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </div>
                          <div className="flex-1 bg-gray-100 rounded-full h-6 relative">
                            <div
                              className="bg-white h-6 rounded-full flex items-center justify-end pr-2"
                              style={{
                                width: `${(day.count / maxViews) * 100}%`,
                                minWidth: day.count > 0 ? '40px' : '0'
                              }}
                            >
                              <span className="text-xs text-black font-medium">{day.count}</span>
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}

