import { redirect, notFound } from 'next/navigation'
import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { canPerformAction } from '@/lib/rbac/guards'
import { isDevModeActive, DEV_MOCK_USER, logDevMode } from '@/lib/dev-mode'
import { PodDetailDashboard } from '@/components/features/monitoring/pod-detail-dashboard'
import { ActiveRecipeDisplay } from '@/components/features/recipes/active-recipe-display'
import type { ActiveRecipeDetails, StageType, EnvironmentalSetpoint, NutrientFormula } from '@/types/recipe'

interface PodDetailPageProps {
  params: Promise<{
    podId: string
  }>
}

export async function generateMetadata({ params }: PodDetailPageProps): Promise<Metadata> {
  const { podId } = await params
  
  return {
    title: `Pod ${podId.slice(0, 8)} | TRAZO`,
    description: 'Real-time environmental monitoring for cultivation pod',
  }
}

export default async function PodDetailPage({ params }: PodDetailPageProps) {
  const { podId } = await params
  let userRole: string
  let userId: string
  let podExists = false
  let podName = 'Pod'
  let roomName = 'Room'
  let deviceToken: string | null = null
  let activeRecipe: ActiveRecipeDetails | null = null

  // DEV MODE: Use mock data
  if (isDevModeActive()) {
    logDevMode('Using dev mode for pod detail page')
    userRole = DEV_MOCK_USER.role
    userId = DEV_MOCK_USER.id
    podExists = true
    podName = 'Dev Pod'
    roomName = 'Dev Room'
    deviceToken = process.env.TAGOIO_DEVICE_TOKEN || null
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
      .select('role')
      .eq('id', user.id)
      .single()

    if (!userData || userError) {
      redirect('/auth/login')
    }

    // Check permission
    if (!canPerformAction(userData.role, 'monitoring:view')) {
      redirect('/dashboard')
    }

    // Check if pod exists and user has access
    // Use service client to bypass RLS for this query
    const { createServiceClient } = await import('@/lib/supabase/service')
    const serviceSupabase = createServiceClient('US')
    
    const { data: podData, error: podError } = await serviceSupabase
      .from('pods')
      .select(`
        id,
        name,
        tagoio_device_token,
        room_id,
        rooms!inner (
          name,
          site_id
        )
      `)
      .eq('id', podId)
      .single()

    if (podError || !podData) {
      notFound()
    }

    // Verify user has access to the pod's site
    // Skip this check if user is org_admin (they have access to all sites)
    if (userData.role !== 'org_admin') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const siteId = (podData.rooms as any)?.site_id
      if (siteId) {
        const { data: siteAccess } = await supabase
          .from('user_site_assignments')
          .select('site_id')
          .eq('user_id', user.id)
          .eq('site_id', siteId)
          .eq('is_active', true)
          .single()

        if (!siteAccess) {
          redirect('/dashboard/monitoring')
        }
      }
    }

    userRole = userData.role
    userId = user.id
    podExists = true
    podName = podData.name || 'Unknown Pod'
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    roomName = (podData.rooms as any)?.name || 'Unknown Room'
    deviceToken = podData.tagoio_device_token || null
  }

  if (!podExists) {
    notFound()
  }

  // Fetch active recipe for this pod using service client to bypass RLS
  console.log('🔍 Fetching active recipe for pod:', podId)
  const { createServiceClient } = await import('@/lib/supabase/service')
  const serviceSupabase = createServiceClient('US')
  
  // Query recipe_activations directly
  const { data: activationData, error: activationError } = await serviceSupabase
    .from('recipe_activations')
    .select(`
      *,
      recipe:recipes(*),
      recipe_version:recipe_versions(*)
    `)
    .eq('scope_type', 'pod')
    .eq('scope_id', podId)
    .eq('is_active', true)
    .order('activated_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  
  if (activationError) {
    console.error('❌ Error fetching active recipe:', activationError)
  } else if (activationData) {
    console.log('✅ Found active recipe:', {
      recipeId: activationData.recipe_id,
      recipeName: activationData.recipe?.name,
      scopeName: activationData.scope_name
    })
    
    // Fetch stages with setpoints
    const { data: stages } = await serviceSupabase
      .from('recipe_stages')
      .select(`
        *,
        setpoints:environmental_setpoints(*),
        nutrient_formula:nutrient_formulas(*)
      `)
      .eq('recipe_version_id', activationData.recipe_version_id)
      .order('order_index', { ascending: true })
    
    const currentStage = stages?.find((s: { id: string }) => s.id === activationData.current_stage_id)
    const currentSetpoints = currentStage?.setpoints || []
    
    activeRecipe = {
      activation: {
        ...activationData,
        current_stage: currentStage ? {
          id: currentStage.id,
          recipe_version_id: currentStage.recipe_version_id,
          name: currentStage.name,
          stage_type: currentStage.stage_type,
          order_index: currentStage.order_index,
          duration_days: currentStage.duration_days,
          description: currentStage.description,
          color_code: currentStage.color_code,
          created_at: currentStage.created_at,
          setpoints: currentStage.setpoints || [],
          nutrient_formula: currentStage.nutrient_formula?.[0] || null,
        } : undefined,
      },
      stages: stages?.map((stage: {
        id: string
        recipe_version_id: string
        name: string
        stage_type: StageType
        order_index: number
        duration_days: number
        description: string | null
        color_code: string | null
        created_at: string
        setpoints: EnvironmentalSetpoint[]
        nutrient_formula: NutrientFormula[] | null
      }) => ({
        id: stage.id,
        recipe_version_id: stage.recipe_version_id,
        name: stage.name,
        stage_type: stage.stage_type,
        order_index: stage.order_index,
        duration_days: stage.duration_days,
        description: stage.description,
        color_code: stage.color_code,
        created_at: stage.created_at,
        setpoints: stage.setpoints || [],
        nutrient_formula: stage.nutrient_formula?.[0] || null,
      })) || [],
      current_setpoints: currentSetpoints,
      active_overrides: [],
    }
  } else {
    console.log('ℹ️ No active recipe found for pod:', podId)
  }

  return (
    <>
      {/* Pod Monitoring Dashboard (includes Back to Fleet button at top) */}
      <PodDetailDashboard
        podId={podId}
        podName={podName}
        roomName={roomName}
        userRole={userRole}
        userId={userId}
        deviceToken={deviceToken}
        activeRecipe={activeRecipe}
      />
    </>
  )
}
