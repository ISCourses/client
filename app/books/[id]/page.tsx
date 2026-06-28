'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BookOpen, Star, ShoppingCart, Download, ArrowLeft, Clock, User, Calendar } from 'lucide-react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import api from '@/lib/api'
import toast from 'react-hot-toast'

interface Book {
  _id: string
  title: string
  author: string
  description: string
  category: string
  price: number
  currency: string
  language: string
  pages: number
  isbn: string
  publisher: string
  publicationYear: number
  coverImage: string
  pdfFile?: string
  isFeatured: boolean
  tags: string[]
  rating: {
    average: number
    count: number
  }
  downloads: number
  purchasedBy: any[]
}

export default function BookDetailPage() {
  const params = useParams()
  const { user } = useAuth()
  const router = useRouter()
  const [book, setBook] = useState<Book | null>(null)
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState(false)
  const [isPurchased, setIsPurchased] = useState(false)
  const [showPdfViewer, setShowPdfViewer] = useState(false)

  useEffect(() => {
    if (params.id) {
      fetchBook()
    }
  }, [params.id])

  useEffect(() => {
    if (book && user) {
      checkPurchaseStatus()
    }
  }, [book, user])

  const fetchBook = async () => {
    try {
      const response = await api.get(`/books/${params.id}`)
      setBook(response.data)
    } catch (error) {
      console.error('Failed to fetch book:', error)
      toast.error('Failed to load book')
    } finally {
      setLoading(false)
    }
  }

  const checkPurchaseStatus = () => {
    if (user && book) {
      // Check if user has purchased - handle both populated and unpopulated user references
      const purchased = book.purchasedBy.some(
        purchase => {
          const userId = purchase.user?._id || purchase.user || purchase.user?.toString()
          const currentUserId = user.id
          return userId?.toString() === currentUserId?.toString()
        }
      )
      setIsPurchased(purchased)
    } else if (!user) {
      setIsPurchased(false)
    }
  }

  const handlePurchase = async () => {
    if (!user) {
      toast.error('Please login to purchase books')
      router.push('/login')
      return
    }

    setPurchasing(true)
    try {
      await api.post(`/books/${book!._id}/purchase`)
      setIsPurchased(true)
      toast.success('Book purchased successfully!')
      // Refresh book data to get updated purchase status
      await fetchBook()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to purchase book')
    } finally {
      setPurchasing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1">
                <div className="h-96 bg-gray-200 rounded"></div>
              </div>
              <div className="lg:col-span-2 space-y-4">
                <div className="h-8 bg-gray-200 rounded w-2/3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  if (!book) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Book not found</h1>
            <Link href="/books">
              <Button>Back to Products</Button>
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
            <Link href="/books" className="hover:text-red-600">Products</Link>
            <span>/</span>
            <span>{book.title}</span>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{book.title}</h1>
          <p className="text-gray-600 text-lg">by {book.author}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Book Cover and Purchase */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <div className="aspect-[3/4] bg-gray-200 rounded-lg mb-4 flex items-center justify-center">
                  <img 
                    src={book.coverImage || '/book-default.jpeg'} 
                    alt={book.title}
                    className="w-full h-full object-cover rounded-lg"
                  />
                </div>
                <div className="flex items-center justify-between mb-2">
                  {book.isFeatured && (
                    <Badge className="bg-red-600 text-white">Featured</Badge>
                  )}
                  <div className="flex items-center text-sm text-gray-600">
                    <Star className="h-4 w-4 text-yellow-400 mr-1" />
                    {book.rating.average.toFixed(1)} ({book.rating.count} reviews)
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-red-600">${book.price}</p>
                    <p className="text-sm text-gray-500">{book.currency}</p>
                  </div>

                  {isPurchased ? (
                    <div className="text-center space-y-2">
                      <div className="bg-green-100 text-green-600 px-4 py-2 rounded-lg mb-4">
                        ✓ You own this book
                      </div>
                      {book.pdfFile && (
                        <Button 
                          className="w-full" 
                          variant="outline"
                          onClick={() => {
                            window.open(book.pdfFile, '_blank')
                          }}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download PDF
                        </Button>
                      )}
                    </div>
                  ) : (
                    <Button 
                      onClick={handlePurchase}
                      disabled={purchasing}
                      className="w-full"
                    >
                      {purchasing ? (
                        'Processing...'
                      ) : (
                        <>
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          Buy Now - ${book.price}
                        </>
                      )}
                    </Button>
                  )}

                  <div className="text-center text-sm text-gray-500">
                    {book.downloads} downloads
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Book Details */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Book Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">{book.description}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Book Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3">
                    <BookOpen className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Pages</p>
                      <p className="text-sm text-gray-600">{book.pages}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <User className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Author</p>
                      <p className="text-sm text-gray-600">{book.author}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Published</p>
                      <p className="text-sm text-gray-600">{book.publicationYear}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <BookOpen className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Publisher</p>
                      <p className="text-sm text-gray-600">{book.publisher}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <BookOpen className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Language</p>
                      <p className="text-sm text-gray-600">{book.language}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <BookOpen className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">ISBN</p>
                      <p className="text-sm text-gray-600">{book.isbn}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {book.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="bg-gray-100">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* PDF Viewer - Only for purchased books or free books */}
            {book.pdfFile && (isPurchased || book.price === 0) && (
              <Card>
                <CardHeader>
                  <CardTitle>Read Book</CardTitle>
                  <CardDescription>
                    {book.price === 0 ? 'This book is free to read' : 'View the book PDF below'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!showPdfViewer ? (
                    <div className="text-center py-12">
                      <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready to Read</h3>
                      <p className="text-gray-600 mb-6">
                        Click the button below to view the PDF
                      </p>
                      <div className="flex justify-center space-x-2">
                        <Button
                          onClick={() => setShowPdfViewer(true)}
                          className="bg-red-600 text-white hover:bg-red-700"
                        >
                          <BookOpen className="h-4 w-4 mr-2" />
                          View PDF
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            const newWindow = window.open('', '_blank')
                            if (newWindow) {
                              newWindow.location.href = book.pdfFile!
                            }
                          }}
                        >
                          <BookOpen className="h-4 w-4 mr-2" />
                          Open in New Tab
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            const link = document.createElement('a')
                            link.href = book.pdfFile!
                            link.download = `${book.title}.pdf`
                            document.body.appendChild(link)
                            link.click()
                            document.body.removeChild(link)
                          }}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download PDF
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="w-full" style={{ height: '800px' }}>
                        <object
                          data={`${book.pdfFile}#toolbar=1&navpanes=0&scrollbar=1`}
                          type="application/pdf"
                          className="w-full h-full border border-gray-300 rounded-lg"
                          aria-label={`${book.title} PDF`}
                        >
                          <div className="flex flex-col items-center justify-center h-full bg-gray-50 rounded-lg">
                            <BookOpen className="h-12 w-12 text-gray-400 mb-4" />
                            <p className="text-gray-600 mb-4">Unable to display PDF in browser</p>
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                onClick={() => {
                                  const newWindow = window.open('', '_blank')
                                  if (newWindow) {
                                    newWindow.location.href = book.pdfFile!
                                  }
                                }}
                              >
                                <BookOpen className="h-4 w-4 mr-2" />
                                Open in New Tab
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => {
                                  const link = document.createElement('a')
                                  link.href = book.pdfFile!
                                  link.download = `${book.title}.pdf`
                                  document.body.appendChild(link)
                                  link.click()
                                  document.body.removeChild(link)
                                }}
                              >
                                <Download className="h-4 w-4 mr-2" />
                                Download PDF
                              </Button>
                            </div>
                          </div>
                        </object>
                      </div>
                      <div className="mt-4 flex justify-center space-x-2">
                        <Button
                          variant="outline"
                          onClick={() => setShowPdfViewer(false)}
                        >
                          Hide PDF Viewer
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            const newWindow = window.open('', '_blank')
                            if (newWindow) {
                              newWindow.location.href = book.pdfFile!
                            }
                          }}
                        >
                          <BookOpen className="h-4 w-4 mr-2" />
                          Open in New Tab
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            const link = document.createElement('a')
                            link.href = book.pdfFile!
                            link.download = `${book.title}.pdf`
                            document.body.appendChild(link)
                            link.click()
                            document.body.removeChild(link)
                          }}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download PDF
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Message for non-purchased paid books */}
            {book.pdfFile && !isPurchased && book.price > 0 && (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Purchase to Read</h3>
                    <p className="text-gray-600 mb-4">
                      Purchase this book to view and download the PDF
                    </p>
                    <Button
                      onClick={handlePurchase}
                      disabled={purchasing || !user}
                      className="bg-red-600 text-white hover:bg-red-700"
                    >
                      {purchasing ? (
                        'Processing...'
                      ) : (
                        <>
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          Buy Now - ${book.price}
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
