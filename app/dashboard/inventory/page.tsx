import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { InventoryDashboard } from '@/components/features/inventory/inventory-dashboard'
import { canPerformAction } from '@/lib/rbac/guards'
import { isDevModeActive, DEV_MOCK_USER, logDevMode } from '@/lib/dev-mode'

export default async function InventoryOverviewPage() {
  let userRole: string
  let siteId: string
  let organizationId: string
  let userId: string

  // DEV MODE: Use mock data
  if (isDevModeActive()) {
    logDevMode('Inventory Overview Page')
    userRole = DEV_MOCK_USER.role
    siteId = DEV_MOCK_USER.site_assignments[0].site_id // Mock site ID
    organizationId = DEV_MOCK_USER.organization_id // Mock organization ID
    userId = DEV_MOCK_USER.id // Mock user ID
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
    userId = user.id
    
    // Get site_id from user_site_assignments or fall back to organization_id
    siteId = siteAssignments?.[0]?.site_id || organizationId
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Inventory Overview</h1>
        <p className="text-muted-foreground">
          Monitor stock levels, alerts, and recent activity
        </p>
      </div>

      <InventoryDashboard
        siteId={siteId}
        userRole={userRole}
        organizationId={organizationId}
        userId={userId}
      />
    </div>
  )
}
