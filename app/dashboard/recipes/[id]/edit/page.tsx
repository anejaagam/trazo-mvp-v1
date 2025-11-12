import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { canPerformAction } from '@/lib/rbac/guards'
import { getRecipeById, createRecipeVersion } from '@/lib/supabase/queries/recipes'
import { RecipeAuthor } from '@/components/features/recipes/recipe-author'
import type { PlantType, RecipeVersionData, StageType, SetpointParameterType } from '@/types/recipe'

interface RecipeFormData {
  name: string
  description: string
  notes: string
  plantTypes: PlantType[]
  tags: string[]
  stages: StageFormData[]
}

interface StageFormData {
  id: string
  name: string
  stageType: StageType
  duration: number
  description: string
  order: number
  setpoints: SetpointFormData[]
}

interface SetpointFormData {
  id: string
  parameterType: SetpointParameterType
  value?: number
  dayValue?: number
  nightValue?: number
  unit: string
  deadband?: number
  minValue?: number
  maxValue?: number
}

interface RecipeEditPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function RecipeEditPage({ params }: RecipeEditPageProps) {
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

  // Get organization's plant type
  const { data: orgData } = await supabase
    .from('organizations')
    .select('plant_type')
    .eq('id', userData.organization_id)
    .single()
  
  const plantType = orgData?.plant_type // 'cannabis' or 'produce'

  // RBAC check
  const role = userData.role || ''
  if (!canPerformAction(role, 'control:recipe_edit').allowed) {
    redirect('/dashboard/recipes')
  }

  // Fetch recipe
  const { data: recipe, error } = await getRecipeById(id)
  
  if (error || !recipe) {
    redirect('/dashboard/recipes')
  }

  // Convert recipe data to form format
  const initialData: RecipeFormData | undefined = recipe.latest_version ? {
    name: recipe.name,
    description: recipe.description || '',
    notes: '',
    plantTypes: (recipe.plant_types as PlantType[]) || [],
    tags: recipe.tags || [],
    stages: recipe.latest_version.version_data.stages.map((stage, idx) => ({
      id: `stage-${idx}`,
      name: stage.name,
      stageType: stage.stage_type || 'vegetative',
      duration: stage.duration_days,
      description: stage.description || '',
      order: stage.order_index,
      setpoints: stage.setpoints.map((sp, spIdx) => ({
        id: `sp-${spIdx}`,
        parameterType: sp.parameter_type,
        value: sp.value,
        dayValue: sp.day_value,
        nightValue: sp.night_value,
        unit: sp.unit,
        deadband: sp.deadband,
        minValue: sp.min_value,
        maxValue: sp.max_value
      }))
    }))
  } : undefined

  // Server action for saving new version
  async function saveNewVersion(formData: RecipeFormData) {
    'use server'
    
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('Unauthorized')
    }

    // Create version data
    const versionData: RecipeVersionData = {
      name: formData.name,
      description: formData.description || undefined,
      stages: formData.stages.map(stage => ({
        name: stage.name,
        stage_type: stage.stageType,
        order_index: stage.order,
        duration_days: stage.duration,
        description: stage.description || undefined,
        setpoints: stage.setpoints.map(sp => ({
          parameter_type: sp.parameterType,
          value: sp.value,
          day_value: sp.dayValue,
          night_value: sp.nightValue,
          unit: sp.unit,
          deadband: sp.deadband,
          min_value: sp.minValue,
          max_value: sp.maxValue,
          priority: 100,
          enabled: true
        }))
      }))
    }

    // Create new version
    const { error: versionError } = await createRecipeVersion(
      id,
      user.id,
      versionData,
      formData.notes || undefined
    )

    if (versionError) {
      console.error('Version creation error:', versionError)
      throw new Error('Failed to create recipe version')
    }

    // Update recipe metadata
    const { error: updateError } = await supabase
      .from('recipes')
      .update({
        name: formData.name,
        description: formData.description,
        plant_types: formData.plantTypes.length > 0 ? formData.plantTypes : null,
        tags: formData.tags.length > 0 ? formData.tags : null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (updateError) {
      console.error('Recipe update error:', updateError)
      throw new Error('Failed to update recipe')
    }

    return id
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <RecipeAuthor
        facilityType={plantType}
        mode="edit"
        initialData={initialData}
        onSave={async (data) => {
          'use server'
          await saveNewVersion(data)
          redirect(`/dashboard/recipes/${id}`)
        }}
      />
    </div>
  )
}
