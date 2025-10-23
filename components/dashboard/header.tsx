'use client'

import { 
  Bell, 
  Menu, 
  User,
  Package,
  ClipboardList,
  Thermometer,
  FileCheck,
  BarChart3,
  Sprout,
  AlertTriangle
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
import { GlobalSearch } from '@/components/dashboard/global-search'
import Link from 'next/link'

interface DashboardHeaderProps {
  user: {
    id: string
    full_name: string
    email: string
    role: string
    organization?: {
      name: string
      jurisdiction: string
    }
  }
  className?: string
}

const navigationCategories = [
  { label: 'Batches', href: '/dashboard/batches', icon: Sprout },
  { label: 'Inventory', href: '/dashboard/inventory', icon: Package },
  { label: 'Tasks', href: '/dashboard/tasks', icon: ClipboardList },
  { label: 'Environmental', href: '/dashboard/environmental', icon: Thermometer },
  { label: 'Monitoring', href: '/dashboard/monitoring', icon: BarChart3 },
  { label: 'Compliance', href: '/dashboard/compliance', icon: FileCheck },
  { label: 'Alarms', href: '/dashboard/alarms', icon: AlertTriangle },
]

export function DashboardHeader({ user, className }: DashboardHeaderProps) {
  return (
    <header className={`${className} bg-green-900`}>
      <div className="relative flex items-center justify-between h-16 pl-6 pr-0">
        {/* Left: Search */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="lg:hidden text-white hover:bg-white/10">
            <Menu className="h-5 w-5" />
          </Button>
          
          <div className="hidden md:block">
            <GlobalSearch />
          </div>
        </div>

        {/* Center: Navigation */}
        <nav className="hidden lg:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
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
                  className="text-white/80 hover:text-white hover:bg-white/10 gap-2 !bg-[rgba(255,255,255,0.08)] dark:!bg-[rgba(255,255,255,0.08)] dark:hover:!bg-[rgba(255,255,255,0.15)]"
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Button>
              </Link>
            )
          })}
        </nav>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 -mr-4">
          <ThemeSwitcher />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="relative text-white hover:bg-white/10 !bg-[rgba(255,255,255,0.08)] dark:!bg-[rgba(255,255,255,0.08)] dark:hover:!bg-[rgba(255,255,255,0.15)]"
              >
                <Bell className="h-7 w-7" />
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-red-500 border-0 text-[10px]">
                  3
                </Badge>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="flex flex-col items-start gap-1 py-3">
                <div className="font-medium">High Temperature Alert</div>
                <div className="text-sm text-muted-foreground">Pod 12 exceeded 85°F</div>
                <div className="text-xs text-muted-foreground">2 min ago</div>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex flex-col items-start gap-1 py-3">
                <div className="font-medium">Low Stock Alert</div>
                <div className="text-sm text-muted-foreground">CO2 below threshold</div>
                <div className="text-xs text-muted-foreground">1 hour ago</div>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex flex-col items-start gap-1 py-3">
                <div className="font-medium">Task Due Soon</div>
                <div className="text-sm text-muted-foreground">Cleaning checklist due in 2h</div>
                <div className="text-xs text-muted-foreground">3 hours ago</div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="text-white hover:bg-white/10 gap-2 h-9 !bg-transparent dark:!bg-transparent dark:hover:!bg-white/10"
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
    </header>
  )
}