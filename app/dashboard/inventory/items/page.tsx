import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ItemCatalogPage } from '@/components/features/inventory/item-catalog-page'
import { canPerformAction } from '@/lib/rbac/guards'
import { isDevModeActive, DEV_MOCK_USER, logDevMode } from '@/lib/dev-mode'
import { getOrCreateDefaultSite } from '@/lib/supabase/queries/sites'
import { getServerSiteId } from '@/lib/site/server'
import { ALL_SITES_ID } from '@/lib/site/types'

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
    siteId = DEV_MOCK_USER.site_assignments[0].site_id
    organizationId = DEV_MOCK_USER.organization_id
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

    userId = user.id
    userRole = userData.role
    organizationId = userData.organization_id

    // Get site_id from site context (cookie-based)
    const contextSiteId = await getServerSiteId()
    if (contextSiteId === ALL_SITES_ID) {
      // Org admin viewing all sites - pass the special ID
      // Components will handle aggregate data fetching
      siteId = ALL_SITES_ID
    } else if (contextSiteId) {
      siteId = contextSiteId
    } else {
      // Fallback to default site if no site selected
      const { data: defaultSiteId } = await getOrCreateDefaultSite(organizationId)
      siteId = defaultSiteId || organizationId
    }
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
