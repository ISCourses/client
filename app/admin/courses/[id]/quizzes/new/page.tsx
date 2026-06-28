'use client'

import { useState } from 'react'
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
  type: 'multiple-choice' | 'text' | 'textarea' | 'select' | 'checkbox'
  options?: string[]
  correctAnswer?: string
  correctAnswers?: string[] // For checkbox
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

export default function NewQuizPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const courseId = params.id as string
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    watch,
    setValue
  } = useForm<QuizForm>({
    defaultValues: {
      questions: [{ question: '', type: 'multiple-choice', options: ['', '', '', ''], correctAnswer: '', explanation: '' }],
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

  const onSubmit = async (data: QuizForm) => {
    setSubmitting(true)
    try {
      // Process questions to handle checkbox correctAnswers
      const processedQuestions = data.questions.map(q => {
        const question: any = {
          question: q.question,
          type: q.type,
          explanation: q.explanation || ''
        }
        
        if (q.type === 'checkbox') {
          question.options = q.options?.filter(opt => opt && opt.trim())
          question.correctAnswers = Array.isArray(q.correctAnswers) ? q.correctAnswers : []
        } else if (q.type === 'multiple-choice' || q.type === 'select') {
          question.options = q.options?.filter(opt => opt && opt.trim())
          question.correctAnswer = q.correctAnswer
        } else if (q.type === 'text' || q.type === 'textarea') {
          question.correctAnswer = q.correctAnswer
        }
        
        return question
      })

      await api.post('/quizzes', {
        ...data,
        questions: processedQuestions,
        course: courseId
      })
      toast.success('Quiz created successfully!')
      router.push(`/admin/courses/${courseId}/quizzes`)
    } catch (error: any) {
      console.error('Failed to create quiz:', error)
      toast.error(error.response?.data?.message || 'Failed to create quiz')
    } finally {
      setSubmitting(false)
    }
  }

  const addQuestion = () => {
    append({ question: '', type: 'multiple-choice', options: ['', '', '', ''], correctAnswer: '', explanation: '' })
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
            <Link href={`/admin/courses/${courseId}/quizzes`}>
              <Button variant="outline" className="bg-white border-gray-300 text-gray-900 hover:bg-gray-100">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Quizzes
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Create New Quiz</h1>
          <p className="text-gray-600">Add a new quiz to this course</p>
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
                    Add quiz questions
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
                        Question Type *
                      </label>
                      <select
                        {...register(`questions.${index}.type`, { required: 'Question type is required' })}
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                      >
                        <option value="multiple-choice">Multiple Choice (Auto-graded)</option>
                        <option value="text">Text (Manual grading)</option>
                        <option value="textarea">Textarea (Manual grading)</option>
                        <option value="select">Select (Auto-graded)</option>
                        <option value="checkbox">Checkbox (Auto-graded)</option>
                      </select>
                    </div>

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

                    {/* Options for multiple-choice, select, checkbox */}
                    {(watch(`questions.${index}.type`) === 'multiple-choice' || 
                      watch(`questions.${index}.type`) === 'select' || 
                      watch(`questions.${index}.type`) === 'checkbox') && (
                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">
                          Options *
                        </label>
                        {watch(`questions.${index}.type`) === 'select' ? (
                          <div className="space-y-2">
                            {(watch(`questions.${index}.options`) || ['', '']).map((_: string, optIndex: number) => (
                              <div key={optIndex} className="flex gap-2">
                                <Input
                                  {...register(`questions.${index}.options.${optIndex}`)}
                                  placeholder={`Option ${optIndex + 1}`}
                                  className="bg-white border-gray-300 text-gray-900 placeholder-gray-400 flex-1"
                                />
                                {(watch(`questions.${index}.options`) || []).length > 2 && (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      const current = watch(`questions.${index}.options`) || []
                                      setValue(`questions.${index}.options`, current.filter((_: string, i: number) => i !== optIndex))
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            ))}
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const current = watch(`questions.${index}.options`) || ['', '']
                                setValue(`questions.${index}.options`, [...current, ''])
                              }}
                            >
                              <Plus className="h-4 w-4 mr-1" /> Add option
                            </Button>
                            <p className="text-xs text-gray-600">Add as many options as needed (e.g. True/False). Only filled options are saved.</p>
                          </div>
                        ) : (
                          [0, 1, 2, 3].map((optIndex) => (
                            <div key={optIndex} className="mb-2">
                              <Input
                                {...register(`questions.${index}.options.${optIndex}`, { 
                                  required: watch(`questions.${index}.type`) !== 'checkbox' || optIndex < 2 ? 'Option is required' : false
                                })}
                                placeholder={`Option ${optIndex + 1}`}
                                className="bg-white border-gray-300 text-gray-900 placeholder-gray-400"
                              />
                            </div>
                          ))
                        )}
                      </div>
                    )}

                    {/* Correct Answer for multiple-choice, select, text, textarea */}
                    {(watch(`questions.${index}.type`) === 'multiple-choice' || 
                      watch(`questions.${index}.type`) === 'select' || 
                      watch(`questions.${index}.type`) === 'text' || 
                      watch(`questions.${index}.type`) === 'textarea') && (
                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">
                          Correct Answer *
                        </label>
                        {watch(`questions.${index}.type`) === 'select' ? (
                          <div className="space-y-2">
                            {(watch(`questions.${index}.options`) || [])
                              .filter((opt: string) => opt?.trim())
                              .map((optionText: string, optIndex: number) => (
                                <label key={optIndex} className="flex items-center space-x-2 cursor-pointer">
                                  <input
                                    type="radio"
                                    value={optionText}
                                    {...register(`questions.${index}.correctAnswer`, { required: 'Select the correct answer' })}
                                    className="text-red-600"
                                  />
                                  <span className="text-gray-900">{optionText}</span>
                                </label>
                              ))}
                            {(watch(`questions.${index}.options`) || []).filter((o: string) => o?.trim()).length === 0 && (
                              <p className="text-xs text-gray-500">Fill in options above first, then select the correct one.</p>
                            )}
                          </div>
                        ) : watch(`questions.${index}.type`) === 'multiple-choice' ? (
                          <>
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
                              Select which option is the correct answer.
                            </p>
                          </>
                        ) : (
                          <>
                            <Input
                              {...register(`questions.${index}.correctAnswer`, { required: 'Correct answer is required' })}
                              placeholder="Enter the expected answer (for manual grading reference)"
                              className="bg-white border-gray-300 text-gray-900 placeholder-gray-400"
                            />
                            <p className="mt-1 text-xs text-gray-600">
                              This answer will be used as a reference for manual grading.
                            </p>
                          </>
                        )}
                      </div>
                    )}

                    {/* Correct Answers for checkbox */}
                    {watch(`questions.${index}.type`) === 'checkbox' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">
                          Correct Answers * (Select all that apply)
                        </label>
                        <div className="space-y-2">
                          {[0, 1, 2, 3].map((optIndex) => {
                            const optionText = watch(`questions.${index}.options.${optIndex}`)
                            const currentAnswers = watch(`questions.${index}.correctAnswers`) || []
                            const isEmpty = !optionText || optionText.trim() === ''
                            
                            return (
                              <label 
                                key={optIndex} 
                                className={`flex items-center space-x-2 ${isEmpty ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                              >
                                <input
                                  type="checkbox"
                                  checked={!isEmpty && Array.isArray(currentAnswers) && currentAnswers.includes(optionText)}
                                  disabled={isEmpty}
                                  onChange={(e) => {
                                    if (isEmpty) return
                                    const current = watch(`questions.${index}.correctAnswers`) || []
                                    const newAnswers = e.target.checked
                                      ? [...(Array.isArray(current) ? current : []), optionText]
                                      : (Array.isArray(current) ? current.filter((a: string) => a !== optionText) : [])
                                    setValue(`questions.${index}.correctAnswers`, newAnswers)
                                  }}
                                  className="rounded border-gray-300 bg-white text-gray-900 focus:ring-red-500 disabled:opacity-50"
                                />
                                <span className={`text-gray-900 ${isEmpty ? 'text-gray-400' : ''}`}>
                                  {optionText || `Option ${optIndex + 1} (fill in option above first)`}
                                </span>
                              </label>
                            )
                          })}
                        </div>
                        <p className="mt-1 text-xs text-gray-600">
                          Select all options that are correct answers. Fill in the options above first.
                        </p>
                      </div>
                    )}

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
                  Creating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Create Quiz
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

