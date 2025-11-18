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

const sectionClasses = 'space-y-4 rounded-lg border border-slate-200 bg-slate-50/50 p-5';

function renderDependencyList(
  label: string,
  emptyText: string,
  items: DependencyLink[],
  onNavigateTask?: (taskId: string) => void
) {
  return (
    <div className={sectionClasses}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">{label}</h3>
        <Badge variant="secondary" className="text-xs">
          {items.length}
        </Badge>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">{emptyText}</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900 truncate">{item.title}</p>
                <p className="text-xs text-muted-foreground capitalize">{item.status.replace('_', ' ')}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {onNavigateTask && (
                  <Button variant="ghost" size="sm" onClick={() => onNavigateTask(item.id)}>
                    View
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
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl lg:max-w-2xl xl:max-w-3xl p-8" side="right">
        {!task ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-muted-foreground">Select a task to view its details</p>
          </div>
        ) : (
          <div className="space-y-6">
            <SheetHeader className="space-y-3">
              <SheetTitle className="text-2xl">{task.title}</SheetTitle>
              <SheetDescription className="text-base">
                {task.template_name ? `📋 ${task.template_name}` : '📝 Ad-hoc task'}
              </SheetDescription>
            </SheetHeader>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100 p-4 shadow-sm">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-600 mb-2">Status</p>
                <Badge className="capitalize">{task.status.replace('_', ' ')}</Badge>
              </div>
              <div className="rounded-lg border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100 p-4 shadow-sm">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-600 mb-2">Priority</p>
                <Badge variant="outline" className="capitalize">{task.priority}</Badge>
              </div>
              {task.due_date && (
                <div className="rounded-lg border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100 p-4 shadow-sm">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-600 mb-2">Due</p>
                  <p className="font-semibold text-slate-900">{format(new Date(task.due_date), 'MMM d, yyyy')}</p>
                </div>
              )}
              {task.assigned_to && (
                <div className="rounded-lg border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100 p-4 shadow-sm">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-600 mb-2">Assigned To</p>
                  <p className="font-semibold text-slate-900">{task.assigned_to}</p>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              <Button className="flex-1 sm:flex-initial" onClick={() => onExecuteTask?.(task.id)}>
                Execute
              </Button>
              <Button variant="outline" asChild>
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
