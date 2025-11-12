import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { canPerformAction } from '@/lib/rbac/guards'
import { createRecipe, createRecipeVersion } from '@/lib/supabase/queries/recipes'
import { RecipeAuthor } from '@/components/features/recipes/recipe-author'
import type { 
  PlantType, 
  RecipeVersionData,
  StageType,
  SetpointParameterType
} from '@/types/recipe'

interface SetpointFormData {
  id: string
  // Temperature in °F
  tempMin?: number
  tempMax?: number
  // Relative Humidity %
  humidityMin?: number
  humidityMax?: number
  // VPD kPa
  vpdMin?: number
  vpdMax?: number
  // Light Level %
  lightMin?: number
  lightMax?: number
  // Light Schedule (24-hour format HH:MM)
  lightOn?: string
  lightOff?: string
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

interface RecipeFormData {
  name: string
  description: string
  notes: string
  plantTypes: PlantType[]
  tags: string[]
  stages: StageFormData[]
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

    // Create version data - transform form data to match database schema
    const versionData: RecipeVersionData = {
      name: formData.name,
      description: formData.description || undefined,
      stages: formData.stages.map((stage, index) => ({
        name: stage.name,
        stage_type: stage.stageType,
        order_index: index,
        duration_days: stage.duration,
        description: stage.description || undefined,
        setpoints: stage.setpoints.flatMap(sp => {
          // Convert our single comprehensive setpoint into multiple database setpoints
          const dbSetpoints = []
          
          // Temperature setpoint
          if (sp.tempMin !== undefined || sp.tempMax !== undefined) {
            dbSetpoints.push({
              parameter_type: 'temperature' as const,
              min_value: sp.tempMin,
              max_value: sp.tempMax,
              unit: '°F',
              ramp_enabled: false,
              priority: 50,
              enabled: true,
            })
          }
          
          // Humidity setpoint
          if (sp.humidityMin !== undefined || sp.humidityMax !== undefined) {
            dbSetpoints.push({
              parameter_type: 'humidity' as const,
              min_value: sp.humidityMin,
              max_value: sp.humidityMax,
              unit: '%',
              ramp_enabled: false,
              priority: 50,
              enabled: true,
            })
          }
          
          // VPD setpoint
          if (sp.vpdMin !== undefined || sp.vpdMax !== undefined) {
            dbSetpoints.push({
              parameter_type: 'vpd' as const,
              min_value: sp.vpdMin,
              max_value: sp.vpdMax,
              unit: 'kPa',
              ramp_enabled: false,
              priority: 50,
              enabled: true,
            })
          }
          
          // Light level setpoint
          if (sp.lightMin !== undefined || sp.lightMax !== undefined) {
            dbSetpoints.push({
              parameter_type: 'light_intensity' as const,
              min_value: sp.lightMin,
              max_value: sp.lightMax,
              unit: '%',
              ramp_enabled: false,
              priority: 50,
              enabled: true,
            })
          }
          
          // Light schedule (photoperiod) - calculate hours from on/off times
          if (sp.lightOn && sp.lightOff) {
            const [onHour, onMin] = sp.lightOn.split(':').map(Number)
            const [offHour, offMin] = sp.lightOff.split(':').map(Number)
            const onMinutes = onHour * 60 + onMin
            const offMinutes = offHour * 60 + offMin
            let durationHours = (offMinutes - onMinutes) / 60
            if (durationHours < 0) durationHours += 24 // Handle overnight schedules
            
            dbSetpoints.push({
              parameter_type: 'photoperiod' as const,
              value: durationHours,
              unit: 'hrs',
              ramp_enabled: false,
              priority: 50,
              enabled: true,
            })
          }
          
          return dbSetpoints
        }),
      })),
    }

    console.log('Creating recipe with data:', {
      recipeData: {
        organization_id: userData.organization_id,
        name: formData.name,
        plantTypes: formData.plantTypes,
      },
      versionData: {
        name: versionData.name,
        stagesCount: versionData.stages.length,
        stages: versionData.stages.map(s => ({
          name: s.name,
          type: s.stage_type,
          duration: s.duration_days,
          setpointsCount: s.setpoints.length,
        })),
      },
    })

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
      console.error('Recipe creation error details:', {
        error: recipeError,
        errorMessage: recipeError instanceof Error ? recipeError.message : 'Unknown error',
        errorDetails: JSON.stringify(recipeError, null, 2)
      })
      throw new Error(`Failed to create recipe: ${recipeError instanceof Error ? recipeError.message : JSON.stringify(recipeError)}`)
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
      console.error('Version data that caused error:', JSON.stringify(versionData, null, 2))
      throw new Error(`Failed to create recipe version: ${versionError instanceof Error ? versionError.message : JSON.stringify(versionError)}`)
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
