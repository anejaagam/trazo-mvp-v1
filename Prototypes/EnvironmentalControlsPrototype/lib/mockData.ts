import { Recipe, RecipeVersion, Stage, SetpointTarget, Schedule, BatchGroup, Override, AuditEvent } from '../types';

// Mock Recipes
export const mockRecipes: Recipe[] = [
  {
    id: 'recipe-1',
    name: 'Premium Flower Cycle',
    ownerId: 'user-1',
    ownerName: 'Sarah Chen',
    status: 'Published',
    currentVersion: 3,
    versions: [],
    createdAt: '2025-08-15T10:00:00Z',
    updatedAt: '2025-10-10T14:30:00Z'
  },
  {
    id: 'recipe-2',
    name: 'Fast Veg Protocol',
    ownerId: 'user-1',
    ownerName: 'Sarah Chen',
    status: 'Applied',
    currentVersion: 2,
    versions: [],
    createdAt: '2025-09-01T08:00:00Z',
    updatedAt: '2025-10-05T09:15:00Z'
  },
  {
    id: 'recipe-3',
    name: 'Seed Starting Mix',
    ownerId: 'user-2',
    ownerName: 'Mike Rodriguez',
    status: 'Draft',
    currentVersion: 1,
    versions: [],
    createdAt: '2025-10-12T16:20:00Z',
    updatedAt: '2025-10-12T16:20:00Z'
  }
];

// Mock Setpoints for a stage
export const createMockSetpoints = (stageId: string): SetpointTarget[] => [
  {
    id: `sp-${stageId}-1`,
    stageId,
    type: 'Temperature',
    value: 24,
    dayValue: 26,
    nightValue: 22,
    unit: '°C',
    deadband: 1,
    minValue: 18,
    maxValue: 30
  },
  {
    id: `sp-${stageId}-2`,
    stageId,
    type: 'RH',
    value: 65,
    dayValue: 60,
    nightValue: 70,
    unit: '%',
    deadband: 5,
    minValue: 40,
    maxValue: 80
  },
  {
    id: `sp-${stageId}-3`,
    stageId,
    type: 'CO2',
    value: 1200,
    unit: 'ppm',
    deadband: 50,
    minValue: 400,
    maxValue: 1500
  },
  {
    id: `sp-${stageId}-4`,
    stageId,
    type: 'LightIntensity',
    value: 85,
    unit: '%',
    ramp: { start: 0, end: 85, duration: 30 },
    minValue: 0,
    maxValue: 100
  },
  {
    id: `sp-${stageId}-5`,
    stageId,
    type: 'Photoperiod',
    value: 18,
    unit: 'hrs',
    minValue: 0,
    maxValue: 24
  }
];

// Mock Stages
export const createMockStages = (recipeVersionId: string): Stage[] => [
  {
    id: `stage-${recipeVersionId}-1`,
    recipeVersionId,
    name: 'Germination',
    duration: 7,
    order: 1,
    setpoints: createMockSetpoints(`stage-${recipeVersionId}-1`)
  },
  {
    id: `stage-${recipeVersionId}-2`,
    recipeVersionId,
    name: 'Vegetative',
    duration: 21,
    order: 2,
    setpoints: createMockSetpoints(`stage-${recipeVersionId}-2`).map(sp => ({
      ...sp,
      value: sp.type === 'Photoperiod' ? 18 : sp.type === 'LightIntensity' ? 90 : sp.value
    }))
  },
  {
    id: `stage-${recipeVersionId}-3`,
    recipeVersionId,
    name: 'Flowering',
    duration: 56,
    order: 3,
    setpoints: createMockSetpoints(`stage-${recipeVersionId}-3`).map(sp => ({
      ...sp,
      value: sp.type === 'Photoperiod' ? 12 : sp.type === 'RH' ? 50 : sp.value,
      dayValue: sp.type === 'RH' ? 45 : sp.dayValue,
      nightValue: sp.type === 'RH' ? 55 : sp.nightValue
    }))
  },
  {
    id: `stage-${recipeVersionId}-4`,
    recipeVersionId,
    name: 'Harvest',
    duration: 1,
    order: 4,
    setpoints: createMockSetpoints(`stage-${recipeVersionId}-4`).map(sp => ({
      ...sp,
      value: sp.type === 'LightIntensity' ? 0 : sp.type === 'Photoperiod' ? 0 : sp.value
    }))
  }
];

// Mock Recipe Versions
export const mockRecipeVersions: RecipeVersion[] = [
  {
    id: 'rv-1',
    recipeId: 'recipe-1',
    version: 3,
    createdBy: 'Sarah Chen',
    createdAt: '2025-10-10T14:30:00Z',
    notes: 'Adjusted flowering RH targets to reduce mold risk',
    stages: createMockStages('rv-1')
  }
];

// Mock Schedules
export const mockSchedules: Schedule[] = [
  {
    id: 'sched-1',
    scope: 'batch_group',
    scopeId: 'bg-1',
    scopeName: 'Batch Group A-D',
    timezone: 'America/Los_Angeles',
    dayStart: '06:00',
    nightStart: '18:00',
    blackoutWindows: [
      {
        start: '02:00',
        end: '04:00',
        reason: 'Scheduled maintenance window'
      }
    ],
    activeRecipeId: 'recipe-1',
    activeRecipeName: 'Premium Flower Cycle',
    activationTime: '2025-09-01T08:00:00-07:00'
  },
  {
    id: 'sched-2',
    scope: 'pod',
    scopeId: 'pod-5',
    scopeName: 'Pod E',
    timezone: 'America/Los_Angeles',
    dayStart: '07:00',
    nightStart: '19:00',
    blackoutWindows: []
  }
];

// Mock Batch Groups
export const mockBatchGroups: BatchGroup[] = [
  {
    id: 'bg-1',
    name: 'Batch Group A-D',
    pods: ['Pod A', 'Pod B', 'Pod C', 'Pod D'],
    activeRecipeId: 'recipe-1',
    activeRecipeName: 'Premium Flower Cycle',
    stage: 'Flowering',
    stageDay: 28,
    scheduledActivation: '2025-09-01T08:00:00-07:00'
  },
  {
    id: 'bg-2',
    name: 'Veg Group 1',
    pods: ['Pod E', 'Pod F'],
    activeRecipeId: 'recipe-2',
    activeRecipeName: 'Fast Veg Protocol',
    stage: 'Vegetative',
    stageDay: 14
  },
  {
    id: 'bg-3',
    name: 'New Starts',
    pods: ['Pod G', 'Pod H'],
    stage: 'Germination',
    stageDay: 3
  }
];

// Mock Overrides
export const mockOverrides: Override[] = [
  {
    id: 'ovr-1',
    scopeId: 'pod-a',
    scopeName: 'Pod A',
    parameter: 'CO2',
    currentValue: 1200,
    overrideValue: 0,
    unit: 'ppm',
    ttl: 1200,
    reason: 'Door open for inspection',
    actorId: 'user-3',
    actorName: 'James Wilson',
    precedence: 'Manual Override',
    status: 'Active',
    createdAt: '2025-10-16T10:30:00Z',
    expiresAt: '2025-10-16T10:50:00Z'
  },
  {
    id: 'ovr-2',
    scopeId: 'pod-c',
    scopeName: 'Pod C',
    parameter: 'Temperature',
    currentValue: 26,
    overrideValue: 24,
    unit: '°C',
    ttl: 7200,
    reason: 'Hotfix: temperature spike mitigation',
    actorId: 'user-1',
    actorName: 'Sarah Chen',
    precedence: 'Manual Override',
    status: 'Active',
    createdAt: '2025-10-16T09:00:00Z',
    expiresAt: '2025-10-16T11:00:00Z'
  }
];

// Mock Audit Events
export const mockAuditEvents: AuditEvent[] = [
  {
    id: 'audit-1',
    timestamp: '2025-10-16T10:30:15Z',
    eventType: 'override_event',
    actor: 'James Wilson',
    scope: 'Pod A',
    action: 'Override Started',
    reason: 'Door open for inspection',
    metadata: { parameter: 'CO2', value: 0, ttl: 1200 }
  },
  {
    id: 'audit-2',
    timestamp: '2025-10-16T09:00:00Z',
    eventType: 'override_event',
    actor: 'Sarah Chen',
    scope: 'Pod C',
    action: 'Override Started',
    reason: 'Hotfix: temperature spike mitigation',
    metadata: { parameter: 'Temperature', value: 24, ttl: 7200 }
  },
  {
    id: 'audit-3',
    timestamp: '2025-10-10T14:30:00Z',
    eventType: 'recipe_change',
    actor: 'Sarah Chen',
    scope: 'Premium Flower Cycle',
    action: 'Published v3',
    reason: 'Adjusted flowering RH targets to reduce mold risk'
  },
  {
    id: 'audit-4',
    timestamp: '2025-09-01T08:00:01Z',
    eventType: 'schedule_activation',
    actor: 'System',
    scope: 'Batch Group A-D',
    action: 'Recipe Activated',
    metadata: { recipe: 'Premium Flower Cycle v3', accuracy: '+1s' }
  },
  {
    id: 'audit-5',
    timestamp: '2025-10-15T14:20:00Z',
    eventType: 'setpoint_update',
    actor: 'Mike Rodriguez',
    scope: 'Pod E',
    action: 'Setpoint Updated',
    metadata: { parameter: 'LightIntensity', from: 85, to: 90 }
  }
];
