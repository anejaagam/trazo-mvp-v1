import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { canPerformAction } from '@/lib/rbac/guards'
import { MetrcCredentialsManager } from '@/components/features/admin/metrc-credentials-manager'

export const metadata: Metadata = {
  title: 'Metrc Integration - Trazo Admin',
  description: 'Connect your Metrc account and manage compliance integration',
}

export default async function ComplianceKeysPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/auth/login')
  }

  // Check permissions
  const { data: userData } = await supabase
    .from('users')
    .select('role, organization_id')
    .eq('id', user.id)
    .single()

  if (!userData) {
    redirect('/dashboard')
  }

  // Check if user has compliance:sync permission
  if (!canPerformAction(userData.role, 'compliance:sync').allowed) {
    redirect('/dashboard')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-display-4 font-semibold text-brand-dark-green-700">
          Metrc Integration
        </h1>
        <p className="text-body-base text-slate-600 mt-2">
          Connect your Metrc account to enable compliance tracking. Enter your User API Key to get started.
        </p>
      </div>

      <MetrcCredentialsManager />
    </div>
  )
}
