import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { canPerformAction } from '@/lib/rbac/guards'
import { isDevModeActive, DEV_MOCK_USER, logDevMode } from '@/lib/dev-mode'
import { getOrCreateDefaultSite } from '@/lib/supabase/queries/sites'
import { HarvestClient } from './harvest-client'

export default async function HarvestQueuePage() {
  let userId: string
  let organizationId: string
  let siteId: string

  if (isDevModeActive()) {
    logDevMode('Harvest Queue Page')
    if (!canPerformAction(DEV_MOCK_USER.role, 'batch:stage_change')) {
      redirect('/dashboard')
    }
    userId = DEV_MOCK_USER.id
    organizationId = DEV_MOCK_USER.organization_id
    siteId = DEV_MOCK_USER.site_assignments[0].site_id
  } else {
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
    if (!canPerformAction(userData.role, 'batch:stage_change')) {
      redirect('/dashboard')
    }

    // Get site assignments
    const { data: siteAssignments } = await supabase
      .from('user_site_assignments')
      .select('site_id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .limit(1)

    userId = user.id
    organizationId = userData.organization_id

    // Get site_id from user_site_assignments or get/create default site
    if (siteAssignments?.[0]?.site_id) {
      siteId = siteAssignments[0].site_id
    } else {
      const { data: defaultSiteId } = await getOrCreateDefaultSite(organizationId)
      siteId = defaultSiteId || organizationId
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Harvest Queue</h1>
        <p className="text-muted-foreground">
          Manage batches ready for harvest and post-harvest processing
        </p>
      </div>

      <HarvestClient
        userId={userId}
        organizationId={organizationId}
        siteId={siteId}
      />
    </div>
  )
}
