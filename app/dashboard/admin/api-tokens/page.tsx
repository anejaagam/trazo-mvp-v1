import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PodDeviceTokenManager } from '@/components/features/admin/pod-device-token-manager';

export const metadata: Metadata = {
  title: 'API Tokens & Integrations - Trazo Admin',
  description: 'Configure third-party integration API tokens (TagoIO, Metrc, CTLS, DemeGrow)',
};

export default async function ApiTokensPage() {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    redirect('/auth/login');
  }

  // Check permissions - only org_admin and site_manager
  const { data: userData } = await supabase
    .from('users')
    .select('role, organization_id')
    .eq('id', user.id)
    .single();

  if (!userData) {
    redirect('/dashboard');
  }

  if (!['org_admin', 'site_manager'].includes(userData.role)) {
    redirect('/dashboard');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-display-4 font-semibold text-brand-dark-green-700">
          Pod Device Tokens
        </h1>
        <p className="text-body-base text-slate-600 mt-2">
          Configure TagoIO device tokens for each pod to enable automated telemetry collection
        </p>
      </div>
      
      <PodDeviceTokenManager />
    </div>
  );
}
