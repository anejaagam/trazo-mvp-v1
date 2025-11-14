'use client';

import { useState } from 'react';
import { Task } from '@/types/workflow';
import { TaskBoard } from '@/components/features/workflows/task-board';
import { TaskList } from '@/components/features/workflows/task-list';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LayoutGrid, List, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { updateTaskStatusAction } from '@/app/actions/tasks';

interface WorkflowsDashboardClientProps {
  myTasks: Task[];
  allTasks: Task[];
  userId: string;
  canCreateTask?: boolean;
}

export function WorkflowsDashboardClient({ 
  myTasks, 
  allTasks,
  userId,
  canCreateTask = false,
}: WorkflowsDashboardClientProps) {
  const router = useRouter();
  const [view, setView] = useState<'board' | 'list'>('board');

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
    if (!canCreateTask) {
      return;
    }

    router.push('/dashboard/workflows/tasks/new');
  };

  return (
    <div className="space-y-4">
      {/* Action Bar */}
      <div className="flex items-center justify-between">
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

        {canCreateTask && (
          <Button onClick={handleCreateTask}>
            <Plus className="mr-2 h-4 w-4" />
            New Task
          </Button>
        )}
      </div>

      {/* Content Tabs */}
      <Tabs defaultValue="my-tasks">
        <TabsList>
          <TabsTrigger value="my-tasks">My Tasks ({myTasks.length})</TabsTrigger>
          <TabsTrigger value="all-tasks">All Tasks ({allTasks.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="my-tasks" className="mt-6">
          {view === 'board' ? (
            <TaskBoard 
              tasks={myTasks}
              onTaskUpdate={handleTaskUpdate}
              onTaskExecute={handleTaskExecute}
            />
          ) : (
            <TaskList 
              tasks={myTasks}
              onTaskExecute={handleTaskExecute}
            />
          )}
        </TabsContent>

        <TabsContent value="all-tasks" className="mt-6">
          {view === 'board' ? (
            <TaskBoard 
              tasks={allTasks}
              onTaskUpdate={handleTaskUpdate}
              onTaskExecute={handleTaskExecute}
            />
          ) : (
            <TaskList 
              tasks={allTasks}
              onTaskExecute={handleTaskExecute}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
