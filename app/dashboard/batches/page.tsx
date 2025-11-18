import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BatchManagement } from '@/components/features/batches/batch-management'
import { canPerformAction } from '@/lib/rbac/guards'
import { isDevModeActive, DEV_MOCK_USER, logDevMode } from '@/lib/dev-mode'
import { getOrCreateDefaultSite } from '@/lib/supabase/queries/sites'
import type { JurisdictionId, PlantType } from '@/lib/jurisdiction/types'

export default async function BatchesPage() {
  let userRole: string
  let siteId: string
  let organizationId: string
  let userId: string
  let jurisdictionId: JurisdictionId | null = null
  let plantType: PlantType = 'cannabis'

  // DEV MODE: Use mock data
  if (isDevModeActive()) {
    logDevMode('Crop Management Page')
    userRole = DEV_MOCK_USER.role
    siteId = DEV_MOCK_USER.site_assignments[0].site_id
    organizationId = DEV_MOCK_USER.organization_id
    userId = DEV_MOCK_USER.id
    const devJurisdiction = (DEV_MOCK_USER as { jurisdiction?: JurisdictionId | null }).jurisdiction
    jurisdictionId = devJurisdiction ?? null
    const devPlantType = (DEV_MOCK_USER as { plant_type?: PlantType }).plant_type
    plantType = devPlantType ?? 'cannabis'
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
    if (!canPerformAction(userData.role, 'batch:view')) {
      redirect('/dashboard')
    }

    // Get site assignments
    const { data: siteAssignments } = await supabase
      .from('user_site_assignments')
      .select('site_id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .limit(1)

    userRole = userData.role
    organizationId = userData.organization_id
    userId = user.id

    const { data: org } = await supabase
      .from('organizations')
      .select('jurisdiction, plant_type')
      .eq('id', organizationId)
      .single()

    jurisdictionId = (org?.jurisdiction as JurisdictionId) || null
    plantType = (org?.plant_type as PlantType) || 'cannabis'
    
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
      <BatchManagement
        siteId={siteId}
        organizationId={organizationId}
        userId={userId}
        userRole={userRole}
        jurisdictionId={jurisdictionId}
        plantType={plantType}
      />
    </div>
  )
}
