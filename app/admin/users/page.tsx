'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Users, Search, Shield, UserCheck, UserX, Trash2, Eye } from 'lucide-react'
import Link from 'next/link'
import AdminSidebar from '@/components/AdminSidebar'
import api from '@/lib/api'
import toast from 'react-hot-toast'

interface User {
  _id: string
  name: string
  email: string
  role: string
  enrolledCourses: any[]
  quizAttempts: any[]
  createdAt: string
}

export default function AdminUsersPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.push('/')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchUsers()
    }
  }, [user, searchTerm])

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true)
      const response = await api.get('/users')
      let filteredUsers = response.data

      if (searchTerm) {
        filteredUsers = response.data.filter((user: User) =>
          user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase())
        )
      }

      setUsers(filteredUsers)
    } catch (error) {
      console.error('Failed to fetch users:', error)
      toast.error('Failed to fetch users')
    } finally {
      setLoadingUsers(false)
    }
  }

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await api.put(`/users/${userId}/role`, { role: newRole })
      toast.success(`User role updated to ${newRole}`)
      fetchUsers()
    } catch (error) {
      console.error('Failed to update user role:', error)
      toast.error('Failed to update user role')
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return
    }

    try {
      await api.delete(`/users/${userId}`)
      toast.success('User deleted successfully')
      fetchUsers()
    } catch (error) {
      console.error('Failed to delete user:', error)
      toast.error('Failed to delete user')
    }
  }

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
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600">Manage users and their permissions</p>
        </div>

        {/* Search */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600 h-4 w-4" />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white border-gray-200 text-gray-900"
            />
          </div>
        </div>

        {/* Users Table */}
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-900">All Users ({users.length})</CardTitle>
            <CardDescription className="text-gray-600">
              Manage user accounts and permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingUsers ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-100 rounded animate-pulse"></div>
                ))}
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-600 text-lg">No users found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-200">
                    <TableHead className="text-gray-600">Name</TableHead>
                    <TableHead className="text-gray-600">Email</TableHead>
                    <TableHead className="text-gray-600">Role</TableHead>
                    <TableHead className="text-gray-600">Courses</TableHead>
                    <TableHead className="text-gray-600">Joined</TableHead>
                    <TableHead className="text-gray-600">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((userData) => (
                    <TableRow key={userData._id} className="border-gray-200">
                      <TableCell className="font-medium text-gray-900">{userData.name}</TableCell>
                      <TableCell className="text-gray-600">{userData.email}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={userData.role === 'admin' ? 'default' : 'secondary'} 
                          className={userData.role === 'admin' ? 'bg-red-600 text-gray-900' : 'bg-gray-600 text-gray-900'}
                        >
                          {userData.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-600">{userData.enrolledCourses.length}</TableCell>
                      <TableCell className="text-gray-600">
                        {new Date(userData.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Link href={`/admin/users/${userData._id}`}>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="bg-white border-gray-300 text-gray-900 hover:bg-gray-100"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          {userData.role === 'user' ? (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => handleRoleChange(userData._id, 'admin')}
                              className="bg-white border-gray-300 text-gray-900 hover:bg-gray-100"
                            >
                              <Shield className="h-4 w-4 mr-1" />
                              Make Admin
                            </Button>
                          ) : (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => handleRoleChange(userData._id, 'user')}
                              className="bg-white border-gray-300 text-gray-900 hover:bg-gray-100"
                            >
                              <UserCheck className="h-4 w-4 mr-1" />
                              Make User
                            </Button>
                          )}
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleDeleteUser(userData._id)}
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

