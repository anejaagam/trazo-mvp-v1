import { redirect, notFound } from 'next/navigation'
import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { canPerformAction } from '@/lib/rbac/guards'
import { isDevModeActive, DEV_MOCK_USER, logDevMode } from '@/lib/dev-mode'
import { BatchDetailPage } from '@/components/features/batches/batch-detail-page'
import type { JurisdictionId, PlantType } from '@/lib/jurisdiction/types'
import type { BatchDetail } from '@/lib/supabase/queries/batches-client'
import type { RoleKey } from '@/lib/rbac/types'

interface BatchPageProps {
  params: Promise<{
    batchId: string
  }>
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `Batch Details | TRAZO`,
    description: 'Batch management and tracking',
  }
}

export default async function BatchPage(props: BatchPageProps) {
  const params = await props.params
  const { batchId } = params
  let userRole: RoleKey
  let userId: string
  let jurisdictionId: JurisdictionId | null = null
  const plantType: PlantType = 'cannabis'

  // DEV MODE: Use mock data
  if (isDevModeActive()) {
    logDevMode('Using dev mode for batch detail page')
    userRole = DEV_MOCK_USER.role as RoleKey
    userId = DEV_MOCK_USER.id
  } else {
    // PRODUCTION MODE: Get actual user data
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      redirect('/auth/login')
    }

    // Get user data
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, organization_id')
      .eq('id', user.id)
      .single()

    if (!userData || userError) {
      redirect('/auth/login')
    }

    // Check permission
    if (!canPerformAction(userData.role, 'batch:view')) {
      redirect('/dashboard')
    }

    userRole = userData.role
    userId = user.id

    // Get organization jurisdiction
    if (userData.organization_id) {
      const { data: orgData } = await supabase
        .from('organizations')
        .select('jurisdiction_id')
        .eq('id', userData.organization_id)
        .single()
      
      if (orgData?.jurisdiction_id) {
        jurisdictionId = orgData.jurisdiction_id as JurisdictionId
      }
    }
  }

  // Fetch batch detail using server client
  const supabase = await createClient()
  
  const { data: batchData, error } = await supabase
    .from('batches')
    .select(
      `
        *,
        cultivar:cultivars(id, name, strain_type),
        pod_assignments:batch_pod_assignments(
          id,
          batch_id,
          pod_id,
          plant_count,
          assigned_at,
          removed_at,
          notes,
          pod:pods(
            id,
            name,
            max_plant_count,
            status,
            room:rooms(id, name)
          )
        ),
        stage_history:batch_stage_history(
          id,
          stage,
          started_at,
          ended_at,
          notes,
          transitioned_by
        ),
        quality_metrics:batch_quality_metrics(
          id,
          metric_type,
          value,
          unit,
          recorded_at,
          recorded_by,
          notes,
          lab_certified
        ),
        events:batch_events(
          id,
          event_type,
          to_value,
          timestamp,
          notes,
          user_id
        )
      `
    )
    .eq('id', batchId)
    .single()
  
  if (error || !batchData) {
    console.error('Error fetching batch:', error)
    notFound()
  }

  const batchDetail = batchData as BatchDetail

  // Fetch telemetry for assigned pods using the same logic as monitoring page
  const activeAssignments = batchDetail.pod_assignments?.filter((assignment) => !assignment.removed_at) || []
  const podIds = activeAssignments.map((assignment) => assignment.pod_id).filter(Boolean)
  
  if (podIds.length > 0) {
    const { getLatestReading } = await import('@/app/actions/monitoring')
    const telemetryPromises = podIds.map(async (podId) => {
      const result = await getLatestReading(podId)
      return result.data
    })
    
    const telemetryResults = await Promise.all(telemetryPromises)
    batchDetail.telemetry_snapshots = telemetryResults.filter((r): r is NonNullable<typeof r> => r !== null)
  }

  // Fetch active recipe for this batch
  const { data: activeRecipeData } = await supabase
    .from('recipe_activations')
    .select(`
      *,
      recipe:recipes(*),
      recipe_version:recipe_versions(*)
    `)
    .eq('scope_type', 'batch')
    .eq('scope_id', batchId)
    .eq('is_active', true)
    .maybeSingle()

  if (activeRecipeData) {
    // Fetch stages with setpoints for this recipe version
    const { data: stages } = await supabase
      .from('recipe_stages')
      .select(`
        *,
        setpoints:environmental_setpoints(*),
        nutrient_formula:nutrient_formulas(*)
      `)
      .eq('recipe_version_id', activeRecipeData.recipe_version_id)
      .order('order_index', { ascending: true })

    // Get current stage with setpoints
    const currentStage = stages?.find((s) => s.id === activeRecipeData.current_stage_id)
    const currentSetpoints = currentStage?.setpoints || []

    batchDetail.active_recipe_detail = {
      activation: {
        ...activeRecipeData,
        current_stage: currentStage || null,
      },
      stages: stages || [],
      current_setpoints: currentSetpoints,
      active_overrides: [],
    }

    if (activeRecipeData.recipe) {
      batchDetail.active_recipe = {
        id: activeRecipeData.recipe.id,
        name: activeRecipeData.recipe.name,
        stage: currentStage?.name || null,
        applied_at: activeRecipeData.activated_at || null,
      }
    }
  }

  return (
    <BatchDetailPage
      batch={batchDetail}
      userId={userId}
      userRole={userRole}
      jurisdictionId={jurisdictionId}
      plantType={plantType}
    />
  )
}

