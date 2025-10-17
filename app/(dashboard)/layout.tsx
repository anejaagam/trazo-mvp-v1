import { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardSidebar } from '@/components/dashboard/sidebar'
import { DashboardHeader } from '@/components/dashboard/header'
import { DashboardBreadcrumbs } from '@/components/dashboard/breadcrumbs'
import { Toaster } from '@/components/ui/toaster'

interface DashboardLayoutProps {
  children: ReactNode
}

export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Get user details including role and organization
  const { data: userDetails, error } = await supabase
    .from('users')
    .select(`
      *,
      organization:organizations(*)
    `)
    .eq('id', user.id)
    .single()

  if (error || !userDetails) {
    console.error('Error fetching user details:', error)
    redirect('/auth/login')
  }

  // Check if user has access to dashboard
  // TODO: Fix permission check with correct permission key
  // if (!RoleGuard.hasPermission(userDetails.role as any, 'dashboard:view')) {
  //   redirect('/unauthorized')
  // }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <DashboardSidebar 
        user={userDetails}
        className="hidden md:flex w-64 border-r border-border" 
      />
      
      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <DashboardHeader 
          user={userDetails}
          className="h-16 border-b border-border px-6" 
        />
        
        {/* Breadcrumbs */}
        <DashboardBreadcrumbs className="px-6 py-3 border-b border-border" />
        
        {/* Page content */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
      
      {/* Global toast notifications */}
      <Toaster />
    </div>
  )
}