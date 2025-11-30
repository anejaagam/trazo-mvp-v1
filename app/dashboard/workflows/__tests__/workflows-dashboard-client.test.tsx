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

const mockIn = jest.fn().mockResolvedValue({ data: [], error: null });
jest.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: () => ({
      select: () => ({
        in: mockIn,
      }),
    }),
  }),
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
    mockIn.mockClear();
  });

  it('navigates to task creation when user can create tasks', async () => {
    const user = userEvent.setup();

    render(
      <WorkflowsDashboardClient
        myTasks={[baseTask]}
        allTasks={[baseTask]}
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
        canCreateTask={false}
      />
    );

    expect(screen.queryByRole('button', { name: /New Task/i })).not.toBeInTheDocument();
  });

  it('switches between board and list views', async () => {
    const user = userEvent.setup();

    render(
      <WorkflowsDashboardClient
        myTasks={[baseTask]}
        allTasks={[baseTask]}
        canCreateTask
      />
    );

    await user.click(screen.getByRole('button', { name: /List/i }));
    expect(screen.getByPlaceholderText('Search tasks...')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Board/i }));
    expect(screen.getByText('To Do')).toBeInTheDocument();
  });

  it('filters tasks via the status dropdown', async () => {
    const user = userEvent.setup();
    const doneTask: Task = {
      ...baseTask,
      id: 'task-2',
      title: 'Calibrate Sensors',
      status: 'done',
    };

    render(
      <WorkflowsDashboardClient
        myTasks={[baseTask, doneTask]}
        allTasks={[baseTask, doneTask]}
        canCreateTask
      />
    );

    await user.click(screen.getByRole('button', { name: /List/i }));
    await user.click(screen.getByRole('button', { name: /All statuses/i }));
    await user.click(screen.getByRole('menuitemcheckbox', { name: /To Do/i }));

    expect(await screen.findByText('Calibrate Sensors')).toBeInTheDocument();
    expect(screen.queryByText('Inspect Irrigation')).not.toBeInTheDocument();
  });
});
