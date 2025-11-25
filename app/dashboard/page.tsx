import { redirect } from 'next/navigation'
import { Boxes, Sprout, Bell, Package } from 'lucide-react'
import { WelcomeBanner } from '@/components/features/onboarding/welcome-banner'
import { createClient } from '@/lib/supabase/server'
import { DashboardClient } from './dashboard-client'

type UserRow = { 
  role: string | null
  organization: { 
    jurisdiction: string | null
    id: string
  } | null
  site_id: string | null
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }

  // Get user data
  const { data: userData } = await supabase
    .from('users')
    .select('role, organization_id')
    .eq('id', user.id)
    .single()

  const userRole = userData?.role ?? null
  const organizationId = userData?.organization_id ?? ''
  const userId = user.id

  // Get site assignments
  const { data: siteAssignments } = await supabase
    .from('user_site_assignments')
    .select('site_id')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .limit(1)

  const siteId = siteAssignments?.[0]?.site_id ?? ''

  // Get organization data
  const { data: org } = await supabase
    .from('organizations')
    .select('jurisdiction')
    .eq('id', organizationId)
    .single()

  const jurisdictionId = org?.jurisdiction ?? null

  return (
    <div className="space-y-6">
      {/* Onboarding banner (shows once per browser) */}
      <WelcomeBanner role={userRole} jurisdictionId={jurisdictionId ?? undefined} />
      
      {/* Client-side dashboard content */}
      <DashboardClient 
        siteId={siteId}
        organizationId={organizationId}
        userId={userId}
        jurisdictionId={jurisdictionId}
      />
    </div>
  )
}