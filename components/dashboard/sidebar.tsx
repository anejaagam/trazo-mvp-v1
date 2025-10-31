
"use client"

import { ReactNode, useEffect, useState } from 'react'
import Link from 'next/link'
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
  Shield
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { usePermissions } from '@/hooks/use-permissions'

interface DashboardSidebarProps {
  user: {
    id: string
    role: string
    additional_permissions?: string[]
    organization?: {
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

  const navItems: NavItem[] = [
    {
      title: 'Overview',
      href: '/dashboard',
      icon: <BarChart3 className="h-4 w-4" />,
      permission: 'dashboard:view'
    },
    {
      title: 'Batch Management',
      href: '/dashboard/batches',
      icon: <Sprout className="h-4 w-4" />,
      permission: 'batch:view',
      children: [
        {
          title: 'Active Batches',
          href: '/dashboard/batches/active',
          icon: <Sprout className="h-4 w-4" />,
          permission: 'batch:view'
        },
        {
          title: 'Planning',
          href: '/dashboard/batches/planning',
          icon: <ClipboardList className="h-4 w-4" />,
          permission: 'batch:create'
        },
        {
          title: 'Harvest Queue',
          href: '/dashboard/batches/harvest',
          icon: <Package className="h-4 w-4" />,
          permission: 'batch:stage_change'
        }
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
          badge: '3' // TODO: Get actual count from real data
        },
        {
          title: 'Waste Tracking',
          href: '/dashboard/inventory/waste',
          icon: <Trash2 className="h-4 w-4" />,
          permission: 'inventory:waste'
        }
      ]
    },
    {
      title: 'Monitoring',
      href: '/dashboard/monitoring',
      icon: <Thermometer className="h-4 w-4" />,
      permission: 'monitoring:view',
      children: [
        {
          title: 'Fleet Overview',
          href: '/dashboard/monitoring',
          icon: <BarChart3 className="h-4 w-4" />,
          permission: 'monitoring:view'
        },
        {
          title: 'Alarms',
          href: '/dashboard/monitoring/alarms',
          icon: <AlertTriangle className="h-4 w-4" />,
          permission: 'alarm:view',
          badge: '2' // TODO: Get actual count from useAlarmSummary
        }
      ]
    },
    {
      title: 'Environmental Controls',
      href: '/dashboard/environmental',
      icon: <Settings className="h-4 w-4" />,
      permission: 'control:view',
      children: [
        {
          title: 'Recipes',
          href: '/dashboard/environmental/recipes',
          icon: <Settings className="h-4 w-4" />,
          permission: 'control:view'
        },
        {
          title: 'Schedules',
          href: '/dashboard/environmental/schedules',
          icon: <ClipboardList className="h-4 w-4" />,
          permission: 'control:view'
        }
      ]
    },
    {
      title: 'Tasks & Workflows',
      href: '/dashboard/tasks',
      icon: <ClipboardList className="h-4 w-4" />,
      permission: 'task:view',
      children: [
        {
          title: 'My Tasks',
          href: '/dashboard/tasks/assigned',
          icon: <ClipboardList className="h-4 w-4" />,
          permission: 'task:view'
        },
        {
          title: 'SOPs',
          href: '/dashboard/tasks/sops',
          icon: <FileText className="h-4 w-4" />,
          permission: 'task:view'
        },
        {
          title: 'Schedule',
          href: '/dashboard/tasks/schedule',
          icon: <ClipboardList className="h-4 w-4" />,
          permission: 'task:assign'
        }
      ]
    },
    {
      title: 'Waste Management',
      href: '/dashboard/waste',
      icon: <Trash2 className="h-4 w-4" />,
      permission: 'inventory:waste',
      children: [
        {
          title: 'Disposal Log',
          href: '/dashboard/waste/disposal',
          icon: <Trash2 className="h-4 w-4" />,
          permission: 'inventory:waste'
        },
        {
          title: 'Schedule Disposal',
          href: '/dashboard/waste/schedule',
          icon: <ClipboardList className="h-4 w-4" />,
          permission: 'inventory:waste'
        }
      ]
    },
    {
      title: 'Compliance',
      href: '/dashboard/compliance',
      icon: <Shield className="h-4 w-4" />,
      permission: 'compliance:view',
      children: [
        {
          title: 'Reports',
          href: '/dashboard/compliance/reports',
          icon: <FileText className="h-4 w-4" />,
          permission: 'compliance:view'
        },
        {
          title: 'Evidence Vault',
          href: '/dashboard/compliance/evidence',
          icon: <Shield className="h-4 w-4" />,
          permission: 'compliance:view'
        },
        {
          title: 'Audit Trail',
          href: '/dashboard/compliance/audit',
          icon: <FileText className="h-4 w-4" />,
          permission: 'audit:view'
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

  const renderNavItem = (item: NavItem, depth = 0) => {
    const isActive = pathname === item.href || 
      (item.children && item.children.some(child => pathname.startsWith(child.href)))
    const isExpanded = expanded[item.href] ?? false
    
    // Check permissions
    if (item.permission && !can(item.permission as PermissionKey)) {
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
                const firstChildHref = item.children?.[0]?.href
                if (firstChildHref) router.push(firstChildHref)
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
      {/* Logo/Branding */}
      <div className="flex h-16 items-center border-b px-6 bg-green-900">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold text-xl">
          <img
            src="/images/colorLogo.png"
            alt="Trazo Logo"
            className="h-10 w-10 object-contain dark:hidden"
          />
          <img
            src="/images/colorLogo.png"
            alt="Trazo Logo"
            className="h-10 w-10 object-contain hidden dark:block"
          />
            <span className="font-playfair text-[#E5F4EA] tracking-[0.09em] text-2xl md:text-3xl">TRAZO</span>
        </Link>
      </div>

      {/* Organization info */}
      <div className="border-b px-6 py-4 border-r border-border">
        <div className="text-sm font-medium">{user.organization?.name}</div>
        <div className="text-xs text-muted-foreground capitalize">
          {user.organization?.jurisdiction?.replace('_', ' ')} • {user.role?.replace('_', ' ')}
        </div>
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