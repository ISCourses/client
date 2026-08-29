// Shared Book type definition
export interface Book {
  _id: string
  title: string
  author?: string
  description?: string
  category: string
  price: number
  currency?: string
  language?: string
  pages?: number | null
  isbn?: string
  publisher?: string
  publicationYear?: number | null
  coverImage?: string
  pdfFile?: string
  isPublished: boolean
  isFeatured?: boolean
  tags?: string[]
  downloads?: number
  rating: {
    average: number
    count: number
  }
  purchasedBy?: Array<{
    user: string
    purchasedAt: string
  }>
  createdAt?: string
  updatedAt?: string
}

