import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { canPerformAction } from '@/lib/rbac/guards'
import { isDevModeActive, DEV_MOCK_USER, logDevMode } from '@/lib/dev-mode'
import { CategoriesPageClient } from './categories-client'

export default async function InventoryCategoriesPage() {
  let userRole: string
  let organizationId: string

  // DEV MODE: Use mock data
  if (isDevModeActive()) {
    logDevMode('Inventory Categories Page')
    userRole = DEV_MOCK_USER.role
    organizationId = DEV_MOCK_USER.organization_id
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
    if (!canPerformAction(userData.role, 'inventory:view')) {
      redirect('/dashboard')
    }

    userRole = userData.role
    organizationId = userData.organization_id
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Inventory Categories</h1>
        <p className="text-muted-foreground">
          Manage your inventory categories and their tracking settings
        </p>
      </div>

      <CategoriesPageClient
        organizationId={organizationId}
        userRole={userRole}
      />
    </div>
  )
}
