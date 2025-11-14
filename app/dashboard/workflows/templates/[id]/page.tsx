import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { canPerformAction } from '@/lib/rbac/guards';
import { getTemplateById } from '@/lib/supabase/queries/workflows';
import { TemplateEditorWrapper } from '@/components/features/workflows/template-editor-wrapper';

interface EditTemplatePageProps {
  params: { id: string };
}

export default async function EditTemplatePage({ params }: EditTemplatePageProps) {
  const supabase = await createClient();
  
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

  // Check edit permission
  if (!canPerformAction(userRole, 'task:update').allowed) {
    redirect('/dashboard/workflows/templates');
  }

  // Fetch template
  const result = await getTemplateById(params.id);
  
  if (!result.data) {
    redirect('/dashboard/workflows/templates');
  }

  const canPublish = canPerformAction(userRole, 'task:update').allowed;

  return (
    <div className="container mx-auto py-6">
      <TemplateEditorWrapper
        template={result.data}
        isNew={false}
        isCopy={false}
        canPublish={canPublish}
      />
    </div>
  );
}
