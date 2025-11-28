import { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardSidebar } from '@/components/dashboard/sidebar'
import { DashboardHeader } from '@/components/dashboard/header'
import { DashboardBreadcrumbs } from '@/components/dashboard/breadcrumbs'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as SonnerToaster } from 'sonner'
import { isDevModeActive, DEV_MOCK_USER, DEV_MODE_BANNER, logDevMode } from '@/lib/dev-mode'
import { SiteClientWrapper } from './site-client-wrapper'
import { getServerSiteContext } from '@/lib/site/server'
import type { ServerSiteContext } from '@/lib/site/types'

interface DashboardLayoutProps {
  children: ReactNode
}

export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  // DEV MODE: Skip authentication if enabled
  if (isDevModeActive()) {
    logDevMode('Dashboard Layout')
    
    return (
      <div className="flex h-screen bg-background">
        {/* Dev mode banner */}
        <div className={DEV_MODE_BANNER.className} style={DEV_MODE_BANNER.style}>
          {DEV_MODE_BANNER.text}
        </div>
        
        {/* Sidebar */}
        <DashboardSidebar 
          user={DEV_MOCK_USER}
          className="hidden md:flex w-64 border-r border-border mt-10" 
        />
        
        {/* Main content area */}
        <div className="flex-1 flex flex-col overflow-hidden mt-10">
          {/* Header */}
          <DashboardHeader 
            user={DEV_MOCK_USER}
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
        <SonnerToaster position="top-right" />
      </div>
    )
  }

  // PRODUCTION MODE: Normal authentication flow
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
      organization:organizations!users_organization_id_fkey(*)
    `)
    .eq('id', user.id)
    .single()

  if (error || !userDetails) {
    console.error('Error fetching user details:', error)
    redirect('/auth/login')
  }

  // Check if org_admin needs to complete onboarding
  // This blocks ALL dashboard access until onboarding is complete
  if (userDetails.role === 'org_admin') {
    const org = userDetails.organization as { onboarding_completed?: boolean; id?: string } | null
    
    // If organization exists but onboarding is not completed, redirect
    if (org && org.onboarding_completed !== true) {
      console.log('Org admin has not completed onboarding, redirecting...', {
        orgId: org.id,
        onboarding_completed: org.onboarding_completed
      })
      redirect('/onboarding')
    }
    
    // If no organization found for org_admin, something is wrong
    if (!org) {
      console.error('No organization found for org_admin:', userDetails.id)
      redirect('/auth/login')
    }
  }

  // Check if user has access to dashboard
  // TODO: Fix permission check with correct permission key
  // if (!RoleGuard.hasPermission(userDetails.role as any, 'dashboard:view')) {
  //   redirect('/unauthorized')
  // }

  // Get site context for the user
  const siteContext = await getServerSiteContext(
    user.id,
    userDetails.role,
    userDetails.organization_id
  )

  return (
    <SiteClientWrapper siteContext={siteContext}>
      <div className="flex h-screen bg-background">
        {/* Sidebar */}
        <DashboardSidebar
          user={userDetails}
          className="hidden md:flex w-64"
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
        <SonnerToaster position="top-right" />
      </div>
    </SiteClientWrapper>
  )
}