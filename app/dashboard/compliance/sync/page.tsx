/**
 * Compliance Sync Dashboard
 *
 * View and manage Metrc sync operations
 */

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { canPerformAction } from '@/lib/rbac/guards'
import { getMetrcSyncLog } from '@/lib/supabase/queries/compliance'
import { MetrcSyncDashboard } from '@/components/features/compliance/metrc-sync-dashboard'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TagInventoryView } from '@/components/features/tags/tag-inventory-view'

export default async function ComplianceSyncPage() {
  const supabase = await createClient()

  // Get authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Get user data
  const { data: userData } = await supabase
    .from('users')
    .select('role, organization_id')
    .eq('id', user.id)
    .single()

  if (!userData) {
    redirect('/dashboard')
  }

  // Check permissions
  if (!canPerformAction(userData.role, 'compliance:view')) {
    redirect('/dashboard')
  }

  // Get user's sites
  const { data: sites } = await supabase
    .from('sites')
    .select('id, name')
    .eq('organization_id', userData.organization_id)
    .order('name')

  // Get recent sync logs for all sites
  const syncLogs = await Promise.all(
    (sites || []).map(async (site) => {
      const { data } = await getMetrcSyncLog(site.id)
      return {
        siteId: site.id,
        siteName: site.name,
        logs: data || [],
      }
    })
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Compliance Management</h1>
        <p className="text-muted-foreground mt-2">
          Monitor Metrc sync operations and manage tag inventory
        </p>
      </div>

      <Tabs defaultValue="sync" className="space-y-6">
        <TabsList>
          <TabsTrigger value="sync">Metrc Sync</TabsTrigger>
          <TabsTrigger value="tags">Tag Inventory</TabsTrigger>
        </TabsList>

        <TabsContent value="sync">
          <MetrcSyncDashboard
            sites={sites || []}
            syncLogs={syncLogs}
            canSync={canPerformAction(userData.role, 'compliance:sync').allowed}
          />
        </TabsContent>

        <TabsContent value="tags">
          <TagInventoryView organizationId={userData.organization_id} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
