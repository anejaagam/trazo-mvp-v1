import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { canPerformAction } from '@/lib/rbac/guards';

export const metadata: Metadata = {
  title: 'API Tokens - Trazo Admin',
  description: 'Manage API tokens for programmatic access',
};

export default async function ApiTokensPage() {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    redirect('/auth/login');
  }

  // Check permissions
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!userData) {
    redirect('/dashboard');
  }

  const hasPermission = canPerformAction(userData.role, 'user:view');
  
  if (!hasPermission.allowed) {
    redirect('/dashboard');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-display-4 font-semibold text-brand-dark-green-700">
          API Tokens
        </h1>
        <p className="text-body-base text-slate-600 mt-2">
          Create and manage API tokens for programmatic access
        </p>
      </div>

      {/* API tokens table component will be added here */}
      <div className="rounded-lg border bg-white p-6">
        <p className="text-slate-600">API token management will be integrated here...</p>
      </div>
    </div>
  );
}
