'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, User, Heart } from 'lucide-react'
import api from '@/lib/api'

interface Blog {
  _id: string
  title: string
  excerpt: string
  category: string
  author: {
    name: string
  }
  createdAt: string
  views: number
  likes: string[]
  featuredImage?: string
  thumbnail?: string
}

export default function FeaturedBlogs() {
  const [blogs, setBlogs] = useState<Blog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBlogs()
  }, [])

  const fetchBlogs = async () => {
    try {
      const response = await api.get('/blogs?featured=true&limit=3')
      setBlogs(response.data)
    } catch (error) {
      console.error('Failed to fetch blogs:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Islamic Articles & Insights</h2>
            <p className="text-gray-600 mt-4">Discover wisdom, guidance, and spiritual insights from Islamic teachings</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm border p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-4"></div>
                <div className="h-3 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900">Islamic Articles & Insights</h2>
          <p className="text-gray-600 mt-4">Discover wisdom, guidance, and spiritual insights from Islamic teachings</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {blogs.map((blog) => (
            <Card key={blog._id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="aspect-video bg-gray-200 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                  {(blog.thumbnail || blog.featuredImage) ? (
                    <img 
                      src={blog.thumbnail || blog.featuredImage} 
                      alt={blog.title}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <div className="text-gray-400 text-sm">No image</div>
                  )}
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
                  <span className="bg-red-100 text-red-600 px-2 py-1 rounded-full text-xs">
                    {blog.category}
                  </span>
                </div>
                <CardTitle className="text-lg line-clamp-2">{blog.title}</CardTitle>
                <CardDescription className="line-clamp-3">
                  {blog.excerpt}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-1" />
                      {blog.author.name}
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {new Date(blog.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Heart className="h-4 w-4 mr-1" />
                    {blog.likes.length}
                  </div>
                </div>
                <Link href={`/blogs/${blog._id}`}>
                  <Button variant="outline" size="sm" className="w-full">
                    Read More
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link href="/blogs">
            <Button variant="outline" size="lg">
              View All Posts
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
