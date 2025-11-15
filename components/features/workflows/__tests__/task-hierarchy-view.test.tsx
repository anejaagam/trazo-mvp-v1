import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TaskHierarchyView } from '../task-hierarchy-view';

const rpcMock = jest.fn();

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    rpc: rpcMock,
  }),
}));

describe('TaskHierarchyView', () => {
  const hierarchyPayload = [
    {
      task_id: 'root',
      parent_id: null,
      title: 'Parent Task',
      status: 'in_progress',
      hierarchy_level: 0,
      sequence_order: 1,
      path: [],
    },
    {
      task_id: 'child',
      parent_id: 'root',
      title: 'Child Task',
      status: 'blocked',
      hierarchy_level: 1,
      sequence_order: 1,
      path: ['root'],
    },
  ];

  beforeEach(() => {
    rpcMock.mockResolvedValue({ data: hierarchyPayload, error: null });
  });

  it('renders hierarchy nodes and blocked indicators', async () => {
    render(
      <TaskHierarchyView
        rootTaskId="root"
        dependencyMap={{
          child: { blocked: true, blockers: [{ id: 'dep', title: 'Prereq', status: 'to_do' }] },
        }}
      />
    );

    expect(await screen.findByText('Parent Task')).toBeInTheDocument();
    expect(screen.getByText('Child Task')).toBeInTheDocument();
    expect(screen.getAllByText(/blocked/i).length).toBeGreaterThan(0);
  });

  it('allows manual refresh to refetch hierarchy', async () => {
    const user = userEvent.setup();
    render(<TaskHierarchyView rootTaskId="root" />);
    await screen.findByText('Parent Task');
    rpcMock.mockClear();
    await user.click(screen.getByRole('button', { name: /refresh/i }));
    await waitFor(() => expect(rpcMock).toHaveBeenCalled());
  });
});
