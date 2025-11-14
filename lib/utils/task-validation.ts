/**
 * Task Validation Utilities
 * 
 * Validation functions for task management including:
 * - Task hierarchy depth validation (max 5 levels)
 * - Prerequisite validation
 * - Evidence validation
 * - Template validation
 * 
 * @module lib/utils/task-validation
 */

import {
  Task,
  SOPTemplate,
  SOPStep,
  TaskEvidence,
  TaskHierarchyValidation,
  ValidationResult,
  ValidationError,
  MAX_TASK_HIERARCHY_LEVEL,
} from '@/types/workflow';

// =====================================================
// TASK HIERARCHY VALIDATION
// =====================================================

/**
 * Validate task hierarchy depth
 */
export function validateTaskHierarchy(
  parentHierarchyLevel: number | null,
  currentLevel?: number
): TaskHierarchyValidation {
  const errors: ValidationError[] = [];
  
  // Calculate what the level would be
  const calculatedLevel = parentHierarchyLevel !== null 
    ? parentHierarchyLevel + 1 
    : 0;

  // Check if depth is exceeded
  if (calculatedLevel > MAX_TASK_HIERARCHY_LEVEL) {
    errors.push({
      field: 'hierarchy_level',
      message: `Task hierarchy cannot exceed ${MAX_TASK_HIERARCHY_LEVEL + 1} levels (0-${MAX_TASK_HIERARCHY_LEVEL})`,
      code: 'MAX_HIERARCHY_EXCEEDED',
    });
  }

  // Validate current level matches parent
  if (currentLevel !== undefined && currentLevel !== calculatedLevel) {
    errors.push({
      field: 'hierarchy_level',
      message: `Hierarchy level ${currentLevel} does not match parent level ${parentHierarchyLevel}`,
      code: 'HIERARCHY_MISMATCH',
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    maxDepthExceeded: calculatedLevel > MAX_TASK_HIERARCHY_LEVEL,
    currentDepth: calculatedLevel,
    maxDepth: MAX_TASK_HIERARCHY_LEVEL,
  };
}

/**
 * Validate that a task can be assigned as a child of another task
 */
export function validateParentChild(
  parentTask: Task,
  childTask: Task
): ValidationResult {
  const errors: ValidationError[] = [];

  // Check hierarchy depth
  const hierarchyValidation = validateTaskHierarchy(
    parentTask.hierarchy_level,
    childTask.hierarchy_level
  );

  if (!hierarchyValidation.valid) {
    errors.push(...hierarchyValidation.errors);
  }

  // Check for circular dependencies
  if (parentTask.parent_task_id === childTask.id) {
    errors.push({
      field: 'parent_task_id',
      message: 'Circular dependency detected',
      code: 'CIRCULAR_DEPENDENCY',
    });
  }

  // Check same organization
  if (parentTask.organization_id !== childTask.organization_id) {
    errors.push({
      field: 'organization_id',
      message: 'Parent and child tasks must be in the same organization',
      code: 'ORG_MISMATCH',
    });
  }

  // Check same site (optional - tasks can span sites)
  // Uncomment if site must match:
  // if (parentTask.site_id !== childTask.site_id) {
  //   errors.push({
  //     field: 'site_id',
  //     message: 'Parent and child tasks must be at the same site',
  //     code: 'SITE_MISMATCH',
  //   });
  // }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Count total descendants of a task (recursive)
 */
export function countDescendants(task: Task, allTasks: Task[]): number {
  const children = allTasks.filter((t) => t.parent_task_id === task.id);
  
  let count = children.length;
  
  children.forEach((child) => {
    count += countDescendants(child, allTasks);
  });
  
  return count;
}

/**
 * Get all ancestor task IDs for a task
 */
export function getAncestorIds(task: Task, allTasks: Task[]): string[] {
  const ancestors: string[] = [];
  
  let currentTask = task;
  
  while (currentTask.parent_task_id) {
    const parent = allTasks.find((t) => t.id === currentTask.parent_task_id);
    
    if (!parent) break;
    
    ancestors.push(parent.id);
    currentTask = parent;
  }
  
  return ancestors;
}

/**
 * Check for circular dependencies in task hierarchy
 */
export function hasCircularDependency(
  taskId: string,
  proposedParentId: string,
  allTasks: Task[]
): boolean {
  // If proposed parent is the task itself
  if (taskId === proposedParentId) return true;

  // Get all ancestors of proposed parent
  const proposedParent = allTasks.find((t) => t.id === proposedParentId);
  
  if (!proposedParent) return false;
  
  const ancestors = getAncestorIds(proposedParent, allTasks);
  
  // Check if task is in the ancestor chain
  return ancestors.includes(taskId);
}

// =====================================================
// EVIDENCE VALIDATION
// =====================================================

/**
 * Validate evidence against step requirements
 */
export function validateEvidence(
  evidence: TaskEvidence,
  step: SOPStep
): ValidationResult {
  const errors: ValidationError[] = [];

  // Check if evidence is required
  if (step.evidenceRequired && !evidence.value) {
    errors.push({
      field: 'value',
      message: 'Evidence is required for this step',
      code: 'EVIDENCE_REQUIRED',
    });
  }

  // Check evidence type matches
  if (evidence.type !== step.evidenceType) {
    errors.push({
      field: 'type',
      message: `Evidence type ${evidence.type} does not match step requirement ${step.evidenceType}`,
      code: 'TYPE_MISMATCH',
    });
  }

  // Validate based on evidence type
  switch (evidence.type) {
    case 'numeric':
      validateNumericEvidence(evidence, step, errors);
      break;
    
    case 'checkbox':
      validateCheckboxEvidence(evidence, step, errors);
      break;
    
    case 'text':
      validateTextEvidence(evidence, step, errors);
      break;
    
    case 'photo':
      validatePhotoEvidence(evidence, step, errors);
      break;
    
    case 'dual_signature':
      validateDualSignatureEvidence(evidence, step, errors);
      break;
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate numeric evidence
 */
function validateNumericEvidence(
  evidence: TaskEvidence,
  step: SOPStep,
  errors: ValidationError[]
) {
  const value = Number(evidence.value);
  
  if (isNaN(value)) {
    errors.push({
      field: 'value',
      message: 'Numeric evidence must be a valid number',
      code: 'INVALID_NUMBER',
    });
    return;
  }

  const config = step.evidenceConfig;
  
  if (config?.minValue !== undefined && value < config.minValue) {
    errors.push({
      field: 'value',
      message: `Value ${value} is below minimum ${config.minValue}${config.unit || ''}`,
      code: 'BELOW_MIN',
    });
  }

  if (config?.maxValue !== undefined && value > config.maxValue) {
    errors.push({
      field: 'value',
      message: `Value ${value} is above maximum ${config.maxValue}${config.unit || ''}`,
      code: 'ABOVE_MAX',
    });
  }
}

/**
 * Validate checkbox evidence
 */
function validateCheckboxEvidence(
  evidence: TaskEvidence,
  step: SOPStep,
  errors: ValidationError[]
) {
  if (typeof evidence.value !== 'boolean') {
    errors.push({
      field: 'value',
      message: 'Checkbox evidence must be true or false',
      code: 'INVALID_BOOLEAN',
    });
  }
}

/**
 * Validate text evidence
 */
function validateTextEvidence(
  evidence: TaskEvidence,
  step: SOPStep,
  errors: ValidationError[]
) {
  const text = String(evidence.value);
  const config = step.evidenceConfig;

  if (config?.minLength && text.length < config.minLength) {
    errors.push({
      field: 'value',
      message: `Text must be at least ${config.minLength} characters`,
      code: 'TEXT_TOO_SHORT',
    });
  }

  if (config?.maxLength && text.length > config.maxLength) {
    errors.push({
      field: 'value',
      message: `Text must be no more than ${config.maxLength} characters`,
      code: 'TEXT_TOO_LONG',
    });
  }

  if (config?.requiredText && !text.includes(config.requiredText)) {
    errors.push({
      field: 'value',
      message: `Text must contain "${config.requiredText}"`,
      code: 'REQUIRED_TEXT_MISSING',
    });
  }
}

/**
 * Validate photo evidence
 */
function validatePhotoEvidence(
  evidence: TaskEvidence,
  step: SOPStep,
  errors: ValidationError[]
) {
  const config = step.evidenceConfig;

  if (!evidence.photoUrl && !evidence.photoUrls?.length) {
    errors.push({
      field: 'photoUrl',
      message: 'Photo evidence is required',
      code: 'PHOTO_REQUIRED',
    });
  }

  if (config?.maxPhotos && evidence.photoUrls && evidence.photoUrls.length > config.maxPhotos) {
    errors.push({
      field: 'photoUrls',
      message: `Maximum ${config.maxPhotos} photos allowed`,
      code: 'TOO_MANY_PHOTOS',
    });
  }

  if (config?.requireLocation && !evidence.location) {
    errors.push({
      field: 'location',
      message: 'Location data is required for this photo',
      code: 'LOCATION_REQUIRED',
    });
  }
}

/**
 * Validate dual signature evidence
 */
function validateDualSignatureEvidence(
  evidence: TaskEvidence,
  step: SOPStep,
  errors: ValidationError[]
) {
  if (!evidence.dualSignatures) {
    errors.push({
      field: 'dualSignatures',
      message: 'Dual signatures are required',
      code: 'DUAL_SIGNATURES_REQUIRED',
    });
    return;
  }

  const { signature1, signature2 } = evidence.dualSignatures;

  if (!signature1?.signature || !signature2?.signature) {
    errors.push({
      field: 'dualSignatures',
      message: 'Both signatures must be provided',
      code: 'INCOMPLETE_SIGNATURES',
    });
  }

  const config = step.evidenceConfig?.dualSignature;

  if (config) {
    // Check role requirements
    if (config.role1 && signature1?.role !== config.role1) {
      errors.push({
        field: 'dualSignatures.signature1',
        message: `First signature must be from ${config.role1}`,
        code: 'ROLE1_MISMATCH',
      });
    }

    if (config.role2 && signature2?.role !== config.role2) {
      errors.push({
        field: 'dualSignatures.signature2',
        message: `Second signature must be from ${config.role2}`,
        code: 'ROLE2_MISMATCH',
      });
    }

    // Ensure signatures are from different users
    if (signature1?.userId === signature2?.userId) {
      errors.push({
        field: 'dualSignatures',
        message: 'Signatures must be from different users',
        code: 'DUPLICATE_SIGNER',
      });
    }
  }
}

// =====================================================
// TEMPLATE VALIDATION
// =====================================================

/**
 * Validate SOP template
 */
export function validateTemplate(template: SOPTemplate): ValidationResult {
  const errors: ValidationError[] = [];

  // Check required fields
  if (!template.name?.trim()) {
    errors.push({
      field: 'name',
      message: 'Template name is required',
      code: 'NAME_REQUIRED',
    });
  }

  if (!template.steps || template.steps.length === 0) {
    errors.push({
      field: 'steps',
      message: 'Template must have at least one step',
      code: 'STEPS_REQUIRED',
    });
  }

  // Validate steps
  if (template.steps) {
    template.steps.forEach((step, index) => {
      const stepErrors = validateTemplateStep(step, index);
      errors.push(...stepErrors);
    });
  }

  // Validate step order is sequential
  if (template.steps) {
    const orders = template.steps.map((s) => s.order);
    const expectedOrders = Array.from({ length: orders.length }, (_, i) => i + 1);
    
    if (JSON.stringify(orders) !== JSON.stringify(expectedOrders)) {
      errors.push({
        field: 'steps',
        message: 'Step orders must be sequential starting from 1',
        code: 'INVALID_STEP_ORDER',
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate individual template step
 */
function validateTemplateStep(step: SOPStep, index: number): ValidationError[] {
  const errors: ValidationError[] = [];
  const prefix = `steps[${index}]`;

  if (!step.title?.trim()) {
    errors.push({
      field: `${prefix}.title`,
      message: `Step ${index + 1} must have a title`,
      code: 'STEP_TITLE_REQUIRED',
    });
  }

  if (!step.description?.trim()) {
    errors.push({
      field: `${prefix}.description`,
      message: `Step ${index + 1} must have a description`,
      code: 'STEP_DESCRIPTION_REQUIRED',
    });
  }

  // Validate evidence configuration
  if (step.evidenceRequired && !step.evidenceType) {
    errors.push({
      field: `${prefix}.evidenceType`,
      message: `Step ${index + 1} requires evidence but no type specified`,
      code: 'EVIDENCE_TYPE_REQUIRED',
    });
  }

  // Validate conditional logic
  if (step.isConditional && (!step.conditionalLogic || step.conditionalLogic.length === 0)) {
    errors.push({
      field: `${prefix}.conditionalLogic`,
      message: `Step ${index + 1} is marked conditional but has no logic defined`,
      code: 'CONDITIONAL_LOGIC_REQUIRED',
    });
  }

  // Validate approval requirements
  if (step.requiresApproval && (!step.approvalRoles || step.approvalRoles.length === 0)) {
    errors.push({
      field: `${prefix}.approvalRoles`,
      message: `Step ${index + 1} requires approval but no roles specified`,
      code: 'APPROVAL_ROLES_REQUIRED',
    });
  }

  return errors;
}

// =====================================================
// TASK VALIDATION
// =====================================================

/**
 * Validate task can be started
 */
export function validateTaskStart(task: Task): ValidationResult {
  const errors: ValidationError[] = [];

  if (task.status !== 'to_do' && task.status !== 'blocked') {
    errors.push({
      field: 'status',
      message: 'Task must be in to_do or blocked status to start',
      code: 'INVALID_STATUS',
    });
  }

  if (!task.assigned_to) {
    errors.push({
      field: 'assigned_to',
      message: 'Task must be assigned before starting',
      code: 'NOT_ASSIGNED',
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate task can be completed
 */
export function validateTaskCompletion(
  task: Task,
  template?: SOPTemplate
): ValidationResult {
  const errors: ValidationError[] = [];

  if (task.status !== 'in_progress') {
    errors.push({
      field: 'status',
      message: 'Task must be in progress to complete',
      code: 'NOT_IN_PROGRESS',
    });
  }

  // Check all required evidence is provided
  if (template) {
    const requiredSteps = template.steps.filter((s) => s.evidenceRequired);
    const providedStepIds = new Set(task.evidence.map((e) => e.stepId));

    const missingEvidence = requiredSteps.filter(
      (s) => !providedStepIds.has(s.id)
    );

    if (missingEvidence.length > 0) {
      errors.push({
        field: 'evidence',
        message: `Missing required evidence for ${missingEvidence.length} step(s)`,
        code: 'MISSING_EVIDENCE',
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
