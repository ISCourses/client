'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Save, Loader2, Upload, X, Eye, Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react'
import Link from 'next/link'
import AdminSidebar from '@/components/AdminSidebar'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import { cmsPagePath } from '@/lib/cms'

interface Settings {
  siteName: string
  siteDescription: string
  siteLogo: string
  siteFavicon: string
  siteUrl: string
  contactEmail: string
  contactPhone: string
  contactAddress: string
  socialMedia: {
    facebook: string
    twitter: string
    instagram: string
    linkedin: string
    youtube: string
  }
  emailSettings: {
    fromEmail: string
    fromName: string
    smtpHost: string
    smtpPort: number
    smtpUser: string
    smtpPassword: string
    smtpSecure: boolean
  }
  paymentSettings: {
    currency: string
    currencySymbol: string
    stripePublicKey: string
    stripeSecretKey: string
    paypalClientId: string
    paypalSecret: string
  }
  generalSettings: {
    timezone: string
    language: string
    dateFormat: string
    timeFormat: string
  }
  features: {
    enableRegistration: boolean
    enableEmailVerification: boolean
    enableComments: boolean
    enableRatings: boolean
    enableCertificates: boolean
    enableNotifications: boolean
  }
  courseSettings: {
    defaultDuration: number
    allowFreeCourses: boolean
    requireEnrollment: boolean
    maxFileSize: number
    allowedFileTypes: string[]
  }
  seoSettings: {
    metaTitle: string
    metaDescription: string
    metaKeywords: string
    googleAnalyticsId: string
    facebookPixelId: string
  }
  legalPages: {
    termsOfService: string
    privacyPolicy: string
    refundPolicy: string
    cookiePolicy: string
  }
  navMenu: {
    label: string
    href: string
    order: number
    openInNewTab: boolean
  }[]
  footerSettings: {
    quickLinksTitle: string
    supportTitle: string
    quickLinks: { label: string; href: string; order: number }[]
    supportLinks: { label: string; href: string; order: number }[]
    copyrightLine: string
  }
  homepageContent: {
    aboutUs: string
    contactContent: string
    heroTitle: string
    heroDescription: string
    heroImage: string
    carouselSlides: {
      imageUrl: string
      title: string
      subtitle: string
      linkLabel: string
      linkHref: string
      order: number
    }[]
    additionalSections: {
      title: string
      bodyHtml: string
      order: number
    }[]
  }
  maintenanceMode: {
    enabled: boolean
    message: string
  }
  registrationSettings: {
    requireEmailVerification: boolean
    allowSocialLogin: boolean
    minPasswordLength: number
    requireStrongPassword: boolean
  }
}

export default function AdminSettingsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loadingSettings, setLoadingSettings] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingHeroImage, setUploadingHeroImage] = useState(false)
  const [uploadingCarouselIndex, setUploadingCarouselIndex] = useState<number | null>(null)
  const [cmsPublishedPages, setCmsPublishedPages] = useState<{ title: string; slug: string }[]>([])
  const [cmsAddSlug, setCmsAddSlug] = useState('')
  const [cmsAddTarget, setCmsAddTarget] = useState<'nav' | 'quick' | 'support'>('nav')

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.push('/')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchSettings()
    }
  }, [user])

  useEffect(() => {
    if (user?.role !== 'admin') return
    api
      .get('/cms-pages/admin/all')
      .then((res) => {
        const list = (res.data || []).filter((p: { published?: boolean; archived?: boolean }) => p.published && !p.archived)
        setCmsPublishedPages(list.map((p: { title: string; slug: string }) => ({ title: p.title, slug: p.slug })))
      })
      .catch(() => setCmsPublishedPages([]))
  }, [user])

  const fetchSettings = async () => {
    try {
      setLoadingSettings(true)
      const response = await api.get('/settings/admin/all')
      const data = response.data
      // Ensure all nested objects have default values
      setSettings({
        siteName: data.siteName || '',
        siteDescription: data.siteDescription || '',
        siteLogo: data.siteLogo || '',
        siteFavicon: data.siteFavicon || '',
        siteUrl: data.siteUrl || '',
        contactEmail: data.contactEmail || '',
        contactPhone: data.contactPhone || '',
        contactAddress: data.contactAddress || '',
        socialMedia: {
          facebook: data.socialMedia?.facebook || '',
          twitter: data.socialMedia?.twitter || '',
          instagram: data.socialMedia?.instagram || '',
          linkedin: data.socialMedia?.linkedin || '',
          youtube: data.socialMedia?.youtube || ''
        },
        emailSettings: {
          fromEmail: data.emailSettings?.fromEmail || '',
          fromName: data.emailSettings?.fromName || 'NOI LMS',
          smtpHost: data.emailSettings?.smtpHost || '',
          smtpPort: data.emailSettings?.smtpPort || 587,
          smtpUser: data.emailSettings?.smtpUser || '',
          smtpPassword: data.emailSettings?.smtpPassword || '',
          smtpSecure: data.emailSettings?.smtpSecure || false
        },
        paymentSettings: {
          currency: data.paymentSettings?.currency || 'USD',
          currencySymbol: data.paymentSettings?.currencySymbol || '$',
          stripePublicKey: data.paymentSettings?.stripePublicKey || '',
          stripeSecretKey: data.paymentSettings?.stripeSecretKey || '',
          paypalClientId: data.paymentSettings?.paypalClientId || '',
          paypalSecret: data.paymentSettings?.paypalSecret || ''
        },
        generalSettings: {
          timezone: data.generalSettings?.timezone || 'UTC',
          language: data.generalSettings?.language || 'en',
          dateFormat: data.generalSettings?.dateFormat || 'MM/DD/YYYY',
          timeFormat: data.generalSettings?.timeFormat || '12h'
        },
        features: {
          enableRegistration: data.features?.enableRegistration !== false,
          enableEmailVerification: data.features?.enableEmailVerification || false,
          enableComments: data.features?.enableComments || false,
          enableRatings: data.features?.enableRatings || false,
          enableCertificates: data.features?.enableCertificates || false,
          enableNotifications: data.features?.enableNotifications || false
        },
        courseSettings: {
          defaultDuration: data.courseSettings?.defaultDuration || 0,
          allowFreeCourses: data.courseSettings?.allowFreeCourses !== false,
          requireEnrollment: data.courseSettings?.requireEnrollment || false,
          maxFileSize: data.courseSettings?.maxFileSize || 10,
          allowedFileTypes: data.courseSettings?.allowedFileTypes || ['pdf', 'doc', 'docx', 'mp4', 'mp3']
        },
        seoSettings: {
          metaTitle: data.seoSettings?.metaTitle || '',
          metaDescription: data.seoSettings?.metaDescription || '',
          metaKeywords: data.seoSettings?.metaKeywords || '',
          googleAnalyticsId: data.seoSettings?.googleAnalyticsId || '',
          facebookPixelId: data.seoSettings?.facebookPixelId || ''
        },
        legalPages: {
          termsOfService: data.legalPages?.termsOfService || '',
          privacyPolicy: data.legalPages?.privacyPolicy || '',
          refundPolicy: data.legalPages?.refundPolicy || '',
          cookiePolicy: data.legalPages?.cookiePolicy || ''
        },
        maintenanceMode: {
          enabled: data.maintenanceMode?.enabled || false,
          message: data.maintenanceMode?.message || 'We are currently performing maintenance. Please check back soon.'
        },
        registrationSettings: {
          requireEmailVerification: data.registrationSettings?.requireEmailVerification || false,
          allowSocialLogin: data.registrationSettings?.allowSocialLogin || false,
          minPasswordLength: data.registrationSettings?.minPasswordLength || 6,
          requireStrongPassword: data.registrationSettings?.requireStrongPassword || false
        },
        navMenu: Array.isArray(data.navMenu)
          ? data.navMenu.map((item: any, i: number) => ({
              label: item.label || '',
              href: item.href || '',
              order: typeof item.order === 'number' ? item.order : i,
              openInNewTab: !!item.openInNewTab
            }))
          : [],
        footerSettings: {
          quickLinksTitle: data.footerSettings?.quickLinksTitle || 'Quick Links',
          supportTitle: data.footerSettings?.supportTitle || 'Support',
          quickLinks: Array.isArray(data.footerSettings?.quickLinks)
            ? data.footerSettings.quickLinks.map((item: any, i: number) => ({
                label: item.label || '',
                href: item.href || '',
                order: typeof item.order === 'number' ? item.order : i
              }))
            : [],
          supportLinks: Array.isArray(data.footerSettings?.supportLinks)
            ? data.footerSettings.supportLinks.map((item: any, i: number) => ({
                label: item.label || '',
                href: item.href || '',
                order: typeof item.order === 'number' ? item.order : i
              }))
            : [],
          copyrightLine: data.footerSettings?.copyrightLine || ''
        },
        homepageContent: {
          aboutUs: data.homepageContent?.aboutUs || '',
          contactContent: data.homepageContent?.contactContent || '',
          heroTitle: data.homepageContent?.heroTitle || 'Welcome to NOI LMS',
          heroDescription: data.homepageContent?.heroDescription || 'Your gateway to Islamic learning',
          heroImage: data.homepageContent?.heroImage || '',
          carouselSlides: Array.isArray(data.homepageContent?.carouselSlides)
            ? data.homepageContent.carouselSlides.map((s: any, i: number) => ({
                imageUrl: s.imageUrl || '',
                title: s.title || '',
                subtitle: s.subtitle || '',
                linkLabel: s.linkLabel || '',
                linkHref: s.linkHref || '',
                order: typeof s.order === 'number' ? s.order : i
              }))
            : [],
          additionalSections: Array.isArray(data.homepageContent?.additionalSections)
            ? data.homepageContent.additionalSections.map((s: any, i: number) => ({
                title: s.title || '',
                bodyHtml: s.bodyHtml || '',
                order: typeof s.order === 'number' ? s.order : i
              }))
            : []
        }
      })
    } catch (error) {
      console.error('Failed to fetch settings:', error)
      toast.error('Failed to load settings')
    } finally {
      setLoadingSettings(false)
    }
  }

  const handleSave = async () => {
    if (!settings) return

    setSaving(true)
    try {
      await api.put('/settings', settings)
      toast.success('Settings saved successfully!')
    } catch (error: any) {
      console.error('Failed to save settings:', error)
      toast.error(error.response?.data?.message || 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const updateField = (path: string, value: any) => {
    if (!settings) return

    const keys = path.split('.')
    const newSettings = { ...settings }
    let current: any = newSettings

    for (let i = 0; i < keys.length - 1; i++) {
      current[keys[i]] = { ...current[keys[i]] }
      current = current[keys[i]]
    }

    current[keys[keys.length - 1]] = value
    setSettings(newSettings)
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingLogo(true)
    try {
      const formData = new FormData()
      formData.append('image', file)

      const response = await api.post('/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      
      updateField('siteLogo', response.data.url)
      toast.success('Logo uploaded successfully!')
    } catch (error: any) {
      console.error('Logo upload error:', error)
      toast.error(error.response?.data?.message || 'Failed to upload logo')
    } finally {
      setUploadingLogo(false)
    }
  }

  const handleHeroImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingHeroImage(true)
    try {
      const formData = new FormData()
      formData.append('image', file)

      const response = await api.post('/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      
      updateField('homepageContent.heroImage', response.data.url)
      toast.success('Hero image uploaded successfully!')
    } catch (error: any) {
      console.error('Hero image upload error:', error)
      toast.error(error.response?.data?.message || 'Failed to upload hero image')
    } finally {
      setUploadingHeroImage(false)
    }
  }

  const handleCarouselImageUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingCarouselIndex(index)
    try {
      const formData = new FormData()
      formData.append('image', file)

      const response = await api.post('/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      const slides = [...(settings?.homepageContent?.carouselSlides || [])]
      while (slides.length <= index) {
        slides.push({
          imageUrl: '',
          title: '',
          subtitle: '',
          linkLabel: '',
          linkHref: '',
          order: slides.length
        })
      }
      slides[index] = { ...slides[index], imageUrl: response.data.url, order: index }
      updateField('homepageContent.carouselSlides', slides)
      toast.success('Slide image uploaded')
    } catch (error: any) {
      console.error('Carousel upload error:', error)
      toast.error(error.response?.data?.message || 'Failed to upload image')
    } finally {
      setUploadingCarouselIndex(null)
      e.target.value = ''
    }
  }

  const reorderArray = <T,>(arr: T[], from: number, to: number): T[] => {
    const next = [...arr]
    const [removed] = next.splice(from, 1)
    next.splice(to, 0, removed)
    return next.map((item: any, i) => (typeof item === 'object' && item !== null ? { ...item, order: i } : item))
  }

  const addCmsPageToNavigation = () => {
    if (!settings) return
    const page = cmsPublishedPages.find((p) => p.slug === cmsAddSlug)
    if (!page) {
      toast.error('Choose a published CMS page')
      return
    }
    const href = cmsPagePath(page.slug)
    if (cmsAddTarget === 'nav') {
      const arr = [...(settings.navMenu || [])]
      arr.push({ label: page.title, href, order: arr.length, openInNewTab: false })
      updateField('navMenu', arr)
    } else if (cmsAddTarget === 'quick') {
      const arr = [...(settings.footerSettings?.quickLinks || [])]
      arr.push({ label: page.title, href, order: arr.length })
      updateField('footerSettings.quickLinks', arr)
    } else {
      const arr = [...(settings.footerSettings?.supportLinks || [])]
      arr.push({ label: page.title, href, order: arr.length })
      updateField('footerSettings.supportLinks', arr)
    }
    toast.success('Link added to this form — click Save All Settings below to apply.')
  }

  if (loading || loadingSettings) {
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

  if (!user || user.role !== 'admin' || !settings) {
    return null
  }

  return (
    <div className="min-h-screen bg-white flex">
      <AdminSidebar />
      
      <div className="flex-1 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600">Manage your LMS platform settings</p>
        </div>

        <Tabs defaultValue="site" className="space-y-6">
          <TabsList className="flex w-full flex-wrap gap-1">
            <TabsTrigger value="site">Site</TabsTrigger>
            <TabsTrigger value="homepage">Homepage</TabsTrigger>
            <TabsTrigger value="layout">Menus &amp; footer</TabsTrigger>
            <TabsTrigger value="contact">Contact</TabsTrigger>
            <TabsTrigger value="email">Email</TabsTrigger>
            <TabsTrigger value="payment">Payment</TabsTrigger>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
            <TabsTrigger value="registration">Registration</TabsTrigger>
          </TabsList>

          {/* Site Settings */}
          <TabsContent value="site" className="space-y-6">
            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle className="text-gray-900">Site Information</CardTitle>
                <CardDescription className="text-gray-600">
                  Basic site settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Site Name
                  </label>
                  <Input
                    value={settings.siteName || ''}
                    onChange={(e) => updateField('siteName', e.target.value)}
                    className="bg-white border-gray-300 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Site Description
                  </label>
                  <textarea
                    value={settings.siteDescription || ''}
                    onChange={(e) => updateField('siteDescription', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-900 placeholder-gray-400"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Site Logo
                    </label>
                    {settings.siteLogo && (
                      <div className="relative mb-2">
                        <img src={settings.siteLogo} alt="Logo" className="h-20 object-contain rounded" />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => updateField('siteLogo', '')}
                          className="absolute top-0 right-0 bg-white"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                      id="logo-upload"
                      disabled={uploadingLogo}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full bg-white border-gray-300 text-gray-900 hover:bg-gray-100"
                      disabled={uploadingLogo}
                      onClick={() => document.getElementById('logo-upload')?.click()}
                    >
                      {uploadingLogo ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          {settings.siteLogo ? 'Change Logo' : 'Upload Logo'}
                        </>
                      )}
                    </Button>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Site URL
                    </label>
                    <Input
                      value={settings.siteUrl || ''}
                      onChange={(e) => updateField('siteUrl', e.target.value)}
                      placeholder="https://example.com"
                      className="bg-white border-gray-300 text-gray-900"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle className="text-gray-900">SEO Settings</CardTitle>
                <CardDescription className="text-gray-600">
                  Search engine optimization
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Meta Title
                  </label>
                  <Input
                    value={settings.seoSettings?.metaTitle || ''}
                    onChange={(e) => updateField('seoSettings.metaTitle', e.target.value)}
                    className="bg-white border-gray-300 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Meta Description
                  </label>
                  <textarea
                    value={settings.seoSettings?.metaDescription || ''}
                    onChange={(e) => updateField('seoSettings.metaDescription', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-900 placeholder-gray-400"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Google Analytics ID
                    </label>
                    <Input
                      value={settings.seoSettings?.googleAnalyticsId || ''}
                      onChange={(e) => updateField('seoSettings.googleAnalyticsId', e.target.value)}
                      className="bg-white border-gray-300 text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Facebook Pixel ID
                    </label>
                    <Input
                      value={settings.seoSettings?.facebookPixelId || ''}
                      onChange={(e) => updateField('seoSettings.facebookPixelId', e.target.value)}
                      className="bg-white border-gray-300 text-gray-900"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Homepage Content */}
          <TabsContent value="homepage" className="space-y-6">
            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle className="text-gray-900">Hero Section</CardTitle>
                <CardDescription className="text-gray-600">
                  Customize the homepage hero section
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Hero Title
                  </label>
                  <Input
                    value={settings.homepageContent?.heroTitle || ''}
                    onChange={(e) => updateField('homepageContent.heroTitle', e.target.value)}
                    className="bg-white border-gray-300 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Hero Description
                  </label>
                  <textarea
                    value={settings.homepageContent?.heroDescription || ''}
                    onChange={(e) => updateField('homepageContent.heroDescription', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-900 placeholder-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Hero Image
                  </label>
                  {settings.homepageContent?.heroImage && (
                    <div className="relative mb-2">
                      <img src={settings.homepageContent.heroImage} alt="Hero" className="w-full h-64 object-cover rounded-lg" />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => updateField('homepageContent.heroImage', '')}
                        className="absolute top-2 right-2 bg-white"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleHeroImageUpload}
                    className="hidden"
                    id="hero-image-upload"
                    disabled={uploadingHeroImage}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full bg-white border-gray-300 text-gray-900 hover:bg-gray-100"
                    disabled={uploadingHeroImage}
                    onClick={() => document.getElementById('hero-image-upload')?.click()}
                  >
                    {uploadingHeroImage ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        {settings.homepageContent?.heroImage ? 'Change Hero Image' : 'Upload Hero Image'}
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle className="text-gray-900">Homepage carousel</CardTitle>
                <CardDescription className="text-gray-600">
                  If you add at least one slide with an image, the homepage shows this carousel instead of the hero section above.
                  Remove all slide images to use the static hero again.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {(settings.homepageContent?.carouselSlides?.length
                  ? settings.homepageContent.carouselSlides
                  : []
                ).map((slide, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg p-4 space-y-3 bg-gray-50/50"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-sm font-medium text-gray-900">Slide {index + 1}</span>
                      <div className="flex gap-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={index === 0}
                          onClick={() => {
                            const arr = settings.homepageContent?.carouselSlides || []
                            updateField('homepageContent.carouselSlides', reorderArray(arr, index, index - 1))
                          }}
                        >
                          <ChevronUp className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={index >= (settings.homepageContent?.carouselSlides?.length || 0) - 1}
                          onClick={() => {
                            const arr = settings.homepageContent?.carouselSlides || []
                            updateField('homepageContent.carouselSlides', reorderArray(arr, index, index + 1))
                          }}
                        >
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="text-red-600"
                          onClick={() => {
                            const arr = [...(settings.homepageContent?.carouselSlides || [])]
                            arr.splice(index, 1)
                            updateField(
                              'homepageContent.carouselSlides',
                              arr.map((s, i) => ({ ...s, order: i }))
                            )
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {slide.imageUrl && (
                      <div className="relative rounded-md overflow-hidden max-h-48">
                        <img src={slide.imageUrl} alt="" className="w-full h-40 object-cover" />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="absolute top-2 right-2 bg-white"
                          onClick={() => {
                            const arr = [...(settings.homepageContent?.carouselSlides || [])]
                            arr[index] = { ...arr[index], imageUrl: '' }
                            updateField('homepageContent.carouselSlides', arr)
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      id={`carousel-upload-${index}`}
                      disabled={uploadingCarouselIndex === index}
                      onChange={(e) => handleCarouselImageUpload(index, e)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full sm:w-auto bg-white border-gray-300"
                      disabled={uploadingCarouselIndex === index}
                      onClick={() =>
                        document.getElementById(`carousel-upload-${index}`)?.click()
                      }
                    >
                      {uploadingCarouselIndex === index ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          {slide.imageUrl ? 'Change image' : 'Upload image'}
                        </>
                      )}
                    </Button>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Title (optional)</label>
                        <Input
                          value={slide.title || ''}
                          onChange={(e) => {
                            const arr = [...(settings.homepageContent?.carouselSlides || [])]
                            arr[index] = { ...arr[index], title: e.target.value }
                            updateField('homepageContent.carouselSlides', arr)
                          }}
                          className="bg-white border-gray-300 text-gray-900"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Subtitle (optional)</label>
                        <Input
                          value={slide.subtitle || ''}
                          onChange={(e) => {
                            const arr = [...(settings.homepageContent?.carouselSlides || [])]
                            arr[index] = { ...arr[index], subtitle: e.target.value }
                            updateField('homepageContent.carouselSlides', arr)
                          }}
                          className="bg-white border-gray-300 text-gray-900"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Button label (optional)</label>
                        <Input
                          value={slide.linkLabel || ''}
                          onChange={(e) => {
                            const arr = [...(settings.homepageContent?.carouselSlides || [])]
                            arr[index] = { ...arr[index], linkLabel: e.target.value }
                            updateField('homepageContent.carouselSlides', arr)
                          }}
                          className="bg-white border-gray-300 text-gray-900"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Button link (optional)</label>
                        <Input
                          value={slide.linkHref || ''}
                          onChange={(e) => {
                            const arr = [...(settings.homepageContent?.carouselSlides || [])]
                            arr[index] = { ...arr[index], linkHref: e.target.value }
                            updateField('homepageContent.carouselSlides', arr)
                          }}
                          placeholder="/courses"
                          className="bg-white border-gray-300 text-gray-900"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-dashed"
                  onClick={() => {
                    const arr = [...(settings.homepageContent?.carouselSlides || [])]
                    arr.push({
                      imageUrl: '',
                      title: '',
                      subtitle: '',
                      linkLabel: '',
                      linkHref: '',
                      order: arr.length
                    })
                    updateField('homepageContent.carouselSlides', arr)
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add carousel slide
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle className="text-gray-900">Extra homepage sections</CardTitle>
                <CardDescription className="text-gray-600">
                  Optional content blocks shown after About Us and Contact. Plain text and line breaks are supported.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {(settings.homepageContent?.additionalSections?.length
                  ? settings.homepageContent.additionalSections
                  : []
                ).map((section, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-sm font-medium text-gray-900">Section {index + 1}</span>
                      <div className="flex gap-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={index === 0}
                          onClick={() => {
                            const arr = settings.homepageContent?.additionalSections || []
                            updateField('homepageContent.additionalSections', reorderArray(arr, index, index - 1))
                          }}
                        >
                          <ChevronUp className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={
                            index >= (settings.homepageContent?.additionalSections?.length || 0) - 1
                          }
                          onClick={() => {
                            const arr = settings.homepageContent?.additionalSections || []
                            updateField('homepageContent.additionalSections', reorderArray(arr, index, index + 1))
                          }}
                        >
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="text-red-600"
                          onClick={() => {
                            const arr = [...(settings.homepageContent?.additionalSections || [])]
                            arr.splice(index, 1)
                            updateField(
                              'homepageContent.additionalSections',
                              arr.map((s, i) => ({ ...s, order: i }))
                            )
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Section title</label>
                      <Input
                        value={section.title || ''}
                        onChange={(e) => {
                          const arr = [...(settings.homepageContent?.additionalSections || [])]
                          arr[index] = { ...arr[index], title: e.target.value }
                          updateField('homepageContent.additionalSections', arr)
                        }}
                        className="bg-white border-gray-300 text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Content</label>
                      <textarea
                        value={section.bodyHtml || ''}
                        onChange={(e) => {
                          const arr = [...(settings.homepageContent?.additionalSections || [])]
                          arr[index] = { ...arr[index], bodyHtml: e.target.value }
                          updateField('homepageContent.additionalSections', arr)
                        }}
                        rows={6}
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-900"
                      />
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-dashed"
                  onClick={() => {
                    const arr = [...(settings.homepageContent?.additionalSections || [])]
                    arr.push({ title: '', bodyHtml: '', order: arr.length })
                    updateField('homepageContent.additionalSections', arr)
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add section
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle className="text-gray-900">About Us</CardTitle>
                <CardDescription className="text-gray-600">
                  Content for the About Us section on homepage
                </CardDescription>
              </CardHeader>
              <CardContent>
                <textarea
                  value={settings.homepageContent?.aboutUs || ''}
                  onChange={(e) => updateField('homepageContent.aboutUs', e.target.value)}
                  rows={10}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-900 placeholder-gray-400"
                  placeholder="Enter About Us content..."
                />
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle className="text-gray-900">Contact Content</CardTitle>
                <CardDescription className="text-gray-600">
                  Content for the Contact section on homepage
                </CardDescription>
              </CardHeader>
              <CardContent>
                <textarea
                  value={settings.homepageContent?.contactContent || ''}
                  onChange={(e) => updateField('homepageContent.contactContent', e.target.value)}
                  rows={10}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-900 placeholder-gray-400"
                  placeholder="Enter Contact content..."
                />
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle className="text-gray-900">Legal Pages</CardTitle>
                <CardDescription className="text-gray-600">
                  Manage privacy policy, terms of service, etc.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Privacy Policy
                  </label>
                  <textarea
                    value={settings.legalPages?.privacyPolicy || ''}
                    onChange={(e) => updateField('legalPages.privacyPolicy', e.target.value)}
                    rows={8}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-900 placeholder-gray-400"
                    placeholder="Enter Privacy Policy content..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Terms of Service
                  </label>
                  <textarea
                    value={settings.legalPages?.termsOfService || ''}
                    onChange={(e) => updateField('legalPages.termsOfService', e.target.value)}
                    rows={8}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-900 placeholder-gray-400"
                    placeholder="Enter Terms of Service content..."
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="layout" className="space-y-6">
            <Card className="bg-white border-gray-200 border-l-4 border-l-red-500">
              <CardHeader>
                <CardTitle className="text-gray-900">Add CMS page to menu or footer</CardTitle>
                <CardDescription className="text-gray-600">
                  Published site pages live at <code className="text-xs bg-gray-100 px-1 rounded">/p/your-slug</code>.
                  Manage pages in{' '}
                  <Link href="/admin/cms-pages" className="text-red-600 font-medium hover:underline">
                    Site pages (CMS)
                  </Link>
                  . Links you add here are merged into the fields below — save settings when done.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col md:flex-row md:flex-wrap gap-4 md:items-end">
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Published page</label>
                  <select
                    className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900"
                    value={cmsAddSlug}
                    onChange={(e) => setCmsAddSlug(e.target.value)}
                  >
                    <option value="">Select a page…</option>
                    {cmsPublishedPages.map((p) => (
                      <option key={p.slug} value={p.slug}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                  {cmsPublishedPages.length === 0 && (
                    <p className="text-xs text-gray-500 mt-2">
                      No published pages yet.{' '}
                      <Link href="/admin/cms-pages/new" className="text-red-600 hover:underline">
                        Create one
                      </Link>
                    </p>
                  )}
                </div>
                <div className="w-full md:w-56">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Add to</label>
                  <select
                    className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900"
                    value={cmsAddTarget}
                    onChange={(e) => setCmsAddTarget(e.target.value as 'nav' | 'quick' | 'support')}
                  >
                    <option value="nav">Main header menu</option>
                    <option value="quick">Footer — quick links column</option>
                    <option value="support">Footer — support column</option>
                  </select>
                </div>
                <Button
                  type="button"
                  className="bg-red-600 text-white hover:bg-red-700"
                  onClick={addCmsPageToNavigation}
                  disabled={!cmsAddSlug}
                >
                  Add link
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle className="text-gray-900">Header menu</CardTitle>
                <CardDescription className="text-gray-600">
                  Links shown on every page next to the logo. Leave empty to use the default Courses, Books, and Blog links.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {(settings.navMenu?.length ? settings.navMenu : []).map((item, index) => (
                  <div key={index} className="flex flex-col gap-3 border border-gray-200 rounded-lg p-4 md:flex-row md:items-end">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Label</label>
                        <Input
                          value={item.label}
                          onChange={(e) => {
                            const arr = [...(settings.navMenu || [])]
                            arr[index] = { ...arr[index], label: e.target.value }
                            updateField('navMenu', arr)
                          }}
                          placeholder="Courses"
                          className="bg-white border-gray-300 text-gray-900"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">URL</label>
                        <Input
                          value={item.href}
                          onChange={(e) => {
                            const arr = [...(settings.navMenu || [])]
                            arr[index] = { ...arr[index], href: e.target.value }
                            updateField('navMenu', arr)
                          }}
                          placeholder="/courses"
                          className="bg-white border-gray-300 text-gray-900"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 text-sm text-gray-900">
                        <input
                          type="checkbox"
                          checked={item.openInNewTab}
                          onChange={(e) => {
                            const arr = [...(settings.navMenu || [])]
                            arr[index] = { ...arr[index], openInNewTab: e.target.checked }
                            updateField('navMenu', arr)
                          }}
                          className="rounded border-gray-300"
                        />
                        New tab
                      </label>
                      <div className="flex gap-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={index === 0}
                          onClick={() =>
                            updateField('navMenu', reorderArray(settings.navMenu || [], index, index - 1))
                          }
                        >
                          <ChevronUp className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={index >= (settings.navMenu?.length || 0) - 1}
                          onClick={() =>
                            updateField('navMenu', reorderArray(settings.navMenu || [], index, index + 1))
                          }
                        >
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="text-red-600"
                          onClick={() => {
                            const arr = [...(settings.navMenu || [])]
                            arr.splice(index, 1)
                            updateField(
                              'navMenu',
                              arr.map((n, i) => ({ ...n, order: i }))
                            )
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-dashed"
                  onClick={() => {
                    const arr = [...(settings.navMenu || [])]
                    arr.push({ label: '', href: '', order: arr.length, openInNewTab: false })
                    updateField('navMenu', arr)
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add menu item
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle className="text-gray-900">Footer</CardTitle>
                <CardDescription className="text-gray-600">
                  Customize footer columns and copyright. Leave link lists empty to use the built-in defaults.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">Quick links column title</label>
                    <Input
                      value={settings.footerSettings?.quickLinksTitle || ''}
                      onChange={(e) => updateField('footerSettings.quickLinksTitle', e.target.value)}
                      className="bg-white border-gray-300 text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">Support column title</label>
                    <Input
                      value={settings.footerSettings?.supportTitle || ''}
                      onChange={(e) => updateField('footerSettings.supportTitle', e.target.value)}
                      className="bg-white border-gray-300 text-gray-900"
                    />
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Quick links</h4>
                  <div className="space-y-3">
                    {(settings.footerSettings?.quickLinks?.length
                      ? settings.footerSettings.quickLinks
                      : []
                    ).map((item, index) => (
                      <div key={index} className="flex flex-col gap-2 md:flex-row md:items-center border border-gray-100 rounded p-3">
                        <Input
                          value={item.label}
                          onChange={(e) => {
                            const arr = [...(settings.footerSettings?.quickLinks || [])]
                            arr[index] = { ...arr[index], label: e.target.value }
                            updateField('footerSettings.quickLinks', arr)
                          }}
                          placeholder="Label"
                          className="bg-white border-gray-300 text-gray-900 md:flex-1"
                        />
                        <Input
                          value={item.href}
                          onChange={(e) => {
                            const arr = [...(settings.footerSettings?.quickLinks || [])]
                            arr[index] = { ...arr[index], href: e.target.value }
                            updateField('footerSettings.quickLinks', arr)
                          }}
                          placeholder="/path"
                          className="bg-white border-gray-300 text-gray-900 md:flex-1"
                        />
                        <div className="flex gap-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={index === 0}
                            onClick={() =>
                              updateField(
                                'footerSettings.quickLinks',
                                reorderArray(settings.footerSettings?.quickLinks || [], index, index - 1)
                              )
                            }
                          >
                            <ChevronUp className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={index >= (settings.footerSettings?.quickLinks?.length || 0) - 1}
                            onClick={() =>
                              updateField(
                                'footerSettings.quickLinks',
                                reorderArray(settings.footerSettings?.quickLinks || [], index, index + 1)
                              )
                            }
                          >
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="text-red-600"
                            onClick={() => {
                              const arr = [...(settings.footerSettings?.quickLinks || [])]
                              arr.splice(index, 1)
                              updateField(
                                'footerSettings.quickLinks',
                                arr.map((n, i) => ({ ...n, order: i }))
                              )
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const arr = [...(settings.footerSettings?.quickLinks || [])]
                        arr.push({ label: '', href: '', order: arr.length })
                        updateField('footerSettings.quickLinks', arr)
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add quick link
                    </Button>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Support links</h4>
                  <div className="space-y-3">
                    {(settings.footerSettings?.supportLinks?.length
                      ? settings.footerSettings.supportLinks
                      : []
                    ).map((item, index) => (
                      <div key={index} className="flex flex-col gap-2 md:flex-row md:items-center border border-gray-100 rounded p-3">
                        <Input
                          value={item.label}
                          onChange={(e) => {
                            const arr = [...(settings.footerSettings?.supportLinks || [])]
                            arr[index] = { ...arr[index], label: e.target.value }
                            updateField('footerSettings.supportLinks', arr)
                          }}
                          placeholder="Label"
                          className="bg-white border-gray-300 text-gray-900 md:flex-1"
                        />
                        <Input
                          value={item.href}
                          onChange={(e) => {
                            const arr = [...(settings.footerSettings?.supportLinks || [])]
                            arr[index] = { ...arr[index], href: e.target.value }
                            updateField('footerSettings.supportLinks', arr)
                          }}
                          placeholder="/path"
                          className="bg-white border-gray-300 text-gray-900 md:flex-1"
                        />
                        <div className="flex gap-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={index === 0}
                            onClick={() =>
                              updateField(
                                'footerSettings.supportLinks',
                                reorderArray(settings.footerSettings?.supportLinks || [], index, index - 1)
                              )
                            }
                          >
                            <ChevronUp className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={index >= (settings.footerSettings?.supportLinks?.length || 0) - 1}
                            onClick={() =>
                              updateField(
                                'footerSettings.supportLinks',
                                reorderArray(settings.footerSettings?.supportLinks || [], index, index + 1)
                              )
                            }
                          >
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="text-red-600"
                            onClick={() => {
                              const arr = [...(settings.footerSettings?.supportLinks || [])]
                              arr.splice(index, 1)
                              updateField(
                                'footerSettings.supportLinks',
                                arr.map((n, i) => ({ ...n, order: i }))
                              )
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const arr = [...(settings.footerSettings?.supportLinks || [])]
                        arr.push({ label: '', href: '', order: arr.length })
                        updateField('footerSettings.supportLinks', arr)
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add support link
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Copyright line (optional — leave blank for default)
                  </label>
                  <Input
                    value={settings.footerSettings?.copyrightLine || ''}
                    onChange={(e) => updateField('footerSettings.copyrightLine', e.target.value)}
                    placeholder={`© ${new Date().getFullYear()} ${settings.siteName || 'NOI LMS'}...`}
                    className="bg-white border-gray-300 text-gray-900"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contact Settings */}
          <TabsContent value="contact" className="space-y-6">
            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle className="text-gray-900">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Contact Email
                    </label>
                    <Input
                      type="email"
                      value={settings.contactEmail || ''}
                      onChange={(e) => updateField('contactEmail', e.target.value)}
                      className="bg-white border-gray-300 text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Contact Phone
                    </label>
                    <Input
                      value={settings.contactPhone || ''}
                      onChange={(e) => updateField('contactPhone', e.target.value)}
                      className="bg-white border-gray-300 text-gray-900"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Contact Address
                  </label>
                  <textarea
                    value={settings.contactAddress || ''}
                    onChange={(e) => updateField('contactAddress', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-900 placeholder-gray-400"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle className="text-gray-900">Social Media Links</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Facebook
                    </label>
                    <Input
                      value={settings.socialMedia?.facebook || ''}
                      onChange={(e) => updateField('socialMedia.facebook', e.target.value)}
                      placeholder="https://facebook.com/yourpage"
                      className="bg-white border-gray-300 text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Twitter
                    </label>
                    <Input
                      value={settings.socialMedia?.twitter || ''}
                      onChange={(e) => updateField('socialMedia.twitter', e.target.value)}
                      placeholder="https://twitter.com/yourhandle"
                      className="bg-white border-gray-300 text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Instagram
                    </label>
                    <Input
                      value={settings.socialMedia?.instagram || ''}
                      onChange={(e) => updateField('socialMedia.instagram', e.target.value)}
                      placeholder="https://instagram.com/yourhandle"
                      className="bg-white border-gray-300 text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      LinkedIn
                    </label>
                    <Input
                      value={settings.socialMedia?.linkedin || ''}
                      onChange={(e) => updateField('socialMedia.linkedin', e.target.value)}
                      placeholder="https://linkedin.com/company/yourcompany"
                      className="bg-white border-gray-300 text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      YouTube
                    </label>
                    <Input
                      value={settings.socialMedia?.youtube || ''}
                      onChange={(e) => updateField('socialMedia.youtube', e.target.value)}
                      placeholder="https://youtube.com/channel/yourchannel"
                      className="bg-white border-gray-300 text-gray-900"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Email Settings */}
          <TabsContent value="email" className="space-y-6">
            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle className="text-gray-900">Email Configuration</CardTitle>
                <CardDescription className="text-gray-600">
                  SMTP settings for sending emails
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      From Email
                    </label>
                    <Input
                      type="email"
                      value={settings.emailSettings?.fromEmail || ''}
                      onChange={(e) => updateField('emailSettings.fromEmail', e.target.value)}
                      className="bg-white border-gray-300 text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      From Name
                    </label>
                    <Input
                      value={settings.emailSettings?.fromName || ''}
                      onChange={(e) => updateField('emailSettings.fromName', e.target.value)}
                      className="bg-white border-gray-300 text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      SMTP Host
                    </label>
                    <Input
                      value={settings.emailSettings?.smtpHost || ''}
                      onChange={(e) => updateField('emailSettings.smtpHost', e.target.value)}
                      placeholder="smtp.gmail.com"
                      className="bg-white border-gray-300 text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      SMTP Port
                    </label>
                    <Input
                      type="number"
                      value={settings.emailSettings?.smtpPort || 587}
                      onChange={(e) => updateField('emailSettings.smtpPort', parseInt(e.target.value))}
                      className="bg-white border-gray-300 text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      SMTP Username
                    </label>
                    <Input
                      value={settings.emailSettings?.smtpUser || ''}
                      onChange={(e) => updateField('emailSettings.smtpUser', e.target.value)}
                      className="bg-white border-gray-300 text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      SMTP Password
                    </label>
                    <Input
                      type="password"
                      value={settings.emailSettings?.smtpPassword || ''}
                      onChange={(e) => updateField('emailSettings.smtpPassword', e.target.value)}
                      className="bg-white border-gray-300 text-gray-900"
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={settings.emailSettings?.smtpSecure || false}
                    onChange={(e) => updateField('emailSettings.smtpSecure', e.target.checked)}
                    className="rounded border-gray-300 bg-white text-gray-900 focus:ring-red-500"
                  />
                  <label className="text-gray-900">Use SSL/TLS</label>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payment Settings */}
          <TabsContent value="payment" className="space-y-6">
            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle className="text-gray-900">Payment Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Currency
                    </label>
                    <Input
                      value={settings.paymentSettings?.currency || 'USD'}
                      onChange={(e) => updateField('paymentSettings.currency', e.target.value)}
                      className="bg-white border-gray-300 text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Currency Symbol
                    </label>
                    <Input
                      value={settings.paymentSettings?.currencySymbol || '$'}
                      onChange={(e) => updateField('paymentSettings.currencySymbol', e.target.value)}
                      className="bg-white border-gray-300 text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Stripe Public Key
                    </label>
                    <Input
                      value={settings.paymentSettings?.stripePublicKey || ''}
                      onChange={(e) => updateField('paymentSettings.stripePublicKey', e.target.value)}
                      className="bg-white border-gray-300 text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Stripe Secret Key
                    </label>
                    <Input
                      type="password"
                      value={settings.paymentSettings?.stripeSecretKey || ''}
                      onChange={(e) => updateField('paymentSettings.stripeSecretKey', e.target.value)}
                      className="bg-white border-gray-300 text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      PayPal Client ID
                    </label>
                    <Input
                      value={settings.paymentSettings?.paypalClientId || ''}
                      onChange={(e) => updateField('paymentSettings.paypalClientId', e.target.value)}
                      className="bg-white border-gray-300 text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      PayPal Secret
                    </label>
                    <Input
                      type="password"
                      value={settings.paymentSettings?.paypalSecret || ''}
                      onChange={(e) => updateField('paymentSettings.paypalSecret', e.target.value)}
                      className="bg-white border-gray-300 text-gray-900"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* General Settings */}
          <TabsContent value="general" className="space-y-6">
            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle className="text-gray-900">General Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Timezone
                    </label>
                    <select
                      value={settings.generalSettings?.timezone || 'UTC'}
                      onChange={(e) => updateField('generalSettings.timezone', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-900"
                    >
                      <option value="UTC">UTC</option>
                      <option value="America/New_York">Eastern Time</option>
                      <option value="America/Chicago">Central Time</option>
                      <option value="America/Denver">Mountain Time</option>
                      <option value="America/Los_Angeles">Pacific Time</option>
                      <option value="Europe/London">London</option>
                      <option value="Europe/Paris">Paris</option>
                      <option value="Asia/Dubai">Dubai</option>
                      <option value="Asia/Karachi">Karachi</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Language
                    </label>
                    <select
                      value={settings.generalSettings?.language || 'en'}
                      onChange={(e) => updateField('generalSettings.language', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-900"
                    >
                      <option value="en">English</option>
                      <option value="ar">Arabic</option>
                      <option value="ur">Urdu</option>
                      <option value="fr">French</option>
                      <option value="es">Spanish</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Date Format
                    </label>
                    <select
                      value={settings.generalSettings?.dateFormat || 'MM/DD/YYYY'}
                      onChange={(e) => updateField('generalSettings.dateFormat', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-900"
                    >
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Time Format
                    </label>
                    <select
                      value={settings.generalSettings?.timeFormat || '12h'}
                      onChange={(e) => updateField('generalSettings.timeFormat', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-900"
                    >
                      <option value="12h">12 Hour</option>
                      <option value="24h">24 Hour</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle className="text-gray-900">Course Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Default Duration (hours)
                    </label>
                    <Input
                      type="number"
                      value={settings.courseSettings?.defaultDuration || 0}
                      onChange={(e) => updateField('courseSettings.defaultDuration', parseInt(e.target.value))}
                      className="bg-white border-gray-300 text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Max File Size (MB)
                    </label>
                    <Input
                      type="number"
                      value={settings.courseSettings?.maxFileSize || 10}
                      onChange={(e) => updateField('courseSettings.maxFileSize', parseInt(e.target.value))}
                      className="bg-white border-gray-300 text-gray-900"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={settings.courseSettings?.allowFreeCourses || false}
                      onChange={(e) => updateField('courseSettings.allowFreeCourses', e.target.checked)}
                      className="rounded border-gray-300 bg-white text-gray-900 focus:ring-red-500"
                    />
                    <label className="text-gray-900">Allow Free Courses</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={settings.courseSettings?.requireEnrollment || false}
                      onChange={(e) => updateField('courseSettings.requireEnrollment', e.target.checked)}
                      className="rounded border-gray-300 bg-white text-gray-900 focus:ring-red-500"
                    />
                    <label className="text-gray-900">Require Enrollment</label>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle className="text-gray-900">Maintenance Mode</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={settings.maintenanceMode?.enabled || false}
                    onChange={(e) => updateField('maintenanceMode.enabled', e.target.checked)}
                    className="rounded border-gray-300 bg-white text-gray-900 focus:ring-red-500"
                  />
                  <label className="text-gray-900">Enable Maintenance Mode</label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Maintenance Message
                  </label>
                  <textarea
                    value={settings.maintenanceMode?.message || ''}
                    onChange={(e) => updateField('maintenanceMode.message', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-900 placeholder-gray-400"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Features */}
          <TabsContent value="features" className="space-y-6">
            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle className="text-gray-900">Feature Toggles</CardTitle>
                <CardDescription className="text-gray-600">
                  Enable or disable platform features
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-gray-900 font-medium">User Registration</label>
                      <p className="text-sm text-gray-600">Allow new users to register</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.features?.enableRegistration !== false}
                      onChange={(e) => updateField('features.enableRegistration', e.target.checked)}
                      className="rounded border-gray-300 bg-white text-gray-900 focus:ring-red-500"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-gray-900 font-medium">Email Verification</label>
                      <p className="text-sm text-gray-600">Require email verification for new users</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.features?.enableEmailVerification || false}
                      onChange={(e) => updateField('features.enableEmailVerification', e.target.checked)}
                      className="rounded border-gray-300 bg-white text-gray-900 focus:ring-red-500"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-gray-900 font-medium">Comments</label>
                      <p className="text-sm text-gray-600">Enable comments on courses and blogs</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.features?.enableComments || false}
                      onChange={(e) => updateField('features.enableComments', e.target.checked)}
                      className="rounded border-gray-300 bg-white text-gray-900 focus:ring-red-500"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-gray-900 font-medium">Ratings</label>
                      <p className="text-sm text-gray-600">Allow users to rate courses</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.features?.enableRatings || false}
                      onChange={(e) => updateField('features.enableRatings', e.target.checked)}
                      className="rounded border-gray-300 bg-white text-gray-900 focus:ring-red-500"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-gray-900 font-medium">Certificates</label>
                      <p className="text-sm text-gray-600">Issue certificates upon course completion</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.features?.enableCertificates || false}
                      onChange={(e) => updateField('features.enableCertificates', e.target.checked)}
                      className="rounded border-gray-300 bg-white text-gray-900 focus:ring-red-500"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-gray-900 font-medium">Notifications</label>
                      <p className="text-sm text-gray-600">Send email and push notifications</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.features?.enableNotifications || false}
                      onChange={(e) => updateField('features.enableNotifications', e.target.checked)}
                      className="rounded border-gray-300 bg-white text-gray-900 focus:ring-red-500"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle className="text-gray-900">Registration Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Minimum Password Length
                    </label>
                    <Input
                      type="number"
                      value={settings.registrationSettings?.minPasswordLength || 6}
                      onChange={(e) => updateField('registrationSettings.minPasswordLength', parseInt(e.target.value))}
                      className="bg-white border-gray-300 text-gray-900"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={settings.registrationSettings?.requireEmailVerification || false}
                      onChange={(e) => updateField('registrationSettings.requireEmailVerification', e.target.checked)}
                      className="rounded border-gray-300 bg-white text-gray-900 focus:ring-red-500"
                    />
                    <label className="text-gray-900">Require Email Verification</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={settings.registrationSettings?.allowSocialLogin || false}
                      onChange={(e) => updateField('registrationSettings.allowSocialLogin', e.target.checked)}
                      className="rounded border-gray-300 bg-white text-gray-900 focus:ring-red-500"
                    />
                    <label className="text-gray-900">Allow Social Login</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={settings.registrationSettings?.requireStrongPassword || false}
                      onChange={(e) => updateField('registrationSettings.requireStrongPassword', e.target.checked)}
                      className="rounded border-gray-300 bg-white text-gray-900 focus:ring-red-500"
                    />
                    <label className="text-gray-900">Require Strong Password</label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Registration Form Settings */}
          <TabsContent value="registration" className="space-y-6">
            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle className="text-gray-900">Registration Form Management</CardTitle>
                <CardDescription className="text-gray-600">
                  Customize the registration form fields
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Manage which fields appear on the registration form. You can add custom fields, reorder them, and configure validation rules.
                </p>
                <Link href="/admin/settings/registration-form">
                  <Button className="bg-red-600 text-white hover:bg-red-700">
                    <Eye className="h-4 w-4 mr-2" />
                    Manage Registration Form Fields
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Save Button */}
        <div className="mt-8 flex justify-end">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-red-600 text-white hover:bg-red-700"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save All Settings
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

