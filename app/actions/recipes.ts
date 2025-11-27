'use server'

import {
  getAssignableScopes as getAssignableScopesQuery,
  assignRecipeToScope as assignRecipeToScopeQuery,
  deactivateRecipe as deactivateRecipeQuery,
  updateRecipe,
  deprecateRecipe as deprecateRecipeQuery,
  undeprecateRecipe as undeprecateRecipeQuery,
  deleteRecipe as deleteRecipeQuery,
} from '@/lib/supabase/queries/recipes'
import { createClient } from '@/lib/supabase/server'
import { logAuditEvent } from '@/lib/supabase/queries/audit'
import type { RecipeScopeType } from '@/types/recipe'

/**
 * Server action to get assignable scopes (pods, rooms, batches, batch_groups)
 */
export async function getAssignableScopes(
  organizationId: string,
  scopeType: RecipeScopeType
): Promise<{
  data: Array<{ id: string; name: string; location?: string }> | null
  error: string | null
}> {
  try {
    const { data, error } = await getAssignableScopesQuery(organizationId, scopeType)
    
    if (error) {
      console.error('Error fetching assignable scopes:', error)
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to fetch assignable scopes',
      }
    }
    
    return { data, error: null }
  } catch (err) {
    console.error('Unexpected error in getAssignableScopes:', err)
    return {
      data: null,
      error: err instanceof Error ? err.message : 'An unexpected error occurred',
    }
  }
}

/**
 * Server action to assign a recipe to a scope
 */
export async function assignRecipeToScope(
  recipeId: string,
  recipeVersionId: string,
  scopeType: RecipeScopeType,
  scopeId: string,
  scopeName: string,
  userId: string,
  activatedAt: string
): Promise<{
  data: { id: string } | null
  error: string | null
}> {
  try {
    const { data, error } = await assignRecipeToScopeQuery(
      recipeId,
      recipeVersionId,
      scopeType,
      scopeId,
      scopeName,
      userId,
      activatedAt
    )
    
    if (error) {
      console.error('Error assigning recipe to scope:', error)
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to assign recipe',
      }
    }
    
    return { data, error: null }
  } catch (err) {
    console.error('Unexpected error in assignRecipeToScope:', err)
    return {
      data: null,
      error: err instanceof Error ? err.message : 'An unexpected error occurred',
    }
  }
}

/**
 * Server action to deactivate a recipe activation
 */
export async function deactivateRecipe(
  activationId: string,
  userId: string,
  reason?: string
): Promise<{
  data: boolean
  error: string | null
}> {
  try {
    const { data, error } = await deactivateRecipeQuery(activationId, userId, reason)
    
    if (error) {
      console.error('Error deactivating recipe:', error)
      return {
        data: false,
        error: error instanceof Error ? error.message : 'Failed to deactivate recipe',
      }
    }
    
    return { data: data || false, error: null }
  } catch (err) {
    console.error('Unexpected error in deactivateRecipe:', err)
    return {
      data: false,
      error: err instanceof Error ? err.message : 'An unexpected error occurred',
    }
  }
}

/**
 * Server action to publish a draft recipe
 */
export async function publishRecipe(
  recipeId: string
): Promise<{
  data: { id: string; status: string } | null
  error: string | null
}> {
  try {
    const supabase = await createClient()
    const { data: authData, error: authError } = await supabase.auth.getUser()
    const user = authData?.user

    if (authError) {
      console.error('Auth error when publishing recipe:', authError)
    }

    if (!user) {
      return {
        data: null,
        error: 'User not authenticated',
      }
    }

    const { data: currentRecipe, error: currentRecipeError } = await supabase
      .from('recipes')
      .select('status, current_version')
      .eq('id', recipeId)
      .single()

    if (currentRecipeError && currentRecipeError.code !== 'PGRST116') {
      console.error('Error fetching recipe before publish:', currentRecipeError)
    }

    const { data, error } = await updateRecipe(recipeId, {
      status: 'published',
      published_at: new Date().toISOString(),
    })
    
    if (error) {
      console.error('Error publishing recipe:', error)
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to publish recipe',
      }
    }

    if (data) {
      try {
        await logAuditEvent(
          user.id,
          'recipe',
          recipeId,
          'recipe.published',
          {
            status: {
              from: currentRecipe?.status ?? null,
              to: data.status,
            },
          },
          {
            published_at: data.published_at,
            current_version: data.current_version,
          }
        )
      } catch (auditError) {
        console.error('Failed to log recipe.published audit event:', auditError)
      }
    }
    
    return { 
      data: data ? { id: data.id, status: data.status } : null, 
      error: null 
    }
  } catch (err) {
    console.error('Unexpected error in publishRecipe:', err)
    return {
      data: null,
      error: err instanceof Error ? err.message : 'An unexpected error occurred',
    }
  }
}

/**
 * Server action to deprecate a recipe
 */
export async function deprecateRecipe(
  recipeId: string,
  userId: string,
  reason?: string
): Promise<{
  data: boolean
  activeCount?: number
  error: string | null
}> {
  try {
    const { data, error, activeCount } = await deprecateRecipeQuery(recipeId, userId, reason)
    
    if (error) {
      console.error('Error deprecating recipe:', error)
      return {
        data: false,
        error: error instanceof Error ? error.message : 'Failed to deprecate recipe',
      }
    }
    
    return { data, activeCount, error: null }
  } catch (err) {
    console.error('Unexpected error in deprecateRecipe:', err)
    return {
      data: false,
      error: err instanceof Error ? err.message : 'An unexpected error occurred',
    }
  }
}

/**
 * Server action to undeprecate a recipe (restore to published/applied)
 */
export async function undeprecateRecipe(
  recipeId: string,
  userId: string
): Promise<{
  data: boolean
  error: string | null
}> {
  try {
    const { data, error } = await undeprecateRecipeQuery(recipeId, userId)
    
    if (error) {
      console.error('Error undeprecating recipe:', error)
      return {
        data: false,
        error: error instanceof Error ? error.message : 'Failed to restore recipe',
      }
    }
    
    return { data, error: null }
  } catch (err) {
    console.error('Unexpected error in undeprecateRecipe:', err)
    return {
      data: false,
      error: err instanceof Error ? err.message : 'An unexpected error occurred',
    }
  }
}

/**
 * Server action to get active recipes for multiple scopes (for fleet monitoring)
 */
export async function getActiveRecipesForScopes(
  scopeType: RecipeScopeType,
  scopeIds: string[]
): Promise<{
  data: Record<string, {
    recipeName: string
    stageName: string
    currentDay: number
    totalDays: number
  } | null> | null
  error: string | null
}> {
  try {
    const supabase = await createClient()
    
    // Fetch all active recipes for the given scopes
    const { data: activations, error } = await supabase
      .from('recipe_activations')
      .select(`
        scope_id,
        current_stage_day,
        recipe:recipes(name),
        current_stage:recipe_stages(
          name,
          duration_days
        )
      `)
      .eq('scope_type', scopeType)
      .in('scope_id', scopeIds)
      .eq('is_active', true)
    
    if (error) {
      console.error('Error fetching active recipes for scopes:', error)
      return {
        data: null,
        error: error.message,
      }
    }
    
    // Transform to a map keyed by scope_id
    const recipesMap: Record<string, {
      recipeName: string
      stageName: string
      currentDay: number
      totalDays: number
    } | null> = {}
    
    // Type for the activation with nested relations
    type ActivationWithRecipe = {
      scope_id: string
      current_stage_day: number
      recipe: { name: string } | { name: string }[] | null
      current_stage: { name: string; duration_days: number } | { name: string; duration_days: number }[] | null
    }
    
    for (const scopeId of scopeIds) {
      const activation = activations?.find((a: ActivationWithRecipe) => a.scope_id === scopeId) as ActivationWithRecipe | undefined
      
      if (activation && activation.recipe && activation.current_stage) {
        const recipe = Array.isArray(activation.recipe) ? activation.recipe[0] : activation.recipe
        const stage = Array.isArray(activation.current_stage) ? activation.current_stage[0] : activation.current_stage
        
        if (recipe && stage) {
          recipesMap[scopeId] = {
            recipeName: recipe.name,
            stageName: stage.name,
            currentDay: activation.current_stage_day,
            totalDays: stage.duration_days,
          }
        } else {
          recipesMap[scopeId] = null
        }
      } else {
        recipesMap[scopeId] = null
      }
    }
    
    return { data: recipesMap, error: null }
  } catch (err) {
    console.error('Unexpected error in getActiveRecipesForScopes:', err)
    return {
      data: null,
      error: err instanceof Error ? err.message : 'An unexpected error occurred',
    }
  }
}

/**
 * Server action to delete a recipe
 * - Draft recipes: permanently deleted
 * - Published/deprecated recipes: archived (soft delete)
 * - Applied recipes: cannot be deleted
 */
export async function deleteRecipe(
  recipeId: string
): Promise<{
  success: boolean
  error: string | null
}> {
  try {
    const supabase = await createClient()
    const { data: authData, error: authError } = await supabase.auth.getUser()
    const user = authData?.user

    if (authError || !user) {
      return {
        success: false,
        error: 'User not authenticated',
      }
    }

    // First, check the recipe status
    const { data: recipe, error: fetchError } = await supabase
      .from('recipes')
      .select('id, name, status')
      .eq('id', recipeId)
      .single()

    if (fetchError) {
      console.error('Error fetching recipe for deletion:', fetchError)
      return {
        success: false,
        error: 'Recipe not found',
      }
    }

    const status = recipe.status.toLowerCase()

    // Check if recipe is applied - prevent deletion
    if (status === 'applied') {
      return {
        success: false,
        error: 'Cannot delete an applied recipe. Deactivate all applications first.',
      }
    }

    // Check if recipe has active activations
    const { data: activeActivations, error: activationsError } = await supabase
      .from('recipe_activations')
      .select('id')
      .eq('recipe_id', recipeId)
      .eq('is_active', true)
      .limit(1)

    if (activationsError) {
      console.error('Error checking recipe activations:', activationsError)
    }

    if (activeActivations && activeActivations.length > 0) {
      return {
        success: false,
        error: 'Cannot delete a recipe with active applications. Deactivate all applications first.',
      }
    }

    // Determine delete type based on status
    // Draft recipes are permanently deleted, published/deprecated are archived
    const isDraft = status === 'draft'
    const { data, error } = await deleteRecipeQuery(recipeId, isDraft)

    if (error) {
      console.error('Error deleting recipe:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete recipe',
      }
    }

    // Log audit event
    try {
      await logAuditEvent(
        user.id,
        'recipe',
        recipeId,
        isDraft ? 'recipe.permanently_deleted' : 'recipe.archived',
        {
          status: {
            from: recipe.status,
            to: isDraft ? 'deleted' : 'archived',
          },
        },
        {
          recipe_name: recipe.name,
          deletion_type: isDraft ? 'permanent' : 'soft',
        }
      )
    } catch (auditError) {
      console.error('Failed to log recipe deletion audit event:', auditError)
    }

    return { success: true, error: null }
  } catch (err) {
    console.error('Unexpected error in deleteRecipe:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'An unexpected error occurred',
    }
  }
}
