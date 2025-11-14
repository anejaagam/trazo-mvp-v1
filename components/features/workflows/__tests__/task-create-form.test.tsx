import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import TaskCreateForm from '../task-create-form';
import { createTaskAction } from '@/app/actions/tasks';
import { SOPTemplate, Task } from '@/types/workflow';

const pushMock = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

jest.mock('@/app/actions/tasks', () => ({
  createTaskAction: jest.fn(),
}));

type MinimalUser = { id: string; email: string; role: string };

describe('TaskCreateForm', () => {
  const mockCreateTask = createTaskAction as jest.MockedFunction<typeof createTaskAction>;

  beforeAll(() => {
    class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    }

    Object.defineProperty(globalThis, 'ResizeObserver', {
      configurable: true,
      writable: true,
      value: ResizeObserver,
    });

    Object.defineProperty(HTMLElement.prototype, 'hasPointerCapture', {
      configurable: true,
      value: () => false,
    });
    Object.defineProperty(HTMLElement.prototype, 'setPointerCapture', {
      configurable: true,
      value: () => {},
    });
    Object.defineProperty(HTMLElement.prototype, 'releasePointerCapture', {
      configurable: true,
      value: () => {},
    });

    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: () => {},
    });
  });

  const baseTask: Task = {
    id: 'task-base',
    organization_id: 'org-1',
    site_id: 'site-1',
    title: 'Base Task',
    status: 'to_do',
    priority: 'medium',
    hierarchy_level: 0,
    sequence_order: 1,
    prerequisite_completed: false,
    current_step_index: 0,
    evidence: [],
    evidence_compressed: false,
    created_by: 'tester',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const createMockTask = (overrides?: Partial<Task>): Task => ({
    ...baseTask,
    ...overrides,
    id: overrides?.id ?? baseTask.id,
  });

  const baseProps = {
    siteId: 'site-1',
    publishedTemplates: [] as SOPTemplate[],
    users: [] as MinimalUser[],
    existingTasks: [] as Task[],
    batches: [] as Array<{ id: string; batch_number: string; status: string; cultivar_name?: string | null }>,
  };

  beforeEach(() => {
    jest.useRealTimers();
    pushMock.mockReset();
    mockCreateTask.mockReset();
  });

  it('shows validation error when approval role missing', async () => {
    mockCreateTask.mockResolvedValue({ success: true, data: createMockTask({ id: 'task-1' }) });

    render(<TaskCreateForm {...baseProps} />);

    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Compliance Audit' } });
    fireEvent.click(screen.getByLabelText('Requires Approval'));
    fireEvent.click(screen.getByRole('button', { name: /^Create Task$/ }));

    await waitFor(() => {
      expect(screen.getByText(/Resolve the following before creating the task/i)).toBeInTheDocument();
    });

    expect(mockCreateTask).not.toHaveBeenCalled();
  });

  it('reveals dual sign-off configuration fields when enabled', () => {
    mockCreateTask.mockResolvedValue({ success: true, data: createMockTask({ id: 'task-1' }) });

    render(<TaskCreateForm {...baseProps} />);

    fireEvent.click(screen.getByLabelText('Requires Dual Sign-off'));

    expect(screen.getByLabelText('Primary Role')).toBeInTheDocument();
    expect(screen.getByLabelText('Secondary Role')).toBeInTheDocument();
    expect(screen.getByLabelText('Dual Sign-off Notes')).toBeInTheDocument();
  });

  it('submits minimal payload and navigates after success', async () => {
    jest.useFakeTimers();
    mockCreateTask.mockResolvedValue({ success: true, data: createMockTask({ id: 'task-55' }) });

    render(<TaskCreateForm {...baseProps} />);

    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Irrigation Check' } });
    fireEvent.click(screen.getByRole('button', { name: /^Create Task$/ }));

    await waitFor(() => {
      expect(mockCreateTask).toHaveBeenCalledTimes(1);
    });

    const payload = mockCreateTask.mock.calls[0][0];
    expect(payload).toMatchObject({
      site_id: 'site-1',
      title: 'Irrigation Check',
      schedule_mode: 'manual',
    });
    expect(payload.dependencies).toEqual({ blocking: [], suggested: [] });

    await waitFor(() => {
      expect(screen.getByText('Task created')).toBeInTheDocument();
      expect(screen.getByText(/Redirecting to the new task/i)).toBeInTheDocument();
    });

    await act(async () => {
      jest.runAllTimers();
    });

    expect(pushMock).toHaveBeenCalledWith('/dashboard/workflows/tasks/task-55');

    jest.useRealTimers();
  });

  it('captures dual sign-off metadata when configured', async () => {
    const user = userEvent.setup();
    mockCreateTask.mockResolvedValue({ success: true, data: createMockTask({ id: 'task-999' }) });

    render(<TaskCreateForm {...baseProps} />);

    await user.type(screen.getByLabelText('Title'), 'High Risk Transfer');
    await user.type(screen.getByLabelText('Custom Tags'), 'critical,dual');
    await user.type(screen.getByLabelText('SLA Hours (optional)'), '4');

    await user.click(screen.getByLabelText('Requires Dual Sign-off'));

    await user.click(screen.getByRole('combobox', { name: /Primary Role/i }));
    await user.click(await screen.findByRole('option', { name: /Organization Admin/i }));

    await user.click(screen.getByRole('combobox', { name: /Secondary Role/i }));
    await user.click(await screen.findByRole('option', { name: /Site Manager/i }));

    await user.type(screen.getByLabelText('Dual Sign-off Notes'), 'Dual authorization required');

    await user.click(screen.getByRole('button', { name: /^Create Task$/ }));

    await waitFor(() => {
      expect(mockCreateTask).toHaveBeenCalled();
    });

    const payload = mockCreateTask.mock.calls[0][0];
    expect(payload.evidence_metadata).toEqual({
      customTags: ['critical', 'dual'],
      slaHours: 4,
      dualSignoff: {
        required: true,
        primaryRole: 'org_admin',
        secondaryRole: 'site_manager',
        description: 'Dual authorization required',
      },
    });
  });
});
