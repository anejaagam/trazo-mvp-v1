import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { canPerformAction } from '@/lib/rbac/guards';
import { getPublishedTemplates, getTasks } from '@/lib/supabase/queries/workflows';
import { getActiveBatches } from '@/lib/supabase/queries/batches';
import { getOrCreateDefaultSite } from '@/lib/supabase/queries/sites';
import { getServerSiteId } from '@/lib/site/server';

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

  // Get site_id from site context (cookie-based)
  const contextSiteId = await getServerSiteId();
  let site_id: string | null = null;

  if (contextSiteId && contextSiteId !== 'all') {
    site_id = contextSiteId;
  } else {
    // Fallback to default site if no site selected or "all sites" mode
    const { data: defaultSiteId } = await getOrCreateDefaultSite(userData.organization_id);
    site_id = defaultSiteId || null;
  }

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Task</h1>
          <p className="text-muted-foreground">Create and assign a new operational or workflow task.</p>
        </div>
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
