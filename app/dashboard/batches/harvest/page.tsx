import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { canPerformAction } from '@/lib/rbac/guards'
import { isDevModeActive, DEV_MOCK_USER, logDevMode } from '@/lib/dev-mode'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default async function HarvestPage() {
  let _userRole: string

  if (isDevModeActive()) {
    logDevMode('Harvest Queue Page')
    _userRole = DEV_MOCK_USER.role
  } else {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      redirect('/auth/login')
    }

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!userData || userError) {
      redirect('/auth/login')
    }

    if (!canPerformAction(userData.role, 'batch:stage_change')) {
      redirect('/dashboard')
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _userRole = userData.role
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Harvest Queue</h1>
        <p className="text-muted-foreground">
          Manage batches ready for harvest and post-harvest processing
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
          <CardDescription>
            Harvest workflow features are under development
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This page will include harvest queue management, yield tracking, and post-harvest workflows.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
