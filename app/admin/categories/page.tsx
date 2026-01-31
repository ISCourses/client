'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Plus, Edit, Trash2, Search, Tag } from 'lucide-react'
import AdminSidebar from '@/components/AdminSidebar'
import api from '@/lib/api'
import toast from 'react-hot-toast'

interface Category {
  _id: string
  name: string
  description: string
  icon: string
  color: string
  isActive: boolean
  createdAt: string
}

export default function AdminCategoriesPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '',
    color: '#6366f1',
    isActive: true
  })

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.push('/')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchCategories()
    }
  }, [user])

  const fetchCategories = async () => {
    try {
      setLoadingCategories(true)
      const response = await api.get('/categories/admin/all')
      setCategories(response.data)
    } catch (error) {
      console.error('Failed to fetch categories:', error)
      toast.error('Failed to fetch categories')
    } finally {
      setLoadingCategories(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingCategory) {
        await api.put(`/categories/${editingCategory._id}`, formData)
        toast.success('Category updated successfully')
      } else {
        await api.post('/categories', formData)
        toast.success('Category created successfully')
      }
      setShowForm(false)
      setEditingCategory(null)
      setFormData({ name: '', description: '', icon: '', color: '#6366f1', isActive: true })
      fetchCategories()
    } catch (error: any) {
      console.error('Failed to save category:', error)
      toast.error(error.response?.data?.message || 'Failed to save category')
    }
  }

  const handleEdit = (category: Category) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      description: category.description || '',
      icon: category.icon || '',
      color: category.color || '#6366f1',
      isActive: category.isActive
    })
    setShowForm(true)
  }

  const handleDelete = async (categoryId: string) => {
    if (!confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
      return
    }

    try {
      await api.delete(`/categories/${categoryId}`)
      toast.success('Category deleted successfully')
      fetchCategories()
    } catch (error: any) {
      console.error('Failed to delete category:', error)
      toast.error(error.response?.data?.message || 'Failed to delete category')
    }
  }

  const handleToggleActive = async (categoryId: string, currentStatus: boolean) => {
    try {
      await api.put(`/categories/${categoryId}`, { isActive: !currentStatus })
      toast.success(`Category ${!currentStatus ? 'activated' : 'deactivated'} successfully`)
      fetchCategories()
    } catch (error: any) {
      console.error('Failed to update category:', error)
      toast.error('Failed to update category')
    }
  }

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex">
        <AdminSidebar />
        <div className="flex-1 p-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-100 rounded w-1/3 mb-8"></div>
            <div className="h-64 bg-gray-100 rounded"></div>
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
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Category Management</h1>
              <p className="text-gray-600">Manage course categories</p>
            </div>
            <Button 
              onClick={() => {
                setEditingCategory(null)
                setFormData({ name: '', description: '', icon: '', color: '#6366f1', isActive: true })
                setShowForm(true)
              }}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create New Category
            </Button>
          </div>
        </div>

        {/* Create/Edit Form */}
        {showForm && (
          <Card className="bg-white border-gray-200 mb-8">
            <CardHeader>
              <CardTitle className="text-gray-900">
                {editingCategory ? 'Edit Category' : 'Create New Category'}
              </CardTitle>
              <CardDescription className="text-gray-600">
                {editingCategory ? 'Update category information' : 'Add a new category for courses'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Category Name *
                    </label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter category name"
                      className="bg-white border-gray-300 text-gray-900 placeholder-gray-400"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Color
                    </label>
                    <Input
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="bg-gray-800 border-gray-200 h-10"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Enter category description"
                    rows={3}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Icon (optional)
                  </label>
                  <Input
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    placeholder="Icon name or emoji"
                    className="bg-white border-gray-300 text-gray-900 placeholder-gray-400"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="rounded border-gray-300 bg-white text-gray-900 focus:ring-red-500"
                  />
                  <label className="text-gray-900">Active</label>
                </div>
                <div className="flex justify-end space-x-4">
                  <Button
                    type="button"
                    onClick={() => {
                      setShowForm(false)
                      setEditingCategory(null)
                      setFormData({ name: '', description: '', icon: '', color: '#6366f1', isActive: true })
                    }}
                    variant="outline"
                    className="bg-white border-gray-300 text-gray-900 hover:bg-gray-100"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-red-600 text-white hover:bg-red-700">
                    {editingCategory ? 'Update Category' : 'Create Category'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Search */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600 h-4 w-4" />
            <Input
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white border-gray-200 text-gray-900"
            />
          </div>
        </div>

        {/* Categories Table */}
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-900">All Categories ({filteredCategories.length})</CardTitle>
            <CardDescription className="text-gray-600">
              Manage and organize course categories
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingCategories ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-100 rounded animate-pulse"></div>
                ))}
              </div>
            ) : filteredCategories.length === 0 ? (
              <div className="text-center py-12">
                <Tag className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-600 text-lg">No categories found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-200">
                    <TableHead className="text-gray-600">Name</TableHead>
                    <TableHead className="text-gray-600">Description</TableHead>
                    <TableHead className="text-gray-600">Status</TableHead>
                    <TableHead className="text-gray-600">Created</TableHead>
                    <TableHead className="text-gray-600">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCategories.map((category) => (
                    <TableRow key={category._id} className="border-gray-200">
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {category.icon && <span>{category.icon}</span>}
                          <span className="font-medium text-gray-900">{category.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {category.description || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={category.isActive ? 'default' : 'secondary'} 
                          className={category.isActive ? 'bg-green-600 text-gray-900' : 'bg-gray-600 text-gray-900'}
                        >
                          {category.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {new Date(category.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleEdit(category)}
                            className="bg-white border-gray-300 text-gray-900 hover:bg-gray-100"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleToggleActive(category._id, category.isActive)}
                            className="bg-white border-gray-300 text-gray-900 hover:bg-gray-100"
                          >
                            {category.isActive ? 'Deactivate' : 'Activate'}
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleDelete(category._id)}
                            className="bg-red-50 border-red-300 text-red-600 hover:bg-red-100"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

