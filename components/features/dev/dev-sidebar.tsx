'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { 
  LayoutDashboard, 
  AlertTriangle, 
  Building2, 
  Users, 
  ScrollText,
  LogOut,
  Terminal,
  Settings
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { logDevAction, DEV_AUDIT_ACTIONS } from '@/lib/dev-audit'

interface DevSidebarProps {
  developerId: string
  developerName: string
  developerEmail: string
  pendingCount?: number
  errorCount?: number
}

const navItems = [
  {
    title: 'Overview',
    href: '/dev-dashboard',
    icon: LayoutDashboard,
    exact: true,
  },
  {
    title: 'Errors',
    href: '/dev-dashboard/errors',
    icon: AlertTriangle,
    badge: 'errorCount',
  },
  {
    title: 'Approvals',
    href: '/dev-dashboard/approvals',
    icon: Building2,
    badge: 'pendingCount',
  },
  {
    title: 'Users',
    href: '/dev-dashboard/users',
    icon: Users,
  },
  {
    title: 'Audit Logs',
    href: '/dev-dashboard/logs',
    icon: ScrollText,
  },
]

export function DevSidebar({
  developerId,
  developerName,
  developerEmail,
  pendingCount = 0,
  errorCount = 0,
}: DevSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    
    // Log the logout action
    await logDevAction({
      developerId,
      action: DEV_AUDIT_ACTIONS.DEV_LOGOUT,
      metadata: { logged_out_at: new Date().toISOString() },
    })
    
    await supabase.auth.signOut()
    router.push('/dev-auth/login')
    router.refresh()
  }

  const isActive = (item: typeof navItems[0]) => {
    if (item.exact) {
      return pathname === item.href
    }
    return pathname.startsWith(item.href)
  }

  const getBadgeCount = (badgeKey?: string) => {
    if (badgeKey === 'pendingCount') return pendingCount
    if (badgeKey === 'errorCount') return errorCount
    return 0
  }

  return (
    <div className="flex h-full w-64 flex-col border-r border-purple-200 bg-gradient-to-b from-purple-50 to-white dark:border-purple-800 dark:from-purple-950 dark:to-slate-900">
      {/* Header */}
      <div className="flex h-16 items-center gap-2 border-b border-purple-200 px-4 dark:border-purple-800">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-600">
          <Terminal className="h-4 w-4 text-white" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-gray-900 dark:text-white">TRAZO Dev</span>
          <span className="text-xs text-muted-foreground">Dashboard</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item)
          const badgeCount = item.badge ? getBadgeCount(item.badge) : 0

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-purple-100 text-purple-900 dark:bg-purple-900/40 dark:text-purple-100'
                  : 'text-gray-700 hover:bg-purple-50 dark:text-gray-300 dark:hover:bg-purple-900/20'
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="flex-1">{item.title}</span>
              {badgeCount > 0 && (
                <Badge
                  variant={item.badge === 'errorCount' ? 'destructive' : 'secondary'}
                  className={cn(
                    'ml-auto h-5 min-w-[20px] px-1.5 text-xs',
                    item.badge === 'errorCount' && 'bg-red-500 text-white'
                  )}
                >
                  {badgeCount > 99 ? '99+' : badgeCount}
                </Badge>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Settings Link */}
      <div className="border-t border-purple-200 p-4 dark:border-purple-800">
        <Link
          href="/dev-dashboard/settings"
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
            pathname === '/dev-dashboard/settings'
              ? 'bg-purple-100 text-purple-900 dark:bg-purple-900/40 dark:text-purple-100'
              : 'text-gray-700 hover:bg-purple-50 dark:text-gray-300 dark:hover:bg-purple-900/20'
          )}
        >
          <Settings className="h-4 w-4" />
          <span>Settings</span>
        </Link>
      </div>

      {/* User Section */}
      <div className="border-t border-purple-200 p-4 dark:border-purple-800">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-200 text-sm font-medium text-purple-700 dark:bg-purple-800 dark:text-purple-300">
            {developerName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
              {developerName}
            </p>
            <p className="truncate text-xs text-muted-foreground">{developerEmail}</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2 border-purple-200 text-gray-700 hover:bg-purple-50 dark:border-purple-800 dark:text-gray-300 dark:hover:bg-purple-900/20"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  )
}
