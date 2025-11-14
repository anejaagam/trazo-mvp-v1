import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { canPerformAction } from '@/lib/rbac/permissions';
import { getTemplates } from '@/lib/supabase/queries/workflows';
import { TemplateLibraryWrapper } from '@/components/features/workflows/template-library-wrapper';

export default async function WorkflowTemplatesPage() {
  const supabase = createClient();
  
  // Check authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/auth/login');
  }

  // Get user role
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  const userRole = userData?.role || '';

  // Check view permission
  if (!canPerformAction(userRole, 'tasks:view')) {
    redirect('/dashboard');
  }

  // Get user's organization
  const { data: orgData } = await supabase
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .single();

  if (!orgData?.organization_id) {
    redirect('/dashboard');
  }

  // Fetch templates
  const templatesResult = await getTemplates({
    is_latest_version: true, // Only show latest versions
  });

  const templates = templatesResult.data || [];

  // Check permissions
  const canCreate = canPerformAction(userRole, 'tasks:create');
  const canEdit = canPerformAction(userRole, 'tasks:edit');
  const canView = canPerformAction(userRole, 'tasks:view');

  return (
    <div className="container mx-auto py-6">
      <TemplateLibraryWrapper
        templates={templates}
        canCreate={canCreate}
        canEdit={canEdit}
        canView={canView}
      />
    </div>
  );
}
