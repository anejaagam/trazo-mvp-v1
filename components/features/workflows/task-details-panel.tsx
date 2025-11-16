'use client';

import Link from 'next/link';
import { format } from 'date-fns';
import { Task } from '@/types/workflow';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TaskHierarchyView } from './task-hierarchy-view';

interface DependencyLink {
  id: string;
  title: string;
  status: string;
}

interface TaskDetailsPanelProps {
  task?: Task;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dependencyMeta?: {
    blocking: DependencyLink[];
    suggested: DependencyLink[];
    dependents: DependencyLink[];
  };
  dependencyMap?: Parameters<typeof TaskHierarchyView>[0]['dependencyMap'];
  onNavigateTask?: (taskId: string) => void;
  onExecuteTask?: (taskId: string) => void;
  hierarchyRootId?: string;
  canEditHierarchy?: boolean;
}

const sectionClasses = 'space-y-3 rounded border bg-white/60 p-4';

function renderDependencyList(
  label: string,
  emptyText: string,
  items: DependencyLink[],
  onNavigateTask?: (taskId: string) => void
) {
  return (
    <div className={sectionClasses}>
      <div className="flex items-center justify-between">
        <p className="font-medium">{label}</p>
        <Badge variant="secondary">{items.length}</Badge>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-slate-500">{emptyText}</p>
      ) : (
        <ul className="space-y-2 text-sm">
          {items.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-2 rounded border px-2 py-1">
              <div>
                <p className="font-medium">{item.title}</p>
                <p className="text-xs text-slate-500">{item.status.replace('_', ' ')}</p>
              </div>
              <div className="flex items-center gap-2">
                {onNavigateTask && (
                  <Button variant="link" size="sm" onClick={() => onNavigateTask(item.id)}>
                    Inspect
                  </Button>
                )}
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/dashboard/workflows/tasks/${item.id}`}>Open</Link>
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function TaskDetailsPanel({
  task,
  open,
  onOpenChange,
  dependencyMeta,
  dependencyMap,
  onNavigateTask,
  onExecuteTask,
  hierarchyRootId,
  canEditHierarchy,
}: TaskDetailsPanelProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
        {!task ? (
          <div className="p-4 text-sm text-slate-500">Select a task to view its hierarchy and dependencies.</div>
        ) : (
          <div className="space-y-6 py-4">
            <SheetHeader>
              <SheetTitle>{task.title}</SheetTitle>
              <SheetDescription>
                {task.template_name ? `Derived from ${task.template_name}` : 'Ad-hoc task'}
              </SheetDescription>
            </SheetHeader>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded border bg-slate-50 p-3">
                <p className="text-xs uppercase text-slate-500">Status</p>
                <Badge>{task.status.replace('_', ' ')}</Badge>
              </div>
              <div className="rounded border bg-slate-50 p-3">
                <p className="text-xs uppercase text-slate-500">Priority</p>
                <Badge variant="outline">{task.priority}</Badge>
              </div>
              {task.due_date && (
                <div className="rounded border bg-slate-50 p-3">
                  <p className="text-xs uppercase text-slate-500">Due</p>
                  <p className="font-medium">{format(new Date(task.due_date), 'MMM d, yyyy')}</p>
                </div>
              )}
              {task.assigned_to && (
                <div className="rounded border bg-slate-50 p-3">
                  <p className="text-xs uppercase text-slate-500">Assigned User</p>
                  <p className="font-medium">{task.assigned_to}</p>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="default" size="sm" onClick={() => onExecuteTask?.(task.id)}>
                Execute
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/dashboard/workflows/tasks/${task.id}`}>Open task page</Link>
              </Button>
            </div>

            <TaskHierarchyView
              rootTaskId={hierarchyRootId || task.id}
              selectedTaskId={task.id}
              onSelectTask={onNavigateTask}
              dependencyMap={dependencyMap}
              canEditHierarchy={canEditHierarchy}
            />

            {dependencyMeta && (
              <div className="space-y-4">
                {renderDependencyList(
                  'Blocking prerequisites',
                  'No blocking dependencies configured.',
                  dependencyMeta.blocking,
                  onNavigateTask
                )}
                {renderDependencyList(
                  'Suggested dependencies',
                  'No suggested dependencies configured.',
                  dependencyMeta.suggested,
                  onNavigateTask
                )}
                {renderDependencyList(
                  'Downstream dependents',
                  'No downstream tasks currently reference this task.',
                  dependencyMeta.dependents,
                  onNavigateTask
                )}
              </div>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
