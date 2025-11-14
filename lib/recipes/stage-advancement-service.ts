import type { SupabaseClient } from '@supabase/supabase-js'

const MS_PER_DAY = 86_400_000
const MAX_ADVANCES_PER_RUN = 10

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ServiceClient = SupabaseClient<any, any, any>

type StageRecord = {
  id: string
  name: string | null
  duration_days: number | null
  order_index?: number | null
}

type RecipeRecord = {
  organization_id: string
  name: string | null
}

type ActivationRecord = {
  id: string
  recipe_id: string
  recipe_version_id: string
  scope_type: string
  scope_id: string
  scope_name: string | null
  activated_at: string | null
  current_stage_id: string | null
  current_stage_day: number | null
  stage_started_at: string | null
  is_active: boolean
  recipe: RecipeRecord | null
  current_stage: StageRecord | null
}

export interface StageAdvancementJobResult {
  processed: number
  dayIncrements: number
  stagesAdvanced: number
  activationsCompleted: number
  errors: string[]
  timestamp: string
}

export function calculateStageProgress(stageStartedAt: string | null, now: Date = new Date()): {
  daysElapsed: number
} | null {
  if (!stageStartedAt) return null

  const start = new Date(stageStartedAt)
  if (Number.isNaN(start.getTime())) {
    return null
  }

  const diffMs = now.getTime() - start.getTime()
  if (diffMs <= 0) {
    return { daysElapsed: 1 }
  }

  return {
    daysElapsed: Math.floor(diffMs / MS_PER_DAY) + 1,
  }
}

const baseActivationSelect = `
  id,
  recipe_id,
  recipe_version_id,
  scope_type,
  scope_id,
  scope_name,
  activated_at,
  current_stage_id,
  current_stage_day,
  stage_started_at,
  is_active,
  recipe:recipes(organization_id, name),
  current_stage:recipe_stages(id, name, duration_days, order_index)
`

function normaliseStage(stage: unknown): StageRecord | null {
  if (!stage) return null
  const value = Array.isArray(stage) ? stage[0] : stage
  if (!value) return null
  return {
    id: value.id,
    name: value.name ?? null,
    duration_days: value.duration_days ?? null,
    order_index: value.order_index ?? null,
  }
}

function normaliseRecipe(recipe: unknown): RecipeRecord | null {
  if (!recipe) return null
  const value = Array.isArray(recipe) ? recipe[0] : recipe
  if (!value) return null
  return {
    organization_id: value.organization_id,
    name: value.name ?? null,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normaliseActivation(raw: any): ActivationRecord {
  return {
    id: raw.id,
    recipe_id: raw.recipe_id,
    recipe_version_id: raw.recipe_version_id,
    scope_type: raw.scope_type,
    scope_id: raw.scope_id,
    scope_name: raw.scope_name ?? null,
    activated_at: raw.activated_at ?? null,
    current_stage_id: raw.current_stage_id ?? null,
    current_stage_day: raw.current_stage_day ?? null,
    stage_started_at: raw.stage_started_at ?? null,
    is_active: Boolean(raw.is_active),
    recipe: normaliseRecipe(raw.recipe),
    current_stage: normaliseStage(raw.current_stage),
  }
}

async function fetchActivation(
  supabase: ServiceClient,
  activationId: string
): Promise<ActivationRecord | null> {
  const { data, error } = await supabase
    .from('recipe_activations')
    .select(baseActivationSelect)
    .eq('id', activationId)
    .single()

  if (error) {
    console.error('Failed to refetch activation after advancement', { activationId, error })
    return null
  }

  return normaliseActivation(data)
}

async function insertAuditLog(
  supabase: ServiceClient,
  params: {
    organizationId?: string | null
    recipeId: string
    recipeName?: string | null
    scopeType: string
    scopeId: string
    scopeName?: string | null
    previousStage?: StageRecord | null
    nextStage?: StageRecord | null
    action: 'recipe.stage.advanced' | 'recipe.activation.completed'
    timestamp: string
  }
) {
  const {
    organizationId,
    recipeId,
    recipeName,
    scopeType,
    scopeId,
    scopeName,
    previousStage,
    nextStage,
    action,
    timestamp,
  } = params

  if (!organizationId) {
    return
  }

  const { error } = await supabase.from('audit_log').insert({
    organization_id: organizationId,
    user_id: null,
    action,
    entity_type: 'recipe',
    entity_id: recipeId,
    entity_name: recipeName ?? null,
    old_values: {
      stage_id: previousStage?.id ?? null,
      stage_name: previousStage?.name ?? null,
      scope_type: scopeType,
      scope_id: scopeId,
      scope_name: scopeName ?? null,
    },
    new_values:
      action === 'recipe.stage.advanced'
        ? {
            stage_id: nextStage?.id ?? null,
            stage_name: nextStage?.name ?? null,
          }
        : {
            status: 'completed',
            completed_at: timestamp,
          },
    metadata: {
      triggered_by: 'system',
      automation_type: 'cron',
      service: 'stage-advancement-service',
      reason: 'Automated stage progression based on duration',
    },
    timestamp,
  })

  if (error) {
    console.error('Failed to write audit_log entry for recipe stage advancement', error)
  }
}

export async function processStageAdvancements(
  supabase: ServiceClient,
  options?: { now?: Date }
): Promise<StageAdvancementJobResult> {
  const now = options?.now ?? new Date()
  const timestamp = now.toISOString()

  const result: StageAdvancementJobResult = {
    processed: 0,
    dayIncrements: 0,
    stagesAdvanced: 0,
    activationsCompleted: 0,
    errors: [],
    timestamp,
  }

  const { data: activations, error } = await supabase
    .from('recipe_activations')
    .select(baseActivationSelect)
    .eq('is_active', true)

  if (error) {
    const message = `Failed to load active recipe activations: ${error.message}`
    console.error(message)
    result.errors.push(message)
    return result
  }

  if (!activations || activations.length === 0) {
    return result
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const normalizedActivations = (activations as any[]).map(normaliseActivation)

  for (const rawActivation of normalizedActivations) {
    result.processed += 1
    let current = rawActivation
    let advanceIterations = 0

    while (current.is_active && advanceIterations < MAX_ADVANCES_PER_RUN) {
      advanceIterations += 1

      const stage = current.current_stage
      if (!stage || !current.stage_started_at) {
        break
      }

      const progress = calculateStageProgress(current.stage_started_at, now)
      if (!progress) {
        break
      }

      const stageDuration = Math.max(stage.duration_days ?? 1, 1)
      const targetDay = Math.min(progress.daysElapsed, stageDuration)

      const currentDay = current.current_stage_day ?? 1
      if (targetDay > currentDay) {
        const { error: dayUpdateError } = await supabase
          .from('recipe_activations')
          .update({
            current_stage_day: targetDay,
            updated_at: timestamp,
          })
          .eq('id', current.id)

        if (dayUpdateError) {
          const message = `Failed to update current_stage_day for activation ${current.id}: ${dayUpdateError.message}`
          console.error(message)
          result.errors.push(message)
          break
        }

        result.dayIncrements += 1
        current.current_stage_day = targetDay
      }

      if (progress.daysElapsed <= stageDuration) {
        break
      }

      const { error: advanceError } = await supabase.rpc('advance_recipe_stage', {
        p_activation_id: current.id,
        p_advanced_by: null,
      })

      if (advanceError) {
        const message = `Failed to advance recipe stage for activation ${current.id}: ${advanceError.message}`
        console.error(message)
        result.errors.push(message)
        break
      }

      result.stagesAdvanced += 1

      const refreshed = await fetchActivation(supabase, current.id)
      if (!refreshed) {
        const message = `Failed to refresh activation ${current.id} after stage advancement`
        console.error(message)
        result.errors.push(message)
        break
      }

      await insertAuditLog(supabase, {
        organizationId: current.recipe?.organization_id,
        recipeId: current.recipe_id,
        recipeName: current.recipe?.name ?? null,
        scopeType: current.scope_type,
        scopeId: current.scope_id,
        scopeName: current.scope_name ?? null,
        previousStage: current.current_stage,
        nextStage: refreshed.current_stage,
        action: refreshed.is_active ? 'recipe.stage.advanced' : 'recipe.activation.completed',
        timestamp,
      })

      if (!refreshed.is_active) {
        result.activationsCompleted += 1
        break
      }

      current = refreshed
    }
  }

  return result
}
