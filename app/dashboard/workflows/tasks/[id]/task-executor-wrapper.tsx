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
  const { toast } = useToast();

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
    
    // Navigate back to workflows after saving
    router.push('/dashboard/workflows');
  };

  const handleClose = () => {
    router.push('/dashboard/workflows');
  };

  // Use different executor based on whether task has a template
  if (!template) {
    return (
      <AdHocTaskExecutor
        task={task}
        onComplete={handleComplete}
        onSaveDraft={handleSaveDraft}
        onClose={handleClose}
      />
    );
  }

  return (
    <TaskExecutor
      task={task}
      template={template}
      onComplete={handleComplete}
      onSaveDraft={handleSaveDraft}
      onClose={handleClose}
      userRole={userRole}
      additionalPermissions={additionalPermissions}
    />
  );
}
