/**
 * Inventory Movements Log Page
 * 
 * Displays comprehensive filterable history of all inventory movements
 */

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { canPerformAction } from '@/lib/rbac/guards'
import { MovementsLog } from '@/components/features/inventory/movements-log'
import { isDevModeActive, DEV_MOCK_USER, logDevMode } from '@/lib/dev-mode'

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

    const { data: userData } = await supabase
      .from('users')
      .select('role, organization_id, site_id')
      .eq('id', user.id)
      .single()

    if (!userData) {
      redirect('/auth/login')
    }

    // Check permission
    if (!canPerformAction(userData.role, 'inventory:view')) {
      redirect('/dashboard')
    }

    userRole = userData.role
    organizationId = userData.organization_id
    siteId = userData.site_id || ''
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
