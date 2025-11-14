'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { canPerformAction } from '@/lib/rbac/guards';
import { 
  createTemplate, 
  updateTemplate,
  publishTemplate,
  archiveTemplate,
  duplicateTemplate
} from '@/lib/supabase/queries/workflows';
import { SOPTemplate, CreateTemplateInput, UpdateTemplateInput } from '@/types/workflow';

/**
 * Create a new template
 */
export async function createTemplateAction(templateData: Partial<SOPTemplate>) {
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
  if (!canPerformAction(userData.role, 'tasks:create')) {
    return { error: 'Permission denied' };
  }

  try {
    // Prepare template input
    const input: CreateTemplateInput = {
      name: templateData.name!,
      category: templateData.category!,
      description: templateData.description,
      estimated_duration_minutes: templateData.estimated_duration_minutes || 30,
      sla_hours: templateData.sla_hours || 24,
      requires_dual_signoff: templateData.requires_dual_signoff || false,
      is_exception_scenario: templateData.is_exception_scenario || false,
      steps: templateData.steps || [],
      created_by: user.id,
      organization_id: userData.organization_id,
    };

    const result = await createTemplate(input);

    if (result.error) {
      return { error: result.error };
    }

    // If status is published, publish the template
    if (templateData.status === 'published' && result.data) {
      const publishResult = await publishTemplate(result.data.id, user.id);
      
      if (publishResult.error) {
        return { error: publishResult.error };
      }
    }

    revalidatePath('/dashboard/workflows/templates');
    return { success: true, data: result.data };
  } catch (error) {
    console.error('Error in createTemplateAction:', error);
    return { error: 'Failed to create template' };
  }
}

/**
 * Update an existing template
 */
export async function updateTemplateAction(
  templateId: string,
  templateData: Partial<SOPTemplate>
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
  if (!canPerformAction(userData.role, 'tasks:edit')) {
    return { error: 'Permission denied' };
  }

  try {
    // Prepare update input
    const input: UpdateTemplateInput = {
      name: templateData.name,
      category: templateData.category,
      description: templateData.description,
      estimated_duration_minutes: templateData.estimated_duration_minutes,
      sla_hours: templateData.sla_hours,
      requires_dual_signoff: templateData.requires_dual_signoff,
      is_exception_scenario: templateData.is_exception_scenario,
      steps: templateData.steps,
    };

    const result = await updateTemplate(templateId, input);

    if (result.error) {
      return { error: result.error };
    }

    // If status changed to published, publish the template
    if (templateData.status === 'published') {
      const publishResult = await publishTemplate(templateId, user.id);
      
      if (publishResult.error) {
        return { error: publishResult.error };
      }
    }

    revalidatePath('/dashboard/workflows/templates');
    revalidatePath(`/dashboard/workflows/templates/${templateId}`);
    return { success: true, data: result.data };
  } catch (error) {
    console.error('Error in updateTemplateAction:', error);
    return { error: 'Failed to update template' };
  }
}

/**
 * Publish a template
 */
export async function publishTemplateAction(templateId: string) {
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
  if (!canPerformAction(userData.role, 'tasks:approve')) {
    return { error: 'Permission denied' };
  }

  try {
    const result = await publishTemplate(templateId, user.id);

    if (result.error) {
      return { error: result.error };
    }

    revalidatePath('/dashboard/workflows/templates');
    revalidatePath(`/dashboard/workflows/templates/${templateId}`);
    return { success: true, data: result.data };
  } catch (error) {
    console.error('Error in publishTemplateAction:', error);
    return { error: 'Failed to publish template' };
  }
}

/**
 * Archive a template
 */
export async function archiveTemplateAction(templateId: string) {
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
  if (!canPerformAction(userData.role, 'tasks:delete')) {
    return { error: 'Permission denied' };
  }

  try {
    const result = await archiveTemplate(templateId);

    if (result.error) {
      return { error: result.error };
    }

    revalidatePath('/dashboard/workflows/templates');
    return { success: true };
  } catch (error) {
    console.error('Error in archiveTemplateAction:', error);
    return { error: 'Failed to archive template' };
  }
}

/**
 * Duplicate a template
 */
export async function duplicateTemplateAction(templateId: string, newName: string) {
  const supabase = await createClient();
  
  // Check authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Unauthorized' };
  }

  // Get user role and org
  const { data: userData } = await supabase
    .from('users')
    .select('role, organization_id')
    .eq('id', user.id)
    .single();

  if (!userData) {
    return { error: 'User not found' };
  }

  // Check permissions
  if (!canPerformAction(userData.role, 'tasks:create')) {
    return { error: 'Permission denied' };
  }

  try {
    const result = await duplicateTemplate(
      templateId,
      newName,
      user.id,
      userData.organization_id
    );

    if (result.error) {
      return { error: result.error };
    }

    revalidatePath('/dashboard/workflows/templates');
    return { success: true, data: result.data };
  } catch (error) {
    console.error('Error in duplicateTemplateAction:', error);
    return { error: 'Failed to duplicate template' };
  }
}
