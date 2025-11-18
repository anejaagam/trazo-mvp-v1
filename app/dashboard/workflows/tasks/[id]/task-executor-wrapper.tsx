'use client';

import { useRouter } from 'next/navigation';
import { TaskExecutor } from '@/components/features/workflows/task-executor';
import { AdHocTaskExecutor } from '@/components/features/workflows/ad-hoc-task-executor';
import { Task, SOPTemplate, TaskEvidence } from '@/types/workflow';
import { completeTaskAction, saveTaskProgressAction, startTaskAction } from '@/app/actions/tasks';
import { useState, useEffect } from 'react';
import type { RoleKey } from '@/lib/rbac/types';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';

interface TaskExecutorWrapperProps {
  task: Task;
  template: SOPTemplate | null;
  userRole: RoleKey;
  additionalPermissions?: string[];
}

export function TaskExecutorWrapper({ task, template, userRole, additionalPermissions = [] }: TaskExecutorWrapperProps) {
  const router = useRouter();
  const [isStarting, setIsStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const { toast } = useToast();

  // Auto-start task if not started
  useEffect(() => {
    const autoStart = async () => {
      if (task.status === 'to_do' && !isStarting) {
        setIsStarting(true);
        try {
          const result = await startTaskAction(task.id);
          if (result?.error) {
            const message = typeof result.error === 'string' ? result.error : 'Failed to start task';
            setStartError(message);
            toast({
              title: 'Unable to start task',
              description: message,
              variant: 'destructive',
            });
          }
        } catch (error) {
          console.error('Error auto-starting task:', error);
          setStartError('Unable to move task into progress.');
          toast({
            title: 'Unable to start task',
            description: 'An unexpected error occurred while starting the task.',
            variant: 'destructive',
          });
        } finally {
          setIsStarting(false);
        }
      }
    };

    autoStart();
  }, [task.id, task.status, isStarting, toast]);

  const handleComplete = async (evidence: TaskEvidence[]) => {
    const result = await completeTaskAction(task.id, evidence);
    
    if (result.error) {
      throw new Error(typeof result.error === 'string' ? result.error : 'Failed to complete task');
    }

    // Redirect back to workflows dashboard
    router.push('/dashboard/workflows');
  };

  const handleSaveDraft = async (evidence: TaskEvidence[], currentStepIndex: number) => {
    const result = await saveTaskProgressAction(task.id, evidence, currentStepIndex);
    
    if (result.error) {
      throw new Error(typeof result.error === 'string' ? result.error : 'Failed to save progress');
    }
  };

  const handleClose = () => {
    router.push('/dashboard/workflows');
  };

  if (isStarting) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Starting task...</p>
        </div>
      </div>
    );
  }

  // Use different executor based on whether task has a template
  if (!template) {
    return (
      <>
        {startError && (
          <div className="mb-4">
            <Alert variant="destructive">
              <AlertDescription>{startError}</AlertDescription>
            </Alert>
          </div>
        )}
        <AdHocTaskExecutor
          task={task}
          onComplete={handleComplete}
          onSaveDraft={handleSaveDraft}
          onClose={handleClose}
        />
      </>
    );
  }

  return (
    <>
      {startError && (
        <div className="mb-4">
          <Alert variant="destructive">
            <AlertDescription>{startError}</AlertDescription>
          </Alert>
        </div>
      )}
      <TaskExecutor
        task={task}
        template={template}
        onComplete={handleComplete}
        onSaveDraft={handleSaveDraft}
        onClose={handleClose}
        userRole={userRole}
        additionalPermissions={additionalPermissions}
      />
    </>
  );
}
