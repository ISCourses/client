'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Check, X, Loader2, Save } from 'lucide-react'
import Link from 'next/link'
import AdminSidebar from '@/components/AdminSidebar'
import api from '@/lib/api'
import toast from 'react-hot-toast'

interface PendingAttempt {
  userId: string
  userName: string
  userEmail: string
  attemptIndex: number
  quiz: {
    _id: string
    title: string
    course: {
      _id: string
      title: string
    }
    questions: Array<{
      _id: string
      question: string
      type: string
      correctAnswer?: string
    }>
    passingScore: number
  }
  score: number
  autoGradedScore: number
  totalQuestions: number
  answers: Array<{
    questionId: string
    selectedAnswer: any
    isCorrect: boolean
    needsManualGrading: boolean
  }>
  attemptedAt: string
}

export default function QuizGradingPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [pendingAttempts, setPendingAttempts] = useState<PendingAttempt[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [selectedAttempt, setSelectedAttempt] = useState<PendingAttempt | null>(null)
  const [grades, setGrades] = useState<Record<number, boolean>>({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchPendingAttempts()
    }
  }, [user])

  const fetchPendingAttempts = async () => {
    try {
      setLoadingData(true)
      const response = await api.get('/quizzes/pending-grading')
      setPendingAttempts(response.data)
    } catch (error: any) {
      console.error('Failed to fetch pending attempts:', error)
      toast.error('Failed to load pending quiz attempts')
    } finally {
      setLoadingData(false)
    }
  }

  const selectAttempt = (attempt: PendingAttempt) => {
    setSelectedAttempt(attempt)
    // Initialize grades with current isCorrect values (if any)
    const initialGrades: Record<number, boolean> = {}
    attempt.answers.forEach((answer, index) => {
      if (answer.needsManualGrading) {
        initialGrades[index] = answer.isCorrect || false
      }
    })
    setGrades(initialGrades)
  }

  const handleGradeChange = (questionIndex: number, isCorrect: boolean) => {
    setGrades(prev => ({
      ...prev,
      [questionIndex]: isCorrect
    }))
  }

  const submitGrading = async () => {
    if (!selectedAttempt) return

    // Validate all manual grading questions are graded
    const manualGradingQuestions = selectedAttempt.answers
      .map((answer, index) => ({ answer, index }))
      .filter(({ answer }) => answer.needsManualGrading)

    const ungraded = manualGradingQuestions.filter(({ index }) => grades[index] === undefined)
    if (ungraded.length > 0) {
      toast.error('Please grade all questions before submitting')
      return
    }

    setSubmitting(true)
    try {
      const gradesArray = manualGradingQuestions.map(({ index }) => ({
        questionIndex: index,
        isCorrect: grades[index]
      }))

      await api.post(`/quizzes/${selectedAttempt.quiz._id}/grade`, {
        userId: selectedAttempt.userId,
        attemptIndex: selectedAttempt.attemptIndex,
        grades: gradesArray
      })

      toast.success('Quiz graded successfully!')
      setSelectedAttempt(null)
      setGrades({})
      fetchPendingAttempts()
    } catch (error: any) {
      console.error('Failed to grade quiz:', error)
      toast.error(error.response?.data?.message || 'Failed to grade quiz')
    } finally {
      setSubmitting(false)
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
            <Link href="/admin">
              <Button variant="outline" className="bg-white border-gray-300 text-gray-900 hover:bg-gray-100">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Quiz Grading</h1>
          <p className="text-gray-600">Grade quiz attempts that require manual review</p>
        </div>

        {selectedAttempt ? (
          <div className="space-y-6">
            <Card className="bg-white border-gray-200">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-gray-900">{selectedAttempt.quiz.title}</CardTitle>
                    <CardDescription className="text-gray-600">
                      Course: {selectedAttempt.quiz.course.title}
                    </CardDescription>
                    <CardDescription className="text-gray-600">
                      Student: {selectedAttempt.userName} ({selectedAttempt.userEmail})
                    </CardDescription>
                    <CardDescription className="text-gray-600">
                      Attempted: {new Date(selectedAttempt.attemptedAt).toLocaleString()}
                    </CardDescription>
                    <CardDescription className="text-gray-600">
                      Auto-graded Score: {selectedAttempt.autoGradedScore}%
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedAttempt(null)
                      setGrades({})
                    }}
                    className="bg-white border-gray-300 text-gray-900 hover:bg-gray-100"
                  >
                    Back to List
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {selectedAttempt.quiz.questions.map((question, questionIndex) => {
                  const answer = selectedAttempt.answers.find(
                    a => a.questionId.toString() === question._id.toString()
                  )
                  const needsGrading = answer?.needsManualGrading || false
                  const questionType = question.type || 'multiple-choice'

                  return (
                    <div key={question._id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <h5 className="font-medium text-gray-900 mb-2">
                            Question {questionIndex + 1}: {question.question}
                          </h5>
                          {needsGrading && (
                            <Badge variant="outline" className="bg-yellow-50 border-yellow-300 text-yellow-800">
                              Manual Grading Required
                            </Badge>
                          )}
                          {!needsGrading && (
                            <Badge variant="outline" className="bg-green-50 border-green-300 text-green-800">
                              Auto-graded: {answer?.isCorrect ? 'Correct' : 'Incorrect'}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="mt-4">
                        <p className="text-sm text-gray-600 mb-2">
                          <strong>Student Answer:</strong>
                        </p>
                        <div className="bg-gray-50 p-3 rounded border border-gray-200">
                          {Array.isArray(answer?.selectedAnswer) ? (
                            <ul className="list-disc list-inside space-y-1">
                              {answer.selectedAnswer.map((ans: string, idx: number) => (
                                <li key={idx} className="text-gray-900">{ans}</li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-gray-900">{answer?.selectedAnswer || 'No answer provided'}</p>
                          )}
                        </div>
                      </div>

                      {question.correctAnswer && (
                        <div className="mt-4">
                          <p className="text-sm text-gray-600 mb-2">
                            <strong>Expected Answer:</strong>
                          </p>
                          <div className="bg-blue-50 p-3 rounded border border-blue-200">
                            <p className="text-gray-900">{question.correctAnswer}</p>
                          </div>
                        </div>
                      )}

                      {needsGrading && (
                        <div className="mt-4 flex items-center space-x-4">
                          <p className="text-sm font-medium text-gray-900">Grade:</p>
                          <Button
                            variant={grades[questionIndex] === true ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => handleGradeChange(questionIndex, true)}
                            className={grades[questionIndex] === true 
                              ? 'bg-green-600 text-white hover:bg-green-700' 
                              : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-100'
                            }
                          >
                            <Check className="h-4 w-4 mr-2" />
                            Correct
                          </Button>
                          <Button
                            variant={grades[questionIndex] === false ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => handleGradeChange(questionIndex, false)}
                            className={grades[questionIndex] === false 
                              ? 'bg-red-600 text-white hover:bg-red-700' 
                              : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-100'
                            }
                          >
                            <X className="h-4 w-4 mr-2" />
                            Incorrect
                          </Button>
                        </div>
                      )}
                    </div>
                  )
                })}

                <div className="flex justify-end space-x-4 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedAttempt(null)
                      setGrades({})
                    }}
                    className="bg-white border-gray-300 text-gray-900 hover:bg-gray-100"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={submitGrading}
                    disabled={submitting}
                    className="bg-red-600 text-white hover:bg-red-700"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Grading...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Submit Grading
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card className="bg-white border-gray-200">
            <CardHeader>
              <CardTitle className="text-gray-900">
                Pending Grading ({pendingAttempts.length})
              </CardTitle>
              <CardDescription className="text-gray-600">
                Quiz attempts requiring manual grading
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingAttempts.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600 text-lg">No pending quiz attempts to grade</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingAttempts.map((attempt, index) => (
                    <div
                      key={index}
                      className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                      onClick={() => selectAttempt(attempt)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{attempt.quiz.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            Course: {attempt.quiz.course.title}
                          </p>
                          <p className="text-sm text-gray-600">
                            Student: {attempt.userName} ({attempt.userEmail})
                          </p>
                          <p className="text-sm text-gray-600">
                            Attempted: {new Date(attempt.attemptedAt).toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline" className="bg-yellow-50 border-yellow-300 text-yellow-800">
                            Pending
                          </Badge>
                          <p className="text-sm text-gray-600 mt-2">
                            Auto Score: {attempt.autoGradedScore}%
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
