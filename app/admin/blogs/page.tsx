'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Plus, Edit, Trash2, Eye, Search, FileText } from 'lucide-react'
import Link from 'next/link'
import AdminSidebar from '@/components/AdminSidebar'
import api from '@/lib/api'
import toast from 'react-hot-toast'

interface Blog {
  _id: string
  title: string
  excerpt: string
  category: string
  author: {
    name: string
  }
  views: number
  likes: string[]
  isPublished: boolean
  isFeatured: boolean
  createdAt: string
}

export default function AdminBlogsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [blogs, setBlogs] = useState<Blog[]>([])
  const [loadingBlogs, setLoadingBlogs] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.push('/')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchBlogs()
    }
  }, [user, searchTerm])

  const fetchBlogs = async () => {
    try {
      setLoadingBlogs(true)
      const response = await api.get('/blogs/admin/all')
      let filteredBlogs = response.data
      
      if (searchTerm) {
        filteredBlogs = filteredBlogs.filter((blog: Blog) =>
          blog.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          blog.category.toLowerCase().includes(searchTerm.toLowerCase())
        )
      }
      
      setBlogs(filteredBlogs)
    } catch (error) {
      console.error('Failed to fetch blogs:', error)
      toast.error('Failed to fetch blogs')
    } finally {
      setLoadingBlogs(false)
    }
  }

  const handleDelete = async (blogId: string) => {
    if (!confirm('Are you sure you want to delete this blog? This action cannot be undone.')) {
      return
    }

    try {
      await api.delete(`/blogs/${blogId}`)
      toast.success('Blog deleted successfully')
      fetchBlogs()
    } catch (error: any) {
      console.error('Failed to delete blog:', error)
      toast.error(error.response?.data?.message || 'Failed to delete blog')
    }
  }

  const handleTogglePublished = async (blogId: string, currentStatus: boolean) => {
    try {
      await api.put(`/blogs/${blogId}`, { isPublished: !currentStatus })
      toast.success(`Blog ${!currentStatus ? 'published' : 'unpublished'} successfully`)
      fetchBlogs()
    } catch (error: any) {
      console.error('Failed to update blog:', error)
      toast.error('Failed to update blog')
    }
  }

  const handleToggleFeatured = async (blogId: string, currentStatus: boolean) => {
    try {
      await api.put(`/blogs/${blogId}`, { isFeatured: !currentStatus })
      toast.success(`Blog ${!currentStatus ? 'featured' : 'unfeatured'} successfully`)
      fetchBlogs()
    } catch (error: any) {
      console.error('Failed to update blog:', error)
      toast.error('Failed to update blog')
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
              <h1 className="text-3xl font-bold text-gray-900">Blog Management</h1>
              <p className="text-gray-600">Manage all blog posts</p>
            </div>
            <Link href="/admin/blogs/new">
              <Button className="bg-red-600 text-white hover:bg-red-700">
                <Plus className="h-4 w-4 mr-2" />
                Create New Blog
              </Button>
            </Link>
          </div>
        </div>

        {/* Search */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600 h-4 w-4" />
            <Input
              placeholder="Search blogs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white border-gray-200 text-gray-900"
            />
          </div>
        </div>

        {/* Blogs Table */}
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-900">All Blogs ({blogs.length})</CardTitle>
            <CardDescription className="text-gray-600">
              Manage and organize blog posts
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingBlogs ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-100 rounded animate-pulse"></div>
                ))}
              </div>
            ) : blogs.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-600 text-lg">No blogs found</p>
                <Link href="/admin/blogs/new">
                  <Button className="mt-4 bg-red-600 text-white hover:bg-red-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Blog
                  </Button>
                </Link>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-200">
                    <TableHead className="text-gray-600">Title</TableHead>
                    <TableHead className="text-gray-600">Category</TableHead>
                    <TableHead className="text-gray-600">Author</TableHead>
                    <TableHead className="text-gray-600">Views</TableHead>
                    <TableHead className="text-gray-600">Likes</TableHead>
                    <TableHead className="text-gray-600">Status</TableHead>
                    <TableHead className="text-gray-600">Created</TableHead>
                    <TableHead className="text-gray-600">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {blogs.map((blog) => (
                    <TableRow key={blog._id} className="border-gray-200">
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-gray-900">{blog.title}</span>
                          {blog.isFeatured && (
                            <Badge className="bg-yellow-600 text-gray-900">Featured</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-600">{blog.category}</TableCell>
                      <TableCell className="text-gray-600">{blog.author?.name || 'Unknown'}</TableCell>
                      <TableCell className="text-gray-600">{blog.views || 0}</TableCell>
                      <TableCell className="text-gray-600">{blog.likes?.length || 0}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={blog.isPublished ? 'default' : 'secondary'} 
                          className={blog.isPublished ? 'bg-green-600 text-gray-900' : 'bg-gray-600 text-gray-900'}
                        >
                          {blog.isPublished ? 'Published' : 'Draft'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {new Date(blog.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Link href={`/admin/blogs/${blog._id}/edit`}>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="bg-white border-gray-300 text-gray-900 hover:bg-gray-100"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleTogglePublished(blog._id, blog.isPublished)}
                            className="bg-white border-gray-300 text-gray-900 hover:bg-gray-100"
                          >
                            {blog.isPublished ? 'Unpublish' : 'Publish'}
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleToggleFeatured(blog._id, blog.isFeatured ?? false)}
                            className="bg-white border-gray-300 text-gray-900 hover:bg-gray-100"
                          >
                            {blog.isFeatured ? 'Unfeature' : 'Feature'}
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleDelete(blog._id)}
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

