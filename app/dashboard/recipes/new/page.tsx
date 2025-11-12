import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { canPerformAction } from '@/lib/rbac/guards'
import { createRecipe, createRecipeVersion } from '@/lib/supabase/queries/recipes'
import { RecipeAuthor } from '@/components/features/recipes/recipe-author'
import type { PlantType, RecipeVersionData } from '@/types/recipe'

interface RecipeFormData {
  name: string
  description: string
  notes: string
  plantTypes: PlantType[]
  tags: string[]
  stages: unknown[]
}

export default async function NewRecipePage() {
  const supabase = await createClient()

  // Auth check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/auth/login')
  }

  // Load user data
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('organization_id, role')
    .eq('id', user.id)
    .single()

  console.log('New recipe page - user data:', { userData, userError })

  if (!userData?.organization_id) {
    console.error('No organization found for user')
    redirect('/dashboard')
  }

  // Get organization's plant type
  const { data: orgData } = await supabase
    .from('organizations')
    .select('plant_type')
    .eq('id', userData.organization_id)
    .single()
  
  const plantType = orgData?.plant_type // 'cannabis' or 'produce'

  // RBAC check
  const role = userData.role || ''
  const createCheck = canPerformAction(role, 'control:recipe_create')
  console.log('Recipe create check:', { role, createCheck })
  
  if (!createCheck.allowed) {
    console.error('Access denied to create recipe:', createCheck.reason)
    redirect('/dashboard/recipes')
  }

  // Server action for saving
  async function saveRecipe(formData: RecipeFormData) {
    'use server'
    
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('Unauthorized')
    }

    const { data: userData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (!userData?.organization_id) {
      throw new Error('No organization found')
    }

    // Get user's site assignment (optional)
    const { data: userSite } = await supabase
      .from('user_site_assignments')
      .select('site_id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .limit(1)
      .single()

    // Create version data
    const versionData: RecipeVersionData = {
      name: formData.name,
      description: formData.description || undefined,
      stages: formData.stages as RecipeVersionData['stages']
    }

    // Create recipe
    const { data: recipe, error: recipeError } = await createRecipe({
      organization_id: userData.organization_id,
      site_id: userSite?.site_id || null,
      name: formData.name,
      description: formData.description,
      owner_id: user.id,
      status: 'draft',
      plant_types: formData.plantTypes.length > 0 ? formData.plantTypes : undefined,
      tags: formData.tags.length > 0 ? formData.tags : undefined
    })

    if (recipeError || !recipe) {
      console.error('Recipe creation error:', recipeError)
      throw new Error('Failed to create recipe')
    }

    // Create initial version
    const { error: versionError } = await createRecipeVersion(
      recipe.id,
      user.id,
      versionData,
      formData.notes || undefined
    )

    if (versionError) {
      console.error('Version creation error:', versionError)
      throw new Error('Failed to create recipe version')
    }

    return recipe.id
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <RecipeAuthor
        facilityType={plantType}
        mode="create"
        onSave={async (data) => {
          'use server'
          const recipeId = await saveRecipe(data)
          redirect(`/dashboard/recipes/${recipeId}`)
        }}
      />
    </div>
  )
}
