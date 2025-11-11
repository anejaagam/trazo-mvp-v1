'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Search, 
  Package, 
  ClipboardList, 
  Thermometer, 
  FileCheck, 
  BarChart3, 
  Sprout, 
  AlertTriangle,
  Users,
  Settings,
  Building2
} from 'lucide-react'
import { Input } from '@/components/ui/input'

const searchablePages = [
  // Main Navigation
  { title: 'Batches', href: '/dashboard/batches', icon: Sprout, category: 'Navigation' },
  { title: 'Inventory', href: '/dashboard/inventory', icon: Package, category: 'Navigation' },
  { title: 'Tasks', href: '/dashboard/tasks', icon: ClipboardList, category: 'Navigation' },
  { title: 'Environmental', href: '/dashboard/environmental', icon: Thermometer, category: 'Navigation' },
  { title: 'Monitoring', href: '/dashboard/monitoring', icon: BarChart3, category: 'Navigation' },
  { title: 'Compliance', href: '/dashboard/compliance', icon: FileCheck, category: 'Navigation' },
  { title: 'Alarms', href: '/dashboard/alarms', icon: AlertTriangle, category: 'Navigation' },
  
  // Admin Pages
  { title: 'User Management', href: '/dashboard/admin', icon: Users, category: 'Admin' },
  { title: 'Site Management', href: '/dashboard/admin/sites', icon: Building2, category: 'Admin' },
  { title: 'Settings', href: '/dashboard/settings', icon: Settings, category: 'Settings' },
  
  // Inventory Sub-pages
  { title: 'Create Inventory Item', href: '/dashboard/inventory/create', icon: Package, category: 'Inventory' },
]

export function GlobalSearch() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filteredPages = search
    ? searchablePages.filter((page) => {
        const searchLower = search.toLowerCase()
        const matches = page.title.toLowerCase().includes(searchLower) ||
                       page.category.toLowerCase().includes(searchLower)
        return matches
      }).sort((a, b) => {
        const searchLower = search.toLowerCase()
        const aStarts = a.title.toLowerCase().startsWith(searchLower)
        const bStarts = b.title.toLowerCase().startsWith(searchLower)
        
        // Pages starting with search term come first
        if (aStarts && !bStarts) return -1
        if (!aStarts && bStarts) return 1
        
        // Then alphabetical order
        return a.title.localeCompare(b.title)
      })
    : []

  const handleSelect = (href: string) => {
    setIsOpen(false)
    setSearch('')
    router.push(href)
  }

  return (
    <div className="relative w-64" ref={containerRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
        <Input
          placeholder="Search..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => search && setIsOpen(true)}
          className="w-full pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus-visible:ring-white/30 focus-visible:bg-white/15 h-9"
        />
      </div>

      {isOpen && filteredPages.length > 0 && (
        <div className="absolute top-full mt-1 w-full max-h-96 overflow-auto bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-50">
          {filteredPages.map((page) => {
            const Icon = page.icon
            return (
              <button
                key={page.href}
                onClick={() => handleSelect(page.href)}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 text-left transition-colors border-b border-gray-100 dark:border-gray-700 last:border-0"
              >
                <Icon className="h-4 w-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {page.title}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {page.category}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {isOpen && search && filteredPages.length === 0 && (
        <div className="absolute top-full mt-1 w-full bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-50 p-4 text-center text-sm text-gray-500 dark:text-gray-400">
          No results found for &ldquo;{search}&rdquo;
        </div>
      )}
    </div>
  )
}
