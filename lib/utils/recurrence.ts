/**
 * Recurrence Utilities (MVP)
 *
 * Provides basic recurrence expansion and validation for tasks.
 * Patterns supported: daily, weekly, monthly.
 * Custom pattern placeholder (returns empty until implemented).
 */

import { RecurringConfig, RecurringPattern, Task } from '@/types/workflow';

export interface GeneratedRecurrenceInstance {
  dueDate: string;
  sourceTaskId: string;
  pattern: RecurringPattern;
  index: number; // sequence number in generated batch
}

export interface RecurrenceValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateRecurringConfig(
  pattern: RecurringPattern | undefined,
  config: RecurringConfig | undefined
): RecurrenceValidationResult {
  if (!pattern) return { valid: true, errors: [] }; // Non-recurring

  const errors: string[] = [];
  if (!config) {
    errors.push('recurring_config is required when recurring_pattern is set');
    return { valid: false, errors };
  }

  // startDate required
  if (!config.startDate) errors.push('startDate is required');

  switch (pattern) {
    case 'weekly':
      if (!config.daysOfWeek?.length) errors.push('daysOfWeek required for weekly pattern');
      break;
    case 'monthly':
      if (!config.dayOfMonth || config.dayOfMonth < 1 || config.dayOfMonth > 31) {
        errors.push('Valid dayOfMonth (1-31) required for monthly pattern');
      }
      break;
    case 'custom':
      if (!config.customRule) errors.push('customRule required for custom pattern');
      break;
  }

  return { valid: errors.length === 0, errors };
}

// Generate next N recurrence due dates (excluding the source task's current due_date)
export function generateNextRecurrenceInstances(
  task: Task,
  limit: number = 5
): GeneratedRecurrenceInstance[] {
  const pattern = task.recurring_pattern;
  const config = task.recurring_config;
  if (!pattern || !config) return [];

  const validation = validateRecurringConfig(pattern, config);
  if (!validation.valid) return [];

  const start = new Date(config.startDate);
  const now = new Date();
  const interval = config.interval && config.interval > 0 ? config.interval : 1;
  const instances: GeneratedRecurrenceInstance[] = [];

  // Helper to push instance
  const pushInstance = (date: Date, index: number) => {
    // respect endDate if provided
    if (config.endDate) {
      const end = new Date(config.endDate);
      if (date > end) return;
    }
    if (date <= now) return; // only future instances
    instances.push({
      dueDate: date.toISOString(),
      sourceTaskId: task.id,
      pattern,
      index,
    });
  };

  let cursor = new Date(start);
  let safety = 0;
  while (instances.length < limit && safety < 1000) {
    safety++;
    switch (pattern) {
      case 'daily':
        cursor.setDate(cursor.getDate() + interval);
        pushInstance(new Date(cursor), instances.length);
        break;
      case 'weekly': {
        // Advance day by day until we hit configured days
        cursor.setDate(cursor.getDate() + 1);
        const weekday = cursor.toLocaleDateString('en-US', { weekday: 'short' }); // e.g. Mon
        // Normalize Mon,Tue,... to match config entries which we expect in same short form
        if (config.daysOfWeek?.includes(weekday)) {
          // ensure spacing by interval weeks: check modulo weeks from start
          const diffDays = Math.floor((cursor.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
          const weeksSinceStart = Math.floor(diffDays / 7);
          if (weeksSinceStart % interval === 0) {
            pushInstance(new Date(cursor), instances.length);
          }
        }
        break;
      }
      case 'monthly': {
        // Set to next month dayOfMonth
        const target = new Date(cursor);
        target.setMonth(target.getMonth() + interval);
        if (config.dayOfMonth) {
          target.setDate(Math.min(config.dayOfMonth, daysInMonth(target.getFullYear(), target.getMonth())));
        }
        cursor = target;
        pushInstance(new Date(cursor), instances.length);
        break;
      }
      case 'custom':
        // Placeholder: custom rule not parsed yet
        return instances; // break early
    }
  }
  return instances;
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
