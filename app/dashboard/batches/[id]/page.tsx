import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { canPerformAction } from '@/lib/rbac/guards'
import type { JurisdictionId, PlantType } from '@/lib/jurisdiction/types'
import type { RoleKey } from '@/lib/rbac/types'
import { BatchDetailPage } from '@/components/features/batches/batch-detail-page'

interface Params {
  params: Promise<{ id: string }>
}

export default async function BatchDetailRoute({ params }: Params) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data: userRecord } = await supabase
    .from('users')
    .select('role, organization_id')
    .eq('id', user.id)
    .single()

  if (!userRecord || !canPerformAction(userRecord.role, 'batch:view')) {
    redirect('/dashboard')
  }

  const { data: org } = await supabase
    .from('organizations')
    .select('jurisdiction, plant_type')
    .eq('id', userRecord.organization_id)
    .single()

  const jurisdictionId = (org?.jurisdiction as JurisdictionId) || null
  const plantType = (org?.plant_type as PlantType) || 'cannabis'

  const { data: batch, error } = await supabase
    .from('batches')
    .select(
      `
        *,
        cultivar:cultivars(id, name, common_name),
        pod_assignments:batch_pod_assignments(
          id,
          pod_id,
          plant_count,
          assigned_at,
          removed_at,
          pod:pods(id, name)
        )
      `
    )
    .eq('id', id)
    .single()

  if (!batch || error) {
    redirect('/dashboard/batches')
  }

  return (
    <BatchDetailPage
      batch={batch}
      userId={user.id}
      userRole={userRecord.role as RoleKey}
      jurisdictionId={jurisdictionId}
      plantType={plantType}
    />
  )
}
