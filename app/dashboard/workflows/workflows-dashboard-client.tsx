'use client';

import { useMemo, useState, useCallback } from 'react';
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

interface WorkflowsDashboardClientProps {
  myTasks: Task[];
  allTasks: Task[];
  userId: string;
  canCreateTask?: boolean;
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

export function WorkflowsDashboardClient({
  myTasks,
  allTasks,
  userId: _userId,
  canCreateTask = false,
}: WorkflowsDashboardClientProps) {
  const router = useRouter();
  const [view, setView] = useState<'board' | 'list'>('board');
  const [visibleStatuses, setVisibleStatuses] = useState<TaskStatus[]>(DEFAULT_STATUSES);

  const handleTaskUpdate = async (taskId: string, updates: Partial<Task>) => {
    if (updates.status) {
      await updateTaskStatusAction(taskId, updates.status);
      router.refresh();
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

  const statusButtonLabel =
    visibleStatuses.length === STATUS_OPTIONS.length
      ? 'All statuses'
      : `${visibleStatuses.length} selected`;

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

          {canCreateTask && (
            <Button onClick={handleCreateTask} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              New Task
            </Button>
          )}
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
            />
          ) : (
            <TaskList tasks={filteredMyTasks} onTaskExecute={handleTaskExecute} />
          )}
        </TabsContent>

        <TabsContent value="all-tasks" className="mt-6">
          {view === 'board' ? (
            <TaskBoard
              tasks={filteredAllTasks}
              onTaskUpdate={handleTaskUpdate}
              onTaskExecute={handleTaskExecute}
            />
          ) : (
            <TaskList tasks={filteredAllTasks} onTaskExecute={handleTaskExecute} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
