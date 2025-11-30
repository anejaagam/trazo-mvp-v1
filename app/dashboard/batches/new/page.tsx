import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { canPerformAction } from '@/lib/rbac/guards'
import { isDevModeActive, DEV_MOCK_USER, logDevMode } from '@/lib/dev-mode'
import { getOrCreateDefaultSite } from '@/lib/supabase/queries/sites'
import { getServerSiteId } from '@/lib/site/server'
import type { JurisdictionId, PlantType } from '@/lib/jurisdiction/types'
import { BatchWizard } from '@/components/features/batches/batch-wizard'

export default async function NewBatchPage() {
  const supabase = await createClient()
  let siteId: string
  let organizationId: string
  let userId: string
  let jurisdictionId: JurisdictionId | null = null
  let plantType: PlantType = 'cannabis'

  if (isDevModeActive()) {
    logDevMode('Batch wizard page')
    siteId = DEV_MOCK_USER.site_assignments[0].site_id
    organizationId = DEV_MOCK_USER.organization_id
    userId = DEV_MOCK_USER.id
    const devJurisdiction = (DEV_MOCK_USER as { jurisdiction?: JurisdictionId | null }).jurisdiction
    jurisdictionId = devJurisdiction ?? null
    const devPlantType = (DEV_MOCK_USER as { plant_type?: PlantType }).plant_type
    plantType = devPlantType ?? 'cannabis'
  } else {
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

    if (!userRecord || !canPerformAction(userRecord.role, 'batch:create')) {
      redirect('/dashboard/batches')
    }

    organizationId = userRecord.organization_id
    userId = user.id

    // Get site_id from site context (cookie-based)
    const contextSiteId = await getServerSiteId()
    if (contextSiteId && contextSiteId !== 'all') {
      siteId = contextSiteId
    } else {
      // Fallback to default site if no site selected or "all sites" mode
      const { data: defaultSiteId } = await getOrCreateDefaultSite(userRecord.organization_id)
      siteId = defaultSiteId || userRecord.organization_id
    }

    const { data: org } = await supabase
      .from('organizations')
      .select('jurisdiction, plant_type')
      .eq('id', organizationId)
      .single()

    jurisdictionId = (org?.jurisdiction as JurisdictionId) || null
    plantType = (org?.plant_type as PlantType) || 'cannabis'
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">New batch</h1>
        <p className="text-muted-foreground">Use the wizard to capture domain-specific data and compliance notes.</p>
      </div>
      <BatchWizard
        organizationId={organizationId}
        siteId={siteId}
        userId={userId}
        jurisdictionId={jurisdictionId}
        plantType={plantType}
      />
    </div>
  )
}
