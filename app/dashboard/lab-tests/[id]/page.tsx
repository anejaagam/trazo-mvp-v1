import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LabTestDetailView } from '@/components/features/lab-tests/lab-test-detail-view'
import { canPerformAction } from '@/lib/rbac/guards'
import { isDevModeActive, DEV_MOCK_USER, logDevMode } from '@/lib/dev-mode'

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default async function LabTestDetailPage({ params }: PageProps) {
  const { id } = await params
  let userRole: string
  let userId: string
  let organizationId: string

  // DEV MODE: Use mock data
  if (isDevModeActive()) {
    logDevMode('Lab Test Detail Page')
    userRole = DEV_MOCK_USER.role
    userId = DEV_MOCK_USER.id
    organizationId = DEV_MOCK_USER.organization_id
  } else {
    // PRODUCTION MODE: Get actual user data
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      redirect('/login')
    }

    userId = user.id

    // Get user's organization and role
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('organization_id, role')
      .eq('id', user.id)
      .single()

    if (userError || !userData || !userData.organization_id) {
      console.error('Error fetching user data:', userError)
      redirect('/dashboard')
    }

    organizationId = userData.organization_id
    userRole = userData.role
  }

  // Check permissions
  const canView = canPerformAction(userRole as any, 'compliance:view').allowed
  if (!canView) {
    redirect('/dashboard')
  }

  return (
    <LabTestDetailView
      testId={id}
      userId={userId}
      userRole={userRole}
      organizationId={organizationId}
    />
  )
}