'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/contexts/AuthContext'
import { BookOpen, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '@/lib/api'

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

  const renderField = (field: RegistrationField) => {
    const validationRules = buildValidationRules(field)
    const fieldError = errors[field.name]

    if (field.name === 'password') {
      return (
        <div key={field.name}>
          <label htmlFor={field.name} className="block text-sm font-medium text-gray-700">
            {field.label} {field.required && <span className="text-red-600">*</span>}
          </label>
          <div className="relative mt-1">
            <Input
              id={field.name}
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder={field.placeholder}
              {...register(field.name, validationRules)}
              className="mt-1"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4 text-gray-400" />
              ) : (
                <Eye className="h-4 w-4 text-gray-400" />
              )}
            </button>
          </div>
          {fieldError && (
            <p className="mt-1 text-sm text-red-600">{fieldError.message as string}</p>
          )}
        </div>
      )
    }

    switch (field.type) {
      case 'textarea':
        return (
          <div key={field.name}>
            <label htmlFor={field.name} className="block text-sm font-medium text-gray-700">
              {field.label} {field.required && <span className="text-red-600">*</span>}
            </label>
            <textarea
              id={field.name}
              placeholder={field.placeholder}
              {...register(field.name, validationRules)}
              rows={4}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
            />
            {fieldError && (
              <p className="mt-1 text-sm text-red-600">{fieldError.message as string}</p>
            )}
          </div>
        )

      case 'select':
        return (
          <div key={field.name}>
            <label htmlFor={field.name} className="block text-sm font-medium text-gray-700">
              {field.label} {field.required && <span className="text-red-600">*</span>}
            </label>
            <select
              id={field.name}
              {...register(field.name, validationRules)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
            >
              <option value="">{field.placeholder || 'Select an option'}</option>
              {field.options.map((option, index) => (
                <option key={index} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {fieldError && (
              <p className="mt-1 text-sm text-red-600">{fieldError.message as string}</p>
            )}
          </div>
        )

      case 'checkbox':
        return (
          <div key={field.name}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {field.label} {field.required && <span className="text-red-600">*</span>}
            </label>
            <div className="space-y-2">
              {field.options.map((option, index) => (
                <label key={index} className="flex items-center space-x-2">
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
              <p className="mt-1 text-sm text-red-600">{fieldError.message as string}</p>
            )}
          </div>
        )

      default:
        return (
          <div key={field.name}>
            <label htmlFor={field.name} className="block text-sm font-medium text-gray-700">
              {field.label} {field.required && <span className="text-red-600">*</span>}
            </label>
            <Input
              id={field.name}
              type={field.type}
              autoComplete={field.type === 'email' ? 'email' : field.type === 'tel' ? 'tel' : 'off'}
              placeholder={field.placeholder}
              {...register(field.name, validationRules)}
              className="mt-1"
            />
            {fieldError && (
              <p className="mt-1 text-sm text-red-600">{fieldError.message as string}</p>
            )}
          </div>
        )
    }
  }

  if (loadingFields) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="animate-pulse">
            <div className="h-12 bg-gray-200 rounded w-full mb-8"></div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <BookOpen className="h-12 w-12 text-red-600" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
          Create your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Or{' '}
          <Link href="/login" className="font-medium text-red-600 hover:text-red-500">
            sign in to your existing account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>Get started</CardTitle>
            <CardDescription>
              Create your account to start learning
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {formFields
                .filter(field => field.enabled !== false && field.name !== 'confirmPassword')
                .map(field => renderField(field))}

              {/* Confirm Password - Always shown */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirm password <span className="text-red-600">*</span>
                </label>
                <div className="relative mt-1">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    {...register('confirmPassword', {
                      required: 'Please confirm your password',
                      validate: value => value === password || 'Passwords do not match'
                    })}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? 'Creating account...' : 'Create account'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
