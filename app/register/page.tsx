'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/contexts/AuthContext'
import { BookOpen, Eye, EyeOff, UserPlus, Mail, Lock, User, Phone, Calendar, FileText, CheckSquare } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '@/lib/api'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

interface RegistrationField {
  name: string
  label: string
  type: 'text' | 'email' | 'tel' | 'number' | 'date' | 'textarea' | 'select' | 'checkbox'
  placeholder: string
  required: boolean
  order: number
  options: string[]
  validation: {
    minLength?: number
    maxLength?: number
    pattern?: string
    min?: number
    max?: number
  }
  enabled: boolean
}

interface RegisterForm {
  name: string
  email: string
  password: string
  confirmPassword: string
  [key: string]: any // For dynamic fields
}

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formFields, setFormFields] = useState<RegistrationField[]>([])
  const [loadingFields, setLoadingFields] = useState(true)
  const { register: registerUser } = useAuth()
  const router = useRouter()

  useEffect(() => {
    fetchFormFields()
  }, [])

  const fetchFormFields = async () => {
    try {
      setLoadingFields(true)
      const response = await api.get('/settings')
      const fields = response.data.registrationFormFields || []
      
      console.log('Fetched registration form fields:', fields) // Debug log
      
      // Ensure default fields exist
      const defaultFields: RegistrationField[] = [
        {
          name: 'name',
          label: 'Full Name',
          type: 'text',
          placeholder: 'Enter your full name',
          required: true,
          order: 0,
          options: [],
          validation: { minLength: 2 },
          enabled: true
        },
        {
          name: 'email',
          label: 'Email Address',
          type: 'email',
          placeholder: 'Enter your email',
          required: true,
          order: 1,
          options: [],
          validation: {},
          enabled: true
        },
        {
          name: 'password',
          label: 'Password',
          type: 'text',
          placeholder: 'Enter your password',
          required: true,
          order: 2,
          options: [],
          validation: { minLength: 6 },
          enabled: true
        }
      ]

      // Merge default fields with saved fields
      const mergedFields = defaultFields.map(defaultField => {
        const savedField = fields.find((f: RegistrationField) => f.name === defaultField.name)
        if (savedField) {
          return { 
            ...defaultField, 
            ...savedField,
            validation: savedField.validation || defaultField.validation || {}
          }
        }
        return defaultField
      })

      // Add any additional fields (only enabled ones)
      const additionalFields = fields
        .filter((f: RegistrationField) => 
          !defaultFields.some(df => df.name === f.name) && 
          f.enabled !== false // Include if enabled is true or undefined
        )
        .map((f: RegistrationField) => ({
          ...f,
          enabled: f.enabled !== false, // Ensure enabled is boolean
          validation: f.validation || {} // Ensure validation is always an object
        }))

      const allFields = [...mergedFields, ...additionalFields].sort((a, b) => a.order - b.order)
      console.log('All fields after merge:', allFields) // Debug log
      console.log('Additional fields found:', additionalFields) // Debug log
      setFormFields(allFields)
    } catch (error) {
      console.error('Failed to fetch form fields:', error)
      // Use default fields on error
      setFormFields([
        {
          name: 'name',
          label: 'Full Name',
          type: 'text',
          placeholder: 'Enter your full name',
          required: true,
          order: 0,
          options: [],
          validation: { minLength: 2 },
          enabled: true
        },
        {
          name: 'email',
          label: 'Email Address',
          type: 'email',
          placeholder: 'Enter your email',
          required: true,
          order: 1,
          options: [],
          validation: {},
          enabled: true
        },
        {
          name: 'password',
          label: 'Password',
          type: 'text',
          placeholder: 'Enter your password',
          required: true,
          order: 2,
          options: [],
          validation: { minLength: 6 },
          enabled: true
        }
      ])
    } finally {
      setLoadingFields(false)
    }
  }

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<RegisterForm>()

  const password = watch('password')

  const buildValidationRules = (field: RegistrationField) => {
    const rules: any = {}
    const validation = field.validation || {}

    if (field.required) {
      rules.required = `${field.label} is required`
    }

    if (field.type === 'email') {
      rules.pattern = {
        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
        message: 'Invalid email address'
      }
    }

    if (validation.minLength) {
      rules.minLength = {
        value: validation.minLength,
        message: `${field.label} must be at least ${validation.minLength} characters`
      }
    }

    if (validation.maxLength) {
      rules.maxLength = {
        value: validation.maxLength,
        message: `${field.label} must be at most ${validation.maxLength} characters`
      }
    }

    if (field.type === 'number') {
      if (validation.min !== undefined) {
        rules.min = {
          value: validation.min,
          message: `${field.label} must be at least ${validation.min}`
        }
      }
      if (validation.max !== undefined) {
        rules.max = {
          value: validation.max,
          message: `${field.label} must be at most ${validation.max}`
        }
      }
    }

    if (validation.pattern) {
      rules.pattern = {
        value: new RegExp(validation.pattern),
        message: `${field.label} format is invalid`
      }
    }

    return rules
  }

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true)
    try {
      // Extract additional fields (excluding name, email, password, confirmPassword)
      const additionalFields: any = {}
      formFields.forEach(field => {
        if (field.enabled && !['name', 'email', 'password'].includes(field.name)) {
          if (data[field.name] !== undefined) {
            additionalFields[field.name] = data[field.name]
          }
        }
      })

      // Register user with additional fields
      const response = await api.post('/auth/register', {
        name: data.name,
        email: data.email,
        password: data.password,
        ...additionalFields
      })

      // Store token and user data
      localStorage.setItem('token', response.data.token)
      localStorage.setItem('user', JSON.stringify(response.data.user))

      toast.success('Registration successful!')
      router.push('/')
    } catch (error: any) {
      console.error('Registration error:', error)
      if (error.response?.data?.errors) {
        const errors = error.response.data.errors
        errors.forEach((err: any) => {
          toast.error(err.msg || err.message)
        })
      } else {
        toast.error(error.response?.data?.message || 'Registration failed')
      }
    } finally {
      setLoading(false)
    }
  }

  const getFieldIcon = (field: RegistrationField) => {
    if (field.name === 'email' || field.type === 'email') return Mail
    if (field.name === 'password' || field.name === 'confirmPassword') return Lock
    if (field.name === 'name') return User
    if (field.type === 'tel') return Phone
    if (field.type === 'date') return Calendar
    if (field.type === 'textarea') return FileText
    if (field.type === 'checkbox') return CheckSquare
    return User
  }

  const renderField = (field: RegistrationField) => {
    const validationRules = buildValidationRules(field)
    const fieldError = errors[field.name]
    const IconComponent = getFieldIcon(field)

    if (field.name === 'password') {
      return (
        <div key={field.name} className="space-y-2">
          <label htmlFor={field.name} className="block text-sm font-semibold text-gray-700">
            {field.label} {field.required && <span className="text-red-600">*</span>}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400" />
            </div>
            <Input
              id={field.name}
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder={field.placeholder}
              {...register(field.name, validationRules)}
              className="pl-10 pr-10 h-12 border-gray-300 focus:border-red-500 focus:ring-red-500 bg-white"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center hover:opacity-70 transition-opacity"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5 text-gray-400" />
              ) : (
                <Eye className="h-5 w-5 text-gray-400" />
              )}
            </button>
          </div>
          {fieldError && (
            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
              <span>•</span>
              {fieldError.message as string}
            </p>
          )}
        </div>
      )
    }

    switch (field.type) {
      case 'textarea':
        return (
          <div key={field.name} className="space-y-2">
            <label htmlFor={field.name} className="block text-sm font-semibold text-gray-700">
              {field.label} {field.required && <span className="text-red-600">*</span>}
            </label>
            <div className="relative">
              <div className="absolute top-3 left-3 pointer-events-none">
                <FileText className="h-5 w-5 text-gray-400" />
              </div>
              <textarea
                id={field.name}
                placeholder={field.placeholder}
                {...register(field.name, validationRules)}
                rows={4}
                className="pl-10 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm bg-white"
              />
            </div>
            {fieldError && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <span>•</span>
                {fieldError.message as string}
              </p>
            )}
          </div>
        )

      case 'select':
        return (
          <div key={field.name} className="space-y-2">
            <label htmlFor={field.name} className="block text-sm font-semibold text-gray-700">
              {field.label} {field.required && <span className="text-red-600">*</span>}
            </label>
            <select
              id={field.name}
              {...register(field.name, validationRules)}
              className="block w-full h-12 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm bg-white"
            >
              <option value="">{field.placeholder || 'Select an option'}</option>
              {field.options.map((option, index) => (
                <option key={index} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {fieldError && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <span>•</span>
                {fieldError.message as string}
              </p>
            )}
          </div>
        )

      case 'checkbox':
        return (
          <div key={field.name} className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {field.label} {field.required && <span className="text-red-600">*</span>}
            </label>
            <div className="space-y-2 bg-gray-50 p-4 rounded-md border border-gray-200">
              {field.options.map((option, index) => (
                <label key={index} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-100 p-2 rounded transition-colors">
                  <input
                    type="checkbox"
                    value={option}
                    {...register(field.name, validationRules)}
                    className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                  />
                  <span className="text-sm text-gray-700">{option}</span>
                </label>
              ))}
            </div>
            {fieldError && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <span>•</span>
                {fieldError.message as string}
              </p>
            )}
          </div>
        )

      default:
        return (
          <div key={field.name} className="space-y-2">
            <label htmlFor={field.name} className="block text-sm font-semibold text-gray-700">
              {field.label} {field.required && <span className="text-red-600">*</span>}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <IconComponent className="h-5 w-5 text-gray-400" />
              </div>
              <Input
                id={field.name}
                type={field.type}
                autoComplete={field.type === 'email' ? 'email' : field.type === 'tel' ? 'tel' : 'off'}
                placeholder={field.placeholder}
                {...register(field.name, validationRules)}
                className="pl-10 h-12 border-gray-300 focus:border-red-500 focus:ring-red-500 bg-white"
              />
            </div>
            {fieldError && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <span>•</span>
                {fieldError.message as string}
              </p>
            )}
          </div>
        )
    }
  }

  if (loadingFields) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <div className="w-full max-w-2xl">
            <div className="animate-pulse">
              <div className="h-12 bg-gray-200 rounded w-full mb-8"></div>
              <div className="h-96 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex flex-col">
      <Navbar />
      
      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-2xl">
          {/* Header Section */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <div className="absolute inset-0 bg-red-600 rounded-full blur-xl opacity-20"></div>
                <div className="relative bg-gradient-to-br from-red-600 to-red-700 p-4 rounded-full shadow-lg">
                  <UserPlus className="h-10 w-10 text-white" />
                </div>
              </div>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Create Your Account
            </h1>
            <p className="text-gray-600">
              Join us and start your learning journey today
            </p>
          </div>

          {/* Registration Card */}
          <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-2xl font-bold text-gray-900 text-center">
                Get Started
              </CardTitle>
              <CardDescription className="text-center text-gray-600">
                Fill in your details to create your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {formFields
                  .filter(field => field.enabled !== false && field.name !== 'confirmPassword')
                  .map(field => renderField(field))}

                {/* Confirm Password - Always shown */}
                <div className="space-y-2">
                  <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700">
                    Confirm Password <span className="text-red-600">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="Confirm your password"
                      {...register('confirmPassword', {
                        required: 'Please confirm your password',
                        validate: value => value === password || 'Passwords do not match'
                      })}
                      className="pl-10 pr-10 h-12 border-gray-300 focus:border-red-500 focus:ring-red-500 bg-white"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center hover:opacity-70 transition-opacity"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <span>•</span>
                      {errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating account...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <UserPlus className="h-5 w-5" />
                      Create Account
                    </span>
                  )}
                </Button>
              </form>

              {/* Login Link */}
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Already have an account?{' '}
                  <Link 
                    href="/login" 
                    className="font-semibold text-red-600 hover:text-red-700 transition-colors underline-offset-4 hover:underline"
                  >
                    Sign in
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Additional Info */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              By creating an account, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
