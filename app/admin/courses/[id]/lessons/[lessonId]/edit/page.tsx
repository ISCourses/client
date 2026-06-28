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
import ContentBlockEditor from '@/components/admin/ContentBlockEditor'
import { blocksToLegacyContent, ContentBlock } from '@/lib/content-blocks'

interface LessonForm {
  title: string
  content: string
  order: number
  duration: number
  isPublished: boolean
}

export default function EditLessonPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const courseId = params.id as string
  const lessonId = params.lessonId as string
  const [submitting, setSubmitting] = useState(false)
  const [loadingLesson, setLoadingLesson] = useState(true)
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([])

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
    if (user?.role === 'admin' && lessonId) {
      fetchLesson()
    }
  }, [user, lessonId])

  const fetchLesson = async () => {
    try {
      setLoadingLesson(true)
      const response = await api.get(`/lessons/${lessonId}`)
      const lesson = response.data
      
      reset({
        title: lesson.title || '',
        content: lesson.content || '', // Hidden field, auto-generated from blocks
        order: lesson.order || 1,
        duration: lesson.duration || 0,
        isPublished: lesson.isPublished || false
      })
      
      // Load content blocks if they exist, otherwise create one from legacy content
      if (lesson.contentBlocks && lesson.contentBlocks.length > 0) {
        setContentBlocks(lesson.contentBlocks.sort((a: ContentBlock, b: ContentBlock) => a.order - b.order))
      } else if (lesson.content) {
        // Migrate legacy content to a text block
        setContentBlocks([{
          type: 'text',
          content: lesson.content,
          order: 1
        }])
      } else {
        setContentBlocks([])
      }
    } catch (error: any) {
      console.error('Failed to fetch lesson:', error)
      toast.error(error.response?.data?.message || 'Failed to load lesson')
      router.push(`/admin/courses/${courseId}/lessons`)
    } finally {
      setLoadingLesson(false)
    }
  }

  const onSubmit = async (data: LessonForm) => {
    if (contentBlocks.length === 0) {
      toast.error('Please add at least one content block')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        ...data,
        content: blocksToLegacyContent(contentBlocks),
        contentBlocks: contentBlocks
      }
      await api.put(`/lessons/${lessonId}`, payload)
      toast.success('Lesson updated successfully!')
      router.push(`/admin/courses/${courseId}/lessons`)
    } catch (error: any) {
      console.error('Failed to update lesson:', error)
      toast.error(error.response?.data?.message || 'Failed to update lesson')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading || loadingLesson) {
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
          <h1 className="text-3xl font-bold text-gray-900">Edit Lesson</h1>
          <p className="text-gray-600">Update lesson information</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Card className="bg-white border-gray-200">
            <CardHeader>
              <CardTitle className="text-gray-900">Lesson Information</CardTitle>
              <CardDescription className="text-gray-600">
                Update the lesson details
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

              {/* Content Blocks Section */}
              <ContentBlockEditor
                blocks={contentBlocks}
                onChange={setContentBlocks}
                description="Add rich text, images, videos, buttons, or sections. Drag blocks to reorder. Sections can hold multiple nested blocks."
              />

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
                  Updating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Update Lesson
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

