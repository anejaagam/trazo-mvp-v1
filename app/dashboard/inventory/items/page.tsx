import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ItemCatalogPage } from '@/components/features/inventory/item-catalog-page'
import { canPerformAction } from '@/lib/rbac/guards'
import { isDevModeActive, DEV_MOCK_USER, logDevMode } from '@/lib/dev-mode'

export default async function InventoryItemsPage() {
  let userId: string
  let userRole: string
  let siteId: string
  let organizationId: string

  // DEV MODE: Use mock data
  if (isDevModeActive()) {
    logDevMode('Inventory Items Page')
    userId = DEV_MOCK_USER.id
    userRole = DEV_MOCK_USER.role
    siteId = 'dev-site-123'
    organizationId = 'dev-org-123'
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

    userId = user.id
    userRole = userData.role
    siteId = userData.site_id || userData.organization_id
    organizationId = userData.organization_id
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Item Catalog</h1>
        <p className="text-muted-foreground">
          Manage your inventory items, stock levels, and suppliers
        </p>
      </div>

      <ItemCatalogPage
        organizationId={organizationId}
        siteId={siteId}
        userId={userId}
        userRole={userRole}
      />
    </div>
  )
}
