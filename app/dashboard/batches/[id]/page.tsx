import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BatchDetailView } from '@/components/features/batches/batch-detail-view'
import { canPerformAction } from '@/lib/rbac/guards'
import { isDevModeActive, DEV_MOCK_USER, logDevMode } from '@/lib/dev-mode'
import type { DomainBatch } from '@/types/batch'

interface BatchDetailPageProps {
  params: {
    id: string
  }
}

// Mock batch data for development mode
const MOCK_BATCH: DomainBatch = {
  id: 'batch-001',
  organization_id: DEV_MOCK_USER.organization_id,
  site_id: DEV_MOCK_USER.site_assignments[0].site_id,
  batch_number: 'BTH-2025-001',
  cultivar_id: 'cultivar-001',
  domain_type: 'cannabis',
  stage: 'flowering',
  plant_count: 50,
  start_date: '2025-01-15',
  expected_harvest_date: '2025-04-15',
  actual_harvest_date: undefined,
  parent_batch_id: undefined,
  status: 'active',
  metrc_batch_id: undefined,
  license_number: undefined,
  source_type: 'clone',
  source_batch_id: undefined,
  yield_weight_g: undefined,
  yield_units: undefined,
  waste_weight_g: undefined,
  quarantine_reason: undefined,
  quarantined_at: undefined,
  quarantined_by: undefined,
  quarantine_released_at: undefined,
  quarantine_released_by: undefined,
  notes: 'Test batch for development',
  created_by: DEV_MOCK_USER.id,
  created_at: '2025-01-15T08:00:00Z',
  updated_at: '2025-01-15T08:00:00Z',
  lighting_schedule: '18/6',
  thc_content: undefined,
  cbd_content: undefined,
  drying_date: undefined,
  curing_date: undefined,
  terpene_profile: undefined,
}

export default async function BatchDetailPage({ params }: BatchDetailPageProps) {
  let userRole: string
  let batch: DomainBatch

  // DEV MODE: Use mock data
  if (isDevModeActive()) {
    logDevMode('Batch Detail Page')
    userRole = DEV_MOCK_USER.role
    batch = MOCK_BATCH
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
    if (!canPerformAction(userData.role, 'batch:view')) {
      redirect('/dashboard')
    }

    // Fetch batch
    const { data: batchData, error: batchError } = await supabase
      .from('batches')
      .select('*')
      .eq('id', params.id)
      .single()

    if (batchError || !batchData) {
      redirect('/dashboard/batches')
    }

    userRole = userData.role
    batch = batchData as DomainBatch
  }

  return (
    <div className="space-y-6">
      <BatchDetailView
        batch={batch}
        userRole={userRole}
      />
    </div>
  )
}
