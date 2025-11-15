import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TaskBoard } from '../task-board';
import type { Task } from '@/types/workflow';

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
  created_by: 'user',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const createDataTransfer = () => {
  const data: Record<string, string> = {};
  return {
    setData: (key: string, value: string) => {
      data[key] = value;
    },
    getData: (key: string) => data[key],
  } as DataTransfer;
};

describe('TaskBoard drag-and-drop', () => {
  it('highlights blocked tasks and triggers status drop callback', async () => {
    const onStatusDrop = jest.fn();
    const user = userEvent.setup();

    render(
      <TaskBoard
        tasks={[baseTask]}
        onStatusDrop={onStatusDrop}
        canManageTaskStatus
        blockedTasks={{ 'task-1': { blocked: true, blockers: [{ id: 'dep', title: 'Check pumps', status: 'to_do' }] } }}
      />
    );

    expect(await screen.findByText('Inspect Irrigation')).toBeInTheDocument();
    expect(screen.getByText(/Blocked/i)).toBeInTheDocument();

    const card = screen.getByText('Inspect Irrigation');
    const inProgressColumn = screen.getByText('In Progress').closest('div')?.parentElement as HTMLElement;

    const dataTransfer = createDataTransfer();
    fireEvent.dragStart(card, { dataTransfer });
    fireEvent.dragOver(inProgressColumn, { dataTransfer });
    fireEvent.drop(inProgressColumn, { dataTransfer });

    expect(onStatusDrop).toHaveBeenCalledWith('task-1', 'in_progress');
  });

  it('invokes onSelectTask when card clicked', async () => {
    const onSelect = jest.fn();
    render(<TaskBoard tasks={[baseTask]} onSelectTask={onSelect} />);
    await userEvent.click(screen.getByText('Inspect Irrigation'));
    expect(onSelect).toHaveBeenCalledWith('task-1');
  });
});
