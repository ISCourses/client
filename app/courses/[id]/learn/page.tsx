'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { BookOpen, Play, CheckCircle, Clock, Trophy, ArrowLeft, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import ContentBlocksRenderer from '@/components/ContentBlocksRenderer'

interface Lesson {
  _id: string
  title: string
  content: string
  contentBlocks?: Array<{
    type: 'text' | 'image' | 'video' | 'button'
    content: string
    order: number
    metadata?: { url?: string; openInNewTab?: boolean }
  }>
  order: number
  duration: number
  isPublished: boolean
}

interface Quiz {
  _id: string
  title: string
  description: string
  order: number
  questions: any[]
  timeLimit: number
  passingScore: number
}

interface Course {
  _id: string
  title: string
  description: string
  instructor: {
    name: string
  }
  lessons: Lesson[]
  quizzes: Quiz[]
  enrolledStudents: string[]
}

export default function CourseLearnPage() {
  const params = useParams()
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [course, setCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const [completedLessons, setCompletedLessons] = useState<string[]>([])
  const [currentQuiz, setCurrentQuiz] = useState<any>(null)
  const [showQuiz, setShowQuiz] = useState(false)
  const [loadingProgress, setLoadingProgress] = useState(true)
  const [quizAnswers, setQuizAnswers] = useState<{ [key: number]: string | string[] }>({})
  const [quizResults, setQuizResults] = useState<any>(null)
  const [submittingQuiz, setSubmittingQuiz] = useState(false)
  const [previousAttempt, setPreviousAttempt] = useState<any>(null)
  const [loadingPreviousAttempt, setLoadingPreviousAttempt] = useState(false)

  useEffect(() => {
    if (params.id) {
      fetchCourse()
    }
  }, [params.id])

  useEffect(() => {
    // Wait for auth to finish loading before checking user
    if (authLoading) {
      return
    }
    
    // Only redirect if auth has finished loading and there's no user
    if (!user) {
      toast.error('Please login to access course content')
      router.push('/login')
      return
    }
    
    if (course && user) {
      const isEnrolled = checkEnrollment()
      if (isEnrolled) {
        fetchProgress()
      }
    }
  }, [course, user, authLoading])

  const fetchCourse = async () => {
    try {
      const response = await api.get(`/courses/${params.id}`)
      setCourse(response.data)
    } catch (error) {
      console.error('Failed to fetch course:', error)
      toast.error('Failed to load course')
    } finally {
      setLoading(false)
    }
  }

  const checkEnrollment = () => {
    if (user && course) {
      const isEnrolled = user.enrolledCourses?.some(
        enrollment => enrollment.course._id === course._id || enrollment.course === course._id
      )
      if (!isEnrolled) {
        toast.error('You must be enrolled in this course to access learning content')
        router.push(`/courses/${params.id}`)
        return false
      }
      return true
    }
    return false
  }

  const fetchProgress = async () => {
    if (!course || !user) return
    
    try {
      setLoadingProgress(true)
      const response = await api.get(`/courses/${params.id}/progress`)
      setProgress(response.data.progress || 0)
      // Convert all lesson IDs to strings for consistent comparison
      const completedIds = (response.data.completedLessons || []).map((id: any) => id.toString())
      setCompletedLessons(completedIds)
      
      // Restore the current lesson index from saved progress
      if (response.data.currentLessonIndex !== undefined) {
        const savedIndex = response.data.currentLessonIndex
        // Make sure the index is valid
        if (savedIndex >= 0 && savedIndex < course.lessons.length) {
          setCurrentLessonIndex(savedIndex)
        }
      }
    } catch (error: any) {
      console.error('Failed to fetch progress:', error)
      // If progress endpoint fails, try to get from user object
      const enrollment = user.enrolledCourses?.find(
        enrollment => enrollment.course._id === course._id || enrollment.course === course._id
      )
      if (enrollment) {
        setProgress(enrollment.progress || 0)
        // Convert completed lessons to strings
        const completedIds = (enrollment.completedLessons || []).map((id: any) => id.toString())
        setCompletedLessons(completedIds)
        // Try to find first incomplete lesson
        if (course.lessons.length > 0) {
          const firstIncompleteIndex = course.lessons.findIndex(
            lesson => !completedIds.includes(lesson._id.toString())
          )
          if (firstIncompleteIndex !== -1) {
            setCurrentLessonIndex(firstIncompleteIndex)
          }
        }
      }
    } finally {
      setLoadingProgress(false)
    }
  }

  const getUnifiedContent = () => {
    if (!course) return []
    // Combine lessons and quizzes, sort by order
    const allContent = [
      ...course.lessons.map(lesson => ({ 
        type: 'lesson' as const, 
        data: lesson, 
        order: lesson.order || 0 
      })),
      ...course.quizzes.map(quiz => ({ 
        type: 'quiz' as const, 
        data: quiz, 
        order: quiz.order || 9999 
      }))
    ].sort((a, b) => a.order - b.order)
    
    return allContent
  }

  const nextLesson = async () => {
    if (!course || !user) return
    
    // If currently viewing a quiz, move to next item in unified order
    if (showQuiz && currentQuiz) {
      const unifiedContent = getUnifiedContent()
      const currentIndex = unifiedContent.findIndex(
        item => item.type === 'quiz' && item.data._id === currentQuiz._id
      )
      
      if (currentIndex < unifiedContent.length - 1) {
        const nextItem = unifiedContent[currentIndex + 1]
        if (nextItem.type === 'quiz') {
          await selectQuiz(nextItem.data as Quiz)
        } else {
          const lesson = nextItem.data as Lesson
          const lessonIndex = course.lessons.findIndex(l => l._id === lesson._id)
          if (lessonIndex !== -1) {
            setCurrentLessonIndex(lessonIndex)
            setShowQuiz(false)
            setCurrentQuiz(null)
            try {
              await api.put(`/courses/${params.id}/progress`, {
                currentLessonIndex: lessonIndex
              })
            } catch (error) {
              console.error('Failed to save lesson index:', error)
            }
          }
        }
      }
      return
    }
    
    // If viewing a lesson, mark it complete and move to next item
    const currentLesson = course.lessons[currentLessonIndex]
    if (!currentLesson) return
    
    // First, mark current lesson as complete if it's not already completed
    const currentLessonId = currentLesson._id.toString()
    if (!completedLessons.includes(currentLessonId)) {
      try {
        // Mark lesson as complete via API
        const response = await api.post(`/courses/${params.id}/lessons/${currentLesson._id}/complete`)
        
        // Update local state with response data
        setProgress(response.data.progress || 0)
        // Convert all lesson IDs to strings for consistent comparison
        const completedIds = (response.data.completedLessons || []).map((id: any) => id.toString())
        setCompletedLessons(completedIds)
      } catch (error: any) {
        console.error('Failed to mark lesson complete:', error)
        toast.error(error.response?.data?.message || 'Failed to mark lesson complete')
      }
    }
    
    // Find next item in unified order
    const unifiedContent = getUnifiedContent()
    const currentIndex = unifiedContent.findIndex(
      item => item.type === 'lesson' && item.data._id === currentLesson._id
    )
    
    if (currentIndex < unifiedContent.length - 1) {
      const nextItem = unifiedContent[currentIndex + 1]
      
      if (nextItem.type === 'quiz') {
        // Next item is a quiz
        await selectQuiz(nextItem.data as Quiz)
      } else {
        // Next item is a lesson
        const nextLesson = nextItem.data as Lesson
        const nextLessonIndex = course.lessons.findIndex(l => l._id === nextLesson._id)
        if (nextLessonIndex !== -1) {
          setCurrentLessonIndex(nextLessonIndex)
          setShowQuiz(false)
          setCurrentQuiz(null)
          try {
            await api.put(`/courses/${params.id}/progress`, {
              currentLessonIndex: nextLessonIndex
            })
          } catch (error) {
            console.error('Failed to save lesson index:', error)
          }
        }
      }
    }
  }

  const prevLesson = async () => {
    if (!course) return
    
    // If currently viewing a quiz, move to previous item in unified order
    if (showQuiz && currentQuiz) {
      const unifiedContent = getUnifiedContent()
      const currentIndex = unifiedContent.findIndex(
        item => item.type === 'quiz' && item.data._id === currentQuiz._id
      )
      
      if (currentIndex > 0) {
        const prevItem = unifiedContent[currentIndex - 1]
        if (prevItem.type === 'quiz') {
          await selectQuiz(prevItem.data as Quiz)
        } else {
          const lesson = prevItem.data as Lesson
          const lessonIndex = course.lessons.findIndex(l => l._id === lesson._id)
          if (lessonIndex !== -1) {
            setCurrentLessonIndex(lessonIndex)
            setShowQuiz(false)
            setCurrentQuiz(null)
            try {
              await api.put(`/courses/${params.id}/progress`, {
                currentLessonIndex: lessonIndex
              })
            } catch (error) {
              console.error('Failed to save lesson index:', error)
            }
          }
        }
      }
      return
    }
    
    // If viewing a lesson, move to previous item in unified order
    const currentLesson = course.lessons[currentLessonIndex]
    if (!currentLesson) return
    
    const unifiedContent = getUnifiedContent()
    const currentIndex = unifiedContent.findIndex(
      item => item.type === 'lesson' && item.data._id === currentLesson._id
    )
    
    if (currentIndex > 0) {
      const prevItem = unifiedContent[currentIndex - 1]
      
      if (prevItem.type === 'quiz') {
        // Previous item is a quiz
        await selectQuiz(prevItem.data as Quiz)
      } else {
        // Previous item is a lesson
        const prevLesson = prevItem.data as Lesson
        const prevLessonIndex = course.lessons.findIndex(l => l._id === prevLesson._id)
        if (prevLessonIndex !== -1) {
          setCurrentLessonIndex(prevLessonIndex)
          setShowQuiz(false)
          setCurrentQuiz(null)
          try {
            await api.put(`/courses/${params.id}/progress`, {
              currentLessonIndex: prevLessonIndex
            })
          } catch (error) {
            console.error('Failed to save lesson index:', error)
          }
        }
      }
    }
  }

  const selectQuiz = async (quiz: any) => {
    setCurrentQuiz(quiz)
    setShowQuiz(true)
    setQuizAnswers({})
    setQuizResults(null)
    setPreviousAttempt(null)
    
    // Fetch previous quiz attempts for this quiz
    await fetchPreviousQuizAttempt(quiz._id)
  }

  const fetchPreviousQuizAttempt = async (quizId: string) => {
    if (!user) return
    
    setLoadingPreviousAttempt(true)
    try {
      // Fetch user's quiz attempts
      const response = await api.get('/quizzes/user/attempts')
      const attempts = response.data || []
      
      // Find the most recent attempt for this quiz
      const quizAttempts = attempts.filter((attempt: any) => {
        const attemptQuizId = attempt.quiz?._id || attempt.quiz || attempt.quizId
        return attemptQuizId === quizId || attemptQuizId?.toString() === quizId
      })
      
      if (quizAttempts.length > 0) {
        // Get the most recent attempt (last one in array, or sort by attemptedAt)
        const mostRecent = quizAttempts.sort((a: any, b: any) => {
          const dateA = new Date(a.attemptedAt).getTime()
          const dateB = new Date(b.attemptedAt).getTime()
          return dateB - dateA
        })[0]
        
        setPreviousAttempt(mostRecent)
        
        // Convert previous attempt to quizResults format for display
        const quiz = course?.quizzes.find((q: any) => q._id === quizId)
        if (quiz) {
          setQuizResults({
            score: mostRecent.score,
            totalQuestions: mostRecent.totalQuestions,
            passed: mostRecent.score >= (quiz.passingScore || 70),
            answers: mostRecent.answers || []
          })
          
          // Restore the answers that were selected
          const restoredAnswers: { [key: number]: string } = {}
          quiz.questions.forEach((question: any, index: number) => {
            const answerData = mostRecent.answers.find((a: any) => 
              a.questionId === question._id || a.questionId?.toString() === question._id.toString()
            )
            if (answerData && answerData.selectedAnswer) {
              // Find the index of the selected answer in the options
              const optionIndex = question.options.findIndex((opt: string) => 
                opt === answerData.selectedAnswer
              )
              if (optionIndex !== -1) {
                restoredAnswers[index] = optionIndex.toString()
              }
            }
          })
          setQuizAnswers(restoredAnswers)
        }
      }
    } catch (error: any) {
      console.error('Failed to fetch previous quiz attempt:', error)
      // Don't show error to user, just continue without previous attempt
    } finally {
      setLoadingPreviousAttempt(false)
    }
  }

  const backToLessons = () => {
    setShowQuiz(false)
    setCurrentQuiz(null)
    setQuizAnswers({})
    setQuizResults(null)
    setPreviousAttempt(null)
  }

  const handleQuizAnswerChange = (questionIndex: number, answer: string | string[]) => {
    setQuizAnswers(prev => ({
      ...prev,
      [questionIndex]: answer
    }))
  }

  const handleCheckboxChange = (questionIndex: number, option: string, checked: boolean) => {
    setQuizAnswers(prev => {
      const current = prev[questionIndex]
      const currentArray = Array.isArray(current) ? current : (current ? [current] : [])
      const newArray = checked
        ? [...currentArray, option]
        : currentArray.filter((a: string) => a !== option)
      return {
        ...prev,
        [questionIndex]: newArray
      }
    })
  }

  const submitQuiz = async () => {
    if (!currentQuiz || !user) return

    // Validate that all questions are answered
    const totalQuestions = currentQuiz.questions.length
    const answeredQuestions = Object.keys(quizAnswers).filter(key => {
      const answer = quizAnswers[parseInt(key)]
      return answer !== undefined && answer !== null && answer !== '' && 
             (Array.isArray(answer) ? answer.length > 0 : true)
    }).length
    
    if (answeredQuestions < totalQuestions) {
      toast.error(`Please answer all ${totalQuestions} questions before submitting`)
      return
    }

    setSubmittingQuiz(true)
    try {
      // Prepare answers array in the order of questions
      const answers = currentQuiz.questions.map((question: any, index: number) => {
        const answer = quizAnswers[index]
        const questionType = question.type || 'multiple-choice'
        
        // For checkbox, return array; for others, return string
        if (questionType === 'checkbox') {
          return Array.isArray(answer) ? answer : (answer ? [answer] : [])
        }
        
        // For other types, return string
        return Array.isArray(answer) ? answer.join(', ') : (answer || '')
      })

      // Submit quiz attempt
      const response = await api.post(`/quizzes/${currentQuiz._id}/attempt`, {
        answers
      })

      setQuizResults(response.data)
      
      // Show appropriate message based on grading status
      if (response.data.manualGradingRequired) {
        toast.success('Quiz submitted! Your answers are being reviewed and will be graded manually.')
      } else {
        toast.success(`Quiz submitted! Score: ${response.data.score}%`)
      }
      
      // Refresh previous attempt to show the new one
      if (currentQuiz) {
        await fetchPreviousQuizAttempt(currentQuiz._id)
      }
    } catch (error: any) {
      console.error('Failed to submit quiz:', error)
      toast.error(error.response?.data?.message || 'Failed to submit quiz')
    } finally {
      setSubmittingQuiz(false)
    }
  }

  const markLessonComplete = async () => {
    if (!user || !course) return
    
    const currentLesson = course.lessons[currentLessonIndex]
    if (!currentLesson) return

    try {
      // Mark lesson as complete via API
      const response = await api.post(`/courses/${params.id}/lessons/${currentLesson._id}/complete`)
      
      // Update local state with response data
      setProgress(response.data.progress || 0)
      // Convert all lesson IDs to strings for consistent comparison
      const completedIds = (response.data.completedLessons || []).map((id: any) => id.toString())
      setCompletedLessons(completedIds)
      
      // Update current lesson index if it changed
      if (response.data.currentLessonIndex !== undefined) {
        setCurrentLessonIndex(response.data.currentLessonIndex)
      }
      
      toast.success('Lesson marked as complete!')
    } catch (error: any) {
      console.error('Failed to update progress:', error)
      toast.error(error.response?.data?.message || 'Failed to update progress')
    }
  }

  // Show loading state while auth is loading or course is loading
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              <div className="lg:col-span-1">
                <div className="h-64 bg-gray-200 rounded"></div>
              </div>
              <div className="lg:col-span-3">
                <div className="h-96 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Course not found</h1>
            <Link href="/courses">
              <Button>Back to Courses</Button>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  const currentLesson = course.lessons[currentLessonIndex]

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Course Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
            <Link href="/courses" className="hover:text-red-600">Courses</Link>
            <span>/</span>
            <Link href={`/courses/${course._id}`} className="hover:text-red-600">{course.title}</Link>
            <span>/</span>
            <span>Learn</span>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{course.title}</h1>
          <p className="text-gray-600">Learn at your own pace</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Course Content */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle className="text-lg">Course Content</CardTitle>
                <CardDescription>
                  {course.lessons.length} lessons • {course.quizzes.length} quizzes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {(() => {
                    // Combine lessons and quizzes, sort by order
                    const allContent = [
                      ...course.lessons.map(lesson => ({ type: 'lesson' as const, data: lesson, order: lesson.order || 0 })),
                      ...course.quizzes.map(quiz => ({ type: 'quiz' as const, data: quiz, order: quiz.order || 9999 }))
                    ].sort((a, b) => a.order - b.order)

                    return allContent.map((item, index) => {
                      if (item.type === 'lesson') {
                        const lesson = item.data as Lesson
                        const lessonIndex = course.lessons.findIndex(l => l._id === lesson._id)
                        return (
                    <div
                      key={lesson._id}
                      className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${
                              lessonIndex === currentLessonIndex && !showQuiz
                          ? 'bg-red-50 border border-red-200'
                          : 'hover:bg-gray-50'
                      }`}
                            onClick={async () => {
                              setCurrentLessonIndex(lessonIndex)
                        setShowQuiz(false)
                        setCurrentQuiz(null)
                              
                              // Save current lesson index to backend
                              try {
                                await api.put(`/courses/${params.id}/progress`, {
                                  currentLessonIndex: lessonIndex
                                })
                              } catch (error) {
                                console.error('Failed to save lesson index:', error)
                              }
                      }}
                    >
                      <div className="flex-shrink-0">
                              {completedLessons.includes(lesson._id.toString()) ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <Play className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {lesson.title}
                        </h4>
                        <p className="text-xs text-gray-500">{lesson.duration} min</p>
                      </div>
                    </div>
                        )
                      } else {
                        const quiz = item.data as Quiz
                        return (
                    <div
                      key={quiz._id}
                      className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${
                        showQuiz && currentQuiz?._id === quiz._id
                          ? 'bg-yellow-50 border border-yellow-200'
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => selectQuiz(quiz)}
                    >
                      <div className="flex-shrink-0">
                        <Trophy className="h-5 w-5 text-yellow-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {quiz.title}
                        </h4>
                        <p className="text-xs text-gray-500">{quiz.questions.length} questions</p>
                      </div>
                    </div>
                        )
                      }
                    })
                  })()}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content - Current Lesson or Quiz */}
          <div className="lg:col-span-3">
            {showQuiz && currentQuiz ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl flex items-center">
                        <Trophy className="h-6 w-6 text-yellow-500 mr-2" />
                        {currentQuiz.title}
                      </CardTitle>
                      <CardDescription>
                        Quiz • {currentQuiz.questions.length} questions
                        {previousAttempt && (
                          <span className="ml-2 text-gray-500">
                            • Last attempted: {new Date(previousAttempt.attemptedAt).toLocaleDateString()}
                          </span>
                        )}
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {currentQuiz.timeLimit || 30} min
                      </Badge>
                      <Button variant="outline" onClick={backToLessons}>
                        Back to Lessons
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {loadingPreviousAttempt ? (
                    <div className="text-center py-8">
                      <div className="animate-pulse">
                        <div className="h-8 bg-gray-200 rounded w-1/2 mx-auto mb-4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/3 mx-auto"></div>
                      </div>
                    </div>
                  ) : (
                  <div className="space-y-6">
                      {!quizResults && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <h4 className="font-medium text-yellow-800 mb-2">Quiz Instructions</h4>
                      <p className="text-yellow-700 text-sm">
                        {currentQuiz.description || 'Answer all questions to complete this quiz. You can review your answers before submitting.'}
                      </p>
                          {previousAttempt && (
                            <p className="text-yellow-700 text-sm mt-2">
                              <strong>Previous Score:</strong> {previousAttempt.score}% (Attempted on {new Date(previousAttempt.attemptedAt).toLocaleDateString()})
                            </p>
                          )}
                    </div>
                      )}
                    
                    {quizResults ? (
                      <div className="space-y-6">
                        <div className={`border rounded-lg p-6 ${
                          quizResults.passed 
                            ? 'bg-green-50 border-green-200' 
                            : 'bg-red-50 border-red-200'
                        }`}>
                          <div className="text-center">
                            <h3 className={`text-2xl font-bold mb-2 ${
                              quizResults.passed ? 'text-green-800' : 'text-red-800'
                            }`}>
                              {quizResults.passed ? 'Congratulations! You Passed!' : 'You Did Not Pass'}
                            </h3>
                            <p className={`text-lg font-semibold mb-1 ${
                              quizResults.passed ? 'text-green-700' : 'text-red-700'
                            }`}>
                              Score: {quizResults.score}%
                            </p>
                            <p className="text-sm text-gray-600">
                              {quizResults.score} out of {quizResults.totalQuestions} questions correct
                            </p>
                            <p className="text-sm text-gray-600 mt-2">
                              Passing Score: {currentQuiz.passingScore || 70}%
                            </p>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <h4 className="font-semibold text-lg">Review Your Answers:</h4>
                          {currentQuiz.questions.map((question: any, index: number) => {
                            const questionType = question.type || 'multiple-choice'
                            const resultAnswer = quizResults.answers.find((a: any) => 
                              a.questionId === question._id || a.questionId?.toString() === question._id?.toString()
                            )
                            const userAnswer = resultAnswer?.selectedAnswer || quizAnswers[index]
                            const isCorrect = resultAnswer?.isCorrect || false
                            const correctAnswer = question.correctAnswer
                            const correctAnswers = question.correctAnswers || []

                            // Format user answer for display
                            let userAnswerText = ''
                            if (Array.isArray(userAnswer)) {
                              userAnswerText = userAnswer.join(', ')
                            } else {
                              userAnswerText = userAnswer || ''
                            }

                            return (
                              <div 
                                key={question._id || index} 
                                className={`border rounded-lg p-4 ${
                                  isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                                }`}
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <h5 className="font-medium text-gray-900">
                                    Question {index + 1}: {question.question}
                                  </h5>
                                  {isCorrect ? (
                                    <span className="text-green-600 font-semibold">✓ Correct</span>
                                  ) : (
                                    <span className="text-red-600 font-semibold">✗ Incorrect</span>
                                  )}
                                </div>
                                
                                {/* Display for questions with options (multiple-choice, select, checkbox) */}
                                {(questionType === 'multiple-choice' || questionType === 'select' || questionType === 'checkbox') && question.options && question.options.length > 0 ? (
                                  <div className="space-y-2 mt-3">
                                    {question.options.map((option: string, optionIndex: number) => {
                                      const isSelected = Array.isArray(userAnswer) 
                                        ? userAnswer.includes(option)
                                        : userAnswer === option
                                      const isCorrectOption = questionType === 'checkbox'
                                        ? correctAnswers.includes(option)
                                        : option === correctAnswer
                                      
                                      return (
                                        <div
                                          key={optionIndex}
                                          className={`p-2 rounded ${
                                            isCorrectOption
                                              ? 'bg-green-100 border border-green-300'
                                              : isSelected && !isCorrectOption
                                              ? 'bg-red-100 border border-red-300'
                                              : 'bg-gray-50'
                                          }`}
                                        >
                                          <span className="text-gray-700">{option}</span>
                                          {isCorrectOption && (
                                            <span className="ml-2 text-green-600 font-semibold">(Correct Answer)</span>
                                          )}
                                          {isSelected && !isCorrectOption && (
                                            <span className="ml-2 text-red-600 font-semibold">(Your Answer)</span>
                                          )}
                                          {isSelected && isCorrectOption && (
                                            <span className="ml-2 text-green-600 font-semibold">(Your Answer)</span>
                                          )}
                                        </div>
                                      )
                                    })}
                                  </div>
                                ) : (
                                  /* Display for text/textarea questions */
                                  <div className="space-y-2 mt-3">
                                    <div className="bg-gray-50 p-3 rounded border border-gray-200">
                                      <p className="text-sm font-medium text-gray-700 mb-1">Your Answer:</p>
                                      <p className="text-gray-900">{userAnswerText || 'No answer provided'}</p>
                                    </div>
                                    {correctAnswer && (
                                      <div className="bg-blue-50 p-3 rounded border border-blue-200">
                                        <p className="text-sm font-medium text-gray-700 mb-1">Expected Answer:</p>
                                        <p className="text-gray-900">{correctAnswer}</p>
                                      </div>
                                    )}
                                  </div>
                                )}
                                {question.explanation && (
                                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                                    <p className="text-sm text-blue-800">
                                      <strong>Explanation:</strong> {question.explanation}
                                    </p>
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>

                        <div className="flex justify-end space-x-4 pt-4 border-t">
                          <Button 
                            variant="outline" 
                            onClick={backToLessons}
                          >
                            Back to Lessons
                          </Button>
                          <Button 
                            onClick={() => {
                              setQuizResults(null)
                              setQuizAnswers({})
                              setPreviousAttempt(null)
                            }}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Retake Quiz
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                    <div className="space-y-4">
                      {currentQuiz.questions.map((question: any, index: number) => {
                        const questionType = question.type || 'multiple-choice'
                        const currentAnswer = quizAnswers[index]
                        
                        return (
                          <div key={question._id || index} className="border rounded-lg p-4">
                            <h5 className="font-medium text-gray-900 mb-3">
                              Question {index + 1}: {question.question}
                            </h5>
                            
                            {/* Multiple Choice */}
                            {questionType === 'multiple-choice' && question.options && (
                              <div className="space-y-2">
                                {question.options.map((option: string, optionIndex: number) => (
                                  <label key={optionIndex} className="flex items-center space-x-3 cursor-pointer">
                                    <input
                                      type="radio"
                                      name={`question-${index}`}
                                      value={option}
                                      checked={currentAnswer === option}
                                      onChange={(e) => handleQuizAnswerChange(index, e.target.value)}
                                      className="text-red-600 focus:ring-red-500"
                                    />
                                    <span className="text-gray-700">{option}</span>
                                  </label>
                                ))}
                              </div>
                            )}

                            {/* Select — radio buttons, only filled options shown */}
                            {questionType === 'select' && question.options && (
                              <div className="space-y-2">
                                {question.options.filter((o: string) => o?.trim()).map((option: string, optionIndex: number) => (
                                  <label key={optionIndex} className="flex items-center space-x-3 cursor-pointer">
                                    <input
                                      type="radio"
                                      name={`question-${index}`}
                                      value={option}
                                      checked={currentAnswer === option}
                                      onChange={(e) => handleQuizAnswerChange(index, e.target.value)}
                                      className="text-red-600 focus:ring-red-500"
                                    />
                                    <span className="text-gray-700">{option}</span>
                                  </label>
                                ))}
                              </div>
                            )}

                            {/* Checkbox */}
                            {questionType === 'checkbox' && question.options && (
                              <div className="space-y-2">
                                {question.options.map((option: string, optionIndex: number) => {
                                  const isChecked = Array.isArray(currentAnswer) 
                                    ? currentAnswer.includes(option)
                                    : currentAnswer === option
                                  return (
                                    <label key={optionIndex} className="flex items-center space-x-3 cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={(e) => handleCheckboxChange(index, option, e.target.checked)}
                                        className="text-red-600 focus:ring-red-500"
                                      />
                                      <span className="text-gray-700">{option}</span>
                                    </label>
                                  )
                                })}
                              </div>
                            )}

                            {/* Text */}
                            {questionType === 'text' && (
                              <input
                                type="text"
                                value={currentAnswer || ''}
                                onChange={(e) => handleQuizAnswerChange(index, e.target.value)}
                                placeholder="Enter your answer"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
                              />
                            )}

                            {/* Fill in the blank */}
                            {questionType === 'fill-in-blank' && (
                              <input
                                type="text"
                                value={currentAnswer || ''}
                                onChange={(e) => handleQuizAnswerChange(index, e.target.value)}
                                placeholder="Fill in the blank"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
                              />
                            )}

                            {/* Textarea */}
                            {questionType === 'textarea' && (
                              <textarea
                                value={currentAnswer || ''}
                                onChange={(e) => handleQuizAnswerChange(index, e.target.value)}
                                placeholder="Enter your answer"
                                rows={4}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
                              />
                            )}
                          </div>
                        )
                      })}
                    </div>
                    
                    <div className="flex justify-between items-center pt-4 border-t">
                      <p className="text-sm text-gray-500">
                        {Object.keys(quizAnswers).filter(key => {
                          const answer = quizAnswers[parseInt(key)]
                          return answer !== undefined && answer !== null && answer !== '' && 
                                 (Array.isArray(answer) ? answer.length > 0 : true)
                        }).length} of {currentQuiz.questions.length} questions answered
                      </p>
                      <Button 
                        onClick={submitQuiz}
                        disabled={submittingQuiz || Object.keys(quizAnswers).filter(key => {
                          const answer = quizAnswers[parseInt(key)]
                          return answer !== undefined && answer !== null && answer !== '' && 
                                 (Array.isArray(answer) ? answer.length > 0 : true)
                        }).length < currentQuiz.questions.length}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        {submittingQuiz ? 'Submitting...' : 'Submit Quiz'}
                      </Button>
                    </div>
                      </>
                    )}
                  </div>)}
                </CardContent>
              </Card>
            ) : currentLesson ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl">{currentLesson.title}</CardTitle>
                      <CardDescription>
                        Lesson {currentLessonIndex + 1} of {course.lessons.length}
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {currentLesson.duration} min
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {currentLesson.contentBlocks && currentLesson.contentBlocks.length > 0 ? (
                    <ContentBlocksRenderer blocks={currentLesson.contentBlocks} />
                  ) : (
                    <div className="prose max-w-none">
                      <div 
                        className="text-gray-700 leading-relaxed"
                        dangerouslySetInnerHTML={{ 
                          __html: currentLesson.content.replace(/\n/g, '<br />') 
                        }}
                      />
                    </div>
                  )}
                  
                  {/* Show "Start Quiz" button at the end of final lesson (only if there are quizzes after this lesson) */}
                  {(() => {
                    const unifiedContent = getUnifiedContent()
                    const currentIndex = unifiedContent.findIndex(
                      item => item.type === 'lesson' && item.data._id === currentLesson._id
                    )
                    const isLastItem = currentIndex === unifiedContent.length - 1
                    const hasQuizzesAfter = currentIndex < unifiedContent.length - 1 && 
                      unifiedContent.slice(currentIndex + 1).some(item => item.type === 'quiz')
                    
                    // Only show quiz prompt if there are quizzes after this lesson but not if this is the last item
                    if (currentLessonIndex === course.lessons.length - 1 && course.quizzes.length > 0 && !isLastItem && hasQuizzesAfter) {
                      return (
                        <div className="mt-8 pt-8 border-t border-gray-200">
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                            <Trophy className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                              Congratulations! You've completed all lessons.
                            </h3>
                            <p className="text-gray-600 mb-6">
                              Test your knowledge by taking the quiz.
                            </p>
                            <Button
                              onClick={() => {
                                // Select the first quiz if available
                                if (course.quizzes.length > 0) {
                                  selectQuiz(course.quizzes[0])
                                }
                              }}
                              className="bg-yellow-500 hover:bg-yellow-600 text-white"
                              size="lg"
                            >
                              <Trophy className="h-5 w-5 mr-2" />
                              {course.quizzes.length === 1 ? 'Start Quiz' : 'Take the Quiz'}
                            </Button>
                          </div>
                        </div>
                      )
                    }
                    return null
                  })()}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No content selected</h3>
                  <p className="text-gray-500">Choose a lesson or quiz from the sidebar to start learning</p>
                </CardContent>
              </Card>
            )}

            {/* Navigation */}
            {currentLesson && !showQuiz && (() => {
              const unifiedContent = getUnifiedContent()
              const currentIndex = unifiedContent.findIndex(
                item => item.type === 'lesson' && item.data._id === currentLesson._id
              )
              const isLastItem = currentIndex === unifiedContent.length - 1
              
              if (isLastItem) {
                // Show "Finish Course" section
                return (
                  <div className="mt-6">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                      <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        🎉 Congratulations! You've completed the course!
                      </h3>
                      <p className="text-gray-600 mb-6">
                        You've finished all lessons and quizzes. Great job!
                      </p>
                      <div className="flex justify-center space-x-4">
                        <Button
                          variant="outline"
                          onClick={prevLesson}
                          disabled={currentIndex === 0}
                          className="flex items-center"
                        >
                          <ArrowLeft className="h-4 w-4 mr-2" />
                          Previous
                        </Button>
                        <Link href={`/courses/${course._id}`}>
                          <Button className="bg-green-600 hover:bg-green-700 text-white flex items-center">
                            Finish Course
                            <CheckCircle className="h-4 w-4 ml-2" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                )
              }
              
              // Normal navigation
              return (
                <div className="mt-6 flex justify-between">
                  <Button
                    variant="outline"
                    onClick={prevLesson}
                    disabled={currentIndex === 0}
                    className="flex items-center"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Previous
                  </Button>

                  <div className="flex space-x-4">
                    <Button
                      variant="outline"
                      onClick={markLessonComplete}
                      className="flex items-center"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Mark Complete
                    </Button>

                    <Button
                      onClick={nextLesson}
                      className="flex items-center"
                    >
                      Next
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </div>
              )
            })()}
            
            {/* Navigation for Quiz */}
            {showQuiz && currentQuiz && (() => {
              const unifiedContent = getUnifiedContent()
              const currentIndex = unifiedContent.findIndex(
                item => item.type === 'quiz' && item.data._id === currentQuiz._id
              )
              const isLastItem = currentIndex === unifiedContent.length - 1
              
              if (isLastItem) {
                // Show "Finish Course" section
                return (
                  <div className="mt-6">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                      <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        🎉 Congratulations! You've completed the course!
                      </h3>
                      <p className="text-gray-600 mb-6">
                        You've finished all lessons and quizzes. Great job!
                      </p>
                      <div className="flex justify-center space-x-4">
                        <Button
                          variant="outline"
                          onClick={prevLesson}
                          disabled={currentIndex === 0}
                          className="flex items-center"
                        >
                          <ArrowLeft className="h-4 w-4 mr-2" />
                          Previous
                        </Button>
                        <Link href={`/courses/${course._id}`}>
                          <Button className="bg-green-600 hover:bg-green-700 text-white flex items-center">
                            Finish Course
                            <CheckCircle className="h-4 w-4 ml-2" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                )
              }
              
              // Normal navigation
              return (
                <div className="mt-6 flex justify-between">
                  <Button
                    variant="outline"
                    onClick={prevLesson}
                    disabled={currentIndex === 0}
                    className="flex items-center"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Previous
                  </Button>

                  <Button
                    onClick={nextLesson}
                    className="flex items-center"
                  >
                    Next
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              )
            })()}

            {/* Progress Bar */}
            <div className="mt-8">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Course Progress</span>
                    <span className="text-sm text-gray-500">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
