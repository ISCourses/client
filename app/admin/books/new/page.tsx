'use client'

import { useState, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Save, Loader2, Upload, X, Image, FileText } from 'lucide-react'
import Link from 'next/link'
import AdminSidebar from '@/components/AdminSidebar'
import api from '@/lib/api'
import toast from 'react-hot-toast'

interface BookForm {
  title: string
  author?: string
  description: string
  category: string
  price: number
  currency: string
  language: string
  pages?: number | null
  isbn: string
  publisher?: string
  publicationYear?: number | null
  coverImage: string
  pdfFile: string
  tags: string
  isPublished: boolean
  isFeatured: boolean
}

const categories = ['Islamic Studies', 'Web Development', 'Data Science', 'Design', 'Business', 'Marketing', 'Other']

export default function NewBookPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [coverImage, setCoverImage] = useState('')
  const [uploadingCover, setUploadingCover] = useState(false)
  const [pdfFile, setPdfFile] = useState('')
  const [uploadingPdf, setUploadingPdf] = useState(false)
  const coverInputRef = useRef<HTMLInputElement>(null)
  const pdfInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<BookForm>({
    defaultValues: {
      currency: 'USD',
      language: 'English',
      isPublished: false,
      isFeatured: false,
      tags: ''
    }
  })

  const handleCoverImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file')
      return
    }

    setUploadingCover(true)
    try {
      const formData = new FormData()
      formData.append('image', file)

      const response = await api.post('/upload/image', formData)
      setCoverImage(response.data.url)
      toast.success('Cover image uploaded successfully!')
    } catch (error: any) {
      console.error('Failed to upload cover image:', error)
      toast.error(error.response?.data?.message || 'Failed to upload cover image')
    } finally {
      setUploadingCover(false)
      if (coverInputRef.current) {
        coverInputRef.current.value = ''
      }
    }
  }

  const handleRemoveCover = () => {
    setCoverImage('')
    if (coverInputRef.current) {
      coverInputRef.current.value = ''
    }
  }

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.type !== 'application/pdf') {
      toast.error('Please upload a PDF file')
      return
    }

    setUploadingPdf(true)
    try {
      const formData = new FormData()
      formData.append('pdf', file)

      const response = await api.post('/upload/pdf', formData)
      setPdfFile(response.data.url)
      toast.success('PDF uploaded successfully!')
    } catch (error: any) {
      console.error('Failed to upload PDF:', error)
      toast.error(error.response?.data?.message || 'Failed to upload PDF')
    } finally {
      setUploadingPdf(false)
      if (pdfInputRef.current) {
        pdfInputRef.current.value = ''
      }
    }
  }

  const handleRemovePdf = () => {
    setPdfFile('')
    if (pdfInputRef.current) {
      pdfInputRef.current.value = ''
    }
  }

  const onSubmit = async (data: BookForm) => {
    setSubmitting(true)
    try {
      const bookData = {
        ...data,
        coverImage: coverImage || data.coverImage, // Use uploaded cover if available, otherwise use URL
        pdfFile: pdfFile || data.pdfFile, // Use uploaded PDF if available, otherwise use URL
        tags: data.tags ? data.tags.split(',').map(tag => tag.trim()) : []
      }
      await api.post('/books', bookData)
      toast.success('Book created successfully!')
      router.push('/admin/books')
    } catch (error: any) {
      console.error('Failed to create book:', error)
      toast.error(error.response?.data?.message || 'Failed to create book')
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
            <Link href="/admin/books">
              <Button variant="outline" className="bg-white border-gray-300 text-gray-900 hover:bg-gray-100">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Products
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Create New Book</h1>
          <p className="text-gray-600">Add a new book to the library</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Card className="bg-white border-gray-200">
            <CardHeader>
              <CardTitle className="text-gray-900">Book Information</CardTitle>
              <CardDescription className="text-gray-600">
                Fill in the book details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Title *
                  </label>
                  <Input
                    {...register('title', { required: 'Title is required' })}
                    placeholder="Enter book title"
                    className="bg-white border-gray-300 text-gray-900 placeholder-gray-400"
                  />
                  {errors.title && (
                    <p className="mt-1 text-sm text-red-400">{errors.title.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Author
                  </label>
                  <Input
                    {...register('author')}
                    placeholder="Enter author name (optional)"
                    className="bg-white border-gray-300 text-gray-900 placeholder-gray-400"
                  />
                  {errors.author && (
                    <p className="mt-1 text-sm text-red-400">{errors.author.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Description *
                </label>
                <textarea
                  {...register('description', { required: 'Description is required' })}
                  placeholder="Enter book description"
                  rows={4}
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
                    Price *
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    {...register('price', { required: 'Price is required', min: 0 })}
                    placeholder="0.00"
                    className="bg-white border-gray-300 text-gray-900 placeholder-gray-400"
                  />
                  {errors.price && (
                    <p className="mt-1 text-sm text-red-400">{errors.price.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Currency
                  </label>
                  <Input
                    {...register('currency')}
                    placeholder="USD"
                    className="bg-white border-gray-300 text-gray-900 placeholder-gray-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Language
                  </label>
                  <Input
                    {...register('language')}
                    placeholder="English"
                    className="bg-white border-gray-300 text-gray-900 placeholder-gray-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Pages
                  </label>
                  <Input
                    type="number"
                    {...register('pages', {
                      setValueAs: (v) => (v === '' || v == null || Number.isNaN(Number(v)) ? null : Number(v)),
                      validate: (v) => {
                        if (v == null) return true
                        return (typeof v === 'number' && v >= 1) || 'Pages must be at least 1'
                      }
                    })}
                    placeholder="Number of pages (optional)"
                    className="bg-white border-gray-300 text-gray-900 placeholder-gray-400"
                  />
                  {errors.pages && (
                    <p className="mt-1 text-sm text-red-400">{errors.pages.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    ISBN
                  </label>
                  <Input
                    {...register('isbn')}
                    placeholder="ISBN number"
                    className="bg-white border-gray-300 text-gray-900 placeholder-gray-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Publisher
                  </label>
                  <Input
                    {...register('publisher')}
                    placeholder="Publisher name (optional)"
                    className="bg-white border-gray-300 text-gray-900 placeholder-gray-400"
                  />
                  {errors.publisher && (
                    <p className="mt-1 text-sm text-red-400">{errors.publisher.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Publication Year
                </label>
                <Input
                  type="number"
                  {...register('publicationYear', {
                    setValueAs: (v) => (v === '' || v == null || Number.isNaN(Number(v)) ? null : Number(v)),
                    validate: (v) => {
                      if (v == null) return true
                      if (typeof v !== 'number' || Number.isNaN(v)) return 'Enter a valid year'
                      if (v < 1000) return 'Enter a valid year'
                      if (v > new Date().getFullYear() + 1) return 'Year is too far in the future'
                      return true
                    }
                  })}
                  placeholder="2024"
                  className="bg-white border-gray-300 text-gray-900 placeholder-gray-400"
                />
                {errors.publicationYear && (
                  <p className="mt-1 text-sm text-red-400">{errors.publicationYear.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Cover Image
                  </label>
                  <div className="space-y-2">
                    <input
                      type="file"
                      ref={coverInputRef}
                      accept="image/*"
                      onChange={handleCoverImageUpload}
                      className="hidden"
                    />
                    {coverImage ? (
                      <div className="relative">
                        <img 
                          src={coverImage} 
                          alt="Cover" 
                          className="w-full h-64 object-cover rounded-md border border-gray-300"
                        />
                        <button
                          type="button"
                          onClick={handleRemoveCover}
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
                          coverInputRef.current?.click()
                        }}
                        disabled={uploadingCover}
                        className="w-full cursor-pointer bg-white border-gray-300 text-gray-900 hover:bg-gray-100"
                      >
                        {uploadingCover ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            Upload Cover Image
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-gray-500">Upload a cover image for the book (recommended)</p>
                  
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Cover Image URL (Alternative)
                    </label>
                    <Input
                      {...register('coverImage')}
                      placeholder="https://example.com/image.jpg"
                      className="bg-white border-gray-300 text-gray-900 placeholder-gray-400"
                    />
                    <p className="mt-1 text-xs text-gray-500">Or enter a URL for the cover image</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    PDF File
                  </label>
                  <div className="space-y-2">
                    <input
                      type="file"
                      ref={pdfInputRef}
                      accept="application/pdf"
                      onChange={handlePdfUpload}
                      className="hidden"
                    />
                    {pdfFile ? (
                      <div className="relative p-4 border border-gray-300 rounded-md bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <FileText className="h-5 w-5 text-red-600" />
                            <span className="text-sm text-gray-700">PDF uploaded</span>
                          </div>
                          <button
                            type="button"
                            onClick={handleRemovePdf}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        <a 
                          href={pdfFile} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline mt-2 block"
                        >
                          View PDF
                        </a>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          pdfInputRef.current?.click()
                        }}
                        disabled={uploadingPdf}
                        className="w-full cursor-pointer bg-white border-gray-300 text-gray-900 hover:bg-gray-100"
                      >
                        {uploadingPdf ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            Upload PDF
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-gray-500">Upload the book PDF file (recommended)</p>
                  
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      PDF File URL (Alternative)
                    </label>
                    <Input
                      {...register('pdfFile')}
                      placeholder="https://example.com/book.pdf"
                      className="bg-white border-gray-300 text-gray-900 placeholder-gray-400"
                    />
                    <p className="mt-1 text-xs text-gray-500">Or enter a URL for the PDF file</p>
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
                    Control when your book is visible to users
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
                            ? '✓ Book will be visible to all users immediately' 
                            : '⚠ Book will be saved as draft - only admins can view it for testing'}
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
                    <label className="text-gray-900">Feature this book on homepage</label>
                  </div>
                  <p className="text-xs text-gray-500">
                    💡 Tip: Save as draft to test your book before making it public. You can publish it later from the books list.
                  </p>
                </CardContent>
              </Card>

          <div className="flex justify-end space-x-4">
            <Link href="/admin/books">
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
                  Create Book
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

