'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter, useParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Save, Loader2, Upload, X } from 'lucide-react'
import Link from 'next/link'
import AdminSidebar from '@/components/AdminSidebar'
import api from '@/lib/api'
import toast from 'react-hot-toast'

interface BlogForm {
  title: string
  content: string
  excerpt: string
  category: string
  featuredImage: string
  tags: string
  isPublished: boolean
  isFeatured: boolean
}

const categories = ['Islamic Studies', 'Technology', 'Education', 'Lifestyle', 'News', 'Other']

export default function EditBlogPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const blogId = params.id as string
  const [submitting, setSubmitting] = useState(false)
  const [loadingBlog, setLoadingBlog] = useState(true)
  const [thumbnail, setThumbnail] = useState('')
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false)
  const thumbnailInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch
  } = useForm<BlogForm>({
    defaultValues: {
      isPublished: false,
      isFeatured: false,
      tags: ''
    }
  })

  useEffect(() => {
    if (user?.role === 'admin' && blogId) {
      fetchBlog()
    }
  }, [user, blogId])

  const fetchBlog = async () => {
    try {
      setLoadingBlog(true)
      const response = await api.get(`/blogs/${blogId}`)
      const blog = response.data
      
      setThumbnail(blog.thumbnail || blog.featuredImage || '')
      reset({
        title: blog.title || '',
        content: blog.content || '',
        excerpt: blog.excerpt || '',
        category: blog.category || '',
        featuredImage: blog.featuredImage || '',
        tags: blog.tags?.join(', ') || '',
        isPublished: blog.isPublished || false,
        isFeatured: blog.isFeatured || false
      })
    } catch (error: any) {
      console.error('Failed to fetch blog:', error)
      toast.error(error.response?.data?.message || 'Failed to load blog')
      router.push('/admin/blogs')
    } finally {
      setLoadingBlog(false)
    }
  }

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file')
      return
    }

    setUploadingThumbnail(true)
    try {
      const formData = new FormData()
      formData.append('image', file)

      const response = await api.post('/upload/image', formData)
      setThumbnail(response.data.url)
      toast.success('Thumbnail uploaded successfully!')
    } catch (error: any) {
      console.error('Failed to upload thumbnail:', error)
      toast.error(error.response?.data?.message || 'Failed to upload thumbnail')
    } finally {
      setUploadingThumbnail(false)
      if (thumbnailInputRef.current) {
        thumbnailInputRef.current.value = ''
      }
    }
  }

  const handleRemoveThumbnail = () => {
    setThumbnail('')
    if (thumbnailInputRef.current) {
      thumbnailInputRef.current.value = ''
    }
  }

  const onSubmit = async (data: BlogForm) => {
    setSubmitting(true)
    try {
      const blogData = {
        ...data,
        thumbnail: thumbnail || data.featuredImage, // Use thumbnail if uploaded, otherwise use featuredImage
        tags: data.tags ? data.tags.split(',').map(tag => tag.trim()) : []
      }
      await api.put(`/blogs/${blogId}`, blogData)
      toast.success('Blog updated successfully!')
      router.push('/admin/blogs')
    } catch (error: any) {
      console.error('Failed to update blog:', error)
      toast.error(error.response?.data?.message || 'Failed to update blog')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading || loadingBlog) {
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
            <Link href="/admin/blogs">
              <Button variant="outline" className="bg-white border-gray-300 text-gray-900 hover:bg-gray-100">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Blogs
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Blog</h1>
          <p className="text-gray-600">Update blog information</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Card className="bg-white border-gray-200">
            <CardHeader>
              <CardTitle className="text-gray-900">Blog Information</CardTitle>
              <CardDescription className="text-gray-600">
                Update the blog details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Title *
                </label>
                <Input
                  {...register('title', { required: 'Title is required' })}
                  placeholder="Enter blog title"
                  className="bg-white border-gray-300 text-gray-900 placeholder-gray-400"
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-400">{errors.title.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Excerpt *
                </label>
                <textarea
                  {...register('excerpt', { required: 'Excerpt is required' })}
                  placeholder="Enter a short excerpt"
                  rows={3}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                {errors.excerpt && (
                  <p className="mt-1 text-sm text-red-400">{errors.excerpt.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Content *
                </label>
                <textarea
                  {...register('content', { required: 'Content is required' })}
                  placeholder="Write your blog content here..."
                  rows={15}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                {errors.content && (
                  <p className="mt-1 text-sm text-red-400">{errors.content.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Category *
                  </label>
                  <select
                    {...register('category', { required: 'Category is required' })}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="">Select category</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                  {errors.category && (
                    <p className="mt-1 text-sm text-red-400">{errors.category.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Thumbnail Image
                  </label>
                  <div className="space-y-2">
                    <input
                      type="file"
                      ref={thumbnailInputRef}
                      accept="image/*"
                      onChange={handleThumbnailUpload}
                      className="hidden"
                    />
                    {thumbnail ? (
                      <div className="relative">
                        <img 
                          src={thumbnail} 
                          alt="Thumbnail" 
                          className="w-full h-48 object-cover rounded-md border border-gray-300"
                        />
                        <button
                          type="button"
                          onClick={handleRemoveThumbnail}
                          className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full hover:bg-red-700"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          thumbnailInputRef.current?.click()
                        }}
                        disabled={uploadingThumbnail}
                        className="w-full cursor-pointer bg-white border-gray-300 text-gray-900 hover:bg-gray-100"
                      >
                        {uploadingThumbnail ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            Upload Thumbnail
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-gray-500">Upload a thumbnail image for the blog (recommended)</p>
                  
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Featured Image URL (Alternative)
                    </label>
                    <Input
                      {...register('featuredImage')}
                      placeholder="https://example.com/image.jpg"
                      className="bg-white border-gray-300 text-gray-900 placeholder-gray-400"
                    />
                    <p className="mt-1 text-xs text-gray-500">Or enter a URL for the featured image</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Tags (comma-separated)
                </label>
                <Input
                  {...register('tags')}
                  placeholder="tag1, tag2, tag3"
                  className="bg-white border-gray-300 text-gray-900 placeholder-gray-400"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200">
            <CardHeader>
              <CardTitle className="text-gray-900">Publish Settings</CardTitle>
              <CardDescription className="text-gray-600">
                Control when your blog is visible to users
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
                        ? '✓ Blog will be visible to all users immediately' 
                        : '⚠ Blog will be saved as draft - only admins can view it for testing'}
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
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  {...register('isFeatured')}
                  className="rounded border-gray-300 bg-white text-gray-900 focus:ring-red-500"
                />
                <label className="text-gray-900">Feature this blog on homepage</label>
              </div>
              <p className="text-xs text-gray-500">
                💡 Tip: Save as draft to test your blog before making it public. You can publish it later from the blogs list.
              </p>
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-4">
            <Link href="/admin/blogs">
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
                  Update Blog
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

