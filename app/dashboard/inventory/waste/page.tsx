/**
 * Waste Tracking Page
 * 
 * Track and document inventory waste/disposal
 * Note: Full waste tracking with disposal workflow is part of Phase 4 (deferred)
 */

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { canPerformAction } from '@/lib/rbac/guards'
import { isDevModeActive, logDevMode } from '@/lib/dev-mode'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Info, Trash2 } from 'lucide-react'

export default async function WasteTrackingPage() {
  // DEV MODE: Use mock data
  if (isDevModeActive()) {
    logDevMode('Waste Tracking Page')
  } else {
    // PRODUCTION MODE: Get actual user data
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      redirect('/auth/login')
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!userData) {
      redirect('/auth/login')
    }

    // Check permission
    if (!canPerformAction(userData.role, 'inventory:view')) {
      redirect('/dashboard')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Waste Tracking</h1>
          <p className="text-muted-foreground mt-2">
            Track and document inventory waste and disposal
          </p>
        </div>
      </div>

      {/* Coming Soon Notice */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Full waste tracking with disposal workflow, witness signatures, and photo documentation
          is currently in development as part of Phase 4.
        </AlertDescription>
      </Alert>

      {/* Placeholder Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Waste</CardTitle>
            <Trash2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">
              Coming soon
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Disposal</CardTitle>
            <Trash2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">
              Coming soon
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Trash2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">
              Coming soon
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Feature Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Planned Features</CardTitle>
          <CardDescription>
            Comprehensive waste tracking capabilities coming in Phase 4
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <div className="mt-0.5 h-4 w-4 rounded-full bg-muted flex items-center justify-center text-xs">
                1
              </div>
              <span>
                <strong>Waste Documentation:</strong> Record waste events with quantity, reason, and compliance notes
              </span>
            </li>
            <li className="flex items-start gap-2">
              <div className="mt-0.5 h-4 w-4 rounded-full bg-muted flex items-center justify-center text-xs">
                2
              </div>
              <span>
                <strong>Disposal Workflow:</strong> Multi-step disposal process with witness signatures
              </span>
            </li>
            <li className="flex items-start gap-2">
              <div className="mt-0.5 h-4 w-4 rounded-full bg-muted flex items-center justify-center text-xs">
                3
              </div>
              <span>
                <strong>Photo Evidence:</strong> Attach before/after photos of disposal
              </span>
            </li>
            <li className="flex items-start gap-2">
              <div className="mt-0.5 h-4 w-4 rounded-full bg-muted flex items-center justify-center text-xs">
                4
              </div>
              <span>
                <strong>Compliance Reports:</strong> Generate waste reports for regulatory submissions
              </span>
            </li>
            <li className="flex items-start gap-2">
              <div className="mt-0.5 h-4 w-4 rounded-full bg-muted flex items-center justify-center text-xs">
                5
              </div>
              <span>
                <strong>Metrc Integration:</strong> Auto-sync waste data with state tracking systems
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
