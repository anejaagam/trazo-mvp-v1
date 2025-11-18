/**
 * Record Waste Disposal Page
 *
 * Multi-step form for recording waste disposal with compliance documentation
 * Implements Phase 8 of the Waste Management system
 */

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { canPerformAction } from '@/lib/rbac/guards'
import { isDevModeActive, DEV_MOCK_USER, logDevMode } from '@/lib/dev-mode'
import { getOrCreateDefaultSite } from '@/lib/supabase/queries/sites'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { WasteRecordingForm } from '@/components/features/waste/waste-recording-form'

export default async function RecordWastePage() {
  let userRole: string
  let siteId: string
  let organizationId: string
  let userId: string

  // DEV MODE: Use mock data
  if (isDevModeActive()) {
    logDevMode('Record Waste Page')
    userRole = DEV_MOCK_USER.role
    siteId = DEV_MOCK_USER.site_assignments[0].site_id
    organizationId = DEV_MOCK_USER.organization_id
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

    // Check permission to create waste records
    if (!canPerformAction(userData.role, 'waste:create')) {
      redirect('/dashboard/waste')
    }

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
      {/* Header with Back Button */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/waste">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Waste Management
          </Button>
        </Link>
      </div>

      {/* Page Title */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Record Waste Disposal</h1>
        <p className="text-muted-foreground">
          Document waste disposal with compliance requirements
        </p>
      </div>

      {/* Recording Form Card */}
      <Card>
        <CardHeader>
          <CardTitle>Disposal Information</CardTitle>
          <CardDescription>
            Complete all required steps to ensure compliance with regulatory requirements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <WasteRecordingForm
            siteId={siteId}
            organizationId={organizationId}
            userId={userId}
            userRole={userRole}
          />
        </CardContent>
      </Card>
    </div>
  )
}
