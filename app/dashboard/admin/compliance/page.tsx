import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { canPerformAction } from '@/lib/rbac/guards'
import { MetrcApiKeyManager } from '@/components/features/admin/metrc-api-key-manager'

export const metadata: Metadata = {
  title: 'Compliance API Keys - Trazo Admin',
  description: 'Configure Metrc API keys for cannabis tracking compliance',
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
          Compliance API Keys
        </h1>
        <p className="text-body-base text-slate-600 mt-2">
          Manage Metrc API credentials for state-mandated cannabis tracking and compliance
        </p>
      </div>

      <MetrcApiKeyManager />
    </div>
  )
}
