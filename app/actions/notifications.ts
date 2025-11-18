'use server';

import { createClient } from '@/lib/supabase/server';
import type { NotificationCategory, NotificationUrgency } from '@/types/telemetry';

/**
 * Server action to create a notification
 * Wraps the database create_notification function
 */
export async function createNotification({
  userId,
  organizationId,
  message,
  category,
  urgency = 'low',
  linkUrl,
  alarmId,
  channel = 'in_app',
}: {
  userId: string;
  organizationId: string;
  message: string;
  category: NotificationCategory;
  urgency?: NotificationUrgency;
  linkUrl?: string | null;
  alarmId?: string | null;
  channel?: 'in_app' | 'email' | 'sms' | 'push';
}) {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase.rpc('create_notification', {
      user_id_param: userId,
      org_id_param: organizationId,
      message_param: message,
      category_param: category,
      urgency_param: urgency,
      link_url_param: linkUrl || null,
      alarm_id_param: alarmId || null,
      channel_param: channel,
    });

    if (error) {
      console.error('Error creating notification:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err) {
    console.error('Unexpected error creating notification:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error'
    };
  }
}

/**
 * Server action to create notifications for all users with a specific role
 * Wraps the database create_notification_for_role function
 */
export async function createNotificationForRole({
  organizationId,
  role,
  message,
  category,
  urgency = 'low',
  linkUrl,
  alarmId,
}: {
  organizationId: string;
  role: string;
  message: string;
  category: NotificationCategory;
  urgency?: NotificationUrgency;
  linkUrl?: string | null;
  alarmId?: string | null;
}) {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase.rpc('create_notification_for_role', {
      org_id_param: organizationId,
      role_param: role,
      message_param: message,
      category_param: category,
      urgency_param: urgency,
      link_url_param: linkUrl || null,
      alarm_id_param: alarmId || null,
    });

    if (error) {
      console.error('Error creating notifications for role:', error);
      return { success: false, error: error.message };
    }

    return { success: true, count: data as number };
  } catch (err) {
    console.error('Unexpected error creating notifications for role:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error'
    };
  }
}

/**
 * Helper to create inventory low stock notifications
 */
export async function notifyLowInventory({
  organizationId,
  itemName,
  currentQuantity,
  minQuantity,
  inventoryItemId,
}: {
  organizationId: string;
  itemName: string;
  currentQuantity: number;
  minQuantity: number;
  inventoryItemId: string;
}) {
  const message = `Low stock alert: ${itemName} has ${currentQuantity} units remaining (minimum: ${minQuantity})`;
  const linkUrl = `/dashboard/inventory/${inventoryItemId}`;

  return createNotificationForRole({
    organizationId,
    role: 'head_grower',
    message,
    category: 'inventory',
    urgency: 'medium',
    linkUrl,
  });
}

/**
 * Helper to create batch status change notifications
 */
export async function notifyBatchStatusChange({
  organizationId,
  batchName,
  newStatus,
  batchId,
  assignedUserId,
}: {
  organizationId: string;
  batchName: string;
  newStatus: string;
  batchId: string;
  assignedUserId?: string;
}) {
  const message = `Batch "${batchName}" status changed to: ${newStatus}`;
  const linkUrl = `/dashboard/batches/${batchId}`;

  if (assignedUserId) {
    // Notify specific assigned user
    return createNotification({
      userId: assignedUserId,
      organizationId,
      message,
      category: 'batch',
      urgency: 'medium',
      linkUrl,
    });
  } else {
    // Notify all head growers
    return createNotificationForRole({
      organizationId,
      role: 'head_grower',
      message,
      category: 'batch',
      urgency: 'low',
      linkUrl,
    });
  }
}

/**
 * Helper to create task assignment notifications
 */
export async function notifyTaskAssignment({
  userId,
  organizationId,
  taskTitle,
  dueDate,
  taskId,
  urgency = 'medium',
}: {
  userId: string;
  organizationId: string;
  taskTitle: string;
  dueDate?: string;
  taskId: string;
  urgency?: NotificationUrgency;
}) {
  const dueDateText = dueDate ? ` (due: ${new Date(dueDate).toLocaleDateString()})` : '';
  const message = `New task assigned: ${taskTitle}${dueDateText}`;
  const linkUrl = `/dashboard/workflows/${taskId}`;

  return createNotification({
    userId,
    organizationId,
    message,
    category: 'task',
    urgency,
    linkUrl,
  });
}

/**
 * Helper to create overdue task notifications
 */
export async function notifyTaskOverdue({
  userId,
  organizationId,
  taskTitle,
  taskId,
}: {
  userId: string;
  organizationId: string;
  taskTitle: string;
  taskId: string;
}) {
  const message = `Task overdue: "${taskTitle}"`;
  const linkUrl = `/dashboard/workflows/${taskId}`;

  return createNotification({
    userId,
    organizationId,
    message,
    category: 'task',
    urgency: 'high',
    linkUrl,
  });
}
