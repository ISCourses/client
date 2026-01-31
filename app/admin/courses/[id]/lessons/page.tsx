'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Plus, Edit, Trash2, Eye, Loader2 } from 'lucide-react'
import Link from 'next/link'
import AdminSidebar from '@/components/AdminSidebar'
import api from '@/lib/api'
import toast from 'react-hot-toast'

interface Lesson {
  _id: string
  title: string
  content: string
  order: number
  duration: number
  isPublished: boolean
  course: string
  createdAt: string
}

interface Course {
  _id: string
  title: string
}

export default function ManageLessonsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const courseId = params.id as string
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [course, setCourse] = useState<Course | null>(null)
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    if (user?.role === 'admin' && courseId) {
      fetchData()
    }
  }, [user, courseId])

  const fetchData = async () => {
    try {
      setLoadingData(true)
      const [courseRes, lessonsRes] = await Promise.all([
        api.get(`/courses/${courseId}`),
        api.get(`/lessons/course/${courseId}/all`)
      ])
      setCourse(courseRes.data)
      setLessons(lessonsRes.data.sort((a: Lesson, b: Lesson) => a.order - b.order))
    } catch (error: any) {
      console.error('Failed to fetch data:', error)
      toast.error('Failed to load lessons')
      router.push('/admin/courses')
    } finally {
      setLoadingData(false)
    }
  }

  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm('Are you sure you want to delete this lesson? This action cannot be undone.')) {
      return
    }

    try {
      await api.delete(`/lessons/${lessonId}`)
      toast.success('Lesson deleted successfully')
      fetchData()
    } catch (error: any) {
      console.error('Failed to delete lesson:', error)
      toast.error(error.response?.data?.message || 'Failed to delete lesson')
    }
  }

  const handleTogglePublish = async (lessonId: string, currentStatus: boolean) => {
    try {
      await api.put(`/lessons/${lessonId}`, { isPublished: !currentStatus })
      toast.success(`Lesson ${!currentStatus ? 'published' : 'unpublished'} successfully`)
      fetchData()
    } catch (error: any) {
      console.error('Failed to update lesson:', error)
      toast.error('Failed to update lesson')
    }
  }

  if (loading || loadingData) {
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
          <div className="flex items-center space-x-4 mb-4">
            <Link href={`/admin/courses/${courseId}/edit`}>
              <Button variant="outline" className="bg-white border-gray-300 text-gray-900 hover:bg-gray-100">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Course
              </Button>
            </Link>
          </div>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Manage Lessons</h1>
              <p className="text-gray-600">{course?.title}</p>
            </div>
            <Link href={`/admin/courses/${courseId}/lessons/new`}>
              <Button className="bg-red-600 text-white hover:bg-red-700">
                <Plus className="h-4 w-4 mr-2" />
                Add New Lesson
              </Button>
            </Link>
          </div>
        </div>

        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-900">Lessons ({lessons.length})</CardTitle>
            <CardDescription className="text-gray-600">
              Manage course lessons and content
            </CardDescription>
          </CardHeader>
          <CardContent>
            {lessons.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600 text-lg mb-4">No lessons found</p>
                <Link href={`/admin/courses/${courseId}/lessons/new`}>
                  <Button className="bg-red-600 text-white hover:bg-red-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Lesson
                  </Button>
                </Link>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-200">
                    <TableHead className="text-gray-600">Order</TableHead>
                    <TableHead className="text-gray-600">Title</TableHead>
                    <TableHead className="text-gray-600">Duration</TableHead>
                    <TableHead className="text-gray-600">Status</TableHead>
                    <TableHead className="text-gray-600">Created</TableHead>
                    <TableHead className="text-gray-600">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lessons.map((lesson) => (
                    <TableRow key={lesson._id} className="border-gray-200">
                      <TableCell className="text-gray-600">{lesson.order}</TableCell>
                      <TableCell className="font-medium text-gray-900">{lesson.title}</TableCell>
                      <TableCell className="text-gray-600">{lesson.duration} min</TableCell>
                      <TableCell>
                        <Badge 
                          variant={lesson.isPublished ? 'default' : 'secondary'} 
                          className={lesson.isPublished ? 'bg-green-600 text-gray-900' : 'bg-gray-600 text-gray-900'}
                        >
                          {lesson.isPublished ? 'Published' : 'Draft'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {new Date(lesson.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Link href={`/admin/courses/${courseId}/lessons/${lesson._id}/edit`}>
                            <Button size="sm" variant="outline" className="bg-white border-gray-300 text-gray-900 hover:bg-gray-100">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleTogglePublish(lesson._id, lesson.isPublished)}
                            className="bg-white border-gray-300 text-gray-900 hover:bg-gray-100"
                          >
                            {lesson.isPublished ? 'Unpublish' : 'Publish'}
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleDeleteLesson(lesson._id)}
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

