'use client';

import { useMemo, useState, useCallback, useEffect } from 'react';
import type { Task, TaskStatus } from '@/types/workflow';
import { TaskBoard } from '@/components/features/workflows/task-board';
import { TaskList } from '@/components/features/workflows/task-list';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LayoutGrid, List, Plus, Filter } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { updateTaskStatusAction } from '@/app/actions/tasks';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { createClient as createBrowserSupabase } from '@/lib/supabase/client';
import { TaskDetailsPanel } from '@/components/features/workflows/task-details-panel';

interface WorkflowsDashboardClientProps {
  myTasks: Task[];
  allTasks: Task[];
  canCreateTask?: boolean;
  canManageTaskStatus?: boolean;
}

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: 'to_do', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'blocked', label: 'Blocked' },
  { value: 'awaiting_approval', label: 'Awaiting Approval' },
  { value: 'approved', label: 'Approved' },
  { value: 'done', label: 'Done' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'cancelled', label: 'Cancelled' },
];

const DEFAULT_STATUSES = STATUS_OPTIONS.map((option) => option.value);

type DependencyLink = { id: string; title: string; status: string };
type TaskDependencySummary = {
  blocking: DependencyLink[];
  suggested: DependencyLink[];
  blockers: DependencyLink[];
  dependents: DependencyLink[];
};

type TaskDependencyRow = {
  id: string;
  task_id: string;
  depends_on_task_id: string;
  dependency_type: 'blocking' | 'suggested';
  depends_on?: Pick<Task, 'id' | 'title' | 'status'>;
  task?: Pick<Task, 'id' | 'title' | 'status'>;
};

type TaskDependencyQueryRow = Omit<TaskDependencyRow, 'depends_on' | 'task'> & {
  depends_on?: TaskDependencyRow['depends_on'] | TaskDependencyRow['depends_on'][] | null;
  task?: TaskDependencyRow['task'] | TaskDependencyRow['task'][] | null;
};

function normalizeDependencyRows(
  rows: TaskDependencyQueryRow[] | null | undefined
): TaskDependencyRow[] {
  if (!rows?.length) {
    return [];
  }

  return rows.map((row) => ({
    id: row.id,
    task_id: row.task_id,
    depends_on_task_id: row.depends_on_task_id,
    dependency_type: row.dependency_type,
    depends_on: Array.isArray(row.depends_on)
      ? row.depends_on[0]
      : row.depends_on ?? undefined,
    task: Array.isArray(row.task) ? row.task[0] : row.task ?? undefined,
  }));
}

export function WorkflowsDashboardClient({
  myTasks,
  allTasks,
  canCreateTask = false,
  canManageTaskStatus = false,
}: WorkflowsDashboardClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [view, setView] = useState<'board' | 'list'>('board');
  const [visibleStatuses, setVisibleStatuses] = useState<TaskStatus[]>(DEFAULT_STATUSES);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [dependencySummary, setDependencySummary] = useState<Record<string, TaskDependencySummary>>({});

  const handleTaskUpdate = async (taskId: string, updates: Partial<Task>) => {
    try {
      if (updates.status) {
        await updateTaskStatusAction(taskId, updates.status);
        router.refresh();
        toast({
          title: 'Status updated',
          description: `Task moved to ${updates.status.replace('_', ' ')}`,
        });
      }
    } catch (error) {
      console.error('Failed to update task', error);
      toast({
        title: 'Unable to update task',
        description: error instanceof Error ? error.message : 'Unexpected error occurred',
        variant: 'destructive',
      });
    }
  };

  const handleTaskExecute = (taskId: string) => {
    router.push(`/dashboard/workflows/tasks/${taskId}`);
  };

  const handleCreateTask = () => {
    if (!canCreateTask) return;
    router.push('/dashboard/workflows/tasks/new');
  };

  const toggleStatus = useCallback((status: TaskStatus, checked: boolean | 'indeterminate') => {
    setVisibleStatuses((prev) => {
      if (checked) {
        if (prev.includes(status)) return prev;
        return [...prev, status];
      }

      if (prev.length === 1 && prev[0] === status) {
        return prev; // keep at least one selected
      }

      return prev.filter((value) => value !== status);
    });
  }, []);

  const selectAllStatuses = () => setVisibleStatuses(DEFAULT_STATUSES);
  const selectActiveStatuses = () => setVisibleStatuses(['to_do', 'in_progress', 'blocked']);
  const handleStatusDrop = async (taskId: string, status: TaskStatus) => {
    if (!canManageTaskStatus) {
      toast({
        title: 'Cannot move task',
        description: 'You do not have permission to modify workflow statuses.',
        variant: 'destructive',
      });
      return;
    }
    await handleTaskUpdate(taskId, { status });
  };

  const filterTasks = useCallback(
    (tasks: Task[]) => {
      if (visibleStatuses.length === STATUS_OPTIONS.length) return tasks;
      const selected = new Set(visibleStatuses);
      return tasks.filter((task) => selected.has(task.status));
    },
    [visibleStatuses]
  );

  const filteredMyTasks = useMemo(() => filterTasks(myTasks), [filterTasks, myTasks]);
  const filteredAllTasks = useMemo(() => filterTasks(allTasks), [filterTasks, allTasks]);
  const taskIndex = useMemo(() => {
    const map = new Map<string, Task>();
    [...allTasks, ...myTasks].forEach((task) => map.set(task.id, task));
    return map;
  }, [allTasks, myTasks]);

  useEffect(() => {
    const ids = Array.from(new Set([...allTasks, ...myTasks].map((task) => task.id)));
    if (!ids.length) {
      setDependencySummary({});
      return;
    }

    let isMounted = true;
    const supabase = createBrowserSupabase();

    const fetchDependencies = async () => {
      try {
        const [prereqResponse, dependentResponse] = await Promise.all([
          supabase
            .from('task_dependencies')
            .select(
              `
              id,
              task_id,
              depends_on_task_id,
              dependency_type,
              depends_on:tasks!task_dependencies_depends_on_task_id_fkey(id, title, status)
            `
            )
            .in('task_id', ids),
          supabase
            .from('task_dependencies')
            .select(
              `
              id,
              task_id,
              depends_on_task_id,
              dependency_type,
              task:tasks!task_dependencies_task_id_fkey(id, title, status)
            `
            )
            .in('depends_on_task_id', ids),
        ]);

        if (!isMounted) return;
        if (prereqResponse.error) throw prereqResponse.error;
        if (dependentResponse.error) throw dependentResponse.error;

        const summary: Record<string, TaskDependencySummary> = {};
        ids.forEach((id) => {
          summary[id] = { blocking: [], suggested: [], blockers: [], dependents: [] };
        });

        const prerequisiteRows = normalizeDependencyRows(prereqResponse.data);
        prerequisiteRows.forEach((row) => {
          if (!row.depends_on) return;
          if (!summary[row.task_id]) {
            summary[row.task_id] = { blocking: [], suggested: [], blockers: [], dependents: [] };
          }
          const entry = {
            id: row.depends_on.id,
            title: row.depends_on.title,
            status: row.depends_on.status,
          };
          if (row.dependency_type === 'blocking') {
            summary[row.task_id].blocking.push(entry);
            if (row.depends_on.status !== 'done' && row.depends_on.status !== 'approved') {
              summary[row.task_id].blockers.push(entry);
            }
          } else {
            summary[row.task_id].suggested.push(entry);
          }
        });

        const dependentRows = normalizeDependencyRows(dependentResponse.data);
        dependentRows.forEach((row) => {
          if (!row.task) return;
          if (!summary[row.depends_on_task_id]) {
            summary[row.depends_on_task_id] = { blocking: [], suggested: [], blockers: [], dependents: [] };
          }
          summary[row.depends_on_task_id].dependents.push({
            id: row.task.id,
            title: row.task.title,
            status: row.task.status,
          });
        });

        setDependencySummary(summary);
      } catch (error) {
        if (!isMounted) return;
        console.error('Failed to load dependencies', error);
        toast({
          title: 'Unable to load dependencies',
          description: error instanceof Error ? error.message : 'Unexpected error occurred',
          variant: 'destructive',
        });
      }
    };

    fetchDependencies();
    const interval = setInterval(fetchDependencies, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [allTasks, myTasks, toast]);

  const blockedTasks = useMemo(() => {
    const map: Record<string, { blocked: boolean; blockers: DependencyLink[] }> = {};
    Object.entries(dependencySummary).forEach(([taskId, meta]) => {
      map[taskId] = { blocked: meta.blockers.length > 0, blockers: meta.blockers };
    });
    return map;
  }, [dependencySummary]);

  useEffect(() => {
    if (activeTaskId && !taskIndex.has(activeTaskId)) {
      setActiveTaskId(null);
    }
  }, [activeTaskId, taskIndex]);

  const resolveRootTaskId = useCallback(
    (taskId: string) => {
      let current = taskIndex.get(taskId);
      const visited = new Set<string>();
      while (current?.parent_task_id) {
        if (visited.has(current.parent_task_id)) break;
        visited.add(current.parent_task_id);
        const parent = taskIndex.get(current.parent_task_id);
        if (!parent) break;
        current = parent;
      }
      return current?.id ?? taskId;
    },
    [taskIndex]
  );

  const statusButtonLabel =
    visibleStatuses.length === STATUS_OPTIONS.length
      ? 'All statuses'
      : `${visibleStatuses.length} selected`;
  const activeTask = activeTaskId ? taskIndex.get(activeTaskId) : undefined;
  const activeDependencyMeta = activeTask ? dependencySummary[activeTask.id] : undefined;
  const hierarchyRootId = activeTask ? resolveRootTaskId(activeTask.id) : undefined;

  return (
    <div className="space-y-4">
      {/* Action Bar */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant={view === 'board' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setView('board')}
          >
            <LayoutGrid className="mr-2 h-4 w-4" />
            Board
          </Button>
          <Button
            variant={view === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setView('list')}
          >
            <List className="mr-2 h-4 w-4" />
            List
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                {statusButtonLabel}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64">
              <div className="px-2 py-1 text-xs text-muted-foreground">Status Filter</div>
              <DropdownMenuItem onClick={selectAllStatuses}>Select all states</DropdownMenuItem>
              <DropdownMenuItem onClick={selectActiveStatuses}>
                Active only (To Do / In Progress / Blocked)
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {STATUS_OPTIONS.map((option) => (
                <DropdownMenuCheckboxItem
                  key={option.value}
                  checked={visibleStatuses.includes(option.value)}
                  onCheckedChange={(checked) => toggleStatus(option.value, checked)}
                >
                  {option.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Content Tabs */}
      <Tabs defaultValue="my-tasks">
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="my-tasks" className="flex items-center gap-2">
            My Tasks
            <Badge variant="secondary">{filteredMyTasks.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="all-tasks" className="flex items-center gap-2">
            All Tasks
            <Badge variant="secondary">{filteredAllTasks.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="my-tasks" className="mt-6">
          {view === 'board' ? (
            <TaskBoard
              tasks={filteredMyTasks}
              onTaskUpdate={handleTaskUpdate}
              onTaskExecute={handleTaskExecute}
              selectedTaskId={activeTaskId}
              onSelectTask={setActiveTaskId}
              blockedTasks={blockedTasks}
              canManageTaskStatus={canManageTaskStatus}
              onStatusDrop={handleStatusDrop}
            />
          ) : (
            <TaskList
              tasks={filteredMyTasks}
              onTaskExecute={handleTaskExecute}
              selectedTaskId={activeTaskId}
              onSelectTask={setActiveTaskId}
              blockedTasks={blockedTasks}
            />
          )}
        </TabsContent>

        <TabsContent value="all-tasks" className="mt-6">
          {view === 'board' ? (
            <TaskBoard
              tasks={filteredAllTasks}
              onTaskUpdate={handleTaskUpdate}
              onTaskExecute={handleTaskExecute}
              selectedTaskId={activeTaskId}
              onSelectTask={setActiveTaskId}
              blockedTasks={blockedTasks}
              canManageTaskStatus={canManageTaskStatus}
              onStatusDrop={handleStatusDrop}
            />
          ) : (
            <TaskList
              tasks={filteredAllTasks}
              onTaskExecute={handleTaskExecute}
              selectedTaskId={activeTaskId}
              onSelectTask={setActiveTaskId}
              blockedTasks={blockedTasks}
            />
          )}
        </TabsContent>
      </Tabs>

      <TaskDetailsPanel
        task={activeTask}
        open={Boolean(activeTask)}
        onOpenChange={(open) => {
          if (!open) setActiveTaskId(null);
        }}
        dependencyMeta={activeDependencyMeta}
        dependencyMap={blockedTasks}
        onNavigateTask={setActiveTaskId}
        onExecuteTask={handleTaskExecute}
        hierarchyRootId={hierarchyRootId}
        canEditHierarchy={canManageTaskStatus}
      />
    </div>
  );
}
