'use server'

import {
  getAssignableScopes as getAssignableScopesQuery,
  assignRecipeToScope as assignRecipeToScopeQuery,
  deactivateRecipe as deactivateRecipeQuery,
  updateRecipe,
  deprecateRecipe as deprecateRecipeQuery,
  undeprecateRecipe as undeprecateRecipeQuery,
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
