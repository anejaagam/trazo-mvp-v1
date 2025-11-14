import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WorkflowsDashboardClient } from '../workflows-dashboard-client';
import type { Task } from '@/types/workflow';

const pushMock = jest.fn();
const refreshMock = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
    refresh: refreshMock,
  }),
}));

jest.mock('@/app/actions/tasks', () => ({
  updateTaskStatusAction: jest.fn(),
}));

describe('WorkflowsDashboardClient', () => {
  const baseTask: Task = {
    id: 'task-1',
    organization_id: 'org-1',
    site_id: 'site-1',
    title: 'Inspect Irrigation',
    status: 'to_do',
    priority: 'medium',
    hierarchy_level: 0,
    sequence_order: 1,
    prerequisite_completed: false,
    current_step_index: 0,
    evidence: [],
    evidence_compressed: false,
    created_by: 'user-1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  beforeEach(() => {
    pushMock.mockClear();
    refreshMock.mockClear();
  });

  it('navigates to task creation when user can create tasks', async () => {
    const user = userEvent.setup();

    render(
      <WorkflowsDashboardClient
        myTasks={[baseTask]}
        allTasks={[baseTask]}
        userId="user-1"
        canCreateTask
      />
    );

    await user.click(screen.getByRole('button', { name: /New Task/i }));

    expect(pushMock).toHaveBeenCalledWith('/dashboard/workflows/tasks/new');
  });

  it('hides the create button when user lacks permission', () => {
    render(
      <WorkflowsDashboardClient
        myTasks={[baseTask]}
        allTasks={[baseTask]}
        userId="user-1"
        canCreateTask={false}
      />
    );

    expect(screen.queryByRole('button', { name: /New Task/i })).not.toBeInTheDocument();
  });
});
