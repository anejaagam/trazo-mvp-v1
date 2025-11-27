'use client'

import {
  Bell,
  Menu,
  User,
  Package,
  ClipboardList,
  FileCheck,
  BarChart3,
  Sprout,
  AlertTriangle,
  ExternalLink
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { LogoutButton } from '@/components/auth/logout-button'
import { ThemeSwitcher } from '@/components/theme-switcher'
import { SiteSelector } from '@/components/dashboard/site-selector'
import { useNotifications, useAlarms } from '@/hooks/use-alarms'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface DashboardHeaderProps {
  user: {
    id: string
    full_name: string
    email: string
    role: string
    organization?: {
      id?: string
      name: string
      jurisdiction: string
    }
  }
  className?: string
}

const navigationCategories = [
  { label: 'Crops', href: '/dashboard/batches', icon: Sprout },
  { label: 'Inventory', href: '/dashboard/inventory', icon: Package },
  { label: 'Tasks', href: '/dashboard/tasks', icon: ClipboardList },
  { label: 'Monitoring', href: '/dashboard/monitoring', icon: BarChart3 },
  { label: 'Compliance', href: '/dashboard/compliance', icon: FileCheck },
  { label: 'Alarms', href: '/dashboard/alarms', icon: AlertTriangle },
]

export function DashboardHeader({ user, className }: DashboardHeaderProps) {
  const [organizationId, setOrganizationId] = useState<string>('')

  // Fetch organization ID
  useEffect(() => {
    const fetchOrgId = async () => {
      if (user.organization?.id) {
        setOrganizationId(user.organization.id)
        return
      }

      const supabase = createClient()
      const { data } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', user.id)
        .single()

      if (data?.organization_id) {
        setOrganizationId(data.organization_id)
      }
    }

    fetchOrgId()
  }, [user.id, user.organization?.id])

  // Use hooks to get real-time counts
  const { activeCount: alarmCount } = useAlarms({
    realtime: true,
    status: 'active',
  })

  const { unreadCount: notificationCount, notifications } = useNotifications({
    userId: user.id,
    organizationId,
    limit: 3,
    unreadOnly: true,
    realtime: true,
  })

  const totalCount = alarmCount + notificationCount

  return (
    <header className={`${className} bg-green-900`}>
      <div className="relative flex items-center justify-between h-16 pl-6 pr-0">
        {/* Left: Site Selector */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="lg:hidden text-white hover:bg-white/10">
            <Menu className="h-5 w-5" />
          </Button>

          {/* Site Selector */}
          <div className="border-l border-white/20 pl-4 ml-2">
            <SiteSelector className="text-white hover:bg-white/10 !bg-[rgba(255,255,255,0.08)] dark:!bg-[rgba(255,255,255,0.08)] dark:hover:!bg-[rgba(255,255,255,0.15)]" />
          </div>
        </div>

        {/* Center: Navigation - offset to account for sidebar */}
        <nav className="hidden lg:flex items-center gap-2 absolute left-[calc(50%-120px)] -translate-x-1/2">
          {navigationCategories.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white/90 hover:text-white bg-white/5 hover:bg-white/15 gap-2 px-4 py-2 rounded-lg transition-all duration-200 border border-white/10 hover:border-white/25"
                >
                  <Icon className="h-4 w-4" />
                  <span className="font-medium">{item.label}</span>
                </Button>
              </Link>
            )
          })}
        </nav>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 ml-auto -mr-4">
          <div className="flex items-center gap-2 -ml-3">
            <ThemeSwitcher />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white/90 hover:text-white hover:bg-white/15 gap-2 px-4 py-2 rounded-lg transition-all duration-200 border border-transparent hover:border-white/20"
                >
                  <Bell className="h-7 w-7" />
                  {totalCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-red-500 border-0 text-[10px]">
                      {totalCount > 9 ? '9+' : totalCount}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel className="flex items-center justify-between">
                <span>Notifications</span>
                {totalCount > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {totalCount}
                  </Badge>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />

              {alarmCount > 0 && (
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/alarms" className="flex items-center gap-2 py-3 cursor-pointer">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <div className="flex-1">
                      <div className="font-medium text-red-600">{alarmCount} Active Alarm{alarmCount !== 1 ? 's' : ''}</div>
                      <div className="text-xs text-muted-foreground">Requires immediate attention</div>
                    </div>
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </DropdownMenuItem>
              )}

              {notifications.slice(0, 3).map((notification) => {
                const isHighUrgency = notification.urgency === 'high' || notification.severity === 'critical';
                const isMediumUrgency = notification.urgency === 'medium' || notification.severity === 'warning';
                
                return (
                  <DropdownMenuItem key={notification.id} asChild>
                    <Link
                      href={notification.link_url || '/dashboard/alarms'}
                      className={`flex flex-col items-start gap-2 py-3 px-3 cursor-pointer relative overflow-hidden ${
                        !notification.read_at && isHighUrgency
                          ? 'bg-gradient-to-r from-red-50 to-orange-50 border-l-4 border-red-500'
                          : !notification.read_at && isMediumUrgency
                            ? 'bg-gradient-to-r from-yellow-50 to-amber-50 border-l-4 border-yellow-500'
                            : !notification.read_at
                              ? 'bg-blue-50/50 border-l-4 border-blue-500'
                              : ''
                      }`}
                    >
                      <div className={`font-semibold text-sm ${
                        !notification.read_at && isHighUrgency ? 'text-red-900' :
                        !notification.read_at && isMediumUrgency ? 'text-yellow-900' :
                        'text-foreground'
                      }`}>
                        {notification.message.split('\n')[0]}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge 
                          variant={isHighUrgency ? 'destructive' : 'outline'} 
                          className={`text-xs capitalize ${
                            isHighUrgency 
                              ? 'bg-red-600 text-white border-red-700' 
                              : isMediumUrgency
                                ? 'bg-yellow-100 text-yellow-900 border-yellow-400'
                                : ''
                          }`}
                        >
                          {notification.category}
                        </Badge>
                        {(notification.urgency || notification.severity) && (
                          <Badge 
                            variant="secondary" 
                            className={`text-xs uppercase font-semibold ${
                              isHighUrgency ? 'bg-red-100 text-red-800' :
                              isMediumUrgency ? 'bg-yellow-100 text-yellow-800' :
                              'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {notification.urgency || notification.severity}
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {new Date(notification.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                );
              })}

              {totalCount === 0 && (
                <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                  No new notifications
                </div>
              )}

              {totalCount > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link
                      href="/dashboard/alarms"
                      className="w-full text-center py-2 cursor-pointer font-medium"
                    >
                      View All Notifications →
                    </Link>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="text-white hover:bg-white/10 gap-1.5 h-9 !bg-transparent dark:!bg-transparent dark:hover:!bg-white/10 rounded-md px-2"
                >
                  <div className="h-7 w-7 rounded-full bg-white/20 flex items-center justify-center">
                    <User className="h-4 w-4" />
                  </div>
                  <div className="hidden xl:block text-left">
                    <div className="text-sm font-medium leading-none">{user.full_name}</div>
                    <div className="text-xs text-white/60 mt-0.5 capitalize">
                      {user.role.replace('_', ' ')}
                    </div>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Profile Settings</DropdownMenuItem>
                <DropdownMenuItem>Preferences</DropdownMenuItem>
                <DropdownMenuItem>Help & Support</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <LogoutButton />
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  )
}