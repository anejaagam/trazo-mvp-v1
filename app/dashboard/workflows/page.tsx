import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { canPerformAction } from '@/lib/rbac/guards';
import { getMyTasks, getTasks } from '@/lib/supabase/queries/workflows';
import { WorkflowsDashboardClient } from './workflows-dashboard-client';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import type { Task } from '@/types/workflow';

export default async function WorkflowsDashboardPage() {
  const supabase = await createClient();
  
  // Check authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/auth/login');
  }

  // Get user data
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('role, id, organization_id')
    .eq('id', user.id)
    .single();

  if (!userData) {
    console.error('User data not found for:', user.id, userError);
    redirect('/dashboard');
  }

  // Get user's site assignment
  const { data: siteAssignment } = await supabase
    .from('user_site_assignments')
    .select('site_id')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single();

  const site_id = siteAssignment?.site_id;

  // Check permissions
  const permissionCheck = canPerformAction(userData.role, 'task:view');
  if (!permissionCheck.allowed) {
    console.error('Permission denied for role:', userData.role, 'reason:', permissionCheck.reason);
    redirect('/dashboard');
  }

  const canCreateTask = canPerformAction(userData.role, 'task:create').allowed;
  const canViewTasks = permissionCheck.allowed;

  // Get user's tasks (with error handling)
  let myTasks: Task[] = [];
  let allTasks: Task[] = [];
  
  try {
    const myTasksResult = await getMyTasks();
    myTasks = myTasksResult.data || [];

    // Get all tasks for the site (if user has permission and has a site)
    if (canViewTasks && site_id) {
      const allTasksResult = await getTasks(
        { site_id },
        { page: 1, pageSize: 200, sortBy: 'due_date', sortOrder: 'asc' }
      );
      allTasks = allTasksResult.data || [];
    } else {
      allTasks = myTasks;
    }
  } catch (error) {
    console.error('Error fetching tasks:', error);
    // Continue with empty arrays if there's an error
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Workflows & Tasks</h1>
          <p className="text-muted-foreground">
            Manage and execute your tasks and standard operating procedures
          </p>
        </div>
        {canCreateTask && (
          <Button asChild>
            <Link href="/dashboard/workflows/tasks/new">
              <Plus className="mr-2 h-4 w-4" />
              Create Task
            </Link>
          </Button>
        )}
      </div>

      {myTasks.length === 0 && allTasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 px-4 border-2 border-dashed rounded-lg">
          <div className="text-center max-w-md">
            <svg className="mx-auto h-12 w-12 text-muted-foreground mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <h3 className="text-lg font-semibold mb-2">No tasks found</h3>
            <p className="text-muted-foreground mb-6">The workflow system is ready to use. Create SOP templates and assign tasks to get started.</p>
          </div>
        </div>
      ) : (
        <WorkflowsDashboardClient 
          myTasks={myTasks}
          allTasks={allTasks}
          userId={user.id}
          canCreateTask={canCreateTask}
        />
      )}
    </div>
  );
}
