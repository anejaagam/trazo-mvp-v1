import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TaskExecutor } from '../task-executor';
import { SOPTemplate, Task, type TaskEvidence } from '@/types/workflow';

const mockCan = jest.fn<boolean, []>(() => true);
const toastMock = jest.fn();
// Mock permissions hook to allow override in tests
jest.mock('@/hooks/use-permissions', () => ({
  usePermissions: () => ({
    can: jest.fn((permission: string) => mockCan()),
    cannot: jest.fn((permission: string) => !mockCan()),
    hasAny: jest.fn(),
    hasAll: jest.fn(),
    requirePermission: jest.fn(),
  })
}));
jest.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({ toast: toastMock }),
}));
// Mock DualSignatureCapture to instantly provide signatures
type DualSignatureValue = NonNullable<TaskEvidence['dualSignatures']>;

jest.mock('../dual-signature-capture', () => ({
  DualSignatureCapture: ({ onCapture }: { onCapture: (value: DualSignatureValue) => void }) => (
    <button
      type="button"
      data-testid="dual-signature-mock"
      onClick={() =>
        onCapture({
          signature1: { userId: 'user1', userName: 'Manager', role: 'site_manager', signature: 'sig1', timestamp: new Date().toISOString() },
          signature2: { userId: 'user2', userName: 'QA', role: 'compliance_qa', signature: 'sig2', timestamp: new Date().toISOString() },
        })
      }
    >
      Dual Signature Mock
    </button>
  )
}));

// Minimal mocks
jest.mock('@/lib/supabase/client', () => ({ createClient: () => ({ from: () => ({ select: () => ({ eq: () => ({ eq: () => ({ eq: () => ({}) }) }) }) }) }) }));

const baseTemplate: SOPTemplate = {
  id: 'tmpl-1',
  organization_id: 'org-1',
  name: 'Execution Template',
  version: '1',
  category: 'daily',
  description: 'Test template',
  steps: [
    { id: 's1', order: 0, title: 'Step 1', description: 'First', evidenceRequired: false },
    { id: 's2', order: 1, title: 'Step 2', description: 'Second', evidenceRequired: false },
  ],
  requires_approval: false,
  is_active: true,
  is_template: true,
  status: 'published',
  is_latest_version: true,
  created_by: 'tester',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const baseTask: Task = {
  id: 'task-1',
  organization_id: 'org-1',
  site_id: 'site-1',
  title: 'Task 1',
  status: 'in_progress',
  priority: 'medium',
  hierarchy_level: 0,
  sequence_order: 0,
  prerequisite_completed: true,
  current_step_index: 0,
  evidence: [],
  evidence_compressed: false,
  created_by: 'tester',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

describe('TaskExecutor', () => {
  beforeEach(() => {
    mockCan.mockImplementation(() => true);
    window.localStorage.clear();
    toastMock.mockClear();
  });

  it('allows skipping a step with reason', async () => {
    const onClose = jest.fn();
    render(<TaskExecutor task={baseTask} template={baseTemplate} onClose={onClose} onComplete={async () => {}} />);

    const skipBtn = screen.getByText('Skip Step');
    fireEvent.click(skipBtn);

    const reasonInput = await screen.findByLabelText('Reason');
    fireEvent.change(reasonInput, { target: { value: 'Not applicable' } });
    fireEvent.click(screen.getByRole('button', { name: /Save & Skip/i }));

    await waitFor(() => {
      expect(screen.getAllByText('Step 2').length).toBeGreaterThan(0);
      expect(screen.getByText(/Execution Timeline/i)).toBeInTheDocument();
      expect(screen.getByText(/Reason: Not applicable/i)).toBeInTheDocument();
    });
  });

  it('renders pre-compression advisory for photo evidence', () => {
    const templateWithPhoto: SOPTemplate = {
      ...baseTemplate,
      steps: [
        { id: 'sPhoto', order: 0, title: 'Photo', description: 'Capture', evidenceRequired: true, evidenceType: 'photo' }
      ],
    };
    const taskPhoto: Task = { ...baseTask, current_step_index: 0 };
    render(<TaskExecutor task={taskPhoto} template={templateWithPhoto} onClose={() => {}} onComplete={async () => {}} />);
    expect(screen.getByLabelText('Compression advisory')).toBeInTheDocument();
  });

  it('shows retain original toggle when permission granted', () => {
    mockCan.mockImplementation(() => true);
    const templateWithPhoto: SOPTemplate = {
      ...baseTemplate,
      steps: [
        { id: 'sPhoto', order: 0, title: 'Photo', description: 'Capture', evidenceRequired: true, evidenceType: 'photo' }
      ],
    };
    const taskPhoto: Task = { ...baseTask, current_step_index: 0 };
    render(
      <TaskExecutor
        task={taskPhoto}
        template={templateWithPhoto}
        onClose={() => {}}
        onComplete={async () => {}}
        userRole="site_manager"
      />
    );
    expect(screen.getByText('Retain original evidence files')).toBeInTheDocument();
  });

  it('hides retain original toggle without permission', () => {
    mockCan.mockImplementation(() => false);
    const templateWithPhoto: SOPTemplate = {
      ...baseTemplate,
      steps: [
        { id: 'sPhoto', order: 0, title: 'Photo', description: 'Capture', evidenceRequired: true, evidenceType: 'photo' }
      ],
    };
    const taskPhoto: Task = { ...baseTask, current_step_index: 0 };
    render(
      <TaskExecutor
        task={taskPhoto}
        template={templateWithPhoto}
        onClose={() => {}}
        onComplete={async () => {}}
        userRole="operator"
      />
    );
    expect(screen.queryByText('Retain original evidence files')).not.toBeInTheDocument();
  });

  it('initiates dual sign-off modal and captures signatures', async () => {
    const templateDual: SOPTemplate = {
      ...baseTemplate,
      requires_dual_signoff: true,
      steps: [
        { id: 'sFinal', order: 0, title: 'Final', description: 'Complete', evidenceRequired: false }
      ],
    };
    const taskDual: Task = { ...baseTask, current_step_index: 0 };
    render(<TaskExecutor task={taskDual} template={templateDual} onClose={() => {}} onComplete={async () => {}} />);
    const completeBtn = screen.getByText(/Begin Dual Sign-off/);
    fireEvent.click(completeBtn);
    await waitFor(() => expect(screen.getByTestId('dual-signature-mock')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('dual-signature-mock'));
    await waitFor(() => expect(screen.getByLabelText('Dual signoff role validation')).toBeInTheDocument());
  });

  it('performs conditional branching jump when logic matches', async () => {
    const branchingTemplate: SOPTemplate = {
      ...baseTemplate,
      steps: [
        {
          id: 'cond1', order: 0, title: 'Conditional Numeric', description: 'Enter value', evidenceRequired: true, evidenceType: 'numeric',
          isConditional: true,
          conditionalLogic: [
            { stepId: 'cond1', condition: 'greater_than', value: 5, nextStepId: 'branchTarget' }
          ]
        },
        { id: 'branchTarget', order: 1, title: 'Branched Step', description: 'Arrived from branch', evidenceRequired: false }
      ],
    };
    const branchingTask: Task = { ...baseTask, current_step_index: 0 };
    render(<TaskExecutor task={branchingTask} template={branchingTemplate} onClose={() => {}} onComplete={async () => {}} />);
    // Enter numeric value > 5
    const input = screen.getByPlaceholderText(/Enter value/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: '8' } });
    fireEvent.click(screen.getByText('Submit'));
    // Wait for branch target
    await waitFor(() => expect(screen.getByText('Branched Step')).toBeInTheDocument());
    // Trail should reflect branched step arrival
    const trailEntries = screen.getAllByText(/Branched Step/i);
    expect(trailEntries.length).toBeGreaterThan(0);
  });

  it('shows compression summary when compressed evidence is provided', () => {
    const template: SOPTemplate = {
      ...baseTemplate,
      steps: [
        { id: 's1', order: 0, title: 'Photo Step', description: 'Capture photo', evidenceRequired: false, evidenceType: 'photo' },
      ],
    };

    const compressedTask: Task = {
      ...baseTask,
      evidence: [
        {
          stepId: 's1',
          type: 'photo',
          value: 'mock',
          timestamp: new Date().toISOString(),
          compressed: true,
          originalSize: 2048,
          compressedSize: 1024,
        },
      ],
    };

    render(<TaskExecutor task={compressedTask} template={template} onClose={() => {}} onComplete={async () => {}} />);

    expect(screen.getByText('Evidence Compression Summary')).toBeInTheDocument();
    expect(screen.getByText(/Optimized 1 item/i)).toBeInTheDocument();
  });

  it('clears offline draft cache after successful completion', async () => {
    const singleStepTemplate: SOPTemplate = {
      ...baseTemplate,
      steps: [{ id: 'only', order: 0, title: 'Only Step', description: '', evidenceRequired: false }],
    };
    const completionTask: Task = {
      ...baseTask,
      id: 'task-draft',
      current_step_index: 0,
    };
    const onComplete = jest.fn().mockResolvedValue(undefined);
    window.localStorage.setItem(`task-exec-draft-${completionTask.id}`, JSON.stringify({ evidence: [], currentStepIndex: 0 }));

    render(
      <TaskExecutor
        task={completionTask}
        template={singleStepTemplate}
        onClose={() => {}}
        onComplete={onComplete}
      />
    );

    await waitFor(() => expect(screen.getByText(/Complete Task/i)).toBeInTheDocument());
    fireEvent.click(screen.getByText(/Complete Task/i));

    await waitFor(() => expect(onComplete).toHaveBeenCalled());
    expect(window.localStorage.getItem(`task-exec-draft-${completionTask.id}`)).toBeFalsy();
  });
});
