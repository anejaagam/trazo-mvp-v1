import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { canPerformAction } from '@/lib/rbac/guards';
import { getPublishedTemplates, getTasks } from '@/lib/supabase/queries/workflows';
import { getActiveBatches } from '@/lib/supabase/queries/batches';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

type BatchResultRow = {
  id: string;
  batch_number: string;
  status: string;
  cultivar?: {
    name?: string | null;
  } | null;
};
import TaskCreateForm from '@/components/features/workflows/task-create-form';

export default async function NewTaskPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: userData } = await supabase
    .from('users')
    .select('role, id, organization_id')
    .eq('id', user.id)
    .single();
  if (!userData) redirect('/dashboard');

  const permissionCheck = canPerformAction(userData.role, 'task:create');
  if (!permissionCheck.allowed) redirect('/dashboard/workflows');

  // Get user's active site assignment
  const { data: siteAssignment } = await supabase
    .from('user_site_assignments')
    .select('site_id')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single();
  const site_id = siteAssignment?.site_id;
  if (!site_id) {
    // Site required for task creation
    redirect('/dashboard/workflows');
  }

  // Fetch published templates (latest versions) for selection
  const publishedTemplatesResult = await getPublishedTemplates();
  const publishedTemplates = publishedTemplatesResult.data || [];

  // Fetch existing tasks to power hierarchy, dependencies, and sequencing
  const existingTasksResult = await getTasks(
    { site_id },
    { page: 1, pageSize: 200, sortBy: 'sequence_order', sortOrder: 'asc' }
  );
  const existingTasks = existingTasksResult.data || [];

  // Fetch active batches for optional linkage
  const batchesResult = await getActiveBatches(userData.organization_id, site_id);
  const batchRows = (batchesResult.data as BatchResultRow[] | null) ?? [];
  const batchOptions = batchRows.map((batch) => ({
    id: batch.id,
    batch_number: batch.batch_number,
    status: batch.status,
    cultivar_name: batch.cultivar?.name || null,
  }));

  // Fetch assignable users (same organization)
  const { data: orgUsers } = await supabase
    .from('users')
    .select('id, email, role')
    .eq('organization_id', userData.organization_id)
    .order('email');

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        className="gap-2 px-4 text-emerald-600 transition duration-300 hover:text-emerald-700"
        asChild
      >
        <Link href="/dashboard/workflows">
          <ArrowLeft className="h-4 w-4" />
          Back to Workflows
        </Link>
      </Button>
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create Task</h1>
        <p className="text-muted-foreground">Create and assign a new operational or workflow task.</p>
      </div>
      <TaskCreateForm
        siteId={site_id}
        publishedTemplates={publishedTemplates}
        users={orgUsers || []}
        existingTasks={existingTasks}
        batches={batchOptions}
      />
    </div>
  );
}
