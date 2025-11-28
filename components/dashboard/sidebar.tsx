
"use client"

import { ReactNode, useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import type { RoleKey, PermissionKey } from '@/lib/rbac/types'
import {
  Building2,
  BarChart3,
  Package,
  Sprout,
  Thermometer,
  ClipboardList,
  AlertTriangle,
  Settings,
  FileText,
  Trash2,
  Users,
  Shield,
  Beaker,
  Bell,
  BookCheck,
  BookOpenCheck,
  FlaskConical,
  Leaf,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { usePermissions } from '@/hooks/use-permissions'
import { useTaskCount } from '@/hooks/use-task-count'
import { useAlarms } from '@/hooks/use-alarms'
import { createClient } from '@/lib/supabase/client'
import { SiteIndicator } from './site-selector'

interface DashboardSidebarProps {
  user: {
    id: string
    role: string
    additional_permissions?: string[]
    organization?: {
      id?: string
      name: string
      jurisdiction: string
    }
  }
  className?: string
}

interface NavItem {
  title: string
  href: string
  icon: ReactNode
  permission?: string
  badge?: string
  children?: NavItem[]
}

export function DashboardSidebar({ user, className }: DashboardSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { can } = usePermissions(user.role as RoleKey, user.additional_permissions || [])
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [batchBadges, setBatchBadges] = useState<{ active: number; harvest: number }>({ active: 0, harvest: 0 })
  const [lowStockCount, setLowStockCount] = useState<number>(0)
  const [notificationCount, setNotificationCount] = useState<number>(0)
  
  // Use the task count hook for real-time updates
  const { count: myTaskCount } = useTaskCount({ userId: user.id, realtime: true })
  
  // Use the alarms hook for real-time alarm count updates
  const { activeCount: alarmCount } = useAlarms({ realtime: true, status: 'active' })

  useEffect(() => {
    if (typeof window === 'undefined' || !user.organization?.id || !user.id) return
    
    const supabase = createClient()
    let siteIdCache: string | null = null

    const loadCounts = async () => {
      // Get user's site assignment (cache it to avoid repeated queries)
      if (!siteIdCache) {
        const { data: siteAssignment } = await supabase
          .from('user_site_assignments')
          .select('site_id')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .limit(1)
          .single()
        
        siteIdCache = siteAssignment?.site_id || null
      }
      
      const queries = [
        supabase
          .from('batches')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', user.organization?.id)
          .in('status', ['active', 'quarantined']),
        supabase
          .from('batches')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', user.organization?.id)
          .eq('stage', 'harvest'),
      ]
      
      // Add inventory alerts query if user has a site
      if (siteIdCache) {
        queries.push(
          supabase
            .from('inventory_stock_balances')
            .select('*', { count: 'exact', head: true })
            .eq('site_id', siteIdCache)
            .in('stock_status', ['below_par', 'reorder', 'out_of_stock'])
        )
      }
      
      const results = await Promise.all(queries)
      const [{ count: activeCount }, { count: harvestCount }, lowStockResult] = results

      setBatchBadges({ active: activeCount || 0, harvest: harvestCount || 0 })
      if (lowStockResult) {
        setLowStockCount(lowStockResult.count || 0)
      }

      // Get unread notifications count
      const { count: unreadNotifs } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .is('read_at', null)

      setNotificationCount(unreadNotifs || 0)
    }

    // Initial load
    loadCounts()

    // Set up realtime subscriptions for inventory changes
    const inventoryChannel = supabase
      .channel('sidebar-inventory-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'inventory_items' },
        (payload) => {
          console.log('Inventory ITEMS change detected:', payload)
          loadCounts()
        }
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'inventory_movements' },
        (payload) => {
          console.log('Inventory MOVEMENTS change detected:', payload)
          loadCounts()
        }
      )
      .subscribe((status) => {
        console.log('Inventory channel subscription status:', status)
      })

    // Set up realtime subscriptions for batch changes
    const batchChannel = supabase
      .channel('sidebar-batch-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'batches' },
        () => {
          loadCounts()
        }
      )
      .subscribe()

    // Alarm real-time is handled by useAlarms hook

    // Set up realtime subscriptions for notification changes
    const notificationChannel = supabase
      .channel('sidebar-notification-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        () => {
          loadCounts()
        }
      )
      .subscribe()

    // Cleanup subscriptions on unmount
    return () => {
      supabase.removeChannel(inventoryChannel)
      supabase.removeChannel(batchChannel)
      supabase.removeChannel(notificationChannel)
    }
  }, [user.organization?.id, user.id])

  const navItems: NavItem[] = [
    {
      title: 'Overview',
      href: '/dashboard',
      icon: <BarChart3 className="h-4 w-4" />,
      permission: 'dashboard:view'
    },
    {
      title: 'Alarms & Notifications',
      href: '/dashboard/alarms',
      icon: <Bell className="h-4 w-4" />,
      permission: 'alarm:view',
      badge: (alarmCount + notificationCount) > 0 ? String(alarmCount + notificationCount) : undefined,
    },
    {
      title: 'Crop Management',
      href: '/dashboard/batches',
      icon: <Sprout className="h-4 w-4" />,
      permission: 'batch:view',
      children: [
        {
          title: 'Active Batches',
          href: '/dashboard/batches/active',
          icon: <Sprout className="h-4 w-4" />, 
          permission: 'batch:view',
          badge: batchBadges.active ? String(batchBadges.active) : undefined,
        },
        {
          title: 'Cultivars',
          href: '/dashboard/cultivars',
          icon: <Beaker className="h-4 w-4" />,
          permission: 'cultivar:view',
        },
        
        {
          title: 'Harvest Queue',
          href: '/dashboard/batches/harvest',
          icon: <Package className="h-4 w-4" />,
          permission: 'batch:stage_change',
          badge: batchBadges.harvest ? String(batchBadges.harvest) : undefined,
        },
        {
          title: 'Individual Plants',
          href: '/dashboard/batches/plants',
          icon: <Leaf className="h-4 w-4" />,
          permission: 'batch:view',
        },
        {
          title: 'Planning - Coming soon',
          href: '/dashboard/batches/planning',
          icon: <ClipboardList className="h-4 w-4" />, 
          permission: 'batch:create'
        },
        
      ]
    },
    {
      title: 'Inventory',
      href: '/dashboard/inventory',
      icon: <Package className="h-4 w-4" />,
      permission: 'inventory:view',
      children: [
        {
          title: 'Overview',
          href: '/dashboard/inventory',
          icon: <BarChart3 className="h-4 w-4" />,
          permission: 'inventory:view'
        },
        {
          title: 'Item Catalog',
          href: '/dashboard/inventory/items',
          icon: <Package className="h-4 w-4" />,
          permission: 'inventory:view'
        },
        {
          title: 'Categories',
          href: '/dashboard/inventory/categories',
          icon: <FileText className="h-4 w-4" />,
          permission: 'inventory:view'
        },
        {
          title: 'Movements Log',
          href: '/dashboard/inventory/movements',
          icon: <ClipboardList className="h-4 w-4" />,
          permission: 'inventory:view'
        },
        {
          title: 'Low Stock Alerts',
          href: '/dashboard/inventory/alerts',
          icon: <AlertTriangle className="h-4 w-4" />,
          permission: 'inventory:view',
          badge: lowStockCount > 0 ? String(lowStockCount) : undefined,
        }
      ]
    },
    {
      title: 'Monitoring & Controls',
      href: '/dashboard/monitoring',
      icon: <Thermometer className="h-4 w-4" />,
      children: [
        {
          title: 'Monitoring Overview',
          href: '/dashboard/monitoring',
          icon: <BarChart3 className="h-4 w-4" />,
          permission: 'monitoring:view'
        },
        {
          title: 'Recipes',
          href: '/dashboard/recipes',
          icon: <Beaker className="h-4 w-4" />,
          permission: 'control:view'
        }
      ]
    },
    {
      title: 'Tasks & Workflows',
      href: '/dashboard/workflows',
      icon: <ClipboardList className="h-4 w-4" />,
      permission: 'task:view',
      children: [
        {
          title: 'My Tasks',
          href: '/dashboard/workflows',
          icon: <ClipboardList className="h-4 w-4" />,
          permission: 'task:view',
          badge: myTaskCount > 0 ? String(myTaskCount) : undefined
        },
        {
          title: 'Templates',
          href: '/dashboard/workflows/templates',
          icon: <FileText className="h-4 w-4" />,
          permission: 'task:view'
        }
      ]
    },
    {
      title: 'Waste Management',
      href: '/dashboard/waste',
      icon: <Trash2 className="h-4 w-4" />,
      permission: 'waste:view',
      children: [
        {
          title: 'Disposal Logs',
          href: '/dashboard/waste',
          icon: <ClipboardList className="h-4 w-4" />,
          permission: 'waste:view'
        },
        {
          title: 'Record Disposal',
          href: '/dashboard/waste/record',
          icon: <Trash2 className="h-4 w-4" />,
          permission: 'waste:create'
        }
      ]
    },
    {
      title: 'Compliance',
      href: '/dashboard/compliance/sync',
      icon: <BookCheck className="h-4 w-4" />,
      permission: 'compliance:view',
      children: [
        {
          title: 'Metrc Sync',
          href: '/dashboard/compliance/sync',
          icon: <BookOpenCheck className="h-4 w-4" />,
          permission: 'compliance:sync'
        },
        {
        title: 'Lab Tests',
  href: '/dashboard/lab-tests',
  icon: <FlaskConical className="h-4 w-4" />  ,
  permission: 'compliance:sync'
}
      ]
    }
  ]

  // Expand section containing current route by default
  useEffect(() => {
    const nextExpanded: Record<string, boolean> = {}
    for (const item of navItems) {
      if (!item.children) continue
      const hasActiveChild = item.children.some(child => pathname.startsWith(child.href))
      nextExpanded[item.href] = !!hasActiveChild
    }
    setExpanded(nextExpanded)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  // Add admin-only navigation items
  if (can('user:view') || can('org:settings')) {
    navItems.push({
      title: 'Administration',
      href: '/dashboard/admin',
      icon: <Shield className="h-4 w-4" />,
      permission: 'user:view',
      children: [
        {
          title: 'Overview',
          href: '/dashboard/admin',
          icon: <BarChart3 className="h-4 w-4" />,
          permission: 'user:view'
        },
        {
          title: 'User Management',
          href: '/dashboard/admin/users',
          icon: <Users className="h-4 w-4" />,
          permission: 'user:view'
        },
        {
          title: 'Roles & Permissions',
          href: '/dashboard/admin/roles',
          icon: <Shield className="h-4 w-4" />,
          permission: 'user:view'
        },
        {
          title: 'Audit Log',
          href: '/dashboard/admin/audit',
          icon: <FileText className="h-4 w-4" />,
          permission: 'audit:view'
        },
        {
          title: 'Compliance API Keys',
          href: '/dashboard/admin/compliance',
          icon: <Shield className="h-4 w-4" />,
          permission: 'compliance:sync'
        },
        {
          title: 'Pod Device Tokens',
          href: '/dashboard/admin/api-tokens',
          icon: <Settings className="h-4 w-4" />,
          permission: 'api:manage'
        },
        {
          title: 'Organization',
          href: '/dashboard/admin/organization',
          icon: <Building2 className="h-4 w-4" />,
          permission: 'org:settings'
        }
      ]
    })
  }

  const hasPermissionForItem = (item: NavItem) => !item.permission || can(item.permission as PermissionKey)

  const hasAccessibleDescendant = (children?: NavItem[]): boolean => {
    if (!children) return false
    for (const child of children) {
      if (hasPermissionForItem(child)) return true
      if (hasAccessibleDescendant(child.children)) return true
    }
    return false
  }

  const getFirstAccessibleChildHref = (children?: NavItem[]): string | undefined => {
    if (!children) return undefined
    for (const child of children) {
      if (hasPermissionForItem(child)) {
        return child.href
      }
      const nested = getFirstAccessibleChildHref(child.children)
      if (nested) return nested
    }
    return undefined
  }

  const renderNavItem = (item: NavItem, depth = 0) => {
    const childIsActive = item.children?.some(child => hasPermissionForItem(child) && pathname.startsWith(child.href))
    const isActive = pathname === item.href || !!childIsActive
    const isExpanded = expanded[item.href] ?? false
    
    if (!hasPermissionForItem(item)) {
      return null
    }

    if (item.children && !hasAccessibleDescendant(item.children)) {
      return null
    }

    const itemContent = (
      <div className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent',
        isActive && 'bg-accent text-accent-foreground',
        depth > 0 && 'ml-4 pl-6'
      )}>
        {item.icon}
        <span className="flex-1">{item.title}</span>
        {item.badge && (
          <Badge variant="secondary" className="ml-auto h-5 min-w-[20px] px-1.5 flex items-center justify-center rounded-full text-xs font-semibold">
            {item.badge}
          </Badge>
        )}
      </div>
    )

    return (
      <div key={item.href}>
        {item.children ? (
          <div className="space-y-1">
            <button
              type="button"
              aria-expanded={isExpanded}
              className={cn(
                'w-full text-left flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent transition-colors',
                isActive && 'bg-accent text-accent-foreground'
              )}
              onClick={() => {
                // Expand only this category and collapse others
                const onlyThisExpanded: Record<string, boolean> = {}
                for (const parent of navItems) {
                  if (!parent.children) continue
                  onlyThisExpanded[parent.href] = parent.href === item.href
                }
                setExpanded(onlyThisExpanded)
                const firstAccessibleChildHref = getFirstAccessibleChildHref(item.children)
                if (firstAccessibleChildHref) router.push(firstAccessibleChildHref)
              }}
            >
              {item.icon}
              <span className="flex-1">{item.title}</span>
              {item.badge && (
                <Badge variant="secondary" className="ml-auto h-5 min-w-[20px] px-1.5 flex items-center justify-center rounded-full text-xs font-semibold">
                  {item.badge}
                </Badge>
              )}
            </button>
            {isExpanded && (
              <div className="space-y-1">
                {item.children.map(child => renderNavItem(child, depth + 1))}
              </div>
            )}
          </div>
        ) : (
          <Link href={item.href}>
            {itemContent}
          </Link>
        )}
      </div>
    )
  }

  return (
    <aside className={cn('flex flex-col bg-background', className)}>
      <div className="flex h-16 items-center border-b px-6 bg-green-900">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold text-xl">
          <Image
            src="/images/colorLogo.png"
            alt="Trazo Logo"
            width={40}
            height={40}
            style={{ height: 'auto' }}
            className="object-contain dark:hidden"
          />
          <Image
            src="/images/colorLogo.png"
            alt="Trazo Logo"
            width={40}
            height={40}
            style={{ height: 'auto' }}
            className="object-contain hidden dark:block"
          />
            <span className="font-helvetica text-[#E5F4EA] tracking-[0.09em] text-xl md:text-2xl">TRAZO</span>
        </Link>
      </div>

      {/* Organization info */}
      <div className="border-b px-6 py-4 border-r border-border">
        <div className="text-sm font-medium">{user.organization?.name}</div>
        <div className="text-xs text-muted-foreground capitalize">
          {user.organization?.jurisdiction?.replace('_', ' ')} • {user.role?.replace('_', ' ')}
        </div>
        <SiteIndicator className="mt-2" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-auto no-scrollbar p-4 border-r border-border" role="navigation" aria-label="Sidebar navigation">
        <div className="space-y-2">
          {navItems.map(item => renderNavItem(item))}
        </div>
      </nav>

      {/* Footer */}
      <div className="border-t p-4 border-r border-border">
        <Button variant="ghost" size="sm" className="w-full justify-start" asChild>
          <Link href="/dashboard/settings">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Link>
        </Button>
      </div>
    </aside>
  )
}
