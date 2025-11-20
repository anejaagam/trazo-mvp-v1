import { redirect } from 'next/navigation'
import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { canPerformAction } from '@/lib/rbac/guards'
import { isDevModeActive, DEV_MOCK_USER, logDevMode } from '@/lib/dev-mode'
import { getOrCreateDefaultSite } from '@/lib/supabase/queries/sites'
import { FleetMonitoringDashboard } from '@/components/features/monitoring/fleet-monitoring-dashboard'
import { NotificationsPanel } from '@/components/features/monitoring/notifications-panel'

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
    
    // IMPORTANT FIX: org_admin users should see ALL pods across ALL sites in their organization
    if (userRole === 'org_admin') {
      useOrgLevel = true
      siteId = null // Don't limit to one site for org admins
      logDevMode('org_admin detected - fetching all organization pods')
    } else {
      // For non-org_admin users, get their site assignments
      const { data: siteAssignments } = await supabase
        .from('user_site_assignments')
        .select('site_id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .limit(1)

      // Get site_id from user_site_assignments or get/create default site
      if (siteAssignments?.[0]?.site_id) {
        siteId = siteAssignments[0].site_id
      } else {
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
        <NotificationsPanel userId={userId} />
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
