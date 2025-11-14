import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { canPerformAction } from '@/lib/rbac/guards';
import { getTemplateById } from '@/lib/supabase/queries/workflows';
import { TemplateEditorWrapper } from '@/components/features/workflows/template-editor-wrapper';
import { SOPTemplate } from '@/types/workflow';

interface NewTemplatePageProps {
  searchParams: { copy?: string };
}

export default async function NewTemplatePage({ searchParams }: NewTemplatePageProps) {
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

  // Check create permission
  if (!canPerformAction(userRole, 'tasks:create')) {
    redirect('/dashboard/workflows/templates');
  }

  // If copying, fetch the source template
  let sourceTemplate: SOPTemplate | null = null;
  if (searchParams.copy) {
    const result = await getTemplateById(searchParams.copy);
    sourceTemplate = result.data;
  }

  const canPublish = canPerformAction(userRole, 'tasks:approve');

  return (
    <div className="container mx-auto py-6">
      <TemplateEditorWrapper
        template={sourceTemplate}
        isNew={!searchParams.copy}
        isCopy={!!searchParams.copy}
        canPublish={canPublish}
      />
    </div>
  );
}
