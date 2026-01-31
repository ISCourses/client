'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Save, Loader2, Plus, Trash2, GripVertical, Eye } from 'lucide-react'
import Link from 'next/link'
import AdminSidebar from '@/components/AdminSidebar'
import api from '@/lib/api'
import toast from 'react-hot-toast'

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

const fieldTypes = [
  { value: 'text', label: 'Text' },
  { value: 'email', label: 'Email' },
  { value: 'tel', label: 'Phone' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'textarea', label: 'Textarea' },
  { value: 'select', label: 'Select' },
  { value: 'checkbox', label: 'Checkbox' }
]

export default function RegistrationFormSettingsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [fields, setFields] = useState<RegistrationField[]>([])
  const [loadingFields, setLoadingFields] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingField, setEditingField] = useState<number | null>(null)
  const [newField, setNewField] = useState<Partial<RegistrationField> | null>(null)

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.push('/')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchFields()
    }
  }, [user])

  const fetchFields = async () => {
    try {
      setLoadingFields(true)
      const response = await api.get('/settings/admin/all')
      const formFields = response.data.registrationFormFields || []
      
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
        const savedField = formFields.find((f: RegistrationField) => f.name === defaultField.name)
        if (savedField) {
          return { 
            ...defaultField, 
            ...savedField,
            validation: savedField.validation || defaultField.validation || {}
          }
        }
        return defaultField
      })

      // Add any additional fields - ensure validation is always an object
      const additionalFields = formFields
        .filter((f: RegistrationField) => 
          !defaultFields.some(df => df.name === f.name)
        )
        .map((f: RegistrationField) => ({
          ...f,
          validation: f.validation || {}
        }))

      setFields([...mergedFields, ...additionalFields].sort((a, b) => a.order - b.order))
    } catch (error) {
      console.error('Failed to fetch fields:', error)
      toast.error('Failed to load registration form fields')
    } finally {
      setLoadingFields(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // Filter out password field and ensure all fields have proper structure
      const fieldsToSave = fields
        .filter(f => f.name !== 'password')
        .map(field => ({
          name: field.name,
          label: field.label,
          type: field.type,
          placeholder: field.placeholder || '',
          required: field.required || false,
          order: field.order,
          options: field.options || [],
          validation: field.validation || {},
          enabled: field.enabled !== false // Default to true if not set
        }))
      
      await api.put('/settings', {
        registrationFormFields: fieldsToSave
      })
      toast.success('Registration form fields saved successfully!')
    } catch (error: any) {
      console.error('Failed to save fields:', error)
      toast.error(error.response?.data?.message || 'Failed to save fields')
    } finally {
      setSaving(false)
    }
  }

  const handleAddField = () => {
    const newFieldData: RegistrationField = {
      name: '',
      label: '',
      type: 'text',
      placeholder: '',
      required: false,
      order: fields.length,
      options: [],
      validation: {},
      enabled: true
    }
    setNewField(newFieldData)
  }

  const handleSaveNewField = () => {
    if (!newField?.name || !newField?.label) {
      toast.error('Field name and label are required')
      return
    }

    // Check if field name already exists
    if (fields.some(f => f.name === newField.name)) {
      toast.error('Field name already exists')
      return
    }

    setFields([...fields, newField as RegistrationField])
    setNewField(null)
    toast.success('Field added successfully')
  }

  const handleUpdateField = (index: number, updates: Partial<RegistrationField>) => {
    const updatedFields = [...fields]
    const currentField = updatedFields[index]
    
    // Ensure validation is always an object
    if (updates.validation !== undefined) {
      updates.validation = { ...(currentField.validation || {}), ...updates.validation }
    }
    
    updatedFields[index] = { 
      ...currentField, 
      ...updates,
      validation: updates.validation || currentField.validation || {}
    }
    setFields(updatedFields)
    setEditingField(null)
  }

  const handleDeleteField = (index: number) => {
    const field = fields[index]
    // Don't allow deleting default fields
    if (['name', 'email', 'password'].includes(field.name)) {
      toast.error('Cannot delete default fields')
      return
    }

    if (confirm(`Are you sure you want to delete "${field.label}"?`)) {
      setFields(fields.filter((_, i) => i !== index))
      toast.success('Field deleted successfully')
    }
  }

  const handleMoveField = (index: number, direction: 'up' | 'down') => {
    const newFields = [...fields]
    const newIndex = direction === 'up' ? index - 1 : index + 1
    
    if (newIndex < 0 || newIndex >= newFields.length) return

    // Directly swap the array elements
    [newFields[index], newFields[newIndex]] = [newFields[newIndex], newFields[index]]
    
    // Reassign order values based on new positions
    newFields.forEach((field, idx) => {
      field.order = idx
    })
    
    setFields(newFields)
  }

  const handleAddOption = (fieldIndex: number) => {
    const updatedFields = [...fields]
    updatedFields[fieldIndex].options = [...updatedFields[fieldIndex].options, '']
    setFields(updatedFields)
  }

  const handleUpdateOption = (fieldIndex: number, optionIndex: number, value: string) => {
    const updatedFields = [...fields]
    updatedFields[fieldIndex].options[optionIndex] = value
    setFields(updatedFields)
  }

  const handleRemoveOption = (fieldIndex: number, optionIndex: number) => {
    const updatedFields = [...fields]
    updatedFields[fieldIndex].options = updatedFields[fieldIndex].options.filter((_, i) => i !== optionIndex)
    setFields(updatedFields)
  }

  if (loading || loadingFields) {
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

  if (!user || user.role !== 'admin') {
    return null
  }

  return (
    <div className="min-h-screen bg-white flex">
      <AdminSidebar />
      
      <div className="flex-1 p-8">
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Link href="/admin/settings">
              <Button variant="outline" className="bg-white border-gray-300 text-gray-900 hover:bg-gray-100">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Settings
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Registration Form Fields</h1>
          <p className="text-gray-600">Manage the fields shown on the registration form</p>
        </div>

        <div className="space-y-6">
          {/* Fields List */}
          <Card className="bg-white border-gray-200">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-gray-900">Form Fields</CardTitle>
                  <CardDescription className="text-gray-600">
                    Configure which fields appear on the registration form
                  </CardDescription>
                </div>
                <Button
                  onClick={handleAddField}
                  className="bg-red-600 text-white hover:bg-red-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Field
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {fields.map((field, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <GripVertical className="h-5 w-5 text-gray-400" />
                      <span className="font-medium text-gray-900">{field.label}</span>
                      {['name', 'email', 'password'].includes(field.name) && (
                        <span className="text-xs text-gray-500">(Default)</span>
                      )}
                    </div>
                    <div className="flex items-center space-x-4">
                      {!['name', 'email', 'password'].includes(field.name) && (
                        <div className="flex items-center space-x-3">
                          <label className="text-sm text-gray-700 font-medium">Enabled</label>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={field.enabled}
                            onClick={() => handleUpdateField(index, { enabled: !field.enabled })}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 ${
                              field.enabled ? 'bg-red-600' : 'bg-gray-300'
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                field.enabled ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </div>
                      )}
                      <div className="flex items-center space-x-2">
                        {index > 0 && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              handleMoveField(index, 'up')
                            }}
                            className="bg-white"
                          >
                            ↑
                          </Button>
                        )}
                        {index < fields.length - 1 && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              handleMoveField(index, 'down')
                            }}
                            className="bg-white"
                          >
                            ↓
                          </Button>
                        )}
                        {!['name', 'email', 'password'].includes(field.name) && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteField(index)}
                            className="bg-red-50 border-red-300 text-red-600 hover:bg-red-100"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingField(editingField === index ? null : index)}
                          className="bg-white"
                        >
                          {editingField === index ? 'Cancel' : 'Edit'}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {editingField === index && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">
                          Field Name (ID) *
                        </label>
                        <Input
                          value={field.name}
                          onChange={(e) => handleUpdateField(index, { name: e.target.value })}
                          disabled={['name', 'email', 'password'].includes(field.name)}
                          placeholder="field_name"
                          className="bg-white border-gray-300 text-gray-900"
                        />
                        <p className="text-xs text-gray-500 mt-1">Used as field identifier (no spaces)</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">
                          Label *
                        </label>
                        <Input
                          value={field.label}
                          onChange={(e) => handleUpdateField(index, { label: e.target.value })}
                          placeholder="Field Label"
                          className="bg-white border-gray-300 text-gray-900"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">
                          Field Type *
                        </label>
                        <select
                          value={field.type}
                          onChange={(e) => handleUpdateField(index, { type: e.target.value as any })}
                          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-900"
                        >
                          {fieldTypes.map(type => (
                            <option key={type.value} value={type.value}>{type.label}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">
                          Placeholder
                        </label>
                        <Input
                          value={field.placeholder}
                          onChange={(e) => handleUpdateField(index, { placeholder: e.target.value })}
                          placeholder="Enter placeholder text"
                          className="bg-white border-gray-300 text-gray-900"
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={field.required}
                          onChange={(e) => handleUpdateField(index, { required: e.target.checked })}
                          className="rounded border-gray-300"
                        />
                        <label className="text-gray-900">Required field</label>
                      </div>

                      {/* Options for select/checkbox */}
                      {(field.type === 'select' || field.type === 'checkbox') && (
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-900 mb-2">
                            Options
                          </label>
                          <div className="space-y-2">
                            {field.options.map((option, optIndex) => (
                              <div key={optIndex} className="flex items-center space-x-2">
                                <Input
                                  value={option}
                                  onChange={(e) => handleUpdateOption(index, optIndex, e.target.value)}
                                  placeholder="Option value"
                                  className="bg-white border-gray-300 text-gray-900"
                                />
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleRemoveOption(index, optIndex)}
                                  className="bg-red-50 border-red-300 text-red-600"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => handleAddOption(index)}
                              className="bg-white border-gray-300 text-gray-900"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add Option
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Validation */}
                      <div className="md:col-span-2 space-y-2">
                        <label className="block text-sm font-medium text-gray-900">Validation</label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Min Length</label>
                            <Input
                              type="number"
                              value={field.validation?.minLength || ''}
                              onChange={(e) => handleUpdateField(index, {
                                validation: { ...(field.validation || {}), minLength: e.target.value ? parseInt(e.target.value) : undefined }
                              })}
                              className="bg-white border-gray-300 text-gray-900"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Max Length</label>
                            <Input
                              type="number"
                              value={field.validation?.maxLength || ''}
                              onChange={(e) => handleUpdateField(index, {
                                validation: { ...(field.validation || {}), maxLength: e.target.value ? parseInt(e.target.value) : undefined }
                              })}
                              className="bg-white border-gray-300 text-gray-900"
                            />
                          </div>
                          {field.type === 'number' && (
                            <>
                              <div>
                                <label className="block text-xs text-gray-600 mb-1">Min Value</label>
                                <Input
                                  type="number"
                                  value={field.validation?.min || ''}
                                  onChange={(e) => handleUpdateField(index, {
                                    validation: { ...(field.validation || {}), min: e.target.value ? parseInt(e.target.value) : undefined }
                                  })}
                                  className="bg-white border-gray-300 text-gray-900"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-600 mb-1">Max Value</label>
                                <Input
                                  type="number"
                                  value={field.validation?.max || ''}
                                  onChange={(e) => handleUpdateField(index, {
                                    validation: { ...(field.validation || {}), max: e.target.value ? parseInt(e.target.value) : undefined }
                                  })}
                                  className="bg-white border-gray-300 text-gray-900"
                                />
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* New Field Form */}
              {newField && (
                <div className="border-2 border-dashed border-red-600 rounded-lg p-4 space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-gray-900">Add New Field</h3>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setNewField(null)}
                      className="bg-white"
                    >
                      Cancel
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Field Name (ID) *
                      </label>
                      <Input
                        value={newField.name || ''}
                        onChange={(e) => setNewField({ ...newField, name: e.target.value })}
                        placeholder="field_name"
                        className="bg-white border-gray-300 text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Label *
                      </label>
                      <Input
                        value={newField.label || ''}
                        onChange={(e) => setNewField({ ...newField, label: e.target.value })}
                        placeholder="Field Label"
                        className="bg-white border-gray-300 text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Type *
                      </label>
                      <select
                        value={newField.type || 'text'}
                        onChange={(e) => setNewField({ ...newField, type: e.target.value as any })}
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-900"
                      >
                        {fieldTypes.map(type => (
                          <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Placeholder
                      </label>
                      <Input
                        value={newField.placeholder || ''}
                        onChange={(e) => setNewField({ ...newField, placeholder: e.target.value })}
                        className="bg-white border-gray-300 text-gray-900"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={newField.required || false}
                        onChange={(e) => setNewField({ ...newField, required: e.target.checked })}
                        className="rounded border-gray-300"
                      />
                      <label className="text-gray-900">Required</label>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setNewField(null)}
                      className="bg-white border-gray-300 text-gray-900"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSaveNewField}
                      className="bg-red-600 text-white hover:bg-red-700"
                    >
                      Add Field
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Preview */}
          <Card className="bg-white border-gray-200">
            <CardHeader>
              <CardTitle className="text-gray-900">Form Preview</CardTitle>
              <CardDescription className="text-gray-600">
                Preview how the registration form will look
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-w-md">
                {fields.filter(f => f.enabled).map((field, index) => (
                  <div key={index}>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      {field.label} {field.required && <span className="text-red-600">*</span>}
                    </label>
                    {field.type === 'textarea' ? (
                      <textarea
                        placeholder={field.placeholder}
                        disabled
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-500"
                        rows={3}
                      />
                    ) : field.type === 'select' ? (
                      <select
                        disabled
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-500"
                      >
                        <option>{field.placeholder || 'Select an option'}</option>
                        {field.options.map((opt, i) => (
                          <option key={i}>{opt}</option>
                        ))}
                      </select>
                    ) : field.type === 'checkbox' ? (
                      <div className="space-y-2">
                        {field.options.map((opt, i) => (
                          <label key={i} className="flex items-center space-x-2">
                            <input type="checkbox" disabled className="rounded border-gray-300" />
                            <span className="text-gray-500">{opt}</span>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <Input
                        type={field.type}
                        placeholder={field.placeholder}
                        disabled
                        className="bg-gray-50 border-gray-300 text-gray-500"
                      />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
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
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

