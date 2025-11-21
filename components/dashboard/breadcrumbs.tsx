'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight, Home } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface DashboardBreadcrumbsProps {
  className?: string
}

interface BreadcrumbItem {
  title: string
  href?: string
}

// Helper to check if string is a UUID
const isUUID = (str: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(str)
}

export function DashboardBreadcrumbs({ className }: DashboardBreadcrumbsProps) {
  const pathname = usePathname()
  const [dynamicNames, setDynamicNames] = useState<Record<string, string>>({})
  
  // Fetch dynamic names for UUIDs (recipes, batches, etc.)
  useEffect(() => {
    const fetchDynamicNames = async () => {
      const segments = pathname.split('/').filter(Boolean)
      const supabase = createClient()
      const newNames: Record<string, string> = {}
      
      for (let i = 0; i < segments.length; i++) {
        const segment = segments[i]
        const prevSegment = i > 0 ? segments[i - 1] : null
        
        if (isUUID(segment) && prevSegment) {
          // Fetch name based on the previous segment
          try {
            if (prevSegment === 'recipes') {
              const { data } = await supabase
                .from('recipes')
                .select('name')
                .eq('id', segment)
                .single()
              if (data?.name) newNames[segment] = data.name
            } else if (prevSegment === 'batches') {
              const { data } = await supabase
                .from('batches')
                .select('batch_number')
                .eq('id', segment)
                .single()
              if (data?.batch_number) newNames[segment] = data.batch_number
            }
            // Add more entity types as needed
          } catch (error) {
            console.error(`Error fetching name for ${prevSegment}:`, error)
          }
        }
      }
      
      if (Object.keys(newNames).length > 0) {
        setDynamicNames(newNames)
      }
    }
    
    fetchDynamicNames()
  }, [pathname])
  
  // Generate breadcrumbs from pathname
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const segments = pathname.split('/').filter(Boolean)
    
    // Always start with Dashboard
    const breadcrumbs: BreadcrumbItem[] = [
      { title: 'Dashboard', href: '/dashboard' }
    ]
    
    // Map path segments to human-readable titles
    const segmentTitles: Record<string, string> = {
      'batches': 'Crop Management',
      'active': 'Active Batches',
      'planning': 'Planning',
      'harvest': 'Harvest Queue',
      'inventory': 'Inventory',
      'stock': 'Current Stock',
      'receiving': 'Receiving',
      'alerts': 'Alerts',
      'environmental': 'Environmental Controls',
      'monitoring': 'Live Monitoring',
      'recipes': 'Recipes',
      'alarms': 'Alarms',
      'tasks': 'Tasks & Workflows',
      'assigned': 'My Tasks',
      'sops': 'SOPs',
      'schedule': 'Schedule',
      'waste': 'Waste Management',
      'disposal': 'Disposal Log',
      'compliance': 'Compliance',
      'reports': 'Reports',
      'evidence': 'Evidence Vault',
      'audit': 'Audit Trail',
      'admin': 'Administration',
      'users': 'Users & Roles',
      'organization': 'Organization',
      'settings': 'Settings'
    }
    
    // Skip 'dashboard' and build breadcrumbs
    let currentPath = ''
    for (let i = 1; i < segments.length; i++) {
      const segment = segments[i]
      currentPath += `/${segment}`
      
      // Use dynamic name if available, otherwise use static mapping or capitalize
      let title: string
      if (dynamicNames[segment]) {
        title = dynamicNames[segment]
      } else if (segmentTitles[segment]) {
        title = segmentTitles[segment]
      } else if (isUUID(segment)) {
        title = 'Loading...'
      } else {
        title = segment.charAt(0).toUpperCase() + segment.slice(1)
      }
      
      const isLast = i === segments.length - 1
      
      breadcrumbs.push({
        title,
        href: isLast ? undefined : `/dashboard${currentPath}`
      })
    }
    
    return breadcrumbs
  }
  
  const breadcrumbs = generateBreadcrumbs()
  
  // Don't show breadcrumbs if we're on the dashboard home
  if (pathname === '/dashboard') {
    return null
  }
  
  return (
    <nav className={cn('flex items-center space-x-1 text-sm text-muted-foreground', className)}>
      <Home className="h-4 w-4" />
      {breadcrumbs.map((crumb, index) => (
        <div key={index} className="flex items-center">
          {index > 0 && <ChevronRight className="h-4 w-4 mx-1" />}
          {crumb.href ? (
            <Link 
              href={crumb.href}
              className="hover:text-foreground transition-colors"
            >
              {crumb.title}
            </Link>
          ) : (
            <span className="text-foreground font-medium">{crumb.title}</span>
          )}
        </div>
      ))}
    </nav>
  )
}
