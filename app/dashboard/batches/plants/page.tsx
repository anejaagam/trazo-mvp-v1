import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PlantList } from '@/components/features/plants/plant-list'
import { canPerformAction } from '@/lib/rbac/guards'
import { isDevModeActive, DEV_MOCK_USER, logDevMode } from '@/lib/dev-mode'
import { getOrCreateDefaultSite } from '@/lib/supabase/queries/sites'
import { getServerSiteId } from '@/lib/site/server'

export default async function PlantsPage() {
  let userRole: string
  let siteId: string
  let organizationId: string
  let userId: string

  if (isDevModeActive()) {
    logDevMode('Plants Page')
    userRole = DEV_MOCK_USER.role
    siteId = DEV_MOCK_USER.site_assignments[0].site_id
    organizationId = DEV_MOCK_USER.organization_id
    userId = DEV_MOCK_USER.id
  } else {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      redirect('/auth/login')
    }

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, organization_id')
      .eq('id', user.id)
      .single()

    if (!userData || userError) {
      redirect('/auth/login')
    }

    if (!canPerformAction(userData.role, 'batch:view')) {
      redirect('/dashboard')
    }

    userRole = userData.role
    organizationId = userData.organization_id
    userId = user.id

    // Get site_id from site context (cookie-based)
    const contextSiteId = await getServerSiteId()
    if (contextSiteId && contextSiteId !== 'all') {
      siteId = contextSiteId
    } else {
      // Fallback: First try user's site assignment, then default site
      const { data: siteAssignment } = await supabase
        .from('user_site_assignments')
        .select('site_id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .limit(1)
        .single()

      if (siteAssignment?.site_id) {
        siteId = siteAssignment.site_id
      } else {
        const { data: defaultSiteId } = await getOrCreateDefaultSite(organizationId)
        siteId = defaultSiteId || organizationId
      }
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Individual Plants</h1>
        <p className="text-muted-foreground">
          Track and manage individual Metrc-tagged plants across growth phases
        </p>
      </div>

      <PlantList
        siteId={siteId}
        organizationId={organizationId}
        userId={userId}
        userRole={userRole}
      />
    </div>
  )
}
