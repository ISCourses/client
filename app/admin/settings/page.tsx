'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Save, Loader2, Upload, X, Eye } from 'lucide-react'
import Link from 'next/link'
import AdminSidebar from '@/components/AdminSidebar'
import api from '@/lib/api'
import toast from 'react-hot-toast'

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
  homepageContent: {
    aboutUs: string
    contactContent: string
    heroTitle: string
    heroDescription: string
    heroImage: string
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
        homepageContent: {
          aboutUs: data.homepageContent?.aboutUs || '',
          contactContent: data.homepageContent?.contactContent || '',
          heroTitle: data.homepageContent?.heroTitle || 'Welcome to NOI LMS',
          heroDescription: data.homepageContent?.heroDescription || 'Your gateway to Islamic learning',
          heroImage: data.homepageContent?.heroImage || ''
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
          <TabsList className="grid w-full grid-cols-8">
            <TabsTrigger value="site">Site</TabsTrigger>
            <TabsTrigger value="homepage">Homepage</TabsTrigger>
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
                    <label htmlFor="logo-upload">
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full bg-white border-gray-300 text-gray-900 hover:bg-gray-100"
                        disabled={uploadingLogo}
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
                    </label>
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
                  <label htmlFor="hero-image-upload">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full bg-white border-gray-300 text-gray-900 hover:bg-gray-100"
                      disabled={uploadingHeroImage}
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
                  </label>
                </div>
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

