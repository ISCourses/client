'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Save, Eye } from 'lucide-react'
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

export default function NewCoursePage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [loadingCategories, setLoadingCategories] = useState(true)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm<CourseForm>({
    defaultValues: {
      isPublished: false,
      price: 0
    }
  })

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchCategories()
    }
  }, [user])

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

  const onSubmit = async (data: CourseForm) => {
    setSubmitting(true)
    try {
      await api.post('/courses', data)
      toast.success('Course created successfully!')
      router.push('/admin/courses')
    } catch (error: any) {
      console.error('Failed to create course:', error)
      toast.error(error.response?.data?.message || 'Failed to create course')
    } finally {
      setSubmitting(false)
    }
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
            <Link href="/admin/courses">
              <Button variant="outline" className="bg-white border-gray-300 text-gray-900 hover:bg-gray-100">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Courses
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Create New Course</h1>
          <p className="text-gray-600">Fill in the details to create a new course</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="bg-white border-gray-200">
                <CardHeader>
                  <CardTitle className="text-gray-900">Course Information</CardTitle>
                  <CardDescription className="text-gray-600">
                    Basic information about your course
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
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
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
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
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
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
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
                'Creating...'
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Create Course
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

