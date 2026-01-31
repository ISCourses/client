'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Plus, Edit, Trash2, Loader2 } from 'lucide-react'
import Link from 'next/link'
import AdminSidebar from '@/components/AdminSidebar'
import api from '@/lib/api'
import toast from 'react-hot-toast'

interface Quiz {
  _id: string
  title: string
  description: string
  questions: any[]
  timeLimit: number
  passingScore: number
  isPublished: boolean
  course: string
  createdAt: string
}

interface Course {
  _id: string
  title: string
}

export default function ManageQuizzesPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const courseId = params.id as string
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
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
      const [courseRes, quizzesRes] = await Promise.all([
        api.get(`/courses/${courseId}`),
        api.get(`/quizzes/course/${courseId}/all`)
      ])
      setCourse(courseRes.data)
      setQuizzes(quizzesRes.data)
    } catch (error: any) {
      console.error('Failed to fetch data:', error)
      toast.error('Failed to load quizzes')
      router.push('/admin/courses')
    } finally {
      setLoadingData(false)
    }
  }

  const handleDeleteQuiz = async (quizId: string) => {
    if (!confirm('Are you sure you want to delete this quiz? This action cannot be undone.')) {
      return
    }

    try {
      await api.delete(`/quizzes/${quizId}`)
      toast.success('Quiz deleted successfully')
      fetchData()
    } catch (error: any) {
      console.error('Failed to delete quiz:', error)
      toast.error(error.response?.data?.message || 'Failed to delete quiz')
    }
  }

  const handleTogglePublish = async (quizId: string, currentStatus: boolean) => {
    try {
      await api.put(`/quizzes/${quizId}`, { isPublished: !currentStatus })
      toast.success(`Quiz ${!currentStatus ? 'published' : 'unpublished'} successfully`)
      fetchData()
    } catch (error: any) {
      console.error('Failed to update quiz:', error)
      toast.error('Failed to update quiz')
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
              <h1 className="text-3xl font-bold text-gray-900">Manage Quizzes</h1>
              <p className="text-gray-600">{course?.title}</p>
            </div>
            <Link href={`/admin/courses/${courseId}/quizzes/new`}>
              <Button className="bg-red-600 text-white hover:bg-red-700">
                <Plus className="h-4 w-4 mr-2" />
                Add New Quiz
              </Button>
            </Link>
          </div>
        </div>

        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-900">Quizzes ({quizzes.length})</CardTitle>
            <CardDescription className="text-gray-600">
              Manage course quizzes and assessments
            </CardDescription>
          </CardHeader>
          <CardContent>
            {quizzes.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600 text-lg mb-4">No quizzes found</p>
                <Link href={`/admin/courses/${courseId}/quizzes/new`}>
                  <Button className="bg-red-600 text-white hover:bg-red-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Quiz
                  </Button>
                </Link>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-200">
                    <TableHead className="text-gray-600">Title</TableHead>
                    <TableHead className="text-gray-600">Questions</TableHead>
                    <TableHead className="text-gray-600">Time Limit</TableHead>
                    <TableHead className="text-gray-600">Passing Score</TableHead>
                    <TableHead className="text-gray-600">Status</TableHead>
                    <TableHead className="text-gray-600">Created</TableHead>
                    <TableHead className="text-gray-600">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quizzes.map((quiz) => (
                    <TableRow key={quiz._id} className="border-gray-200">
                      <TableCell className="font-medium text-gray-900">{quiz.title}</TableCell>
                      <TableCell className="text-gray-600">{quiz.questions.length}</TableCell>
                      <TableCell className="text-gray-600">{quiz.timeLimit} min</TableCell>
                      <TableCell className="text-gray-600">{quiz.passingScore}%</TableCell>
                      <TableCell>
                        <Badge 
                          variant={quiz.isPublished ? 'default' : 'secondary'} 
                          className={quiz.isPublished ? 'bg-green-600 text-gray-900' : 'bg-gray-600 text-gray-900'}
                        >
                          {quiz.isPublished ? 'Published' : 'Draft'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {new Date(quiz.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Link href={`/admin/courses/${courseId}/quizzes/${quiz._id}/edit`}>
                            <Button size="sm" variant="outline" className="bg-white border-gray-300 text-gray-900 hover:bg-gray-100">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleTogglePublish(quiz._id, quiz.isPublished)}
                            className="bg-white border-gray-300 text-gray-900 hover:bg-gray-100"
                          >
                            {quiz.isPublished ? 'Unpublish' : 'Publish'}
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleDeleteQuiz(quiz._id)}
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

