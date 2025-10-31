import { redirect, notFound } from 'next/navigation'
import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { canPerformAction } from '@/lib/rbac/guards'
import { isDevModeActive, DEV_MOCK_USER, logDevMode } from '@/lib/dev-mode'
import { PodDetailDashboard } from '@/components/features/monitoring/pod-detail-dashboard'

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

  return (
    <PodDetailDashboard
      podId={podId}
      podName={podName}
      roomName={roomName}
      userRole={userRole}
      userId={userId}
      deviceToken={deviceToken}
    />
  )
}
