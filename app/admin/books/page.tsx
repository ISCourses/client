'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { BookOpen, Plus, Edit, Trash2, Eye, Search, Filter, Star, Download } from 'lucide-react'
import Link from 'next/link'
import AdminSidebar from '@/components/AdminSidebar'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import { Book } from '@/types/book'

export default function AdminBooksPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [books, setBooks] = useState<Book[]>([])
  const [loadingBooks, setLoadingBooks] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')

  const categories = ['Islamic Studies', 'Web Development', 'Data Science', 'Design', 'Business', 'Marketing', 'Other']

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.push('/')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchBooks()
    }
  }, [user, searchTerm, selectedCategory])

  const fetchBooks = async () => {
    try {
      setLoadingBooks(true)
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (selectedCategory) params.append('category', selectedCategory)

      const response = await api.get(`/books/admin/all?${params.toString()}`)
      setBooks(response.data)
    } catch (error) {
      console.error('Failed to fetch books:', error)
      toast.error('Failed to fetch books')
    } finally {
      setLoadingBooks(false)
    }
  }

  const handleDeleteBook = async (bookId: string) => {
    if (!confirm('Are you sure you want to delete this book? This action cannot be undone.')) {
      return
    }

    try {
      await api.delete(`/books/${bookId}`)
      toast.success('Book deleted successfully')
      fetchBooks()
    } catch (error) {
      console.error('Failed to delete book:', error)
      toast.error('Failed to delete book')
    }
  }

  const handleTogglePublish = async (bookId: string, currentStatus: boolean) => {
    try {
      await api.put(`/books/${bookId}`, { isPublished: !currentStatus })
      toast.success(`Book ${!currentStatus ? 'published' : 'unpublished'} successfully`)
      fetchBooks()
    } catch (error) {
      console.error('Failed to update book:', error)
      toast.error('Failed to update book')
    }
  }

  const handleToggleFeatured = async (bookId: string, currentStatus: boolean) => {
    try {
      await api.put(`/books/${bookId}`, { isFeatured: !currentStatus })
      toast.success(`Book ${!currentStatus ? 'featured' : 'unfeatured'} successfully`)
      fetchBooks()
    } catch (error) {
      console.error('Failed to update book:', error)
      toast.error('Failed to update book')
    }
  }

  if (loading) {
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
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Product Management</h1>
              <p className="text-gray-600">Manage all products in your store</p>
            </div>
            <Link href="/admin/books/new">
              <Button className="bg-red-600 text-white hover:bg-red-700">
                <Plus className="h-4 w-4 mr-2" />
                Add New Product
              </Button>
            </Link>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600 h-4 w-4" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white border-gray-200 text-gray-900"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="border border-gray-200 rounded-md px-3 py-2 text-sm bg-white text-gray-900"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Books Table */}
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-900">All Products ({books.length})</CardTitle>
            <CardDescription className="text-gray-600">
              Manage and organize your book inventory
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingBooks ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-100 rounded animate-pulse"></div>
                ))}
              </div>
            ) : books.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-600 text-lg">No books found</p>
                <Link href="/admin/books/new">
                  <Button className="mt-4 bg-red-600 text-white hover:bg-red-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Book
                  </Button>
                </Link>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-200">
                    <TableHead className="text-gray-600">Title</TableHead>
                    <TableHead className="text-gray-600">Author</TableHead>
                    <TableHead className="text-gray-600">Category</TableHead>
                    <TableHead className="text-gray-600">Price</TableHead>
                    <TableHead className="text-gray-600">Downloads</TableHead>
                    <TableHead className="text-gray-600">Rating</TableHead>
                    <TableHead className="text-gray-600">Status</TableHead>
                    <TableHead className="text-gray-600">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {books.map((book) => (
                    <TableRow key={book._id} className="border-gray-200">
                      <TableCell className="font-medium text-gray-900">
                        <div className="flex items-center space-x-3">
                          <img 
                            src={book.coverImage || '/book-default.jpeg'} 
                            alt={book.title}
                            className="w-12 h-16 object-cover rounded"
                          />
                          <span>{book.title}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-600">{book.author}</TableCell>
                      <TableCell className="text-gray-600">{book.category}</TableCell>
                      <TableCell className="text-gray-600">${book.price}</TableCell>
                      <TableCell className="text-gray-600">{book.downloads}</TableCell>
                      <TableCell className="text-gray-600">
                        <div className="flex items-center">
                          <Star className="h-4 w-4 text-yellow-400 mr-1" />
                          {book.rating.average.toFixed(1)} ({book.rating.count})
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col space-y-1">
                          <Badge 
                            variant={book.isPublished ? 'default' : 'secondary'} 
                            className={book.isPublished ? 'bg-green-600 text-gray-900' : 'bg-gray-600 text-gray-900'}
                          >
                            {book.isPublished ? 'Published' : 'Draft'}
                          </Badge>
                          {book.isFeatured && (
                            <Badge className="bg-red-600 text-gray-900 text-xs">Featured</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Link href={`/books/${book._id}`}>
                            <Button size="sm" variant="outline" className="bg-white border-gray-300 text-gray-900 hover:bg-gray-100">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link href={`/admin/books/${book._id}/edit`}>
                            <Button size="sm" variant="outline" className="bg-white border-gray-300 text-gray-900 hover:bg-gray-100">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleTogglePublish(book._id, book.isPublished)}
                            className="bg-white border-gray-300 text-gray-900 hover:bg-gray-100"
                          >
                            {book.isPublished ? 'Unpublish' : 'Publish'}
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleToggleFeatured(book._id, book.isFeatured ?? false)}
                            className="bg-white border-gray-300 text-gray-900 hover:bg-gray-100"
                          >
                            {book.isFeatured ? 'Unfeature' : 'Feature'}
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleDeleteBook(book._id)}
                            className="bg-red-50 border-red-300 text-red-600 hover:bg-red-100"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
