import type { SupabaseClient } from '@supabase/supabase-js'

type GenericDatabase = Record<string, unknown>
export type AnySupabaseClient = SupabaseClient<GenericDatabase>

interface RecipeActivationRow {
  id: string
  recipe_id: string | null
  recipe_version_id: string | null
  recipe?: { id: string; name: string | null } | null
  scope_name?: string | null
}

interface SyncParams {
  supabase: AnySupabaseClient
  batchId: string
  podId: string
  userId: string
  batchNumber?: string | null
  podName?: string | null
}

export interface RecipeSyncResult {
  appliedToBatch: boolean
  appliedToPod: boolean
}

export async function syncPodAndBatchRecipes(params: SyncParams): Promise<RecipeSyncResult> {
  const { supabase, batchId, podId, userId } = params
  const result: RecipeSyncResult = {
    appliedToBatch: false,
    appliedToPod: false,
  }

  try {
    const [batchRecipeRes, podRecipeRes] = await Promise.all([
      supabase
        .from('recipe_activations')
        .select(
          `
          id,
          recipe_id,
          recipe_version_id,
          recipe:recipes(id, name)
        `
        )
        .eq('scope_type', 'batch')
        .eq('scope_id', batchId)
        .eq('is_active', true)
        .maybeSingle(),
      supabase
        .from('recipe_activations')
        .select(
          `
          id,
          recipe_id,
          recipe_version_id,
          recipe:recipes(id, name),
          scope_name
        `
        )
        .eq('scope_type', 'pod')
        .eq('scope_id', podId)
        .eq('is_active', true)
        .maybeSingle(),
    ])

    const batchRecipe = (batchRecipeRes?.data || null) as RecipeActivationRow | null
    const podRecipe = (podRecipeRes?.data || null) as RecipeActivationRow | null

    // If batch already has a recipe, ensure pod matches it
    if (batchRecipe?.recipe_id && batchRecipe.recipe_version_id) {
      const shouldSyncPod = !podRecipe?.recipe_id || podRecipe.recipe_id !== batchRecipe.recipe_id
      if (shouldSyncPod) {
        const podName = params.podName ?? (await getPodName(supabase, podId))
        const activated = await activateRecipeOnScope(supabase, {
          recipeId: batchRecipe.recipe_id,
          recipeVersionId: batchRecipe.recipe_version_id,
          scopeType: 'pod',
          scopeId: podId,
          scopeName: podName || podId,
          userId,
        })

        if (activated) {
          result.appliedToPod = true
          await logRecipeEvent(supabase, batchId, userId, {
            direction: 'batch_to_pod',
            recipe_id: batchRecipe.recipe_id,
            recipe_version_id: batchRecipe.recipe_version_id,
            pod_id: podId,
          })
        }
      }
    }

    // If batch lacks a recipe but pod has one, copy it to the batch
    if (!batchRecipe?.recipe_id && podRecipe?.recipe_id && podRecipe.recipe_version_id) {
      const batchNumber = params.batchNumber ?? (await getBatchNumber(supabase, batchId))
      const activated = await activateRecipeOnScope(supabase, {
        recipeId: podRecipe.recipe_id,
        recipeVersionId: podRecipe.recipe_version_id,
        scopeType: 'batch',
        scopeId: batchId,
        scopeName: batchNumber || batchId,
        userId,
      })

      if (activated) {
        result.appliedToBatch = true
        await logRecipeEvent(supabase, batchId, userId, {
          direction: 'pod_to_batch',
          recipe_id: podRecipe.recipe_id,
          recipe_version_id: podRecipe.recipe_version_id,
          pod_id: podId,
        })
      }
    }
  } catch (error) {
    console.error('Failed to sync recipes between batch and pod', error)
  }

  return result
}

interface ActivateParams {
  recipeId: string
  recipeVersionId: string
  scopeType: 'batch' | 'pod'
  scopeId: string
  scopeName: string
  userId: string
}

async function activateRecipeOnScope(
  supabase: AnySupabaseClient,
  params: ActivateParams
): Promise<boolean> {
  try {
    const { error } = await supabase.rpc('activate_recipe', {
      p_recipe_id: params.recipeId,
      p_recipe_version_id: params.recipeVersionId,
      p_scope_type: params.scopeType,
      p_scope_id: params.scopeId,
      p_scope_name: params.scopeName,
      p_activated_by: params.userId,
      p_scheduled_start: new Date().toISOString(),
    })

    if (error) throw error
    return true
  } catch (error) {
    console.error('Failed to activate recipe on scope', error)
    return false
  }
}

async function logRecipeEvent(
  supabase: AnySupabaseClient,
  batchId: string,
  userId: string,
  payload: Record<string, unknown>
) {
  try {
    await supabase.from('batch_events').insert({
      batch_id: batchId,
      event_type: 'recipe_applied',
      to_value: payload,
      user_id: userId,
      notes: 'Auto-sync via batch/pod assignment',
    })
  } catch (error) {
    console.error('Failed to log recipe sync event', error)
  }
}

async function getBatchNumber(supabase: AnySupabaseClient, batchId: string) {
  try {
    const { data } = await supabase
      .from('batches')
      .select('batch_number')
      .eq('id', batchId)
      .maybeSingle()
    return data?.batch_number as string | undefined
  } catch (error) {
    console.error('Failed to fetch batch number', error)
    return undefined
  }
}

async function getPodName(supabase: AnySupabaseClient, podId: string) {
  try {
    const { data } = await supabase
      .from('pods')
      .select('name')
      .eq('id', podId)
      .maybeSingle()
    return data?.name as string | undefined
  } catch (error) {
    console.error('Failed to fetch pod name', error)
    return undefined
  }
}

interface AdvanceParams {
  supabase: AnySupabaseClient
  batchId: string
  userId: string
}

export async function advanceRecipeStageForBatch({
  supabase,
  batchId,
  userId,
}: AdvanceParams): Promise<{ advanced: boolean }> {
  try {
    const { data, error } = await supabase
      .from('recipe_activations')
      .select('id')
      .eq('scope_type', 'batch')
      .eq('scope_id', batchId)
      .eq('is_active', true)
      .maybeSingle()

    if (error) throw error
    if (!data?.id) {
      return { advanced: false }
    }

    const { error: advanceError } = await supabase.rpc('advance_recipe_stage', {
      p_activation_id: data.id,
      p_user_id: userId,
    })

    if (advanceError) throw advanceError
    return { advanced: true }
  } catch (error) {
    console.error('Failed to advance recipe stage for batch', error)
    return { advanced: false }
  }
}
