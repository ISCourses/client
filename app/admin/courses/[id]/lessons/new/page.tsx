'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter, useParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import Link from 'next/link'
import AdminSidebar from '@/components/AdminSidebar'
import api from '@/lib/api'
import toast from 'react-hot-toast'

interface LessonForm {
  title: string
  content: string
  order: number
  duration: number
  isPublished: boolean
}

export default function NewLessonPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const courseId = params.id as string
  const [submitting, setSubmitting] = useState(false)
  const [existingLessons, setExistingLessons] = useState<any[]>([])

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<LessonForm>({
    defaultValues: {
      order: 1,
      duration: 0,
      isPublished: false
    }
  })

  useEffect(() => {
    if (user?.role === 'admin' && courseId) {
      fetchLessons()
    }
  }, [user, courseId])

  const fetchLessons = async () => {
    try {
      const response = await api.get(`/lessons/course/${courseId}/all`)
      const lessons = response.data
      setExistingLessons(lessons)
      // Set order to next available number
      const maxOrder = lessons.length > 0 ? Math.max(...lessons.map((l: any) => l.order || 0)) : 0
      reset({
        order: maxOrder + 1,
        duration: 0,
        isPublished: false
      })
    } catch (error) {
      console.error('Failed to fetch lessons:', error)
    }
  }

  const onSubmit = async (data: LessonForm) => {
    setSubmitting(true)
    try {
      await api.post('/lessons', {
        ...data,
        course: courseId
      })
      toast.success('Lesson created successfully!')
      router.push(`/admin/courses/${courseId}/lessons`)
    } catch (error: any) {
      console.error('Failed to create lesson:', error)
      toast.error(error.response?.data?.message || 'Failed to create lesson')
    } finally {
      setSubmitting(false)
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

  return (
    <div className="min-h-screen bg-white flex">
      <AdminSidebar />
      
      <div className="flex-1 p-8">
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Link href={`/admin/courses/${courseId}/lessons`}>
              <Button variant="outline" className="bg-white border-gray-300 text-gray-900 hover:bg-gray-100">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Lessons
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Create New Lesson</h1>
          <p className="text-gray-600">Add a new lesson to this course</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Card className="bg-white border-gray-200">
            <CardHeader>
              <CardTitle className="text-gray-900">Lesson Information</CardTitle>
              <CardDescription className="text-gray-600">
                Fill in the lesson details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Lesson Title *
                </label>
                <Input
                  {...register('title', { required: 'Title is required' })}
                  placeholder="Enter lesson title"
                  className="bg-white border-gray-300 text-gray-900 placeholder-gray-400"
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-400">{errors.title.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Content *
                </label>
                <textarea
                  {...register('content', { required: 'Content is required' })}
                  placeholder="Enter lesson content"
                  rows={12}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                {errors.content && (
                  <p className="mt-1 text-sm text-red-400">{errors.content.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Order *
                  </label>
                  <Input
                    type="number"
                    {...register('order', { 
                      required: 'Order is required',
                      min: { value: 1, message: 'Order must be at least 1' }
                    })}
                    placeholder="Lesson order"
                    className="bg-white border-gray-300 text-gray-900 placeholder-gray-400"
                  />
                  {errors.order && (
                    <p className="mt-1 text-sm text-red-400">{errors.order.message}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-600">
                    Current lessons: {existingLessons.length}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Duration (minutes)
                  </label>
                  <Input
                    type="number"
                    {...register('duration', { min: 0 })}
                    placeholder="Duration in minutes"
                    className="bg-white border-gray-300 text-gray-900 placeholder-gray-400"
                  />
                  {errors.duration && (
                    <p className="mt-1 text-sm text-red-400">{errors.duration.message}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  {...register('isPublished')}
                  className="rounded border-gray-300 bg-white text-gray-900 focus:ring-red-500"
                />
                <label className="text-gray-900">Publish immediately</label>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-4">
            <Link href={`/admin/courses/${courseId}/lessons`}>
              <Button type="button" variant="outline" className="bg-white border-gray-300 text-gray-900 hover:bg-gray-100">
                Cancel
              </Button>
            </Link>
            <Button 
              type="submit" 
              disabled={submitting}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Create Lesson
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

