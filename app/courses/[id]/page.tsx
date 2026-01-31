'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Clock, Users, Star, BookOpen, Play, CheckCircle, Youtube, Image, Video, FileText, Download, Eye } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { useAuth } from '@/contexts/AuthContext'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import PayPalButton from '@/components/PayPalButton'

interface Course {
  _id: string
  title: string
  description: string
  category: string
  level: string
  duration: number
  price: number
  instructor: {
    name: string
  }
  rating: {
    average: number
    count: number
  }
  enrolledStudents: string[]
  lessons: any[]
  quizzes: any[]
  thumbnail?: string
  youtubeLiveUrl?: string
  galleryImages?: string[]
  videos?: Array<{
    url: string
    title: string
    description: string
  }>
  pdfs?: Array<{
    url: string
    title: string
    allowView: boolean
    allowDownload: boolean
  }>
}

export default function CourseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user, refreshUser } = useAuth()
  const [course, setCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)
  const [enrolling, setEnrolling] = useState(false)
  const [isEnrolled, setIsEnrolled] = useState(false)

  useEffect(() => {
    if (params.id) {
      fetchCourse()
    }
  }, [params.id])

  useEffect(() => {
    if (course && user) {
      checkEnrollment()
    }
  }, [course, user])

  const fetchCourse = async () => {
    try {
      const response = await api.get(`/courses/${params.id}`)
      setCourse(response.data)
    } catch (error) {
      console.error('Failed to fetch course:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkEnrollment = () => {
    if (user && course) {
      const enrolled = user.enrolledCourses?.some(
        (enrollment: any) => {
          const courseId = enrollment.course?._id || enrollment.course || enrollment.courseId
          return courseId === course._id || courseId?.toString() === course._id
        }
      )
      setIsEnrolled(enrolled || false)
    }
  }

  const handleEnroll = async () => {
    if (!user) {
      toast.error('Please login to enroll in courses')
      router.push('/login')
      return
    }

    setEnrolling(true)
    try {
      await api.post(`/courses/${params.id}/enroll`)
      toast.success('Successfully enrolled in course!')
      // Refresh user data to get updated enrolled courses
      await refreshUser()
      // Wait a bit for user state to update, then check enrollment
      setTimeout(() => {
        checkEnrollment()
        fetchCourse()
      }, 500)
    } catch (error: any) {
      console.error('Enrollment error:', error)
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.')
        router.push('/login')
      } else {
        toast.error(error.response?.data?.message || 'Failed to enroll')
      }
    } finally {
      setEnrolling(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                <div className="h-64 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
              <div className="space-y-4">
                <div className="h-32 bg-gray-200 rounded"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
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

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
            <Link href="/courses" className="hover:text-red-600">Courses</Link>
            <span>/</span>
            <span>{course.title}</span>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{course.title}</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Course Thumbnail */}
            <div className="aspect-video bg-gray-200 rounded-lg flex items-center justify-center">
              {course.thumbnail ? (
                <img 
                  src={course.thumbnail} 
                  alt={course.title}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <div className="text-gray-400 text-lg">No thumbnail available</div>
              )}
            </div>

            {/* Course Description */}
            {course.description && (
              <div className="mt-6">
                <p className="text-gray-600 text-lg leading-relaxed">{course.description}</p>
              </div>
            )}

            {/* Course Info */}
            <Card>
              <CardHeader>
                <CardTitle>About this course</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center">
                    <Clock className="h-6 w-6 text-red-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Duration</p>
                    <p className="font-semibold">{course.duration} hours</p>
                  </div>
                  <div className="text-center">
                    <Users className="h-6 w-6 text-red-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Students</p>
                    <p className="font-semibold">{course.enrolledStudents.length}</p>
                  </div>
                  <div className="text-center">
                    <Star className="h-6 w-6 text-red-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Rating</p>
                    <p className="font-semibold">{course.rating.average.toFixed(1)}</p>
                  </div>
                  <div className="text-center">
                    <BookOpen className="h-6 w-6 text-red-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Level</p>
                    <p className="font-semibold capitalize">{course.level}</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <p><span className="font-medium">Category:</span> {course.category}</p>
                  <p><span className="font-medium">Instructor:</span> {course.instructor.name}</p>
                </div>
              </CardContent>
            </Card>

            {/* YouTube Live Stream */}
            {course.youtubeLiveUrl && (() => {
              // Extract video ID from various YouTube URL formats
              const getYouTubeVideoId = (url: string) => {
                const patterns = [
                  /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
                  /youtube\.com\/watch\?.*v=([^&\n?#]+)/
                ]
                for (const pattern of patterns) {
                  const match = url.match(pattern)
                  if (match) return match[1]
                }
                return null
              }
              
              const videoId = getYouTubeVideoId(course.youtubeLiveUrl)
              const embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}` : course.youtubeLiveUrl
              
              return (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Youtube className="h-5 w-5 mr-2 text-red-600" />
                      Live Stream
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="aspect-video rounded-lg overflow-hidden">
                      <iframe
                        src={embedUrl}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  </CardContent>
                </Card>
              )
            })()}

            {/* Gallery Images */}
            {course.galleryImages && course.galleryImages.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Image className="h-5 w-5 mr-2 text-red-600" />
                    Gallery
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {course.galleryImages.map((img, index) => (
                      <div key={index} className="aspect-square rounded-lg overflow-hidden">
                        <img 
                          src={img} 
                          alt={`Gallery ${index + 1}`}
                          className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                          onClick={() => window.open(img, '_blank')}
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Videos */}
            {course.videos && course.videos.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Video className="h-5 w-5 mr-2 text-red-600" />
                    Course Videos
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {course.videos.map((video, index) => (
                    <div key={index} className="space-y-2">
                      {video.title && (
                        <h4 className="font-semibold text-lg">{video.title}</h4>
                      )}
                      {video.description && (
                        <p className="text-gray-600">{video.description}</p>
                      )}
                      <div className="aspect-video rounded-lg overflow-hidden">
                        <video 
                          src={video.url} 
                          controls 
                          className="w-full h-full"
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* PDFs */}
            {course.pdfs && course.pdfs.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="h-5 w-5 mr-2 text-red-600" />
                    Course Materials
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {course.pdfs.map((pdf, index) => (
                      <div key={index} className="border rounded-lg p-4 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <FileText className="h-8 w-8 text-red-600" />
                          <div>
                            <h4 className="font-medium">{pdf.title || `PDF ${index + 1}`}</h4>
                            <p className="text-sm text-gray-600">PDF Document</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {pdf.allowView && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(pdf.url, '_blank')}
                              className="bg-white border-gray-300 text-gray-900 hover:bg-gray-100"
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </Button>
                          )}
                          {pdf.allowDownload && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const link = document.createElement('a')
                                link.href = pdf.url
                                link.download = pdf.title || `document-${index + 1}.pdf`
                                link.click()
                              }}
                              className="bg-white border-gray-300 text-gray-900 hover:bg-gray-100"
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Lessons */}
            <Card>
              <CardHeader>
                <CardTitle>Course Content</CardTitle>
                <CardDescription>
                  {course.lessons.length} lessons • {course.quizzes.length} quizzes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {course.lessons.map((lesson, index) => (
                    <div key={lesson._id} className="flex items-center space-x-3 p-3 border rounded-lg">
                      <div className="flex-shrink-0">
                        <Play className="h-5 w-5 text-red-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{lesson.title}</h4>
                        <p className="text-sm text-gray-600">{lesson.duration} min</p>
                      </div>
                      {isEnrolled && (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      )}
                    </div>
                  ))}
                  
                  {course.quizzes.map((quiz, index) => (
                    <div key={quiz._id} className="flex items-center space-x-3 p-3 border rounded-lg">
                      <div className="flex-shrink-0">
                        <BookOpen className="h-5 w-5 text-red-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{quiz.title}</h4>
                        <p className="text-sm text-gray-600">{quiz.questions.length} questions</p>
                      </div>
                      {isEnrolled && (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Enrollment Card */}
            <Card>
              <CardHeader>
                <CardTitle>Enroll in this course</CardTitle>
              </CardHeader>
              <CardContent>
                {isEnrolled ? (
                  <div className="text-center">
                    <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                    <p className="text-green-600 font-medium mb-4">You're enrolled!</p>
                    <Link href={`/courses/${course._id}/learn`}>
                      <Button className="w-full">Continue Learning</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900">
                        {course.price === 0 || !course.price ? 'Free' : `$${course.price.toFixed(2)}`}
                      </p>
                      <p className="text-gray-600">Lifetime access</p>
                    </div>
                    {course.price === 0 || !course.price ? (
                      <Button 
                        onClick={handleEnroll}
                        disabled={enrolling}
                        className="w-full"
                      >
                        {enrolling ? 'Enrolling...' : 'Enroll Now'}
                      </Button>
                    ) : (
                      <div className="space-y-3">
                        <PayPalButton
                          courseId={course._id}
                          amount={course.price}
                          onSuccess={async () => {
                            await refreshUser()
                            setTimeout(() => {
                              checkEnrollment()
                              fetchCourse()
                            }, 500)
                          }}
                        />
                        <p className="text-xs text-gray-500 text-center">
                          Secure payment via PayPal
                        </p>
                      </div>
                    )}
                    <p className="text-xs text-gray-500 text-center">
                      Join {course.enrolledStudents.length} other students
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Course Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Course Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Rating</span>
                    <span className="font-medium">{course.rating.average.toFixed(1)}/5</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Reviews</span>
                    <span className="font-medium">{course.rating.count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Students</span>
                    <span className="font-medium">{course.enrolledStudents.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Level</span>
                    <span className="font-medium capitalize">{course.level}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
