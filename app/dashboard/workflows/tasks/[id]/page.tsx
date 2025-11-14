import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { canPerformAction } from '@/lib/rbac/guards';
import { getTaskById, getTemplateById } from '@/lib/supabase/queries/workflows';
import { TaskExecutorWrapper } from './task-executor-wrapper';
import type { RoleKey } from '@/lib/rbac/types';

export default async function TaskExecutionPage(props: { 
  params: Promise<{ id: string }>
}) {
  const params = await props.params;
  const supabase = await createClient();
  
  // Check authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/auth/login');
  }

  // Get user data
  const { data: userData } = await supabase
    .from('users')
    .select('role, additional_permissions')
    .eq('id', user.id)
    .single();

  if (!userData) {
    redirect('/dashboard');
  }

  // Check permissions
  if (!canPerformAction(userData.role, 'task:view').allowed) {
    redirect('/dashboard');
  }

  // Get task data
  const taskResult = await getTaskById(params.id);
  
  if (taskResult.error || !taskResult.data) {
    redirect('/dashboard/workflows');
  }

  const task = taskResult.data;

  // Get template if task is based on one
  let template = null;
  if (task.sop_template_id) {
    const templateResult = await getTemplateById(task.sop_template_id);
    if (templateResult.data) {
      template = templateResult.data;
    }
  }

  // If no template, redirect back
  if (!template) {
    redirect('/dashboard/workflows');
  }

  // Check if user is assigned to this task (or has permission to execute any task)
  const canExecute = 
    task.assigned_to === user.id || 
    canPerformAction(userData.role, 'task:complete').allowed;

  if (!canExecute) {
    redirect('/dashboard/workflows');
  }

  return (
    <TaskExecutorWrapper 
      task={task} 
      template={template}
      userId={user.id}
      userRole={userData.role as RoleKey}
      additionalPermissions={userData.additional_permissions || []}
    />
  );
}
