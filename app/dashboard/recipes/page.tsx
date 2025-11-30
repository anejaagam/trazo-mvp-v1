import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { canPerformAction } from '@/lib/rbac/guards'
import { getRecipes } from '@/lib/supabase/queries/recipes'
import { getServerSiteId } from '@/lib/site/server'
import { RecipeLibraryWrapper } from '@/components/features/recipes/recipe-library-wrapper'
import type { RoleKey } from '@/lib/rbac/types'

export const metadata = {
  title: 'Recipes | TRAZO',
  description: 'Manage environmental control recipes',
}

export default async function RecipesPage() {
  const supabase = await createClient()
  
  // Auth check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Get user data with org/role
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('organization_id, role')
    .eq('id', user.id)
    .single()

  if (!userData) {
    console.error('No user data found for:', user.id, userError)
    redirect('/dashboard')
  }

  // RBAC check - at minimum need to be able to view controls
  const viewCheck = canPerformAction(userData.role as RoleKey, 'control:view')
  console.log('Recipe access check:', { role: userData.role, viewCheck })
  
  if (!viewCheck.allowed) {
    console.error('Access denied to recipes:', viewCheck.reason)
    redirect('/dashboard')
  }

  const canCreate = canPerformAction(userData.role as RoleKey, 'control:recipe_create').allowed
  const canView = true // If they got here, they can view

  // Get organization's plant type to filter recipes
  const { data: orgData } = await supabase
    .from('organizations')
    .select('plant_type')
    .eq('id', userData.organization_id)
    .single()

  const plantType = orgData?.plant_type // 'cannabis' or 'produce'

  // Get site_id from site context (cookie-based)
  const contextSiteId = await getServerSiteId()
  const siteId = (contextSiteId && contextSiteId !== 'all') ? contextSiteId : undefined

  // Load recipes
  const { data: recipes, error } = await getRecipes(userData.organization_id)

  if (error) {
    console.error('Error loading recipes:', error)
  }

  return (
    <div className="container mx-auto py-8">
      <RecipeLibraryWrapper
        organizationId={userData.organization_id}
        siteId={siteId}
        facilityType={plantType}
        userRole={userData.role}
        recipes={recipes || []}
        loading={false}
        canCreate={canCreate}
        canView={canView}
      />
    </div>
  )
}
