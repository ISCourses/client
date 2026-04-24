'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, BookOpen, Star, Heart } from 'lucide-react'

interface HomepageContent {
  heroTitle: string
  heroDescription: string
  heroImage: string
}

interface HeroProps {
  /** CMS fields from API; missing keys use built-in fallbacks */
  initialContent?: Partial<HomepageContent> | null
}

export default function Hero({ initialContent }: HeroProps) {
  const content = initialContent
  const heroTitle = content?.heroTitle || 'Seek Knowledge, Seek Islam'
  const heroDescription = content?.heroDescription || '"Seek knowledge from the cradle to the grave" - Prophet Muhammad (PBUH). Discover authentic Islamic courses, books, and resources to strengthen your faith and understanding.'
  const heroImage = content?.heroImage

  return (
    <section 
      className={`py-20 ${heroImage ? '' : 'bg-gradient-to-r from-red-50 to-white'}`}
      style={heroImage ? {
        backgroundImage: `url(${heroImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      } : {}}
    >
      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${heroImage ? 'bg-black bg-opacity-50 rounded-lg py-12' : ''}`}>
        <div className="text-center">
          <div className="mb-4">
            <span className={`text-2xl font-arabic ${heroImage ? 'text-white' : 'text-red-600'}`}>بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</span>
          </div>
          <h1 className={`text-4xl md:text-6xl font-bold mb-6 ${heroImage ? 'text-white' : 'text-gray-900'}`}>
            {heroTitle.split(',')[0]}
            {heroTitle.includes(',') && <span className="text-red-600">, {heroTitle.split(',').slice(1).join(',')}</span>}
          </h1>
          <p className={`text-xl mb-8 max-w-3xl mx-auto ${heroImage ? 'text-white' : 'text-gray-700'}`}>
            {heroDescription}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/courses">
              <Button size="lg" className="flex items-center space-x-2">
                <span>Explore Islamic Courses</span>
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="/books">
              <Button variant="outline" size="lg" className="flex items-center space-x-2">
                <BookOpen className="h-5 w-5" />
                <span>Browse Islamic Books</span>
              </Button>
            </Link>
          </div>
        </div>

        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Authentic Islamic Knowledge</h3>
            <p className="text-gray-600">Learn from authentic sources including Quran, Hadith, and scholarly works</p>
          </div>
          <div className="text-center">
            <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Strengthen Your Faith</h3>
            <p className="text-gray-600">Deepen your understanding of Islam and strengthen your connection with Allah</p>
          </div>
          <div className="text-center">
            <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Star className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Lifetime Learning</h3>
            <p className="text-gray-600">Access comprehensive Islamic education with courses, books, and quizzes</p>
          </div>
        </div>
      </div>
    </section>
  )
}
