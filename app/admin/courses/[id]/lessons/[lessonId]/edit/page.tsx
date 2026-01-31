'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter, useParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Save, Loader2, Plus, GripVertical, Trash2, Image, Video, FileText, ArrowUp, ArrowDown, Upload, X } from 'lucide-react'
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

interface ContentBlock {
  type: 'text' | 'image' | 'video'
  content: string
  order: number
  _id?: string
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
  const [showAddBlock, setShowAddBlock] = useState(false)
  const [newBlockType, setNewBlockType] = useState<'text' | 'image' | 'video'>('text')
  const [newBlockContent, setNewBlockContent] = useState('')
  const [draggedBlockIndex, setDraggedBlockIndex] = useState<number | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadingVideo, setUploadingVideo] = useState(false)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)

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

  const addContentBlock = () => {
    if (!newBlockContent.trim()) {
      toast.error('Please enter content')
      return
    }
    
    const newBlock: ContentBlock = {
      type: newBlockType,
      content: newBlockContent,
      order: contentBlocks.length + 1
    }
    
    setContentBlocks([...contentBlocks, newBlock])
    setNewBlockContent('')
    setShowAddBlock(false)
    toast.success('Content block added')
  }

  const removeContentBlock = (index: number) => {
    const updated = contentBlocks.filter((_, i) => i !== index)
      .map((block, i) => ({ ...block, order: i + 1 }))
    setContentBlocks(updated)
  }

  const handleDragStart = (index: number) => {
    setDraggedBlockIndex(index)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (targetIndex: number) => {
    if (draggedBlockIndex === null || draggedBlockIndex === targetIndex) {
      setDraggedBlockIndex(null)
      return
    }

    const newBlocks = [...contentBlocks]
    const [removed] = newBlocks.splice(draggedBlockIndex, 1)
    newBlocks.splice(targetIndex, 0, removed)

    // Update orders
    const updated = newBlocks.map((block, i) => ({ ...block, order: i + 1 }))
    setContentBlocks(updated)
    setDraggedBlockIndex(null)
  }

  const moveBlock = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === contentBlocks.length - 1)
    ) {
      return
    }

    const newBlocks = [...contentBlocks]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    ;[newBlocks[index], newBlocks[targetIndex]] = [newBlocks[targetIndex], newBlocks[index]]
    
    const updated = newBlocks.map((block, i) => ({ ...block, order: i + 1 }))
    setContentBlocks(updated)
  }

  const updateBlockContent = (index: number, content: string) => {
    const updated = [...contentBlocks]
    updated[index].content = content
    setContentBlocks(updated)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate image file
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file')
      return
    }

    setUploadingImage(true)
    try {
      const formData = new FormData()
      formData.append('image', file)

      const response = await api.post('/upload/image', formData)
      setNewBlockContent(response.data.url)
      toast.success('Image uploaded successfully!')
    } catch (error: any) {
      console.error('Failed to upload image:', error)
      toast.error(error.response?.data?.message || 'Failed to upload image')
    } finally {
      setUploadingImage(false)
      if (imageInputRef.current) {
        imageInputRef.current.value = ''
      }
    }
  }

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate video file
    if (!file.type.startsWith('video/')) {
      toast.error('Please upload a video file')
      return
    }

    setUploadingVideo(true)
    try {
      const formData = new FormData()
      formData.append('video', file)

      const response = await api.post('/upload/video', formData)
      setNewBlockContent(response.data.url)
      toast.success('Video uploaded successfully!')
    } catch (error: any) {
      console.error('Failed to upload video:', error)
      toast.error(error.response?.data?.message || 'Failed to upload video')
    } finally {
      setUploadingVideo(false)
      if (videoInputRef.current) {
        videoInputRef.current.value = ''
      }
    }
  }

  const handleUpdateBlockImage = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file')
      return
    }

    try {
      const formData = new FormData()
      formData.append('image', file)

      const response = await api.post('/upload/image', formData)
      updateBlockContent(index, response.data.url)
      toast.success('Image uploaded successfully!')
    } catch (error: any) {
      console.error('Failed to upload image:', error)
      toast.error(error.response?.data?.message || 'Failed to upload image')
    }
  }

  const handleUpdateBlockVideo = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('video/')) {
      toast.error('Please upload a video file')
      return
    }

    try {
      const formData = new FormData()
      formData.append('video', file)

      const response = await api.post('/upload/video', formData)
      updateBlockContent(index, response.data.url)
      toast.success('Video uploaded successfully!')
    } catch (error: any) {
      console.error('Failed to upload video:', error)
      toast.error(error.response?.data?.message || 'Failed to upload video')
    }
  }

  const onSubmit = async (data: LessonForm) => {
    // Validate that at least one content block exists
    if (contentBlocks.length === 0) {
      toast.error('Please add at least one content block')
      return
    }

    setSubmitting(true)
    try {
      // Generate a simple content string from blocks for backward compatibility
      const contentString = contentBlocks
        .sort((a, b) => a.order - b.order)
        .map(block => {
          if (block.type === 'text') return block.content
          if (block.type === 'image') return `[Image: ${block.content}]`
          if (block.type === 'video') return `[Video: ${block.content}]`
          return ''
        })
        .filter(Boolean)
        .join('\n\n')

      const payload = {
        ...data,
        content: contentString, // Auto-generate from content blocks
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
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      Lesson Content *
                    </label>
                    <p className="text-xs text-gray-500">
                      Add and arrange text, images, and videos to create your lesson content. Drag blocks to reorder them.
                    </p>
                  </div>
                  <Button
                    type="button"
                    onClick={() => setShowAddBlock(!showAddBlock)}
                    variant="outline"
                    className="bg-white border-gray-300 text-gray-900 hover:bg-gray-100"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Block
                  </Button>
                </div>

                {showAddBlock && (
                  <Card className="mb-4 bg-gray-50 border-gray-200">
                    <CardContent className="pt-4 space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">
                          Block Type
                        </label>
                        <select
                          value={newBlockType}
                          onChange={(e) => setNewBlockType(e.target.value as 'text' | 'image' | 'video')}
                          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-900"
                        >
                          <option value="text">Text</option>
                          <option value="image">Image (URL)</option>
                          <option value="video">Video (URL)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">
                          Content {newBlockType === 'image' || newBlockType === 'video' ? '(URL or Upload)' : ''}
                        </label>
                        {newBlockType === 'text' ? (
                          <textarea
                            value={newBlockContent}
                            onChange={(e) => setNewBlockContent(e.target.value)}
                            placeholder="Enter text content"
                            rows={4}
                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-900"
                          />
                        ) : (
                          <div className="space-y-2">
                            <div className="flex space-x-2">
                              <Input
                                value={newBlockContent}
                                onChange={(e) => setNewBlockContent(e.target.value)}
                                placeholder={`Enter ${newBlockType} URL or upload file`}
                                className="bg-white border-gray-300 text-gray-900 flex-1"
                              />
                              <input
                                type="file"
                                ref={newBlockType === 'image' ? imageInputRef : videoInputRef}
                                onChange={newBlockType === 'image' ? handleImageUpload : handleVideoUpload}
                                accept={newBlockType === 'image' ? 'image/*' : 'video/*'}
                                className="hidden"
                              />
                              <Button
                                type="button"
                                onClick={() => {
                                  if (newBlockType === 'image' && imageInputRef.current) {
                                    imageInputRef.current.click()
                                  } else if (newBlockType === 'video' && videoInputRef.current) {
                                    videoInputRef.current.click()
                                  }
                                }}
                                disabled={uploadingImage || uploadingVideo}
                                variant="outline"
                                className="bg-white border-gray-300 text-gray-900 hover:bg-gray-100"
                              >
                                {uploadingImage || uploadingVideo ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Upload className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                            <p className="text-xs text-gray-500">
                              {newBlockType === 'image' 
                                ? 'Upload an image file or paste an image URL'
                                : 'Upload a video file or paste a video URL'}
                            </p>
                            {newBlockContent && (
                              <div className="mt-2">
                                {newBlockType === 'image' ? (
                                  <img 
                                    src={newBlockContent} 
                                    alt="Preview" 
                                    className="max-w-full h-auto rounded border max-h-48"
                                    onError={() => toast.error('Invalid image URL')}
                                  />
                                ) : (
                                  <div className="text-xs text-gray-500 p-2 bg-gray-50 rounded">
                                    Video URL: {newBlockContent}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          type="button"
                          onClick={addContentBlock}
                          className="bg-red-600 text-white hover:bg-red-700"
                        >
                          Add Block
                        </Button>
                        <Button
                          type="button"
                          onClick={() => {
                            setShowAddBlock(false)
                            setNewBlockContent('')
                          }}
                          variant="outline"
                          className="bg-white border-gray-300 text-gray-900 hover:bg-gray-100"
                        >
                          Cancel
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {contentBlocks.length > 0 && (
                  <div className="space-y-3">
                    {contentBlocks.map((block, index) => (
                      <Card 
                        key={index} 
                        draggable
                        onDragStart={() => handleDragStart(index)}
                        onDragOver={handleDragOver}
                        onDrop={() => handleDrop(index)}
                        className={`bg-white border-gray-200 transition-all ${
                          draggedBlockIndex === index
                            ? 'opacity-50 bg-gray-100 cursor-move'
                            : 'hover:border-gray-300 cursor-move'
                        }`}
                      >
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center space-x-2">
                              <GripVertical className="h-5 w-5 text-gray-400 cursor-grab active:cursor-grabbing" />
                              {block.type === 'text' && <FileText className="h-5 w-5 text-blue-500" />}
                              {block.type === 'image' && <Image className="h-5 w-5 text-green-500" />}
                              {block.type === 'video' && <Video className="h-5 w-5 text-purple-500" />}
                              <span className="text-sm font-medium text-gray-900 capitalize">
                                {block.type} Block (Order: {block.order})
                              </span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => moveBlock(index, 'up')}
                                disabled={index === 0}
                                className="bg-white border-gray-300 text-gray-900 hover:bg-gray-100"
                              >
                                <ArrowUp className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => moveBlock(index, 'down')}
                                disabled={index === contentBlocks.length - 1}
                                className="bg-white border-gray-300 text-gray-900 hover:bg-gray-100"
                              >
                                <ArrowDown className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => removeContentBlock(index)}
                                className="bg-red-50 border-red-300 text-red-600 hover:bg-red-100"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          {block.type === 'text' ? (
                            <textarea
                              value={block.content}
                              onChange={(e) => updateBlockContent(index, e.target.value)}
                              rows={4}
                              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-900"
                            />
                          ) : (
                            <div className="space-y-2">
                              <div className="flex space-x-2">
                                <Input
                                  value={block.content}
                                  onChange={(e) => updateBlockContent(index, e.target.value)}
                                  placeholder={`${block.type} URL or upload file`}
                                  className="bg-white border-gray-300 text-gray-900 flex-1"
                                />
                                <input
                                  type="file"
                                  id={`${block.type}-upload-${index}`}
                                  onChange={block.type === 'image' 
                                    ? (e) => handleUpdateBlockImage(index, e)
                                    : (e) => handleUpdateBlockVideo(index, e)
                                  }
                                  accept={block.type === 'image' ? 'image/*' : 'video/*'}
                                  className="hidden"
                                />
                                <Button
                                  type="button"
                                  onClick={() => {
                                    const input = document.getElementById(`${block.type}-upload-${index}`) as HTMLInputElement
                                    input?.click()
                                  }}
                                  variant="outline"
                                  size="sm"
                                  className="bg-white border-gray-300 text-gray-900 hover:bg-gray-100"
                                >
                                  <Upload className="h-4 w-4" />
                                </Button>
                              </div>
                              {block.type === 'image' && block.content && (
                                <div className="mt-2">
                                  <img 
                                    src={block.content} 
                                    alt="Preview" 
                                    className="max-w-full h-auto rounded border max-h-48"
                                    onError={() => toast.error('Invalid image URL')}
                                  />
                                </div>
                              )}
                              {block.type === 'video' && block.content && (
                                <div className="mt-2 text-xs text-gray-500 p-2 bg-gray-50 rounded">
                                  Video URL: {block.content}
                                </div>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
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

