'use client';

import { useRouter } from 'next/navigation';
import { TaskExecutor } from '@/components/features/workflows/task-executor';
import { Task, SOPTemplate, TaskEvidence } from '@/types/workflow';
import { completeTaskAction, saveTaskProgressAction, startTaskAction } from '@/app/actions/tasks';
import { useState, useEffect } from 'react';

interface TaskExecutorWrapperProps {
  task: Task;
  template: SOPTemplate;
  userId: string;
}

export function TaskExecutorWrapper({ task, template, userId }: TaskExecutorWrapperProps) {
  const router = useRouter();
  const [isStarting, setIsStarting] = useState(false);

  // Auto-start task if not started
  useEffect(() => {
    const autoStart = async () => {
      if (task.status === 'to_do' && !isStarting) {
        setIsStarting(true);
        try {
          await startTaskAction(task.id);
        } catch (error) {
          console.error('Error auto-starting task:', error);
        } finally {
          setIsStarting(false);
        }
      }
    };

    autoStart();
  }, [task.id, task.status, isStarting]);

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

  return (
    <TaskExecutor
      task={task}
      template={template}
      onComplete={handleComplete}
      onSaveDraft={handleSaveDraft}
      onClose={handleClose}
    />
  );
}
