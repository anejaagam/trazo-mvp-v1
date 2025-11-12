'use server'

import {
  getAssignableScopes as getAssignableScopesQuery,
  assignRecipeToScope as assignRecipeToScopeQuery,
  updateRecipe,
} from '@/lib/supabase/queries/recipes'
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
 * Server action to publish a draft recipe
 */
export async function publishRecipe(
  recipeId: string
): Promise<{
  data: { id: string; status: string } | null
  error: string | null
}> {
  try {
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
