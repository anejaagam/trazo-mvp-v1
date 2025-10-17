'use client'

import { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
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
  const { can } = usePermissions(user.role as RoleKey, user.additional_permissions || [])

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
          permission: 'batch:harvest'
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
          title: 'Current Stock',
          href: '/dashboard/inventory/stock',
          icon: <Package className="h-4 w-4" />,
          permission: 'inventory:view'
        },
        {
          title: 'Receiving',
          href: '/dashboard/inventory/receiving',
          icon: <Package className="h-4 w-4" />,
          permission: 'inventory:receive'
        },
        {
          title: 'Low Stock Alerts',
          href: '/dashboard/inventory/alerts',
          icon: <AlertTriangle className="h-4 w-4" />,
          permission: 'inventory:view',
          badge: '3' // TODO: Get actual count
        }
      ]
    },
    {
      title: 'Environmental Controls',
      href: '/dashboard/environmental',
      icon: <Thermometer className="h-4 w-4" />,
      permission: 'environmental:view',
      children: [
        {
          title: 'Live Monitoring',
          href: '/dashboard/environmental/monitoring',
          icon: <Thermometer className="h-4 w-4" />,
          permission: 'environmental:view'
        },
        {
          title: 'Recipes',
          href: '/dashboard/environmental/recipes',
          icon: <Settings className="h-4 w-4" />,
          permission: 'environmental:recipes:view'
        },
        {
          title: 'Alarms',
          href: '/dashboard/environmental/alarms',
          icon: <AlertTriangle className="h-4 w-4" />,
          permission: 'alarms:view',
          badge: '2' // TODO: Get actual count
        }
      ]
    },
    {
      title: 'Tasks & Workflows',
      href: '/dashboard/tasks',
      icon: <ClipboardList className="h-4 w-4" />,
      permission: 'tasks:view',
      children: [
        {
          title: 'My Tasks',
          href: '/dashboard/tasks/assigned',
          icon: <ClipboardList className="h-4 w-4" />,
          permission: 'tasks:view'
        },
        {
          title: 'SOPs',
          href: '/dashboard/tasks/sops',
          icon: <FileText className="h-4 w-4" />,
          permission: 'sops:view'
        },
        {
          title: 'Schedule',
          href: '/dashboard/tasks/schedule',
          icon: <ClipboardList className="h-4 w-4" />,
          permission: 'tasks:schedule'
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
          title: 'Disposal Log',
          href: '/dashboard/waste/disposal',
          icon: <Trash2 className="h-4 w-4" />,
          permission: 'waste:view'
        },
        {
          title: 'Schedule Disposal',
          href: '/dashboard/waste/schedule',
          icon: <ClipboardList className="h-4 w-4" />,
          permission: 'waste:create'
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
          permission: 'compliance:reports:view'
        },
        {
          title: 'Evidence Vault',
          href: '/dashboard/compliance/evidence',
          icon: <Shield className="h-4 w-4" />,
          permission: 'compliance:evidence:view'
        },
        {
          title: 'Audit Trail',
          href: '/dashboard/compliance/audit',
          icon: <FileText className="h-4 w-4" />,
          permission: 'compliance:audit:view'
        }
      ]
    }
  ]

  // Add admin-only navigation items
  if (can('user:view') || can('org:settings')) {
    navItems.push({
      title: 'Administration',
      href: '/dashboard/admin',
      icon: <Settings className="h-4 w-4" />,
      permission: 'users:view',
      children: [
        {
          title: 'Users & Roles',
          href: '/dashboard/admin/users',
          icon: <Users className="h-4 w-4" />,
          permission: 'user:view'
        },
        {
          title: 'Organization',
          href: '/dashboard/admin/organization',
          icon: <Building2 className="h-4 w-4" />,
          permission: 'org:settings'
        },
        {
          title: 'System Settings',
          href: '/dashboard/admin/settings',
          icon: <Settings className="h-4 w-4" />,
          permission: 'system:configure'
        }
      ]
    })
  }

  const renderNavItem = (item: NavItem, depth = 0) => {
    const isActive = pathname === item.href || 
      (item.children && item.children.some(child => pathname.startsWith(child.href)))
    
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
          <Badge variant="secondary" className="ml-auto h-5 w-5 p-0 text-xs">
            {item.badge}
          </Badge>
        )}
      </div>
    )

    return (
      <div key={item.href}>
        {item.children ? (
          <div className="space-y-1">
            <div className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium',
              isActive && 'bg-accent text-accent-foreground'
            )}>
              {item.icon}
              <span className="flex-1">{item.title}</span>
              {item.badge && (
                <Badge variant="secondary" className="ml-auto h-5 w-5 p-0 text-xs">
                  {item.badge}
                </Badge>
              )}
            </div>
            <div className="space-y-1">
              {item.children.map(child => renderNavItem(child, depth + 1))}
            </div>
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
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <Building2 className="h-6 w-6" />
          <span>Trazo</span>
        </Link>
      </div>

      {/* Organization info */}
      <div className="border-b px-6 py-4">
        <div className="text-sm font-medium">{user.organization?.name}</div>
        <div className="text-xs text-muted-foreground capitalize">
          {user.organization?.jurisdiction?.replace('_', ' ')} • {user.role?.replace('_', ' ')}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-auto p-4">
        <div className="space-y-2">
          {navItems.map(item => renderNavItem(item))}
        </div>
      </nav>

      {/* Footer */}
      <div className="border-t p-4">
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