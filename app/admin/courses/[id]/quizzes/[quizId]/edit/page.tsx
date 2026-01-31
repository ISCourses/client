'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter, useParams } from 'next/navigation'
import { useForm, useFieldArray } from 'react-hook-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Save, Loader2, Plus, Trash2 } from 'lucide-react'
import Link from 'next/link'
import AdminSidebar from '@/components/AdminSidebar'
import api from '@/lib/api'
import toast from 'react-hot-toast'

interface Question {
  question: string
  options: string[]
  correctAnswer: string
  explanation: string
}

interface QuizForm {
  title: string
  description: string
  questions: Question[]
  timeLimit: number
  passingScore: number
  maxAttempts: number
  isPublished: boolean
}

export default function EditQuizPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const courseId = params.id as string
  const quizId = params.quizId as string
  const [submitting, setSubmitting] = useState(false)
  const [loadingQuiz, setLoadingQuiz] = useState(true)

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    reset,
    watch
  } = useForm<QuizForm>({
    defaultValues: {
      questions: [{ question: '', options: ['', '', '', ''], correctAnswer: '', explanation: '' }],
      timeLimit: 30,
      passingScore: 70,
      maxAttempts: 3,
      isPublished: false
    }
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'questions'
  })

  useEffect(() => {
    if (user?.role === 'admin' && quizId) {
      fetchQuiz()
    }
  }, [user, quizId])

  const fetchQuiz = async () => {
    try {
      setLoadingQuiz(true)
      const response = await api.get(`/quizzes/${quizId}`)
      const quiz = response.data
      
      reset({
        title: quiz.title || '',
        description: quiz.description || '',
        questions: quiz.questions && quiz.questions.length > 0 
          ? quiz.questions.map((q: any) => ({
              question: q.question || '',
              options: q.options || ['', '', '', ''],
              correctAnswer: q.correctAnswer || '',
              explanation: q.explanation || ''
            }))
          : [{ question: '', options: ['', '', '', ''], correctAnswer: '', explanation: '' }],
        timeLimit: quiz.timeLimit || 30,
        passingScore: quiz.passingScore || 70,
        maxAttempts: quiz.maxAttempts || 3,
        isPublished: quiz.isPublished || false
      })
    } catch (error: any) {
      console.error('Failed to fetch quiz:', error)
      toast.error(error.response?.data?.message || 'Failed to load quiz')
      router.push(`/admin/courses/${courseId}/quizzes`)
    } finally {
      setLoadingQuiz(false)
    }
  }

  const onSubmit = async (data: QuizForm) => {
    setSubmitting(true)
    try {
      await api.put(`/quizzes/${quizId}`, data)
      toast.success('Quiz updated successfully!')
      router.push(`/admin/courses/${courseId}/quizzes`)
    } catch (error: any) {
      console.error('Failed to update quiz:', error)
      toast.error(error.response?.data?.message || 'Failed to update quiz')
    } finally {
      setSubmitting(false)
    }
  }

  const addQuestion = () => {
    append({ question: '', options: ['', '', '', ''], correctAnswer: '', explanation: '' })
  }

  if (loading || loadingQuiz) {
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
            <Link href={`/admin/courses/${courseId}/quizzes`}>
              <Button variant="outline" className="bg-white border-gray-300 text-gray-900 hover:bg-gray-100">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Quizzes
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Quiz</h1>
          <p className="text-gray-600">Update quiz information and questions</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Card className="bg-white border-gray-200">
            <CardHeader>
              <CardTitle className="text-gray-900">Quiz Information</CardTitle>
              <CardDescription className="text-gray-600">
                Basic quiz details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Quiz Title *
                </label>
                <Input
                  {...register('title', { required: 'Title is required' })}
                  placeholder="Enter quiz title"
                  className="bg-white border-gray-300 text-gray-900 placeholder-gray-400"
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-400">{errors.title.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Description
                </label>
                <textarea
                  {...register('description')}
                  placeholder="Enter quiz description"
                  rows={3}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Time Limit (minutes) *
                  </label>
                  <Input
                    type="number"
                    {...register('timeLimit', { 
                      required: 'Time limit is required',
                      min: { value: 1, message: 'Must be at least 1 minute' }
                    })}
                    className="bg-white border-gray-300 text-gray-900 placeholder-gray-400"
                  />
                  {errors.timeLimit && (
                    <p className="mt-1 text-sm text-red-400">{errors.timeLimit.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Passing Score (%) *
                  </label>
                  <Input
                    type="number"
                    {...register('passingScore', { 
                      required: 'Passing score is required',
                      min: { value: 0, message: 'Must be between 0-100' },
                      max: { value: 100, message: 'Must be between 0-100' }
                    })}
                    className="bg-white border-gray-300 text-gray-900 placeholder-gray-400"
                  />
                  {errors.passingScore && (
                    <p className="mt-1 text-sm text-red-400">{errors.passingScore.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Max Attempts *
                  </label>
                  <Input
                    type="number"
                    {...register('maxAttempts', { 
                      required: 'Max attempts is required',
                      min: { value: 1, message: 'Must be at least 1' }
                    })}
                    className="bg-white border-gray-300 text-gray-900 placeholder-gray-400"
                  />
                  {errors.maxAttempts && (
                    <p className="mt-1 text-sm text-red-400">{errors.maxAttempts.message}</p>
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

          <Card className="bg-white border-gray-200">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-gray-900">Questions</CardTitle>
                  <CardDescription className="text-gray-600">
                    Add and edit quiz questions
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  onClick={addQuestion}
                  variant="outline"
                  className="bg-white border-gray-300 text-gray-900 hover:bg-gray-100"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Question
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {fields.map((field, index) => (
                <div key={field.id} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-gray-900 font-medium">Question {index + 1}</h3>
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        onClick={() => remove(index)}
                        variant="outline"
                        size="sm"
                        className="bg-red-50 border-red-300 text-red-600 hover:bg-red-100"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Question *
                      </label>
                      <Input
                        {...register(`questions.${index}.question`, { required: 'Question is required' })}
                        placeholder="Enter question"
                        className="bg-white border-gray-300 text-gray-900 placeholder-gray-400"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Options *
                      </label>
                      {[0, 1, 2, 3].map((optIndex) => (
                        <div key={optIndex} className="mb-2">
                          <Input
                            {...register(`questions.${index}.options.${optIndex}`, { required: 'Option is required' })}
                            placeholder={`Option ${optIndex + 1}`}
                            className="bg-white border-gray-300 text-gray-900 placeholder-gray-400"
                          />
                        </div>
                      ))}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Correct Answer *
                      </label>
                      <select
                        {...register(`questions.${index}.correctAnswer`, { required: 'Correct answer is required' })}
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                      >
                        <option value="">Select correct answer</option>
                        {[0, 1, 2, 3].map((optIndex) => {
                          const optionText = watch(`questions.${index}.options.${optIndex}`)
                          return (
                            <option key={optIndex} value={optionText || `Option ${optIndex + 1}`}>
                              {optionText || `Option ${optIndex + 1}`} {optionText ? '(Option ' + (optIndex + 1) + ')' : ''}
                            </option>
                          )
                        })}
                      </select>
                      <p className="mt-1 text-xs text-gray-600">
                        Select which option is the correct answer. The correct answer must match one of the option texts above.
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Explanation
                      </label>
                      <textarea
                        {...register(`questions.${index}.explanation`)}
                        placeholder="Explanation for the correct answer"
                        rows={2}
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-4">
            <Link href={`/admin/courses/${courseId}/quizzes`}>
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
                  Update Quiz
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

