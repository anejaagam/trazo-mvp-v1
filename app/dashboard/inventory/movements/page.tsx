import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { canPerformAction } from '@/lib/rbac/guards'
import { MovementsLog } from '@/components/features/inventory/movements-log'
import { isDevModeActive, DEV_MOCK_USER, logDevMode } from '@/lib/dev-mode'
import { getOrCreateDefaultSite } from '@/lib/supabase/queries/sites'

export default async function InventoryMovementsPage() {
  let userRole: string
  let siteId: string
  let organizationId: string

  // DEV MODE: Use mock data
  if (isDevModeActive()) {
    logDevMode('Inventory Movements Page')
    userRole = DEV_MOCK_USER.role
    organizationId = DEV_MOCK_USER.organization_id
    siteId = DEV_MOCK_USER.site_assignments[0].site_id
  } else {
    // PRODUCTION MODE: Get actual user data
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      redirect('/auth/login')
    }

    // First, get the basic user data
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, organization_id')
      .eq('id', user.id)
      .single()

    if (!userData || userError) {
      redirect('/auth/login')
    }

    // Check permission
    if (!canPerformAction(userData.role, 'inventory:view')) {
      redirect('/dashboard')
    }

    // Then get site assignments separately
    const { data: siteAssignments } = await supabase
      .from('user_site_assignments')
      .select('site_id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .limit(1)

    userRole = userData.role
    organizationId = userData.organization_id
    
    // Get site_id from user_site_assignments or get/create default site
    if (siteAssignments?.[0]?.site_id) {
      siteId = siteAssignments[0].site_id
    } else {
      // No site assignment, get or create a default site for the organization
      const { data: defaultSiteId } = await getOrCreateDefaultSite(organizationId)
      siteId = defaultSiteId || organizationId
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Inventory Movements</h1>
          <p className="text-muted-foreground mt-2">
            Track all inventory transactions and movements
          </p>
        </div>
      </div>

      <MovementsLog
        organizationId={organizationId}
        siteId={siteId}
        userRole={userRole}
      />
    </div>
  )
}
