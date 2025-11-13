/**
 * Recipe Management Database Queries
 * 
 * CRUD operations for recipes, versions, stages, and activations
 * with RBAC and jurisdiction awareness
 */

import { createClient } from '@/lib/supabase/server'
import type {
  RecipeFilters,
  RecipeActivationFilters,
  InsertRecipe,
  UpdateRecipe,
  InsertRecipeVersion,
  RecipeVersionData,
  RecipeWithVersions,
  RecipeVersionWithStages,
  ActiveRecipeDetails,
  RecipeScopeType,
  RecipeStageWithDetails,
  EnvironmentalSetpoint,
  NutrientFormula,
} from '@/types/recipe'

// Database response types
type DbStageWithRelations = {
  id: string
  recipe_version_id: string
  name: string
  stage_type: string | null
  order_index: number
  duration_days: number
  description: string | null
  color_code: string | null
  created_at: string
  setpoints: EnvironmentalSetpoint[]
  nutrient_formula: NutrientFormula[]
}

/**
 * Get all recipes for an organization with optional filtering
 */
export async function getRecipes(
  organizationId: string,
  filters?: RecipeFilters
) {
  try {
    const supabase = await createClient()
    let query = supabase
      .from('recipes')
      .select('*')
      .eq('organization_id', organizationId)
      .order('updated_at', { ascending: false })

    // Apply filters
    if (filters?.status) {
      if (Array.isArray(filters.status)) {
        query = query.in('status', filters.status)
      } else {
        query = query.eq('status', filters.status)
      }
    }
    if (filters?.plant_type) {
      query = query.contains('plant_types', [filters.plant_type])
    }
    if (filters?.jurisdiction_type) {
      query = query.contains('jurisdiction_types', [filters.jurisdiction_type])
    }
    if (filters?.is_template !== undefined) {
      query = query.eq('is_template', filters.is_template)
    }
    if (filters?.search) {
      query = query.or(
        `name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
      )
    }
    if (filters?.tags && filters.tags.length > 0) {
      query = query.overlaps('tags', filters.tags)
    }

    const { data, error } = await query

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error in getRecipes:', error)
    return { data: null, error }
  }
}

/**
 * Get recipes for a specific site (includes org-level and site-specific)
 */
export async function getRecipesBySite(
  organizationId: string,
  siteId: string,
  filters?: RecipeFilters
) {
  try {
    const supabase = await createClient()
    let query = supabase
      .from('recipes')
      .select('*')
      .eq('organization_id', organizationId)
      .or(`site_id.is.null,site_id.eq.${siteId}`)
      .order('updated_at', { ascending: false })

    // Apply same filters as getRecipes
    if (filters?.status) {
      if (Array.isArray(filters.status)) {
        query = query.in('status', filters.status)
      } else {
        query = query.eq('status', filters.status)
      }
    }
    if (filters?.plant_type) {
      query = query.contains('plant_types', [filters.plant_type])
    }
    if (filters?.jurisdiction_type) {
      query = query.contains('jurisdiction_types', [filters.jurisdiction_type])
    }
    if (filters?.is_template !== undefined) {
      query = query.eq('is_template', filters.is_template)
    }
    if (filters?.search) {
      query = query.or(
        `name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
      )
    }
    if (filters?.tags && filters.tags.length > 0) {
      query = query.overlaps('tags', filters.tags)
    }

    const { data, error } = await query

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error in getRecipesBySite:', error)
    return { data: null, error }
  }
}

/**
 * Get a single recipe by ID with all versions
 */
export async function getRecipeById(
  recipeId: string
): Promise<{ data: RecipeWithVersions | null; error: unknown }> {
  try {
    const supabase = await createClient()
    
    // Get recipe with versions
    const { data: recipe, error: recipeError } = await supabase
      .from('recipes')
      .select('*')
      .eq('id', recipeId)
      .single()

    if (recipeError) throw recipeError
    if (!recipe) return { data: null, error: null }

    // Get all versions
    const { data: versions, error: versionsError } = await supabase
      .from('recipe_versions')
      .select('*')
      .eq('recipe_id', recipeId)
      .order('version', { ascending: false })

    if (versionsError) throw versionsError

    // Get active activations
    const { data: activations, error: activationsError } = await supabase
      .from('recipe_activations')
      .select('*')
      .eq('recipe_id', recipeId)
      .eq('is_active', true)

    if (activationsError) throw activationsError

    const recipeWithVersions: RecipeWithVersions = {
      ...recipe,
      versions: versions || [],
      latest_version: versions?.[0],
      active_activations: activations || [],
    }

    return { data: recipeWithVersions, error: null }
  } catch (error) {
    console.error('Error in getRecipeById:', error)
    return { data: null, error }
  }
}

/**
 * Get a recipe version with all stages and setpoints
 */
export async function getRecipeVersion(
  versionId: string
): Promise<{ data: RecipeVersionWithStages | null; error: unknown }> {
  try {
    const supabase = await createClient()
    
    // Get version
    const { data: version, error: versionError } = await supabase
      .from('recipe_versions')
      .select('*')
      .eq('id', versionId)
      .single()

    if (versionError) throw versionError
    if (!version) return { data: null, error: null }

    // Get stages with setpoints and nutrient formulas
    const { data: stages, error: stagesError } = await supabase
      .from('recipe_stages')
      .select(`
        *,
        setpoints:environmental_setpoints(*),
        nutrient_formula:nutrient_formulas(*)
      `)
      .eq('recipe_version_id', versionId)
      .order('order_index', { ascending: true })

    if (stagesError) throw stagesError

    const versionWithStages: RecipeVersionWithStages = {
      ...version,
      stages: ((stages as unknown as DbStageWithRelations[]) || []).map((stage): RecipeStageWithDetails => ({
        id: stage.id,
        recipe_version_id: stage.recipe_version_id,
        name: stage.name,
        stage_type: stage.stage_type as RecipeStageWithDetails['stage_type'],
        order_index: stage.order_index,
        duration_days: stage.duration_days,
        description: stage.description,
        color_code: stage.color_code,
        created_at: stage.created_at,
        setpoints: stage.setpoints || [],
        nutrient_formula: stage.nutrient_formula?.[0] || null,
      })),
    }

    return { data: versionWithStages, error: null }
  } catch (error) {
    console.error('Error in getRecipeVersion:', error)
    return { data: null, error }
  }
}

/**
 * Create a new recipe
 */
export async function createRecipe(recipeData: InsertRecipe) {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('recipes')
      .insert(recipeData)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error in createRecipe:', error)
    return { data: null, error }
  }
}

/**
 * Update a recipe
 */
export async function updateRecipe(
  recipeId: string,
  updates: UpdateRecipe
) {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('recipes')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', recipeId)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error in updateRecipe:', error)
    return { data: null, error }
  }
}

/**
 * Delete (archive) a recipe
 */
export async function deleteRecipe(recipeId: string) {
  try {
    const supabase = await createClient()
    
    // Soft delete by setting status to archived
    const { data, error } = await supabase
      .from('recipes')
      .update({
        status: 'archived',
        updated_at: new Date().toISOString(),
      })
      .eq('id', recipeId)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error in deleteRecipe:', error)
    return { data: null, error }
  }
}

/**
 * Create a new recipe version with stages
 */
export async function createRecipeVersion(
  recipeId: string,
  userId: string,
  versionData: RecipeVersionData,
  notes?: string
) {
  try {
    const supabase = await createClient()
    
    // Get current version number
    const { data: recipe, error: recipeError } = await supabase
      .from('recipes')
      .select('current_version')
      .eq('id', recipeId)
      .single()

    if (recipeError) throw recipeError
    if (!recipe) throw new Error('Recipe not found')

    // For new recipes, current_version is 1 (from default), so we use it as-is for the first version
    // For existing recipes with versions, we increment
    const { count } = await supabase
      .from('recipe_versions')
      .select('*', { count: 'exact', head: true })
      .eq('recipe_id', recipeId)

    const newVersion = (count || 0) + 1

    // Create version record
    const versionInsert: InsertRecipeVersion = {
      recipe_id: recipeId,
      version: newVersion,
      created_by: userId,
      notes,
      version_data: versionData,
    }

    const { data: version, error: versionError } = await supabase
      .from('recipe_versions')
      .insert(versionInsert)
      .select()
      .single()

    if (versionError) throw versionError

    // Create stages
    for (const stageData of versionData.stages) {
      const { data: stage, error: stageError } = await supabase
        .from('recipe_stages')
        .insert({
          recipe_version_id: version.id,
          name: stageData.name,
          stage_type: stageData.stage_type,
          order_index: stageData.order_index,
          duration_days: stageData.duration_days,
          description: stageData.description,
          color_code: stageData.color_code,
        })
        .select()
        .single()

      if (stageError) throw stageError

      // Create setpoints
      if (stageData.setpoints && stageData.setpoints.length > 0) {
        const setpointsInsert = stageData.setpoints.map((sp) => ({
          recipe_stage_id: stage.id,
          parameter_type: sp.parameter_type,
          value: sp.value,
          day_value: sp.day_value,
          night_value: sp.night_value,
          unit: sp.unit,
          ramp_enabled: sp.ramp_enabled || false,
          ramp_start_value: sp.ramp_start_value,
          ramp_end_value: sp.ramp_end_value,
          ramp_duration_minutes: sp.ramp_duration_minutes,
          deadband: sp.deadband,
          min_value: sp.min_value,
          max_value: sp.max_value,
          priority: sp.priority || 50,
          enabled: sp.enabled !== false,
        }))

        const { error: setpointsError } = await supabase
          .from('environmental_setpoints')
          .insert(setpointsInsert)

        if (setpointsError) throw setpointsError
      }

      // Create nutrient formula if provided
      if (stageData.nutrient_formula) {
        const { error: nutrientError } = await supabase
          .from('nutrient_formulas')
          .insert({
            recipe_stage_id: stage.id,
            ...stageData.nutrient_formula,
          })

        if (nutrientError) throw nutrientError
      }
    }

    // Update recipe current_version
    const { error: updateError } = await supabase
      .from('recipes')
      .update({
        current_version: newVersion,
        updated_at: new Date().toISOString(),
      })
      .eq('id', recipeId)

    if (updateError) throw updateError

    return { data: version, error: null }
  } catch (error) {
    console.error('Error in createRecipeVersion:', error)
    return { data: null, error }
  }
}

/**
 * Activate a recipe for a scope (pod, batch, batch_group)
 */
export async function activateRecipe(
  recipeId: string,
  versionId: string,
  scopeType: RecipeScopeType,
  scopeId: string,
  scopeName: string,
  userId: string,
  scheduledStart?: string,
  scheduledEnd?: string
) {
  try {
    const supabase = await createClient()
    
    // Use database function for activation
    const { data, error } = await supabase.rpc('activate_recipe', {
      p_recipe_id: recipeId,
      p_recipe_version_id: versionId,
      p_scope_type: scopeType,
      p_scope_id: scopeId,
      p_scope_name: scopeName,
      p_activated_by: userId,
      p_scheduled_start: scheduledStart,
      p_scheduled_end: scheduledEnd,
    })

    if (error) throw error
    
    // Return the activation record
    const { data: activation, error: activationError } = await supabase
      .from('recipe_activations')
      .select('*')
      .eq('id', data)
      .single()

    if (activationError) throw activationError

    return { data: activation, error: null }
  } catch (error) {
    console.error('Error in activateRecipe:', error)
    return { data: null, error }
  }
}

/**
 * Deactivate a recipe activation
 */
export async function deactivateRecipe(
  activationId: string,
  userId: string,
  reason?: string
) {
  try {
    const supabase = await createClient()
    
    // Use database function for deactivation
    const { data, error } = await supabase.rpc('deactivate_recipe', {
      p_activation_id: activationId,
      p_user_id: userId,
      p_reason: reason,
    })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error in deactivateRecipe:', error)
    return { data: null, error }
  }
}

/**
 * Get active recipe for a specific scope
 */
export async function getActiveRecipeForScope(
  scopeType: RecipeScopeType,
  scopeId: string
): Promise<{ data: ActiveRecipeDetails | null; error: unknown }> {
  try {
    const supabase = await createClient()
    
    console.log('🔎 getActiveRecipeForScope called:', { scopeType, scopeId })
    
    // Get active activation with recipe and version details
    const { data: activation, error: activationError } = await supabase
      .from('recipe_activations')
      .select(`
        *,
        recipe:recipes(*),
        recipe_version:recipe_versions(*)
      `)
      .eq('scope_type', scopeType)
      .eq('scope_id', scopeId)
      .eq('is_active', true)
      .order('activated_at', { ascending: false })
      .limit(1)
      .single()

    console.log('📊 Recipe activation query result:', { 
      hasData: !!activation, 
      error: activationError?.code,
      errorMessage: activationError?.message 
    })

    if (activationError) {
      if (activationError.code === 'PGRST116') {
        // No active recipe found
        console.log('ℹ️ No active recipe found (PGRST116)')
        return { data: null, error: null }
      }
      throw activationError
    }

    if (!activation) return { data: null, error: null }

    // Get stages with setpoints
    const { data: stages, error: stagesError } = await supabase
      .from('recipe_stages')
      .select(`
        *,
        setpoints:environmental_setpoints(*),
        nutrient_formula:nutrient_formulas(*)
      `)
      .eq('recipe_version_id', activation.recipe_version.id)
      .order('order_index', { ascending: true })

    if (stagesError) throw stagesError

    // Get current stage setpoints
    const dbStages = (stages as unknown as DbStageWithRelations[]) || []
    const currentStage = dbStages.find((s) => s.id === activation.current_stage_id)
    const currentSetpoints = currentStage?.setpoints || []

    // Get active overrides for this scope
    const { data: overrides, error: overridesError } = await supabase
      .from('control_overrides')
      .select('*')
      .eq('scope_type', scopeType)
      .eq('scope_id', scopeId)
      .eq('status', 'active')
      .order('priority_level', { ascending: false })

    if (overridesError) throw overridesError

    const activeRecipeDetails: ActiveRecipeDetails = {
      activation: {
        ...activation,
        current_stage: currentStage ? {
          id: currentStage.id,
          recipe_version_id: currentStage.recipe_version_id,
          name: currentStage.name,
          stage_type: currentStage.stage_type as RecipeStageWithDetails['stage_type'],
          order_index: currentStage.order_index,
          duration_days: currentStage.duration_days,
          description: currentStage.description,
          color_code: currentStage.color_code,
          created_at: currentStage.created_at,
          setpoints: currentStage.setpoints || [],
          nutrient_formula: currentStage.nutrient_formula?.[0] || null,
        } : undefined,
      },
      stages: dbStages.map((stage): RecipeStageWithDetails => ({
        id: stage.id,
        recipe_version_id: stage.recipe_version_id,
        name: stage.name,
        stage_type: stage.stage_type as RecipeStageWithDetails['stage_type'],
        order_index: stage.order_index,
        duration_days: stage.duration_days,
        description: stage.description,
        color_code: stage.color_code,
        created_at: stage.created_at,
        setpoints: stage.setpoints || [],
        nutrient_formula: stage.nutrient_formula?.[0] || null,
      })),
      current_setpoints: currentSetpoints,
      active_overrides: overrides || [],
    }

    return { data: activeRecipeDetails, error: null }
  } catch (error) {
    console.error('Error in getActiveRecipeForScope:', error)
    return { data: null, error }
  }
}

/**
 * Get recipe activations with filters
 */
export async function getRecipeActivations(
  organizationId: string,
  filters?: RecipeActivationFilters
) {
  try {
    const supabase = await createClient()
    
    let query = supabase
      .from('recipe_activations')
      .select(`
        *,
        recipe:recipes!inner(organization_id, name),
        recipe_version:recipe_versions(version)
      `)
      .eq('recipe.organization_id', organizationId)
      .order('activated_at', { ascending: false })

    // Apply filters
    if (filters?.scope_type) {
      query = query.eq('scope_type', filters.scope_type)
    }
    if (filters?.scope_id) {
      query = query.eq('scope_id', filters.scope_id)
    }
    if (filters?.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active)
    }
    if (filters?.recipe_id) {
      query = query.eq('recipe_id', filters.recipe_id)
    }

    const { data, error } = await query

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error in getRecipeActivations:', error)
    return { data: null, error }
  }
}

/**
 * Advance recipe to next stage
 */
export async function advanceRecipeStage(
  activationId: string,
  userId: string
) {
  try {
    const supabase = await createClient()
    
    // Use database function to advance stage
    const { data, error } = await supabase.rpc('advance_recipe_stage', {
      p_activation_id: activationId,
      p_user_id: userId,
    })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error in advanceRecipeStage:', error)
    return { data: null, error }
  }
}

/**
 * Get recipe templates
 */
export async function getRecipeTemplates(
  organizationId: string,
  category?: string
) {
  try {
    const supabase = await createClient()
    
    let query = supabase
      .from('recipes')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_template', true)
      .eq('status', 'published')
      .order('name', { ascending: true })

    if (category) {
      query = query.eq('template_category', category)
    }

    const { data, error } = await query

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error in getRecipeTemplates:', error)
    return { data: null, error }
  }
}

/**
 * Clone a recipe (create new recipe from existing)
 */
export async function cloneRecipe(
  sourceRecipeId: string,
  newName: string,
  userId: string,
  organizationId: string
) {
  try {
    // Get source recipe with latest version
    const { data: sourceRecipe, error: sourceError } = await getRecipeById(sourceRecipeId)
    if (sourceError || !sourceRecipe) throw sourceError || new Error('Source recipe not found')

    // Create new recipe
    const { data: newRecipe, error: recipeError } = await createRecipe({
      organization_id: organizationId,
      site_id: sourceRecipe.site_id || undefined,
      name: newName,
      description: `Cloned from ${sourceRecipe.name}`,
      owner_id: userId,
      status: 'draft',
      is_template: false,
      jurisdiction_types: sourceRecipe.jurisdiction_types || undefined,
      plant_types: sourceRecipe.plant_types || undefined,
      tags: sourceRecipe.tags || undefined,
    })

    if (recipeError || !newRecipe) throw recipeError

    // Get latest version data
    if (sourceRecipe.latest_version) {
      const { data: versionWithStages } = await getRecipeVersion(sourceRecipe.latest_version.id)
      
      if (versionWithStages) {
        // Create version for new recipe
        const versionData: RecipeVersionData = {
          name: newName,
          description: versionWithStages.version_data.description,
          stages: versionWithStages.stages.map(stage => ({
            name: stage.name,
            stage_type: stage.stage_type || undefined,
            order_index: stage.order_index,
            duration_days: stage.duration_days,
            description: stage.description || undefined,
            color_code: stage.color_code || undefined,
            setpoints: stage.setpoints.map(sp => ({
              parameter_type: sp.parameter_type,
              value: sp.value || undefined,
              day_value: sp.day_value || undefined,
              night_value: sp.night_value || undefined,
              unit: sp.unit,
              ramp_enabled: sp.ramp_enabled,
              ramp_start_value: sp.ramp_start_value || undefined,
              ramp_end_value: sp.ramp_end_value || undefined,
              ramp_duration_minutes: sp.ramp_duration_minutes || undefined,
              deadband: sp.deadband || undefined,
              min_value: sp.min_value || undefined,
              max_value: sp.max_value || undefined,
              priority: sp.priority,
              enabled: sp.enabled,
            })),
            nutrient_formula: stage.nutrient_formula ? {
              ec_target: stage.nutrient_formula.ec_target || undefined,
              ec_min: stage.nutrient_formula.ec_min || undefined,
              ec_max: stage.nutrient_formula.ec_max || undefined,
              ph_target: stage.nutrient_formula.ph_target || undefined,
              ph_min: stage.nutrient_formula.ph_min || undefined,
              ph_max: stage.nutrient_formula.ph_max || undefined,
              water_temp_c: stage.nutrient_formula.water_temp_c || undefined,
              dissolved_oxygen_ppm: stage.nutrient_formula.dissolved_oxygen_ppm || undefined,
              npk_ratio: stage.nutrient_formula.npk_ratio || undefined,
              nutrient_details: stage.nutrient_formula.nutrient_details || undefined,
              notes: stage.nutrient_formula.notes || undefined,
            } : undefined,
          })),
        }

        await createRecipeVersion(newRecipe.id, userId, versionData, 'Cloned from original recipe')
      }
    }

    return { data: newRecipe, error: null }
  } catch (error) {
    console.error('Error in cloneRecipe:', error)
    return { data: null, error }
  }
}

/**
 * Get all pods, rooms, batches, or batch groups available for recipe assignment
 */
export async function getAssignableScopes(
  organizationId: string,
  scopeType: RecipeScopeType
): Promise<{ data: Array<{ id: string; name: string; location?: string }> | null; error: unknown }> {
  try {
    const supabase = await createClient()
    
    if (scopeType === 'pod') {
      const { data, error } = await supabase
        .from('pods')
        .select(`
          id,
          name,
          room:rooms!inner(
            name,
            site:sites!inner(
              organization_id
            )
          )
        `)
        .eq('is_active', true)
        .order('name')
      
      if (error) throw error
      
      // Filter by organization and transform
      const filtered = (data || []).filter(pod => {
        const room = pod.room as unknown as { site: { organization_id: string } }
        return room?.site?.organization_id === organizationId
      })
      
      return {
        data: filtered.map(pod => ({
          id: pod.id,
          name: pod.name,
          location: (pod.room as unknown as { name: string })?.name,
        })),
        error: null,
      }
    } else if (scopeType === 'room') {
      const { data, error } = await supabase
        .from('rooms')
        .select(`
          id,
          name,
          site:sites!inner(
            organization_id,
            name
          )
        `)
        .eq('is_active', true)
        .order('name')
      
      if (error) throw error
      
      const filtered = (data || []).filter(room => {
        const site = room.site as unknown as { organization_id: string }
        return site?.organization_id === organizationId
      })
      
      return {
        data: filtered.map(room => ({
          id: room.id,
          name: room.name,
          location: (room.site as unknown as { name: string })?.name,
        })),
        error: null,
      }
    } else if (scopeType === 'batch') {
      const { data, error } = await supabase
        .from('batches')
        .select(`
          id,
          batch_code,
          site:sites!inner(
            organization_id,
            name
          )
        `)
        .order('batch_code')
      
      if (error) throw error
      
      const filtered = (data || []).filter(batch => {
        const site = batch.site as unknown as { organization_id: string }
        return site?.organization_id === organizationId
      })
      
      return {
        data: filtered.map(batch => ({
          id: batch.id,
          name: batch.batch_code,
          location: (batch.site as unknown as { name: string })?.name,
        })),
        error: null,
      }
    } else if (scopeType === 'batch_group') {
      const { data, error } = await supabase
        .from('batch_groups')
        .select(`
          id,
          name,
          site:sites!inner(
            organization_id,
            name
          )
        `)
        .order('name')
      
      if (error) throw error
      
      const filtered = (data || []).filter(group => {
        const site = group.site as unknown as { organization_id: string }
        return site?.organization_id === organizationId
      })
      
      return {
        data: filtered.map(group => ({
          id: group.id,
          name: group.name,
          location: (group.site as unknown as { name: string })?.name,
        })),
        error: null,
      }
    }
    
    return { data: [], error: null }
  } catch (error) {
    console.error('Error in getAssignableScopes:', error)
    return { data: null, error }
  }
}

/**
 * Assign a recipe to a scope (wrapper around activateRecipe for easier use)
 */
export async function assignRecipeToScope(
  recipeId: string,
  versionId: string,
  scopeType: RecipeScopeType,
  scopeId: string,
  scopeName: string,
  userId: string,
  scheduledStart?: string
): Promise<{ data: { id: string } | null; error: unknown }> {
  try {
    // Use the existing activateRecipe function
    const { data: activation, error } = await activateRecipe(
      recipeId,
      versionId,
      scopeType,
      scopeId,
      scopeName,
      userId,
      scheduledStart || new Date().toISOString()
    )
    
    if (error) throw error
    if (!activation) throw new Error('Failed to create recipe activation')
    
    return { data: { id: activation.id }, error: null }
  } catch (error) {
    console.error('Error in assignRecipeToScope:', error)
    return { data: null, error }
  }
}

/**
 * Deprecate a recipe (mark as outdated/not recommended for new applications)
 * 
 * Note: If the recipe has active activations, they will continue running normally.
 * The recipe status will change to 'deprecated' but existing activations remain active.
 * New activations cannot be created for deprecated recipes.
 */
export async function deprecateRecipe(
  recipeId: string,
  userId: string,
  reason?: string
): Promise<{ data: boolean; error: unknown; activeCount?: number }> {
  try {
    const supabase = await createClient()
    
    // Check for active activations
    const { data: activations, error: checkError } = await supabase
      .from('recipe_activations')
      .select('id, scope_name, scope_type')
      .eq('recipe_id', recipeId)
      .eq('is_active', true)
    
    if (checkError) throw checkError
    
    const activeCount = activations?.length || 0
    
    // Update recipe status
    const { error: updateError } = await supabase
      .from('recipes')
      .update({
        status: 'deprecated',
        deprecated_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', recipeId)
    
    if (updateError) throw updateError
    
    // Log the deprecation with active activation info
    console.log('Recipe deprecated:', { 
      recipeId, 
      userId, 
      reason,
      activeCount,
      activeScopes: activations?.map(a => `${a.scope_type}:${a.scope_name}`)
    })
    
    return { data: true, error: null, activeCount }
  } catch (error) {
    console.error('Error in deprecateRecipe:', error)
    return { data: false, error }
  }
}

/**
 * Undeprecate a recipe (restore to published status)
 */
export async function undeprecateRecipe(
  recipeId: string,
  userId: string
): Promise<{ data: boolean; error: unknown }> {
  try {
    const supabase = await createClient()
    
    // Check if recipe has any active activations
    const { data: activations } = await supabase
      .from('recipe_activations')
      .select('id')
      .eq('recipe_id', recipeId)
      .eq('is_active', true)
      .limit(1)
    
    // If active, set to 'applied', otherwise 'published'
    const newStatus = activations && activations.length > 0 ? 'applied' : 'published'
    
    // Update recipe status
    const { error: updateError } = await supabase
      .from('recipes')
      .update({
        status: newStatus,
        deprecated_at: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', recipeId)
    
    if (updateError) throw updateError
    
    console.log('Recipe undeprecated:', { recipeId, userId, newStatus })
    
    return { data: true, error: null }
  } catch (error) {
    console.error('Error in undeprecateRecipe:', error)
    return { data: false, error }
  }
}
