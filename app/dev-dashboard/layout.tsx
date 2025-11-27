import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DevSidebar } from '@/components/features/dev/dev-sidebar'
import { Toaster } from '@/components/ui/sonner'

export const metadata = {
  title: 'Dev Dashboard | TRAZO',
  description: 'TRAZO Developer Dashboard - Platform monitoring and organization approvals',
}

export default async function DevDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/dev-auth/login')
  }

  // Check if user is a developer
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('role, full_name, email')
    .eq('id', user.id)
    .single()

  if (userError || !userData || userData.role !== 'developer') {
    // Not a developer, redirect to dev login with error
    redirect('/dev-auth/login')
  }

  // Get pending approvals count
  const { count: pendingCount } = await supabase
    .from('organizations')
    .select('id', { count: 'exact', head: true })
    .eq('approval_status', 'pending')

  // Get recent error count (last 24 hours)
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { count: errorCount } = await supabase
    .from('error_logs')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', twentyFourHoursAgo)

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900">
      {/* Sidebar */}
      <DevSidebar
        developerId={user.id}
        developerName={userData.full_name || 'Developer'}
        developerEmail={userData.email || user.email || ''}
        pendingCount={pendingCount || 0}
        errorCount={errorCount || 0}
      />

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Banner */}
        <div className="flex h-10 items-center justify-center bg-purple-600 text-xs text-white">
          Developer Dashboard — For internal use only
        </div>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>

      {/* Toast notifications for critical errors */}
      <Toaster position="top-right" richColors />
    </div>
  )
}
