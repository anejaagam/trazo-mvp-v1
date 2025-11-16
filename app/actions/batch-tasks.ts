'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { canPerformAction } from '@/lib/rbac/guards';
import { 
  linkTemplateToBatch, 
  unlinkTemplateFromBatch, 
  createTaskFromTemplate,
  getBatchPacketData
} from '@/lib/supabase/queries/batch-tasks';/**
 * Link an SOP template to a batch
 */
export async function linkTemplateAction(
  batchId: string,
  templateId: string,
  options?: {
    stage?: string;
    autoCreate?: boolean;
  }
) {
  const supabase = await createClient();
  
  // Check authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Unauthorized' };
  }

  // Get user role
  const { data: userData } = await supabase
    .from('users')
    .select('role, organization_id')
    .eq('id', user.id)
    .single();

  if (!userData) {
    return { error: 'User not found' };
  }

  // Check permissions
  if (!canPerformAction(userData.role, 'batch:tasks_link').allowed) {
    return { error: 'Permission denied' };
  }

  try {
    const result = await linkTemplateToBatch(batchId, templateId, {
      stage: options?.stage,
      autoCreate: options?.autoCreate,
      userId: user.id
    });

    if (result.error) {
      return { error: result.error instanceof Error ? result.error.message : 'Failed to link template' };
    }

    revalidatePath(`/dashboard/batches/${batchId}`);
    revalidatePath('/dashboard/batches');
    return { success: true, data: result.data };
  } catch (error) {
    console.error('Error in linkTemplateAction:', error);
    return { error: 'Failed to link template to batch' };
  }
}

/**
 * Unlink an SOP template from a batch
 */
export async function unlinkTemplateAction(linkId: string, batchId: string) {
  const supabase = await createClient();
  
  // Check authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Unauthorized' };
  }

  // Get user role
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!userData) {
    return { error: 'User not found' };
  }

  // Check permissions
  if (!canPerformAction(userData.role, 'batch:tasks_link').allowed) {
    return { error: 'Permission denied' };
  }

  try {
    const result = await unlinkTemplateFromBatch(linkId, user.id);

    if (result.error) {
      return { error: result.error instanceof Error ? result.error.message : 'Failed to unlink template' };
    }

    revalidatePath(`/dashboard/batches/${batchId}`);
    revalidatePath('/dashboard/batches');
    return { success: true };
  } catch (error) {
    console.error('Error in unlinkTemplateAction:', error);
    return { error: 'Failed to unlink template from batch' };
  }
}

/**
 * Create a task from a linked template
 */
export async function createBatchTaskAction(
  batchId: string,
  templateId: string,
  options?: {
    assignTo?: string;
    dueDate?: string;
    priority?: 'low' | 'medium' | 'high' | 'critical';
  }
) {
  const supabase = await createClient();
  
  // Check authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Unauthorized' };
  }

  // Get user role
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!userData) {
    return { error: 'User not found' };
  }

  // Check permissions
  if (!canPerformAction(userData.role, 'task:create').allowed) {
    return { error: 'Permission denied' };
  }

  try {
    const result = await createTaskFromTemplate(batchId, templateId, {
      ...options,
      userId: user.id
    });

    if (result.error) {
      return { error: result.error instanceof Error ? result.error.message : 'Failed to create task' };
    }

    revalidatePath(`/dashboard/batches/${batchId}`);
    revalidatePath('/dashboard/workflows');
    revalidatePath('/dashboard/workflows/tasks');
    return { success: true, data: result.data };
  } catch (error) {
    console.error('Error in createBatchTaskAction:', error);
    return { error: 'Failed to create task from template' };
  }
}

/**
 * Get batch packet data for client-side PDF generation
 * Returns the data needed to generate a PDF on the client
 */
export async function getBatchPacketDataAction(
  batchId: string
) {
  const supabase = await createClient();
  
  // Check authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Unauthorized' };
  }

  // Get user role
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!userData) {
    return { error: 'User not found' };
  }

  // Check permissions
  if (!canPerformAction(userData.role, 'batch:packet_generate').allowed) {
    return { error: 'Permission denied' };
  }

  try {
    // Get batch packet data
    const dataResult = await getBatchPacketData(batchId);
    if (dataResult.error || !dataResult.data) {
      return { error: 'Failed to fetch batch data' };
    }

    return { 
      success: true, 
      data: dataResult.data
    };
  } catch (error) {
    console.error('Error in getBatchPacketDataAction:', error);
    return { error: 'Failed to fetch batch packet data' };
  }
}
