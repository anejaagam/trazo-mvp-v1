import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LabTestsDashboard } from '@/components/features/lab-tests/lab-tests-dashboard'
import { canPerformAction } from '@/lib/rbac/guards'
import { isDevModeActive, DEV_MOCK_USER, logDevMode } from '@/lib/dev-mode'
import { getOrCreateDefaultSite } from '@/lib/supabase/queries/sites'

export default async function LabTestsPage() {
  let userRole: string
  let siteId: string
  let organizationId: string
  let userId: string

  // DEV MODE: Use mock data
  if (isDevModeActive()) {
    logDevMode('Lab Tests Page')
    userRole = DEV_MOCK_USER.role
    siteId = DEV_MOCK_USER.site_assignments[0].site_id
    organizationId = DEV_MOCK_USER.organization_id
    userId = DEV_MOCK_USER.id
  } else {
    // PRODUCTION MODE: Get actual user data
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      redirect('/login')
    }

    userId = user.id

    // Get user's organization and role
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('organization_id, role')
      .eq('id', user.id)
      .single()

    if (userError || !userData || !userData.organization_id) {
      console.error('Error fetching user data:', userError)
      redirect('/onboarding')
    }

    organizationId = userData.organization_id
    userRole = userData.role

    // Get or create default site
    const { data: defaultSite, error: siteError } = await getOrCreateDefaultSite(
      organizationId
    )

    if (siteError || !defaultSite) {
      console.error('Error getting/creating default site:', siteError)
      redirect('/dashboard')
    }

    siteId = defaultSite.id
  }

  // Check permissions
  const canView = canPerformAction(userRole as any, 'compliance:view').allowed
  if (!canView) {
    redirect('/dashboard')
  }

  return (
    <LabTestsDashboard
      organizationId={organizationId}
      siteId={siteId}
      userId={userId}
      userRole={userRole}
    />
  )
}