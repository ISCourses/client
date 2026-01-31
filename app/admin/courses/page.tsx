'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { BookOpen, Plus, Edit, Trash2, Eye, Search, Filter } from 'lucide-react'
import Link from 'next/link'
import AdminSidebar from '@/components/AdminSidebar'
import api from '@/lib/api'
import toast from 'react-hot-toast'

interface Course {
  _id: string
  title: string
  description: string
  category: string
  level: string
  duration: number
  instructor: {
    name: string
  }
  isPublished: boolean
  enrolledStudents: string[]
  createdAt: string
}

export default function AdminCoursesPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [courses, setCourses] = useState<Course[]>([])
  const [loadingCourses, setLoadingCourses] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [categories, setCategories] = useState<{ _id: string; name: string }[]>([])

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchCategories()
    }
  }, [user])

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories')
      setCategories(response.data.filter((cat: any) => cat.isActive))
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    }
  }

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.push('/')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchCourses()
    }
  }, [user, searchTerm, selectedCategory])

  const fetchCourses = async () => {
    try {
      setLoadingCourses(true)
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (selectedCategory) params.append('category', selectedCategory)

      const response = await api.get(`/courses/admin/all?${params.toString()}`)
      setCourses(response.data)
    } catch (error) {
      console.error('Failed to fetch courses:', error)
      toast.error('Failed to fetch courses')
    } finally {
      setLoadingCourses(false)
    }
  }

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      return
    }

    try {
      await api.delete(`/courses/${courseId}`)
      toast.success('Course deleted successfully')
      fetchCourses()
    } catch (error) {
      console.error('Failed to delete course:', error)
      toast.error('Failed to delete course')
    }
  }

  const handleTogglePublish = async (courseId: string, currentStatus: boolean) => {
    try {
      await api.put(`/courses/${courseId}`, { isPublished: !currentStatus })
      toast.success(`Course ${!currentStatus ? 'published' : 'unpublished'} successfully`)
      fetchCourses()
    } catch (error) {
      console.error('Failed to update course:', error)
      toast.error('Failed to update course')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex">
        <AdminSidebar />
        <div className="flex-1 p-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-100 rounded w-1/3 mb-8"></div>
            <div className="h-64 bg-gray-100 rounded"></div>
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
              <h1 className="text-3xl font-bold text-gray-900">Course Management</h1>
              <p className="text-gray-600">Manage all courses on your platform</p>
            </div>
            <Link href="/admin/courses/new">
              <Button className="bg-red-600 text-white hover:bg-red-700">
                <Plus className="h-4 w-4 mr-2" />
                Create New Course
              </Button>
            </Link>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600 h-4 w-4" />
              <Input
                placeholder="Search courses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white border-gray-200 text-gray-900"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="border border-gray-200 rounded-md px-3 py-2 text-sm bg-white text-gray-900"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category._id} value={category.name}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Courses Table */}
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-900">All Courses ({courses.length})</CardTitle>
            <CardDescription className="text-gray-600">
              Manage and organize your course content
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingCourses ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-100 rounded animate-pulse"></div>
                ))}
              </div>
            ) : courses.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-600 text-lg">No courses found</p>
                <Link href="/admin/courses/new">
                  <Button className="mt-4 bg-red-600 text-white hover:bg-red-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Course
                  </Button>
                </Link>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-200">
                    <TableHead className="text-gray-600">Title</TableHead>
                    <TableHead className="text-gray-600">Category</TableHead>
                    <TableHead className="text-gray-600">Level</TableHead>
                    <TableHead className="text-gray-600">Students</TableHead>
                    <TableHead className="text-gray-600">Status</TableHead>
                    <TableHead className="text-gray-600">Created</TableHead>
                    <TableHead className="text-gray-600">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {courses.map((course) => (
                    <TableRow key={course._id} className="border-gray-200">
                      <TableCell className="font-medium text-gray-900">{course.title}</TableCell>
                      <TableCell className="text-gray-600">{course.category}</TableCell>
                      <TableCell className="text-gray-600 capitalize">{course.level}</TableCell>
                      <TableCell className="text-gray-600">{course.enrolledStudents.length}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={course.isPublished ? 'default' : 'secondary'} 
                          className={course.isPublished ? 'bg-green-600 text-gray-900' : 'bg-gray-600 text-gray-900'}
                        >
                          {course.isPublished ? 'Published' : 'Draft'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {new Date(course.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Link href={`/courses/${course._id}`}>
                            <Button size="sm" variant="outline" className="bg-white border-gray-300 text-gray-900 hover:bg-gray-100">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link href={`/admin/courses/${course._id}/edit`}>
                            <Button size="sm" variant="outline" className="bg-white border-gray-300 text-gray-900 hover:bg-gray-100">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleTogglePublish(course._id, course.isPublished)}
                            className="bg-white border-gray-300 text-gray-900 hover:bg-gray-100"
                          >
                            {course.isPublished ? 'Unpublish' : 'Publish'}
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleDeleteCourse(course._id)}
                            className="bg-red-50 border-red-300 text-red-600 hover:bg-red-100"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

