import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { canPerformAction } from '@/lib/rbac/guards';
import { getMyTasks, getTasks } from '@/lib/supabase/queries/workflows';
import { WorkflowsDashboardClient } from './workflows-dashboard-client';

export default async function WorkflowsDashboardPage() {
  const supabase = await createClient();
  
  // Check authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/auth/login');
  }

  // Get user data
  const { data: userData } = await supabase
    .from('users')
    .select('role, site_id')
    .eq('id', user.id)
    .single();

  if (!userData) {
    redirect('/dashboard');
  }

  // Check permissions
  if (!canPerformAction(userData.role, 'task:view').allowed) {
    redirect('/dashboard');
  }

  // Get user's tasks
  const myTasksResult = await getMyTasks();
  const myTasks = myTasksResult.data || [];

  // Get all tasks for the site (if user has permission)
  let allTasks = myTasks;
  if (canPerformAction(userData.role, 'task:view').allowed) {
    const allTasksResult = await getTasks({ site_id: userData.site_id });
    allTasks = allTasksResult.data || [];
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Workflows & Tasks</h1>
        <p className="text-slate-600 mt-1">Manage and execute your tasks</p>
      </div>

      <WorkflowsDashboardClient 
        myTasks={myTasks}
        allTasks={allTasks}
        userId={user.id}
      />
    </div>
  );
}
