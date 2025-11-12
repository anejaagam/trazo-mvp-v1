import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { canPerformAction } from '@/lib/rbac/guards'
import { getRecipeById, getRecipeVersion } from '@/lib/supabase/queries/recipes'
import { RecipeViewer } from '@/components/features/recipes/recipe-viewer'

interface RecipeDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function RecipeDetailPage({ params }: RecipeDetailPageProps) {
  const { id } = await params
  const supabase = await createClient()

  // Auth check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/auth/login')
  }

  // Load user data
  const { data: userData } = await supabase
    .from('users')
    .select('organization_id, role')
    .eq('id', user.id)
    .single()

  if (!userData?.organization_id) {
    redirect('/dashboard')
  }

  // RBAC check
  const role = userData.role || ''
  if (!canPerformAction(role, 'control:view')) {
    redirect('/dashboard')
  }

  // Compute permissions
  const canEdit = canPerformAction(role, 'control:recipe_edit').allowed
  const canClone = canPerformAction(role, 'control:recipe_create').allowed
  const canApply = canPerformAction(role, 'control:recipe_apply').allowed

  // Fetch recipe with all versions
  const { data: recipe, error } = await getRecipeById(id)
  
  if (error || !recipe) {
    redirect('/dashboard/recipes')
  }

  // Fetch the latest version with full details (stages, setpoints, nutrients)
  let versionWithStages = null
  if (recipe.latest_version?.id) {
    const { data: versionData } = await getRecipeVersion(recipe.latest_version.id)
    versionWithStages = versionData
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <RecipeViewer
        recipe={recipe}
        version={versionWithStages || undefined}
        canEdit={canEdit}
        canClone={canClone}
        canApply={canApply}
        onClose={() => {
          // Client-side navigation handled by RecipeViewer
        }}
      />
    </div>
  )
}
