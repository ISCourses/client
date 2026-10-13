import type { Metadata } from 'next'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import PrayerTimes from '@/components/PrayerTimes'

export const metadata: Metadata = {
  title: 'Prayer Times',
  description: 'Daily and monthly prayer times for your city or ZIP code, with Gregorian and Islamic dates.'
}

export default function PrayerTimesPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        <PrayerTimes variant="full" />
      </main>
      <Footer />
    </div>
  )
}
