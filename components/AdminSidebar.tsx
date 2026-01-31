'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  Users,
  BarChart3,
  Settings,
  LogOut,
  Plus,
  GraduationCap,
  Tag,
  Bell,
  Receipt
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

const menuItems = [
  {
    title: "Dashboard",
    url: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "Courses",
    url: "/admin/courses",
    icon: GraduationCap,
  },
  {
    title: "Books",
    url: "/admin/books",
    icon: BookOpen,
  },
  {
    title: "Blogs",
    url: "/admin/blogs",
    icon: FileText,
  },
  {
    title: "Users",
    url: "/admin/users",
    icon: Users,
  },
  {
    title: "Categories",
    url: "/admin/categories",
    icon: Tag,
  },
  {
    title: "Analytics",
    url: "/admin/analytics",
    icon: BarChart3,
  },
  {
    title: "Transactions",
    url: "/admin/transactions",
    icon: Receipt,
  },
  {
    title: "Notifications",
    url: "/admin/notifications",
    icon: Bell,
  },
  {
    title: "Settings",
    url: "/admin/settings",
    icon: Settings,
  },
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const { logout, user } = useAuth()

  return (
    <div className="flex h-screen w-64 flex-col bg-white border-r border-gray-200 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-gray-200">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-red-600 to-red-700 shadow-lg">
          <BookOpen className="h-6 w-6 text-white" />
        </div>
        <div className="flex flex-col">
          <h2 className="text-lg font-bold text-gray-900">NOI LMS</h2>
          <p className="text-xs text-gray-500 font-medium">Admin Panel</p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-1">
          <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Navigation
          </p>
          {menuItems.map((item) => {
            const isActive = pathname === item.url || (item.url !== "/admin" && pathname.startsWith(item.url))
            const Icon = item.icon
            
            return (
              <Link
                key={item.title}
                href={item.url}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  "hover:bg-gray-100 hover:text-gray-900",
                  isActive
                    ? "bg-red-50 text-red-600 shadow-sm border-l-2 border-red-600"
                    : "text-gray-600"
                )}
              >
                <Icon className={cn(
                  "h-5 w-5 transition-colors",
                  isActive ? "text-red-600" : "text-gray-500 group-hover:text-gray-900"
                )} />
                <span className="flex-1">{item.title}</span>
                {isActive && (
                  <div className="h-1.5 w-1.5 rounded-full bg-red-600" />
                )}
              </Link>
            )
          })}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 space-y-1">
          <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Quick Actions
          </p>
          <Link
            href="/admin/courses/new"
            className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 transition-all duration-200 hover:bg-gray-100 hover:text-gray-900"
          >
            <Plus className="h-5 w-5 text-gray-500 group-hover:text-gray-900 transition-colors" />
            <span>New Course</span>
          </Link>
          <Link
            href="/admin/blogs/new"
            className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 transition-all duration-200 hover:bg-gray-100 hover:text-gray-900"
          >
            <Plus className="h-5 w-5 text-gray-500 group-hover:text-gray-900 transition-colors" />
            <span>New Blog</span>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 p-4">
        {user && (
          <div className="mb-3 px-3 py-2 rounded-lg bg-gray-50">
            <p className="text-xs text-gray-500 mb-1">Logged in as</p>
            <p className="text-sm font-medium text-gray-900">{user.name}</p>
            <p className="text-xs text-gray-600">{user.email}</p>
          </div>
        )}
        <button
          onClick={logout}
          className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 transition-all duration-200 hover:bg-red-50 hover:text-red-600"
        >
          <LogOut className="h-5 w-5 text-gray-500 group-hover:text-red-600 transition-colors" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  )
}
