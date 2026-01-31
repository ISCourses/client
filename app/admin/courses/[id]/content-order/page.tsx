'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Save, GripVertical, BookOpen, Trophy, Loader2 } from 'lucide-react'
import Link from 'next/link'
import AdminSidebar from '@/components/AdminSidebar'
import api from '@/lib/api'
import toast from 'react-hot-toast'

interface Lesson {
  _id: string
  title: string
  order: number
  isPublished: boolean
}

interface Quiz {
  _id: string
  title: string
  order: number
  isPublished: boolean
}

interface Course {
  _id: string
  title: string
}

interface ContentItem {
  id: string
  type: 'lesson' | 'quiz'
  title: string
  order: number
  isPublished: boolean
  data: Lesson | Quiz
}

export default function ContentOrderPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const courseId = params.id as string
  const [course, setCourse] = useState<Course | null>(null)
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [contentItems, setContentItems] = useState<ContentItem[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [saving, setSaving] = useState(false)
  const [draggedItem, setDraggedItem] = useState<string | null>(null)

  useEffect(() => {
    if (user?.role === 'admin' && courseId) {
      fetchData()
    }
  }, [user, courseId])

  const fetchData = async () => {
    try {
      setLoadingData(true)
      const [courseRes, lessonsRes, quizzesRes] = await Promise.all([
        api.get(`/courses/${courseId}`),
        api.get(`/lessons/course/${courseId}/all`),
        api.get(`/quizzes/course/${courseId}/all`)
      ])
      
      setCourse(courseRes.data)
      const fetchedLessons = lessonsRes.data.sort((a: Lesson, b: Lesson) => a.order - b.order)
      const fetchedQuizzes = quizzesRes.data.sort((a: Quiz, b: Quiz) => a.order - b.order)
      
      setLessons(fetchedLessons)
      setQuizzes(fetchedQuizzes)
      
      // Combine lessons and quizzes into a unified list
      const items: ContentItem[] = [
        ...fetchedLessons.map((lesson: Lesson) => ({
          id: `lesson-${lesson._id}`,
          type: 'lesson' as const,
          title: lesson.title,
          order: lesson.order,
          isPublished: lesson.isPublished,
          data: lesson
        })),
        ...fetchedQuizzes.map((quiz: Quiz) => ({
          id: `quiz-${quiz._id}`,
          type: 'quiz' as const,
          title: quiz.title,
          order: quiz.order,
          isPublished: quiz.isPublished,
          data: quiz
        }))
      ].sort((a, b) => a.order - b.order)
      
      setContentItems(items)
    } catch (error: any) {
      console.error('Failed to fetch data:', error)
      toast.error('Failed to load content')
      router.push(`/admin/courses/${courseId}/edit`)
    } finally {
      setLoadingData(false)
    }
  }

  const handleDragStart = (itemId: string) => {
    setDraggedItem(itemId)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (targetItemId: string) => {
    if (!draggedItem || draggedItem === targetItemId) {
      setDraggedItem(null)
      return
    }

    const draggedIndex = contentItems.findIndex(item => item.id === draggedItem)
    const targetIndex = contentItems.findIndex(item => item.id === targetItemId)

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedItem(null)
      return
    }

    const newItems = [...contentItems]
    const [removed] = newItems.splice(draggedIndex, 1)
    newItems.splice(targetIndex, 0, removed)

    // Update orders
    const updatedItems = newItems.map((item, index) => ({
      ...item,
      order: index + 1
    }))

    setContentItems(updatedItems)
    setDraggedItem(null)
  }

  const moveItem = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === contentItems.length - 1)
    ) {
      return
    }

    const newItems = [...contentItems]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    ;[newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]]

    // Update orders
    const updatedItems = newItems.map((item, idx) => ({
      ...item,
      order: idx + 1
    }))

    setContentItems(updatedItems)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const lessonOrders = contentItems
        .filter(item => item.type === 'lesson')
        .map(item => ({
          lessonId: item.data._id,
          order: item.order
        }))

      const quizOrders = contentItems
        .filter(item => item.type === 'quiz')
        .map(item => ({
          quizId: item.data._id,
          order: item.order
        }))

      await api.put(`/courses/${courseId}/content-order`, {
        lessonOrders,
        quizOrders
      })

      toast.success('Content order updated successfully!')
      router.push(`/admin/courses/${courseId}/edit`)
    } catch (error: any) {
      console.error('Failed to save order:', error)
      toast.error(error.response?.data?.message || 'Failed to save order')
    } finally {
      setSaving(false)
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
              <h1 className="text-3xl font-bold text-gray-900">Arrange Course Content</h1>
              <p className="text-gray-600">{course?.title}</p>
            </div>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Order
                </>
              )}
            </Button>
          </div>
        </div>

        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-900">Course Content Order</CardTitle>
            <CardDescription className="text-gray-600">
              Drag and drop items to reorder, or use the arrow buttons. Lessons and quizzes can be mixed together.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {contentItems.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600 text-lg">No content found</p>
              </div>
            ) : (
              <div className="space-y-2">
                {contentItems.map((item, index) => (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={() => handleDragStart(item.id)}
                    onDragOver={handleDragOver}
                    onDrop={() => handleDrop(item.id)}
                    className={`flex items-center space-x-4 p-4 border rounded-lg transition-all ${
                      draggedItem === item.id
                        ? 'opacity-50 bg-gray-100'
                        : 'bg-white border-gray-200 hover:border-gray-300 cursor-move'
                    }`}
                  >
                    <div className="flex-shrink-0">
                      <GripVertical className="h-5 w-5 text-gray-400" />
                    </div>
                    
                    <div className="flex-shrink-0">
                      {item.type === 'lesson' ? (
                        <BookOpen className="h-5 w-5 text-blue-500" />
                      ) : (
                        <Trophy className="h-5 w-5 text-yellow-500" />
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900">{item.title}</span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          item.type === 'lesson'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {item.type === 'lesson' ? 'Lesson' : 'Quiz'}
                        </span>
                        {!item.isPublished && (
                          <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600">
                            Draft
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex-shrink-0 flex items-center space-x-2">
                      <span className="text-sm text-gray-500">Order: {item.order}</span>
                      <div className="flex flex-col">
                        <button
                          onClick={() => moveItem(index, 'up')}
                          disabled={index === 0}
                          className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => moveItem(index, 'down')}
                          disabled={index === contentItems.length - 1}
                          className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          ↓
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
