/**
 * Batch-Task Integration Query Helpers
 * Handles linking SOP templates to batches, auto-creating tasks, and managing batch packets
 */

import { createClient } from '@/lib/supabase/server';

/**
 * Link an SOP template to a batch for automated task generation
 */
export async function linkTemplateToBatch(
  batchId: string,
  templateId: string,
  options?: {
    stage?: string;
    autoCreate?: boolean;
    userId?: string;
  }
) {
  try {
    const supabase = await createClient();
    
    // Get current user if not provided
    let userId = options?.userId;
    if (!userId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { data: null, error: new Error('Not authenticated') };
      }
      userId = user.id;
    }

    // Check if link already exists
    const { data: existingLink } = await supabase
      .from('batch_sop_links')
      .select('*')
      .eq('batch_id', batchId)
      .eq('sop_template_id', templateId)
      .single();

    if (existingLink) {
      return { data: null, error: new Error('Template already linked to this batch') };
    }

    // Create the link
    const { data, error } = await supabase
      .from('batch_sop_links')
      .insert({
        batch_id: batchId,
        sop_template_id: templateId,
        stage: options?.stage || null,
        auto_create: options?.autoCreate ?? false,
        created_by: userId
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Log event
    await supabase.from('batch_events').insert({
      batch_id: batchId,
      event_type: 'sop_template_linked',
      to_value: { template_id: templateId, stage: options?.stage },
      user_id: userId,
      notes: `SOP template linked${options?.stage ? ` for stage: ${options.stage}` : ''}`
    });

    return { data, error: null };
  } catch (error) {
    console.error('Error in linkTemplateToBatch:', error);
    return { data: null, error };
  }
}

/**
 * Unlink an SOP template from a batch
 */
export async function unlinkTemplateFromBatch(linkId: string, userId?: string) {
  try {
    const supabase = await createClient();
    
    // Get current user if not provided
    if (!userId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { error: new Error('Not authenticated') };
      }
      userId = user.id;
    }

    // Get link details before deleting
    const { data: link } = await supabase
      .from('batch_sop_links')
      .select('batch_id, sop_template_id')
      .eq('id', linkId)
      .single();

    if (!link) {
      return { error: new Error('Link not found') };
    }

    // Delete the link
    const { error } = await supabase
      .from('batch_sop_links')
      .delete()
      .eq('id', linkId);

    if (error) {
      throw error;
    }

    // Log event
    await supabase.from('batch_events').insert({
      batch_id: link.batch_id,
      event_type: 'task_cancelled',
      from_value: { template_id: link.sop_template_id },
      user_id: userId,
      notes: 'SOP template unlinked from batch'
    });

    return { error: null };
  } catch (error) {
    console.error('Error in unlinkTemplateFromBatch:', error);
    return { error };
  }
}

/**
 * Get all SOP templates linked to a batch
 */
export async function getBatchSOPLinks(batchId: string) {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('batch_sop_links')
      .select(`
        *,
        sop_template:sop_templates (
          id,
          name,
          category,
          description,
          estimated_duration_minutes,
          required_role,
          is_active
        )
      `)
      .eq('batch_id', batchId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error in getBatchSOPLinks:', error);
    return { data: null, error };
  }
}

/**
 * Get all tasks for a specific batch
 */
export async function getBatchTasks(batchId: string, filters?: {
  status?: string[];
  assignedTo?: string;
}) {
  try {
    const supabase = await createClient();
    
    let query = supabase
      .from('tasks')
      .select(`
        *,
        assigned_user:users!tasks_assigned_to_fkey (
          id,
          full_name,
          email
        ),
        sop_template:sop_templates (
          id,
          name,
          category
        )
      `)
      .eq('batch_id', batchId)
      .order('created_at', { ascending: false });

    if (filters?.status && filters.status.length > 0) {
      query = query.in('status', filters.status);
    }

    if (filters?.assignedTo) {
      query = query.eq('assigned_to', filters.assignedTo);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error in getBatchTasks:', error);
    return { data: null, error };
  }
}

/**
 * Create a task from a template for a specific batch
 */
export async function createTaskFromTemplate(
  batchId: string,
  templateId: string,
  options?: {
    assignTo?: string;
    dueDate?: string;
    priority?: 'low' | 'medium' | 'high' | 'critical';
    userId?: string;
  }
) {
  try {
    const supabase = await createClient();
    
    // Get current user if not provided
    let userId = options?.userId;
    if (!userId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { data: null, error: new Error('Not authenticated') };
      }
      userId = user.id;
    }

    // Get batch and template details
    const [batchResult, templateResult] = await Promise.all([
      supabase
        .from('batches')
        .select('batch_number, site_id, organization_id')
        .eq('id', batchId)
        .single(),
      supabase
        .from('sop_templates')
        .select('*')
        .eq('id', templateId)
        .single()
    ]);

    if (batchResult.error || templateResult.error) {
      throw batchResult.error || templateResult.error;
    }

    const batch = batchResult.data;
    const template = templateResult.data;

    // Create task
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .insert({
        organization_id: batch.organization_id,
        site_id: batch.site_id,
        batch_id: batchId,
        sop_template_id: templateId,
        title: `${template.name} - ${batch.batch_number}`,
        description: template.description,
        status: 'to_do',
        priority: options?.priority || 'medium',
        assigned_to: options?.assignTo || null,
        due_date: options?.dueDate || null,
        estimated_duration_minutes: template.estimated_duration_minutes,
        related_to_type: 'batch',
        related_to_id: batchId,
        created_by: userId
      })
      .select()
      .single();

    if (taskError) {
      throw taskError;
    }

    // Create task steps from template
    if (template.steps && Array.isArray(template.steps)) {
      const steps = (template.steps as unknown[]).map((step: unknown, index: number) => ({
        task_id: task.id,
        step_number: index + 1,
        description: (step as Record<string, unknown>).title || (step as Record<string, unknown>).description,
        instructions: (step as Record<string, unknown>).instructions,
        evidence_required: (step as Record<string, unknown>).evidenceRequired || false,
        evidence_type: (step as Record<string, unknown>).evidenceType || null,
        expected_value: ((step as Record<string, unknown>).evidenceConfig as Record<string, unknown> | undefined)?.expectedValue || null,
        tolerance_range: ((step as Record<string, unknown>).evidenceConfig as Record<string, unknown> | undefined)?.toleranceRange || null,
        is_completed: false,
        skipped: false,
        batch_id: batchId
      }));

      const { error: stepsError } = await supabase
        .from('task_steps')
        .insert(steps);

      if (stepsError) {
        console.error('Error creating task steps:', stepsError);
        // Don't fail the whole operation if steps fail
      }
    }

    // Log event
    await supabase.from('batch_events').insert({
      batch_id: batchId,
      event_type: 'task_linked',
      task_id: task.id,
      user_id: userId,
      notes: `Task created from template: ${template.name}`
    });

    return { data: task, error: null };
  } catch (error) {
    console.error('Error in createTaskFromTemplate:', error);
    return { data: null, error };
  }
}

/**
 * Get batch packet generation history
 */
export async function getBatchPackets(batchId: string) {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('batch_packets')
      .select(`
        *,
        generated_user:users!batch_packets_generated_by_fkey (
          id,
          full_name,
          email
        )
      `)
      .eq('batch_id', batchId)
      .order('generated_at', { ascending: false });

    if (error) {
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error in getBatchPackets:', error);
    return { data: null, error };
  }
}

/**
 * Record a batch packet generation
 */
export async function recordBatchPacket(
  batchId: string,
  fileUrl: string,
  options?: {
    packetType?: 'full' | 'summary' | 'compliance' | 'harvest';
    fileSizeBytes?: number;
    includesTasks?: boolean;
    includesRecipe?: boolean;
    includesInventory?: boolean;
    includesCompliance?: boolean;
    metadata?: Record<string, unknown>;
    userId?: string;
  }
) {
  try {
    const supabase = await createClient();
    
    // Get current user if not provided
    let userId = options?.userId;
    if (!userId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { data: null, error: new Error('Not authenticated') };
      }
      userId = user.id;
    }

    const { data, error } = await supabase
      .from('batch_packets')
      .insert({
        batch_id: batchId,
        packet_type: options?.packetType || 'full',
        file_url: fileUrl,
        file_size_bytes: options?.fileSizeBytes || null,
        includes_tasks: options?.includesTasks ?? true,
        includes_recipe: options?.includesRecipe ?? true,
        includes_inventory: options?.includesInventory ?? true,
        includes_compliance: options?.includesCompliance ?? true,
        metadata: options?.metadata || null,
        generated_by: userId
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Log event
    await supabase.from('batch_events').insert({
      batch_id: batchId,
      event_type: 'packet_generated',
      to_value: { 
        packet_type: options?.packetType || 'full',
        file_url: fileUrl
      },
      user_id: userId,
      notes: `Batch packet generated: ${options?.packetType || 'full'}`
    });

    return { data, error: null };
  } catch (error) {
    console.error('Error in recordBatchPacket:', error);
    return { data: null, error };
  }
}

/**
 * Get comprehensive batch data for packet generation
 */
export async function getBatchPacketData(batchId: string) {
  try {
    const supabase = await createClient();
    
    // Fetch all related data in parallel
    const [
      batchResult,
      tasksResult,
      eventsResult,
      sopLinksResult,
      packetsResult
    ] = await Promise.all([
      // Batch details with cultivar and site info
      supabase
        .from('batches')
        .select(`
          *,
          cultivar:cultivars (*),
          site:sites (*),
          created_user:users!batches_created_by_fkey (id, full_name, email)
        `)
        .eq('id', batchId)
        .single(),
      
      // Tasks
      getBatchTasks(batchId),
      
      // Events
      supabase
        .from('batch_events')
        .select(`
          *,
          user:users (id, full_name, email)
        `)
        .eq('batch_id', batchId)
        .order('timestamp', { ascending: false }),
      
      // SOP links
      getBatchSOPLinks(batchId),
      
      // Previous packets
      getBatchPackets(batchId)
    ]);

    if (batchResult.error) {
      throw batchResult.error;
    }

    return {
      data: {
        batch: batchResult.data,
        tasks: tasksResult.data || [],
        events: eventsResult.data || [],
        sopLinks: sopLinksResult.data || [],
        previousPackets: packetsResult.data || []
      },
      error: null
    };
  } catch (error) {
    console.error('Error in getBatchPacketData:', error);
    return { data: null, error };
  }
}
