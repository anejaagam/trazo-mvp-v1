/**
 * Waste Management Page
 *
 * Main waste management dashboard with disposal logs and analytics
 * Implements Phase 8 of the Waste Management system
 */

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { canPerformAction } from '@/lib/rbac/guards'
import { isDevModeActive, DEV_MOCK_USER, logDevMode } from '@/lib/dev-mode'
import { getOrCreateDefaultSite } from '@/lib/supabase/queries/sites'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Plus, ClipboardList, BarChart3 } from 'lucide-react'
import Link from 'next/link'
import { WasteLogsTable } from '@/components/features/waste/waste-logs-table'
import { WasteAnalyticsDashboard } from '@/components/features/waste/waste-analytics-dashboard'

export default async function WasteManagementPage() {
  let userRole: string
  let siteId: string
  let organizationId: string
  let userId: string
  let canCreate: boolean

  // DEV MODE: Use mock data
  if (isDevModeActive()) {
    logDevMode('Waste Management Page')
    userRole = DEV_MOCK_USER.role
    siteId = DEV_MOCK_USER.site_assignments[0].site_id
    organizationId = DEV_MOCK_USER.organization_id
    userId = DEV_MOCK_USER.id
    canCreate = true // Dev mode has all permissions
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

    // Check permission to view waste
    if (!canPerformAction(userData.role, 'waste:view')) {
      redirect('/dashboard')
    }

    // Check if user can create waste records
    canCreate = canPerformAction(userData.role, 'waste:create').allowed

    // Get site assignments
    const { data: siteAssignments } = await supabase
      .from('user_site_assignments')
      .select('site_id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .limit(1)

    userRole = userData.role
    organizationId = userData.organization_id
    userId = user.id

    // Get site_id from user_site_assignments or get/create default site
    if (siteAssignments?.[0]?.site_id) {
      siteId = siteAssignments[0].site_id
    } else {
      const { data: defaultSiteId } = await getOrCreateDefaultSite(organizationId)
      siteId = defaultSiteId || organizationId
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Waste Management</h1>
          <p className="text-muted-foreground">
            Track disposal logs, compliance, and waste analytics
          </p>
        </div>
        {canCreate && (
          <Link href="/dashboard/waste/record">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Record Disposal
            </Button>
          </Link>
        )}
      </div>

      {/* Tabs for Logs vs Analytics */}
      <Tabs defaultValue="logs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="logs" className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            Disposal Logs
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="logs" className="space-y-4">
          <WasteLogsTable
            siteId={siteId}
            userRole={userRole}
            userId={userId}
          />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <WasteAnalyticsDashboard
            siteId={siteId}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
