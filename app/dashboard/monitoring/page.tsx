import { redirect } from 'next/navigation'
import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { canPerformAction } from '@/lib/rbac/guards'
import { isDevModeActive, DEV_MOCK_USER, logDevMode } from '@/lib/dev-mode'
import { getOrCreateDefaultSite } from '@/lib/supabase/queries/sites'
import { getServerSiteId } from '@/lib/site/server'
import { ALL_SITES_ID } from '@/lib/site/types'
import { FleetMonitoringDashboard } from '@/components/features/monitoring/fleet-monitoring-dashboard'
import { MonitoringAlarmsPanel } from '@/components/features/monitoring/monitoring-alarms-panel'

export const metadata: Metadata = {
  title: 'Fleet Monitoring | TRAZO',
  description: 'Real-time environmental monitoring for all cultivation pods',
}

export default async function MonitoringPage() {
  let userRole: string
  let siteId: string | null = null
  let organizationId: string
  let userId: string
  let useOrgLevel = false // Flag to determine if we should show all org pods

  // DEV MODE: Use mock data
  if (isDevModeActive()) {
    logDevMode('Fleet Monitoring Page')
    userRole = DEV_MOCK_USER.role
    siteId = DEV_MOCK_USER.site_assignments[0].site_id
    organizationId = DEV_MOCK_USER.organization_id
    userId = DEV_MOCK_USER.id
    useOrgLevel = userRole === 'org_admin'
  } else {
    // PRODUCTION MODE: Get actual user data
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      redirect('/auth/login')
    }

    // Get user data
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, organization_id')
      .eq('id', user.id)
      .single()

    if (!userData || userError) {
      redirect('/auth/login')
    }

    // Check permission
    if (!canPerformAction(userData.role, 'monitoring:view')) {
      redirect('/dashboard')
    }

    userRole = userData.role
    organizationId = userData.organization_id
    userId = user.id

    // Get site_id from site context (cookie-based)
    const contextSiteId = await getServerSiteId()

    // Check if user is in "All Sites" mode (only org_admin can use this)
    if (contextSiteId === ALL_SITES_ID && userRole === 'org_admin') {
      useOrgLevel = true
      siteId = null // Show all pods across all sites
    } else if (userRole === 'org_admin' && contextSiteId && contextSiteId !== ALL_SITES_ID) {
      // org_admin with a specific site selected
      siteId = contextSiteId
    } else {
      // Non-org_admin: Always use their default_site_id, ignore cookie
      const { data: userSiteData } = await supabase
        .from('users')
        .select('default_site_id')
        .eq('id', user.id)
        .single()
      
      if (userSiteData?.default_site_id) {
        siteId = userSiteData.default_site_id
      } else {
        // Fallback to default site creation
        const { data: defaultSiteId } = await getOrCreateDefaultSite(organizationId)
        siteId = defaultSiteId || organizationId
      }
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fleet Monitoring</h1>
          <p className="text-muted-foreground mt-1">
            Real-time environmental conditions across all cultivation pods
          </p>
        </div>
        <MonitoringAlarmsPanel siteId={siteId} />
      </div>

      <FleetMonitoringDashboard
        siteId={siteId}
        organizationId={useOrgLevel ? organizationId : undefined}
        userRole={userRole}
        userId={userId}
      />
    </div>
  )
}
