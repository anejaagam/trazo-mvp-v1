import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { canPerformAction } from '@/lib/rbac/guards'
import { WasteDetailsPage } from '@/components/features/waste/waste-details-page'
import { isDevModeActive, DEV_MOCK_USER, logDevMode } from '@/lib/dev-mode'
import { getOrCreateDefaultSite } from '@/lib/supabase/queries/sites'

export default async function WasteLogDetailPage({
  params,
}: {
  params: { id: string }
}) {
  let userRole: string
  let siteId: string
  let userId: string

  // Check for dev mode first
  if (isDevModeActive()) {
    logDevMode('Waste Detail Page')
    userId = DEV_MOCK_USER.id
    userRole = DEV_MOCK_USER.role
    siteId = DEV_MOCK_USER.site_assignments[0]?.site_id || ''
    
    return (
      <WasteDetailsPage
        wasteLogId={params.id}
        userId={userId}
        userRole={userRole}
        siteId={siteId}
      />
    )
  }

  // PRODUCTION MODE: Get actual user data
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Get user data with role
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('role, organization_id')
    .eq('id', user.id)
    .single()

  if (!userData || userError) {
    redirect('/auth/login')
  }

  // Check if user has permission to view waste logs
  if (!canPerformAction(userData.role, 'waste:view')) {
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
  userRole = userData.role

  // Get site_id from user_site_assignments or get/create default site
  if (siteAssignments?.[0]?.site_id) {
    siteId = siteAssignments[0].site_id
  } else {
    const { data: defaultSiteId } = await getOrCreateDefaultSite(userData.organization_id)
    siteId = defaultSiteId || userData.organization_id
  }

  return (
    <WasteDetailsPage
      wasteLogId={params.id}
      userId={userId}
      userRole={userRole}
      siteId={siteId}
    />
  )
}
