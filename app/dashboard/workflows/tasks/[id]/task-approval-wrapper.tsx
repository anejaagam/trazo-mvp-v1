'use client';

import { useRouter } from 'next/navigation';
import { TaskApproval } from '@/components/features/workflows/task-approval';
import { Task, SOPTemplate } from '@/types/workflow';
import { approveTaskAction, rejectTaskAction } from '@/app/actions/tasks';

interface TaskApprovalWrapperProps {
  task: Task;
  template: SOPTemplate | null;
}

export function TaskApprovalWrapper({ task, template }: TaskApprovalWrapperProps) {
  const router = useRouter();

  const handleApprove = async (notes?: string) => {
    const result = await approveTaskAction(task.id, notes);
    
    if (result.error) {
      throw new Error(typeof result.error === 'string' ? result.error : 'Failed to approve task');
    }
  };

  const handleReject = async (reason: string) => {
    const result = await rejectTaskAction(task.id, reason);
    
    if (result.error) {
      throw new Error(typeof result.error === 'string' ? result.error : 'Failed to reject task');
    }
  };

  const handleClose = () => {
    router.push('/dashboard/workflows');
  };

  return (
    <TaskApproval
      task={task}
      template={template}
      onApprove={handleApprove}
      onReject={handleReject}
      onClose={handleClose}
    />
  );
}
