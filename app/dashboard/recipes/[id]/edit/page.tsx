import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { canPerformAction } from '@/lib/rbac/guards'
import { getRecipeById, createRecipeVersion } from '@/lib/supabase/queries/recipes'
import { RecipeAuthor } from '@/components/features/recipes/recipe-author'
import type { PlantType, RecipeVersionData, StageType } from '@/types/recipe'

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
  // Temperature in °C
  tempMin?: number
  tempMax?: number
  // Relative Humidity %
  humidityMin?: number
  humidityMax?: number
  // VPD kPa
  vpdMin?: number
  vpdMax?: number
  // CO2 ppm
  co2Min?: number
  co2Max?: number
  // Light Level %
  lightMin?: number
  lightMax?: number
  // Light Schedule (24-hour format HH:MM)
  lightOn?: string
  lightOff?: string
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
    stages: recipe.latest_version.version_data.stages.map((stage, idx) => {
      // Convert database setpoints (multiple parameter types) into our comprehensive form format
      const setpoints = stage.setpoints || []
      const tempSetpoint = setpoints.find(sp => sp.parameter_type === 'temperature')
      const humiditySetpoint = setpoints.find(sp => sp.parameter_type === 'humidity')
      const vpdSetpoint = setpoints.find(sp => sp.parameter_type === 'vpd')
      const co2Setpoint = setpoints.find(sp => sp.parameter_type === 'co2')
      const lightSetpoint = setpoints.find(sp => sp.parameter_type === 'light_intensity')
      const photoperiodSetpoint = setpoints.find(sp => sp.parameter_type === 'photoperiod')
      
      // Calculate light schedule from photoperiod
      const lightOn = '06:00'
      let lightOff = '22:00'
      if (photoperiodSetpoint?.value) {
        const hours = photoperiodSetpoint.value
        const offHour = 6 + Math.floor(hours)
        const offMin = Math.round((hours % 1) * 60)
        lightOff = `${offHour.toString().padStart(2, '0')}:${offMin.toString().padStart(2, '0')}`
      }
      
      return {
        id: `stage-${idx}`,
        name: stage.name,
        stageType: stage.stage_type || 'vegetative',
        duration: stage.duration_days,
        description: stage.description || '',
        order: stage.order_index,
        setpoints: setpoints.length > 0 ? [{
          id: `sp-${idx}`,
          tempMin: tempSetpoint?.min_value,
          tempMax: tempSetpoint?.max_value,
          humidityMin: humiditySetpoint?.min_value,
          humidityMax: humiditySetpoint?.max_value,
          vpdMin: vpdSetpoint?.min_value,
          vpdMax: vpdSetpoint?.max_value,
          co2Min: co2Setpoint?.min_value,
          co2Max: co2Setpoint?.max_value,
          lightMin: lightSetpoint?.min_value,
          lightMax: lightSetpoint?.max_value,
          lightOn,
          lightOff
        }] : []
      }
    })
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
        setpoints: stage.setpoints.flatMap(sp => {
          // Convert our single comprehensive setpoint into multiple database setpoints
          const dbSetpoints = []
          
          // Temperature setpoint
          if (sp.tempMin !== undefined || sp.tempMax !== undefined) {
            dbSetpoints.push({
              parameter_type: 'temperature' as const,
              min_value: sp.tempMin,
              max_value: sp.tempMax,
              unit: '°C',
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
          
          // CO2 setpoint
          if (sp.co2Min !== undefined || sp.co2Max !== undefined) {
            dbSetpoints.push({
              parameter_type: 'co2' as const,
              min_value: sp.co2Min,
              max_value: sp.co2Max,
              unit: 'ppm',
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
        })
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
