/**
 * Stage Progressions Configuration
 * 
 * Defines valid stage transitions and workflow rules for each domain
 */

import type { DomainType } from '../types/domains';
import type { CannabisBatchStage } from '../types/domains/cannabis';
import type { ProduceBatchStage } from '../types/domains/produce';

/**
 * Stage Progression Definition
 */
export interface StageProgression {
  stage: string;
  label: string;
  description: string;
  color: string; // Tailwind color class
  icon: string; // Lucide icon name
  nextStages: string[];
  allowedPreviousStages: string[];
  minDuration?: number; // Minimum days in this stage
  maxDuration?: number; // Maximum days before alert
  requirements?: StageRequirement[];
}

/**
 * Requirements for stage transitions
 */
export interface StageRequirement {
  type: 'field' | 'date' | 'count' | 'approval' | 'measurement';
  field?: string;
  label: string;
  required: boolean;
  validator?: (value: any) => boolean;
}

/**
 * Cannabis Stage Progressions
 */
export const cannabisStageProgressions: StageProgression[] = [
  {
    stage: 'propagation',
    label: 'Propagation',
    description: 'Cloning or seedling phase',
    color: 'blue',
    icon: 'Sprout',
    nextStages: ['vegetative'],
    allowedPreviousStages: [],
    minDuration: 7,
    maxDuration: 21,
  },
  {
    stage: 'vegetative',
    label: 'Vegetative',
    description: 'Vegetative growth phase',
    color: 'green',
    icon: 'Leaf',
    nextStages: ['flowering', 'propagation'], // Can take clones
    allowedPreviousStages: ['propagation'],
    minDuration: 14,
    maxDuration: 60,
  },
  {
    stage: 'flowering',
    label: 'Flowering',
    description: 'Flowering/bloom phase',
    color: 'purple',
    icon: 'Flower',
    nextStages: ['harvest'],
    allowedPreviousStages: ['vegetative'],
    minDuration: 49,
    maxDuration: 84,
    requirements: [
      {
        type: 'field',
        field: 'lightingSchedule',
        label: 'Light schedule changed to 12/12',
        required: true,
      },
    ],
  },
  {
    stage: 'harvest',
    label: 'Harvest',
    description: 'Harvesting plants',
    color: 'amber',
    icon: 'Scissors',
    nextStages: ['drying'],
    allowedPreviousStages: ['flowering'],
    minDuration: 1,
    maxDuration: 3,
  },
  {
    stage: 'drying',
    label: 'Drying',
    description: 'Drying harvested material',
    color: 'yellow',
    icon: 'Wind',
    nextStages: ['curing', 'testing'],
    allowedPreviousStages: ['harvest'],
    minDuration: 7,
    maxDuration: 14,
  },
  {
    stage: 'curing',
    label: 'Curing',
    description: 'Curing for quality',
    color: 'orange',
    icon: 'Archive',
    nextStages: ['testing', 'packaging'],
    allowedPreviousStages: ['drying'],
    minDuration: 14,
    maxDuration: 60,
  },
  {
    stage: 'testing',
    label: 'Testing',
    description: 'Lab testing and quality assurance',
    color: 'cyan',
    icon: 'FlaskConical',
    nextStages: ['packaging', 'closed'],
    allowedPreviousStages: ['drying', 'curing'],
    minDuration: 1,
    maxDuration: 7,
  },
  {
    stage: 'packaging',
    label: 'Packaging',
    description: 'Final packaging for distribution',
    color: 'indigo',
    icon: 'Package',
    nextStages: ['closed'],
    allowedPreviousStages: ['testing', 'curing'],
    minDuration: 1,
    maxDuration: 7,
  },
  {
    stage: 'closed',
    label: 'Closed',
    description: 'Batch completed',
    color: 'gray',
    icon: 'CheckCircle',
    nextStages: [],
    allowedPreviousStages: ['packaging', 'testing'],
  },
];

/**
 * Produce Stage Progressions
 */
export const produceStageProgressions: StageProgression[] = [
  {
    stage: 'seeding',
    label: 'Seeding',
    description: 'Seeds planted',
    color: 'brown',
    icon: 'Droplet',
    nextStages: ['germination'],
    allowedPreviousStages: [],
    minDuration: 1,
    maxDuration: 7,
  },
  {
    stage: 'germination',
    label: 'Germination',
    description: 'Seeds germinating',
    color: 'lime',
    icon: 'Sprout',
    nextStages: ['seedling'],
    allowedPreviousStages: ['seeding'],
    minDuration: 3,
    maxDuration: 14,
  },
  {
    stage: 'seedling',
    label: 'Seedling',
    description: 'Young plants establishing',
    color: 'green',
    icon: 'Leaf',
    nextStages: ['transplant', 'growing'],
    allowedPreviousStages: ['germination'],
    minDuration: 7,
    maxDuration: 21,
  },
  {
    stage: 'transplant',
    label: 'Transplant',
    description: 'Plants being transplanted',
    color: 'teal',
    icon: 'MoveHorizontal',
    nextStages: ['growing'],
    allowedPreviousStages: ['seedling'],
    minDuration: 1,
    maxDuration: 3,
  },
  {
    stage: 'growing',
    label: 'Growing',
    description: 'Active growth phase',
    color: 'emerald',
    icon: 'TrendingUp',
    nextStages: ['pre_harvest', 'harvest'],
    allowedPreviousStages: ['seedling', 'transplant'],
    minDuration: 21,
    maxDuration: 120,
  },
  {
    stage: 'pre_harvest',
    label: 'Pre-Harvest',
    description: 'Preparing for harvest',
    color: 'yellow',
    icon: 'Clock',
    nextStages: ['harvest'],
    allowedPreviousStages: ['growing'],
    minDuration: 1,
    maxDuration: 7,
  },
  {
    stage: 'harvest',
    label: 'Harvest',
    description: 'Harvesting produce',
    color: 'orange',
    icon: 'Scissors',
    nextStages: ['washing', 'sorting'],
    allowedPreviousStages: ['growing', 'pre_harvest'],
    minDuration: 1,
    maxDuration: 7,
  },
  {
    stage: 'washing',
    label: 'Washing',
    description: 'Cleaning harvested produce',
    color: 'blue',
    icon: 'Droplets',
    nextStages: ['sorting', 'grading'],
    allowedPreviousStages: ['harvest'],
    minDuration: 1,
    maxDuration: 1,
  },
  {
    stage: 'sorting',
    label: 'Sorting',
    description: 'Sorting by size/quality',
    color: 'purple',
    icon: 'Filter',
    nextStages: ['grading', 'packaging'],
    allowedPreviousStages: ['harvest', 'washing'],
    minDuration: 1,
    maxDuration: 2,
  },
  {
    stage: 'grading',
    label: 'Grading',
    description: 'Quality grading',
    color: 'violet',
    icon: 'Star',
    nextStages: ['ripening', 'packaging', 'storage'],
    allowedPreviousStages: ['sorting', 'washing'],
    minDuration: 1,
    maxDuration: 2,
  },
  {
    stage: 'ripening',
    label: 'Ripening',
    description: 'Controlled ripening',
    color: 'amber',
    icon: 'Sun',
    nextStages: ['packaging', 'storage'],
    allowedPreviousStages: ['grading'],
    minDuration: 1,
    maxDuration: 14,
  },
  {
    stage: 'packaging',
    label: 'Packaging',
    description: 'Final packaging',
    color: 'indigo',
    icon: 'Package',
    nextStages: ['storage', 'closed'],
    allowedPreviousStages: ['sorting', 'grading', 'ripening'],
    minDuration: 1,
    maxDuration: 2,
  },
  {
    stage: 'storage',
    label: 'Storage',
    description: 'Cold storage',
    color: 'cyan',
    icon: 'Snowflake',
    nextStages: ['closed'],
    allowedPreviousStages: ['grading', 'ripening', 'packaging'],
    minDuration: 1,
    maxDuration: 30,
  },
  {
    stage: 'closed',
    label: 'Closed',
    description: 'Batch completed',
    color: 'gray',
    icon: 'CheckCircle',
    nextStages: [],
    allowedPreviousStages: ['packaging', 'storage'],
  },
];

/**
 * Get stage progressions for a domain
 */
export function getStageProgressions(domain: DomainType): StageProgression[] {
  return domain === 'cannabis' ? cannabisStageProgressions : produceStageProgressions;
}

/**
 * Get stage configuration
 */
export function getStageConfig(domain: DomainType, stage: string): StageProgression | undefined {
  const progressions = getStageProgressions(domain);
  return progressions.find(p => p.stage === stage);
}

/**
 * Check if stage transition is valid
 */
export function isValidTransition(
  domain: DomainType,
  fromStage: string,
  toStage: string
): boolean {
  const config = getStageConfig(domain, fromStage);
  if (!config) return false;
  return config.nextStages.includes(toStage);
}

/**
 * Get next available stages
 */
export function getNextStages(domain: DomainType, currentStage: string): StageProgression[] {
  const config = getStageConfig(domain, currentStage);
  if (!config) return [];
  
  const progressions = getStageProgressions(domain);
  return config.nextStages
    .map(stage => progressions.find(p => p.stage === stage))
    .filter((p): p is StageProgression => p !== undefined);
}

/**
 * Get all stages for a domain
 */
export function getAllStages(domain: DomainType): string[] {
  return getStageProgressions(domain).map(p => p.stage);
}

/**
 * Type guards for stage types
 */
export function isCannabisBatchStage(stage: string): stage is CannabisBatchStage {
  return getAllStages('cannabis').includes(stage);
}

export function isProduceBatchStage(stage: string): stage is ProduceBatchStage {
  return getAllStages('produce').includes(stage);
}
