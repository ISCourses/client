'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface CarouselSlide {
  imageUrl: string
  title?: string
  subtitle?: string
  linkLabel?: string
  linkHref?: string
  order?: number
}

interface HomeCarouselProps {
  slides: CarouselSlide[]
}

export default function HomeCarousel({ slides }: HomeCarouselProps) {
  const sorted = [...slides]
    .filter((s) => s.imageUrl)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))

  const [index, setIndex] = useState(0)

  const len = sorted.length
  const go = useCallback(
    (next: number) => {
      if (len === 0) return
      const i = ((next % len) + len) % len
      setIndex(i)
    },
    [len]
  )

  useEffect(() => {
    if (len <= 1) return
    const t = setInterval(() => {
      setIndex((i) => (i + 1) % len)
    }, 6000)
    return () => clearInterval(t)
  }, [len])

  if (len === 0) return null

  const slide = sorted[index]

  return (
    <section className="relative min-h-[420px] md:min-h-[520px] overflow-hidden bg-gray-900">
      <div
        className="absolute inset-0 bg-cover bg-center transition-all duration-700"
        style={{ backgroundImage: `url(${slide.imageUrl})` }}
      />
      <div className="absolute inset-0 bg-black/50" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-[420px] md:min-h-[520px] flex flex-col items-center justify-center text-center py-16">
        {slide.title && (
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 drop-shadow-md">{slide.title}</h1>
        )}
        {slide.subtitle && (
          <p className="text-lg md:text-xl text-white/95 max-w-3xl mb-8 drop-shadow">{slide.subtitle}</p>
        )}
        {slide.linkLabel && slide.linkHref && (
          <Button asChild size="lg" className="bg-red-600 hover:bg-red-700 text-white">
            <Link href={slide.linkHref}>{slide.linkLabel}</Link>
          </Button>
        )}
      </div>

      {len > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous slide"
            className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/40 text-white hover:bg-black/60"
            onClick={() => go(index - 1)}
          >
            <ChevronLeft className="h-8 w-8" />
          </button>
          <button
            type="button"
            aria-label="Next slide"
            className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/40 text-white hover:bg-black/60"
            onClick={() => go(index + 1)}
          >
            <ChevronRight className="h-8 w-8" />
          </button>
          <div className="absolute bottom-4 left-0 right-0 z-20 flex justify-center gap-2">
            {sorted.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Go to slide ${i + 1}`}
                className={cn(
                  'h-2 rounded-full transition-all',
                  i === index ? 'w-8 bg-white' : 'w-2 bg-white/50 hover:bg-white/70'
                )}
                onClick={() => go(i)}
              />
            ))}
          </div>
        </>
      )}
    </section>
  )
}
