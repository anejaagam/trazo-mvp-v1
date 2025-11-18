/**
 * Edit Waste Disposal Page
 *
 * Edit existing waste disposal record (only editable within 24 hours)
 * Implements Phase 8 of the Waste Management system
 */

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { canPerformAction } from '@/lib/rbac/guards'
import { isDevModeActive, DEV_MOCK_USER, logDevMode } from '@/lib/dev-mode'
import { getOrCreateDefaultSite } from '@/lib/supabase/queries/sites'
import { getBatches } from '@/lib/supabase/queries/batches'
import { getInventoryItems } from '@/lib/supabase/queries/inventory'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { WasteRecordingForm } from '@/components/features/waste/waste-recording-form'
import { isEditable } from '@/types/waste'

export default async function EditWastePage({
  params,
}: {
  params: { id: string }
}) {
  let userRole: string
  let siteId: string
  let organizationId: string
  let userId: string

  // DEV MODE: Use mock data
  if (isDevModeActive()) {
    logDevMode('Edit Waste Page')
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

    // Check permission to update waste records
    if (!canPerformAction(userData.role, 'waste:update')) {
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

  // Fetch the waste log to edit
  const supabase = await createClient()
  const { data: wasteLog, error: wasteError } = await supabase
    .from('waste_logs')
    .select(`
      *,
      batch:batches(id, batch_number),
      inventory_item:inventory_items(id, name),
      performer:users!waste_logs_performed_by_fkey(id, full_name),
      witness:users!waste_logs_witnessed_by_fkey(id, full_name)
    `)
    .eq('id', params.id)
    .single()

  if (wasteError || !wasteLog) {
    redirect('/dashboard/waste')
  }

  // Check if waste log is editable (within 24 hours)
  if (!isEditable(wasteLog, userId)) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/waste/${params.id}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Details
            </Button>
          </Link>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            This waste log can no longer be edited. Records can only be edited within 24 hours of creation.
          </AlertDescription>
        </Alert>

        <Link href={`/dashboard/waste/${params.id}`}>
          <Button>View Details</Button>
        </Link>
      </div>
    )
  }

  // Fetch available batches (active batches only)
  const { data: batches } = await getBatches(organizationId, siteId, {
    status: ['active', 'in_progress'],
  })

  // Fetch available inventory items
  const { data: inventoryItems } = await getInventoryItems(siteId)

  // Fetch available users for witness selection
  const { data: users } = await supabase
    .from('users')
    .select('id, email, full_name, role')
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .order('full_name', { ascending: true })

  // Format data for the form
  const availableBatches = batches?.map(batch => ({
    id: batch.id,
    name: batch.batch_number || `Batch ${batch.id.slice(0, 8)}`,
  })) || []

  const availableInventoryItems = inventoryItems?.map(item => ({
    id: item.id,
    name: item.name,
  })) || []

  const availableUsers = users?.map(user => ({
    id: user.id,
    name: user.full_name || user.email,
    role: user.role,
  })) || []

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/waste/${params.id}`}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Details
          </Button>
        </Link>
      </div>

      {/* Page Title */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit Waste Disposal</h1>
        <p className="text-muted-foreground">
          Update waste disposal record
        </p>
      </div>

      {/* Alert about edit window */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Waste logs can only be edited within 24 hours of creation for compliance purposes.
        </AlertDescription>
      </Alert>

      {/* Recording Form Card */}
      <Card>
        <CardHeader>
          <CardTitle>Disposal Information</CardTitle>
          <CardDescription>
            Update the waste disposal information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <WasteRecordingForm
            siteId={siteId}
            organizationId={organizationId}
            userId={userId}
            userRole={userRole}
            availableBatches={availableBatches}
            availableInventoryItems={availableInventoryItems}
            availableUsers={availableUsers}
            existingWasteLog={wasteLog}
            isEditing={true}
          />
        </CardContent>
      </Card>
    </div>
  )
}
