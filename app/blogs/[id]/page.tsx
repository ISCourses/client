'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Heart, Calendar, User, Eye, MessageCircle, Send, Trash2 } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import api from '@/lib/api'
import toast from 'react-hot-toast'

interface Comment {
  _id: string
  user: {
    _id: string
    name: string
    email: string
  }
  text: string
  createdAt: string
}

interface Blog {
  _id: string
  title: string
  content: string
  excerpt: string
  category: string
  author: {
    name: string
  }
  views: number
  likes: string[]
  featuredImage?: string
  thumbnail?: string
  tags: string[]
  createdAt: string
  isFeatured: boolean
  comments?: Comment[]
}

export default function BlogDetailPage() {
  const params = useParams()
  const { user } = useAuth()
  const [blog, setBlog] = useState<Blog | null>(null)
  const [loading, setLoading] = useState(true)
  const [liking, setLiking] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)
  const [deletingComment, setDeletingComment] = useState<string | null>(null)

  useEffect(() => {
    if (params.id) {
      fetchBlog()
    }
  }, [params.id])

  useEffect(() => {
    if (blog && user) {
      // Check if user ID is in likes array (handles both string IDs and ObjectIds)
      const isLiked = blog.likes?.some((likeId: any) => 
        likeId === user.id || likeId.toString() === user.id || likeId._id === user.id
      ) || false
      setIsLiked(isLiked)
    }
  }, [blog, user])

  const fetchBlog = async () => {
    try {
      const response = await api.get(`/blogs/${params.id}`)
      setBlog(response.data)
      // Check if user ID is in likes array
      if (user) {
        const isLiked = response.data.likes?.some((likeId: any) => 
          likeId === user.id || likeId.toString() === user.id || likeId._id === user.id
        ) || false
        setIsLiked(isLiked)
      }
    } catch (error: any) {
      console.error('Failed to fetch blog:', error)
      toast.error(error.response?.data?.message || 'Failed to load blog')
    } finally {
      setLoading(false)
    }
  }

  const handleLike = async () => {
    if (!user) {
      toast.error('Please login to like blogs')
      return
    }

    setLiking(true)
    try {
      const response = await api.post(`/blogs/${params.id}/like`)
      setIsLiked(!isLiked)
      if (blog) {
        setBlog({
          ...blog,
          likes: response.data.likes || blog.likes
        })
      }
    } catch (error: any) {
      console.error('Failed to like blog:', error)
      toast.error(error.response?.data?.message || 'Failed to like blog')
    } finally {
      setLiking(false)
    }
  }

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      toast.error('Please login to comment')
      return
    }

    if (!commentText.trim()) {
      toast.error('Please enter a comment')
      return
    }

    setSubmittingComment(true)
    try {
      const response = await api.post(`/blogs/${params.id}/comments`, {
        text: commentText
      })
      
      // Refresh blog to get updated comments
      await fetchBlog()
      setCommentText('')
      toast.success('Comment added successfully!')
    } catch (error: any) {
      console.error('Failed to add comment:', error)
      toast.error(error.response?.data?.message || 'Failed to add comment')
    } finally {
      setSubmittingComment(false)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) {
      return
    }

    setDeletingComment(commentId)
    try {
      await api.delete(`/blogs/${params.id}/comments/${commentId}`)
      // Refresh blog to get updated comments
      await fetchBlog()
      toast.success('Comment deleted successfully!')
    } catch (error: any) {
      console.error('Failed to delete comment:', error)
      toast.error(error.response?.data?.message || 'Failed to delete comment')
    } finally {
      setDeletingComment(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-64 bg-gray-200 rounded mb-4"></div>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  if (!blog) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Blog not found</h1>
            <Link href="/blogs">
              <Button>Back to Blogs</Button>
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
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link href="/blogs">
            <Button variant="outline" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Blogs
            </Button>
          </Link>
          
          <div className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
            <Link href="/blogs" className="hover:text-red-600">Blogs</Link>
            <span>/</span>
            <span>{blog.title}</span>
          </div>
        </div>

        <article>
          {/* Thumbnail/Featured Image */}
          {(blog.thumbnail || blog.featuredImage) && (
            <div className="aspect-video bg-gray-200 rounded-lg mb-8 overflow-hidden">
              <img 
                src={blog.thumbnail || blog.featuredImage} 
                alt={blog.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Header */}
          <header className="mb-8">
            <div className="flex items-center space-x-2 mb-4">
              <Badge className="bg-red-600 text-white">{blog.category}</Badge>
              {blog.isFeatured && (
                <Badge className="bg-yellow-500 text-white">Featured</Badge>
              )}
            </div>
            
            <h1 className="text-4xl font-bold text-gray-900 mb-4">{blog.title}</h1>
            
            <div className="flex items-center space-x-6 text-sm text-gray-600 mb-4">
              <div className="flex items-center">
                <User className="h-4 w-4 mr-2" />
                {blog.author?.name || 'Unknown'}
              </div>
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                {new Date(blog.createdAt).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
              <div className="flex items-center">
                <Eye className="h-4 w-4 mr-2" />
                {blog.views || 0} views
              </div>
            </div>

            {/* Tags */}
            {blog.tags && blog.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {blog.tags.map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-gray-600">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </header>

          {/* Content */}
          <Card className="mb-8">
            <CardContent className="pt-6">
              <div 
                className="prose max-w-none text-gray-700 leading-relaxed"
                dangerouslySetInnerHTML={{ 
                  __html: blog.content.replace(/\n/g, '<br />') 
                }}
              />
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-between pt-6 border-t">
            <Button
              onClick={handleLike}
              disabled={liking}
              variant={isLiked ? "default" : "outline"}
              className={isLiked ? "bg-red-600 text-white hover:bg-red-700" : ""}
            >
              <Heart className={`h-4 w-4 mr-2 ${isLiked ? 'fill-current' : ''}`} />
              {isLiked ? 'Liked' : 'Like'} ({blog.likes?.length || 0})
            </Button>

            <div className="text-sm text-gray-500">
              {blog.views || 0} views
            </div>
          </div>
        </article>

        {/* Comments Section */}
        <Card className="mt-8">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 mb-6">
              <MessageCircle className="h-5 w-5 text-gray-600" />
              <h2 className="text-2xl font-bold text-gray-900">
                Comments ({blog.comments?.length || 0})
              </h2>
            </div>

            {/* Comment Form */}
            {user ? (
              <form onSubmit={handleSubmitComment} className="mb-8">
                <div className="flex space-x-2">
                  <Input
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Write a comment..."
                    className="flex-1"
                  />
                  <Button
                    type="submit"
                    disabled={submittingComment || !commentText.trim()}
                    className="bg-red-600 text-white hover:bg-red-700"
                  >
                    {submittingComment ? (
                      'Posting...'
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Post
                      </>
                    )}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="mb-8 p-4 bg-gray-50 rounded-lg text-center">
                <p className="text-gray-600 mb-2">Please login to leave a comment</p>
                <Link href="/login">
                  <Button variant="outline">Login</Button>
                </Link>
              </div>
            )}

            {/* Comments List */}
            <div className="space-y-4">
              {blog.comments && blog.comments.length > 0 ? (
                blog.comments.map((comment) => (
                  <div
                    key={comment._id}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <User className="h-4 w-4 text-gray-500" />
                          <span className="font-semibold text-gray-900">
                            {comment.user?.name || 'Anonymous'}
                          </span>
                          <span className="text-sm text-gray-500">
                            • {new Date(comment.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <p className="text-gray-700 whitespace-pre-wrap">{comment.text}</p>
                      </div>
                      {(user?.id === comment.user?._id || user?.role === 'admin') && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteComment(comment._id)}
                          disabled={deletingComment === comment._id}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          {deletingComment === comment._id ? (
                            'Deleting...'
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No comments yet. Be the first to comment!</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  )
}

