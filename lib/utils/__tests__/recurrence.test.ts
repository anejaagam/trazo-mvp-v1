import { generateNextRecurrenceInstances, validateRecurringConfig } from '../recurrence';
import type { Task } from '@/types/workflow';

describe('recurrence utilities', () => {
  const baseTask = {
    id: 'task',
    organization_id: 'org',
    site_id: 'site',
    title: 'Recurring task',
    status: 'to_do',
    priority: 'medium',
    hierarchy_level: 0,
    sequence_order: 0,
    prerequisite_completed: false,
    current_step_index: 0,
    evidence: [],
    evidence_compressed: false,
    created_by: 'user',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  } as unknown as Task;

  it('validates weekly recurrence configuration', () => {
    const result = validateRecurringConfig('weekly', { startDate: '2025-01-01', daysOfWeek: ['Mon'] });
    expect(result.valid).toBe(true);
    const invalid = validateRecurringConfig('weekly', { startDate: '2025-01-01' });
    expect(invalid.valid).toBe(false);
  });

  it('generates future instances respecting lookahead', () => {
    const task = {
      ...baseTask,
      recurring_pattern: 'daily',
      recurring_config: { startDate: new Date().toISOString(), interval: 1 },
    } as Task;
    const instances = generateNextRecurrenceInstances(task, 2);
    expect(instances.length).toBeGreaterThan(0);
    expect(instances[0].sourceTaskId).toBe('task');
  });
});
