'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight, Home } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DashboardBreadcrumbsProps {
  className?: string
}

interface BreadcrumbItem {
  title: string
  href?: string
}

export function DashboardBreadcrumbs({ className }: DashboardBreadcrumbsProps) {
  const pathname = usePathname()
  
  // Generate breadcrumbs from pathname
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const segments = pathname.split('/').filter(Boolean)
    
    // Always start with Dashboard
    const breadcrumbs: BreadcrumbItem[] = [
      { title: 'Dashboard', href: '/dashboard' }
    ]
    
    // Map path segments to human-readable titles
    const segmentTitles: Record<string, string> = {
      'batches': 'Batch Management',
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
      
      const title = segmentTitles[segment] || segment.charAt(0).toUpperCase() + segment.slice(1)
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