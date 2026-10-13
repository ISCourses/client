'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'

// Names of active categories, managed in Admin → Categories and shared by courses and products
export function useCategoryNames() {
  const [names, setNames] = useState<string[]>([])

  useEffect(() => {
    let cancelled = false
    api
      .get('/categories')
      .then((response) => {
        if (cancelled) return
        const active = (response.data || []).filter((c: { isActive?: boolean }) => c.isActive !== false)
        setNames(active.map((c: { name: string }) => c.name))
      })
      .catch((error) => console.error('Failed to fetch categories:', error))
    return () => {
      cancelled = true
    }
  }, [])

  return names
}

// Keep a record's current category selectable even if it is no longer in the list
export function withCurrentCategory(names: string[], current?: string) {
  return current && !names.includes(current) ? [...names, current] : names
}
