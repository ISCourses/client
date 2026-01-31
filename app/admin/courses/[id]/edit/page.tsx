'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter, useParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Save, Eye, Loader2, BookOpen, FileQuestion, Upload, X, Youtube, Image, Video, FileText, Trash2, GripVertical } from 'lucide-react'
import Link from 'next/link'
import AdminSidebar from '@/components/AdminSidebar'
import api from '@/lib/api'
import toast from 'react-hot-toast'

interface CourseForm {
  title: string
  description: string
  category: string
  level: string
  duration: number
  price: number
  isPublished: boolean
}

const levels = ['beginner', 'intermediate', 'advanced']

interface Category {
  _id: string
  name: string
  isActive: boolean
}

export default function EditCoursePage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const courseId = params.id as string
  const [submitting, setSubmitting] = useState(false)
  const [loadingCourse, setLoadingCourse] = useState(true)
  const [categories, setCategories] = useState<Category[]>([])
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [youtubeLiveUrl, setYoutubeLiveUrl] = useState('')
  const [thumbnail, setThumbnail] = useState('')
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false)
  const [galleryImages, setGalleryImages] = useState<string[]>([])
  const [uploadingGallery, setUploadingGallery] = useState(false)
  const [videos, setVideos] = useState<Array<{url: string, title: string, description: string}>>([])
  const [uploadingVideo, setUploadingVideo] = useState(false)
  const [pdfs, setPdfs] = useState<Array<{url: string, title: string, allowView: boolean, allowDownload: boolean}>>([])
  const [uploadingPdf, setUploadingPdf] = useState(false)
  
  // Refs for file inputs
  const thumbnailInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const pdfInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset
  } = useForm<CourseForm>({
    defaultValues: {
      isPublished: false,
      price: 0
    }
  })

  useEffect(() => {
    if (user?.role === 'admin' && courseId) {
      fetchCourse()
      fetchCategories()
    }
  }, [user, courseId])

  const fetchCategories = async () => {
    try {
      setLoadingCategories(true)
      const response = await api.get('/categories')
      setCategories(response.data.filter((cat: Category) => cat.isActive))
    } catch (error) {
      console.error('Failed to fetch categories:', error)
      toast.error('Failed to load categories')
    } finally {
      setLoadingCategories(false)
    }
  }

  const fetchCourse = async () => {
    try {
      setLoadingCourse(true)
      const response = await api.get(`/courses/${courseId}`)
      const course = response.data
      
      reset({
        title: course.title || '',
        description: course.description || '',
        category: course.category || '',
        level: course.level || 'beginner',
        duration: course.duration || 0,
        price: course.price || 0,
        isPublished: course.isPublished || false
      })
      
      setYoutubeLiveUrl(course.youtubeLiveUrl || '')
      setThumbnail(course.thumbnail || '')
      setGalleryImages(course.galleryImages || [])
      setVideos(course.videos || [])
      setPdfs(course.pdfs || [])
    } catch (error: any) {
      console.error('Failed to fetch course:', error)
      toast.error(error.response?.data?.message || 'Failed to load course')
      router.push('/admin/courses')
    } finally {
      setLoadingCourse(false)
    }
  }

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingThumbnail(true)
    try {
      const formData = new FormData()
      formData.append('image', file)

      const response = await api.post('/upload/image', formData)
      
      setThumbnail(response.data.url)
      toast.success('Thumbnail uploaded successfully!')
    } catch (error: any) {
      console.error('Thumbnail upload error:', error)
      toast.error(error.response?.data?.message || 'Failed to upload thumbnail')
    } finally {
      setUploadingThumbnail(false)
      // Reset input to allow selecting the same file again
      e.target.value = ''
    }
  }

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploadingGallery(true)
    try {
      const formData = new FormData()
      Array.from(files).forEach(file => {
        formData.append('images', file)
      })

      const response = await api.post('/upload/images', formData)
      
      setGalleryImages([...galleryImages, ...response.data.urls])
      toast.success('Gallery images uploaded successfully!')
    } catch (error: any) {
      console.error('Gallery upload error:', error)
      toast.error(error.response?.data?.message || 'Failed to upload images')
    } finally {
      setUploadingGallery(false)
      // Reset input to allow selecting the same files again
      e.target.value = ''
    }
  }

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file size (e.g., max 500MB)
    const maxSize = 500 * 1024 * 1024 // 500MB
    if (file.size > maxSize) {
      toast.error('Video file is too large. Maximum size is 500MB')
      e.target.value = ''
      return
    }

    setUploadingVideo(true)
    try {
      const formData = new FormData()
      formData.append('video', file)

      const response = await api.post('/upload/video', formData)
      
      setVideos([...videos, { url: response.data.url, title: '', description: '' }])
      toast.success('Video uploaded successfully!')
    } catch (error: any) {
      console.error('Video upload error:', error)
      toast.error(error.response?.data?.message || 'Failed to upload video')
    } finally {
      setUploadingVideo(false)
      // Reset input to allow selecting the same file again
      e.target.value = ''
    }
  }

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingPdf(true)
    try {
      const formData = new FormData()
      formData.append('pdf', file)

      const response = await api.post('/upload/pdf', formData)
      
      setPdfs([...pdfs, { 
        url: response.data.url, 
        title: response.data.filename || '', 
        allowView: true, 
        allowDownload: true 
      }])
      toast.success('PDF uploaded successfully!')
    } catch (error: any) {
      console.error('PDF upload error:', error)
      toast.error(error.response?.data?.message || 'Failed to upload PDF')
    } finally {
      setUploadingPdf(false)
      // Reset input to allow selecting the same file again
      e.target.value = ''
    }
  }

  const onSubmit = async (data: CourseForm) => {
    setSubmitting(true)
    try {
      await api.put(`/courses/${courseId}`, {
        ...data,
        youtubeLiveUrl,
        thumbnail,
        galleryImages,
        videos,
        pdfs
      })
      toast.success('Course updated successfully!')
      router.push('/admin/courses')
    } catch (error: any) {
      console.error('Failed to update course:', error)
      toast.error(error.response?.data?.message || 'Failed to update course')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading || loadingCourse) {
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
            <Link href="/admin/courses">
              <Button variant="outline" className="bg-white border-gray-300 text-gray-900 hover:bg-gray-100">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Courses
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Course</h1>
          <p className="text-gray-600">Update course information</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="bg-white border-gray-200">
                <CardHeader>
                  <CardTitle className="text-gray-900">Course Information</CardTitle>
                  <CardDescription className="text-gray-600">
                    Update the course details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Course Title *
                    </label>
                    <Input
                      {...register('title', { required: 'Title is required' })}
                      placeholder="Enter course title"
                      className="bg-white border-gray-300 text-gray-900 placeholder-gray-400"
                    />
                    {errors.title && (
                      <p className="mt-1 text-sm text-red-400">{errors.title.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Description *
                    </label>
                    <textarea
                      {...register('description', { required: 'Description is required' })}
                      placeholder="Enter course description"
                      rows={6}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                    {errors.description && (
                      <p className="mt-1 text-sm text-red-400">{errors.description.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Category *
                      </label>
                      <select
                        {...register('category', { required: 'Category is required' })}
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                        disabled={loadingCategories}
                      >
                        <option value="">{loadingCategories ? 'Loading categories...' : 'Select category'}</option>
                        {categories.map((category) => (
                          <option key={category._id} value={category.name}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                      {categories.length === 0 && !loadingCategories && (
                        <p className="mt-1 text-xs text-gray-600">
                          No categories available. <Link href="/admin/categories" className="text-gray-900 underline">Create one</Link>
                        </p>
                      )}
                      {errors.category && (
                        <p className="mt-1 text-sm text-red-400">{errors.category.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Level *
                      </label>
                      <select
                        {...register('level', { required: 'Level is required' })}
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                      >
                        <option value="">Select level</option>
                        {levels.map((level) => (
                          <option key={level} value={level}>
                            {level.charAt(0).toUpperCase() + level.slice(1)}
                          </option>
                        ))}
                      </select>
                      {errors.level && (
                        <p className="mt-1 text-sm text-red-400">{errors.level.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Duration (hours) *
                      </label>
                      <Input
                        type="number"
                        {...register('duration', { 
                          required: 'Duration is required',
                          min: { value: 1, message: 'Duration must be at least 1 hour' }
                        })}
                        placeholder="Enter duration in hours"
                        className="bg-white border-gray-300 text-gray-900 placeholder-gray-400"
                      />
                      {errors.duration && (
                        <p className="mt-1 text-sm text-red-400">{errors.duration.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Price ($)
                      </label>
                      <Input
                        type="number"
                        {...register('price', { min: 0 })}
                        placeholder="Enter price (0 for free)"
                        className="bg-white border-gray-300 text-gray-900 placeholder-gray-400"
                      />
                      {errors.price && (
                        <p className="mt-1 text-sm text-red-400">{errors.price.message}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* YouTube Live URL */}
              <Card className="bg-white border-gray-200">
                <CardHeader>
                  <CardTitle className="text-gray-900">YouTube Live Stream</CardTitle>
                  <CardDescription className="text-gray-600">
                    Add YouTube live stream URL for this course
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      YouTube Live URL
                    </label>
                    <Input
                      value={youtubeLiveUrl}
                      onChange={(e) => setYoutubeLiveUrl(e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=..."
                      className="bg-white border-gray-300 text-gray-900 placeholder-gray-400"
                    />
                    <p className="mt-1 text-xs text-gray-600">
                      Enter the full YouTube live stream URL
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Course Thumbnail */}
              <Card className="bg-white border-gray-200">
                <CardHeader>
                  <CardTitle className="text-gray-900">Course Thumbnail</CardTitle>
                  <CardDescription className="text-gray-600">
                    Upload a thumbnail image for the course
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {thumbnail && (
                    <div className="relative">
                      <img src={thumbnail} alt="Thumbnail" className="w-full h-48 object-cover rounded-lg" />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setThumbnail('')}
                        className="absolute top-2 right-2 bg-white"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  <div>
                    <input
                      ref={thumbnailInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleThumbnailUpload}
                      className="hidden"
                      id="thumbnail-upload"
                      disabled={uploadingThumbnail}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        thumbnailInputRef.current?.click()
                      }}
                      className="w-full bg-white border-gray-300 text-gray-900 hover:bg-gray-100 cursor-pointer"
                      disabled={uploadingThumbnail}
                    >
                      {uploadingThumbnail ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          {thumbnail ? 'Change Thumbnail' : 'Upload Thumbnail'}
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Gallery Images */}
              <Card className="bg-white border-gray-200">
                <CardHeader>
                  <CardTitle className="text-gray-900">Gallery Images</CardTitle>
                  <CardDescription className="text-gray-600">
                    Upload multiple images for the course gallery
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {galleryImages.length > 0 && (
                    <div className="grid grid-cols-3 gap-4">
                      {galleryImages.map((img, index) => (
                        <div key={index} className="relative">
                          <img src={img} alt={`Gallery ${index + 1}`} className="w-full h-32 object-cover rounded-lg" />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setGalleryImages(galleryImages.filter((_, i) => i !== index))}
                            className="absolute top-1 right-1 bg-white"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div>
                    <input
                      ref={galleryInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleGalleryUpload}
                      className="hidden"
                      id="gallery-upload"
                      disabled={uploadingGallery}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        galleryInputRef.current?.click()
                      }}
                      className="w-full bg-white border-gray-300 text-gray-900 hover:bg-gray-100 cursor-pointer"
                      disabled={uploadingGallery}
                    >
                      {uploadingGallery ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Image className="h-4 w-4 mr-2" />
                          Upload Gallery Images
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Videos */}
              <Card className="bg-white border-gray-200">
                <CardHeader>
                  <CardTitle className="text-gray-900">Course Videos</CardTitle>
                  <CardDescription className="text-gray-600">
                    Upload videos for this course
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {videos.map((video, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-2">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 space-y-2">
                          <Input
                            placeholder="Video title"
                            value={video.title}
                            onChange={(e) => {
                              const newVideos = [...videos]
                              newVideos[index].title = e.target.value
                              setVideos(newVideos)
                            }}
                            className="bg-white border-gray-300 text-gray-900"
                          />
                          <textarea
                            placeholder="Video description"
                            value={video.description}
                            onChange={(e) => {
                              const newVideos = [...videos]
                              newVideos[index].description = e.target.value
                              setVideos(newVideos)
                            }}
                            rows={2}
                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-900"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setVideos(videos.filter((_, i) => i !== index))}
                          className="ml-2 bg-white"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <video src={video.url} controls className="w-full rounded-lg" />
                    </div>
                  ))}
                  <div>
                    <input
                      ref={videoInputRef}
                      type="file"
                      accept="video/*"
                      onChange={handleVideoUpload}
                      className="hidden"
                      id="video-upload"
                      disabled={uploadingVideo}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        videoInputRef.current?.click()
                      }}
                      className="w-full bg-white border-gray-300 text-gray-900 hover:bg-gray-100 cursor-pointer"
                      disabled={uploadingVideo}
                    >
                      {uploadingVideo ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Video className="h-4 w-4 mr-2" />
                          Upload Video
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* PDFs */}
              <Card className="bg-white border-gray-200">
                <CardHeader>
                  <CardTitle className="text-gray-900">Course PDFs</CardTitle>
                  <CardDescription className="text-gray-600">
                    Upload PDF documents with view/download permissions
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {pdfs.map((pdf, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <Input
                            placeholder="PDF title"
                            value={pdf.title}
                            onChange={(e) => {
                              const newPdfs = [...pdfs]
                              newPdfs[index].title = e.target.value
                              setPdfs(newPdfs)
                            }}
                            className="bg-white border-gray-300 text-gray-900 mb-2"
                          />
                          <div className="flex items-center space-x-4">
                            <label className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={pdf.allowView}
                                onChange={(e) => {
                                  const newPdfs = [...pdfs]
                                  newPdfs[index].allowView = e.target.checked
                                  setPdfs(newPdfs)
                                }}
                                className="rounded border-gray-300"
                              />
                              <span className="text-sm text-gray-900">Allow View</span>
                            </label>
                            <label className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={pdf.allowDownload}
                                onChange={(e) => {
                                  const newPdfs = [...pdfs]
                                  newPdfs[index].allowDownload = e.target.checked
                                  setPdfs(newPdfs)
                                }}
                                className="rounded border-gray-300"
                              />
                              <span className="text-sm text-gray-900">Allow Download</span>
                            </label>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setPdfs(pdfs.filter((_, i) => i !== index))}
                          className="ml-2 bg-white"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <div>
                    <input
                      ref={pdfInputRef}
                      type="file"
                      accept="application/pdf"
                      onChange={handlePdfUpload}
                      className="hidden"
                      id="pdf-upload"
                      disabled={uploadingPdf}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        pdfInputRef.current?.click()
                      }}
                      className="w-full bg-white border-gray-300 text-gray-900 hover:bg-gray-100 cursor-pointer"
                      disabled={uploadingPdf}
                    >
                      {uploadingPdf ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <FileText className="h-4 w-4 mr-2" />
                          Upload PDF
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card className="bg-white border-gray-200">
                <CardHeader>
                  <CardTitle className="text-gray-900">Course Content</CardTitle>
                  <CardDescription className="text-gray-600">
                    Manage lessons and quizzes
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 pt-6">
                  <Link href={`/admin/courses/${courseId}/lessons`}>
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="w-full bg-white border-gray-300 text-gray-900 hover:bg-gray-100 justify-start"
                    >
                      <BookOpen className="h-4 w-4 mr-2" />
                      Manage Lessons
                    </Button>
                  </Link>
                  <Link href={`/admin/courses/${courseId}/quizzes`}>
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="w-full bg-white border-gray-300 text-gray-900 hover:bg-gray-100 justify-start"
                    >
                      <FileQuestion className="h-4 w-4 mr-2" />
                      Manage Quizzes
                    </Button>
                  </Link>
                  <Link href={`/admin/courses/${courseId}/content-order`}>
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="w-full bg-white border-gray-300 text-gray-900 hover:bg-gray-100 justify-start"
                    >
                      <GripVertical className="h-4 w-4 mr-2" />
                      Arrange Content Order
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="bg-white border-gray-200">
                <CardHeader>
                  <CardTitle className="text-gray-900">Publish Settings</CardTitle>
                  <CardDescription className="text-gray-600">
                    Control when your course is visible to users
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 border-2 rounded-lg" style={{ borderColor: watch('isPublished') ? '#16a34a' : '#6b7280' }}>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center space-x-2 mb-2">
                            <input
                              type="checkbox"
                              {...register('isPublished')}
                              className="rounded border-gray-300 bg-white text-gray-900 focus:ring-red-500 w-5 h-5"
                            />
                            <label className="text-gray-900 font-semibold text-lg">
                              {watch('isPublished') ? 'Published' : 'Draft'}
                            </label>
                          </div>
                          <p className="text-sm text-gray-600 ml-7">
                            {watch('isPublished') 
                              ? '✓ Course will be visible to all users immediately' 
                              : '⚠ Course will be saved as draft - only admins can view it for testing'}
                          </p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                          watch('isPublished') 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {watch('isPublished') ? 'Live' : 'Draft'}
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">
                      💡 Tip: Save as draft to test your course before making it public. You can publish it later from the courses list.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border-gray-200">
                <CardHeader>
                  <CardTitle className="text-gray-900">Course Preview</CardTitle>
                  <CardDescription className="text-gray-600">
                    Preview how your course will appear
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">Title:</p>
                    <p className="text-gray-900 font-medium">{watch('title') || 'Course title will appear here'}</p>
                    
                    <p className="text-sm text-gray-600 mt-4">Category:</p>
                    <p className="text-gray-900">{watch('category') || 'Category'}</p>
                    
                    <p className="text-sm text-gray-600 mt-4">Level:</p>
                    <p className="text-gray-900 capitalize">{watch('level') || 'Level'}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4">
            <Link href="/admin/courses">
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
                  Update Course
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

