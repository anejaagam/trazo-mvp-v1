export type RecipeStatus = 'Draft' | 'Published' | 'Applied' | 'Deprecated' | 'Archived';
export type StageType = 'Germination' | 'Vegetative' | 'Flowering' | 'Harvest';
export type SetpointType = 'Temperature' | 'RH' | 'VPD' | 'CO2' | 'LightIntensity' | 'Photoperiod';
export type OverrideStatus = 'Requested' | 'Active' | 'Reverted' | 'Blocked' | 'Escalated';

export interface Ramp {
  start: number;
  end: number;
  duration: number; // minutes
}

export interface SetpointTarget {
  id: string;
  stageId: string;
  type: SetpointType;
  value: number;
  unit: string;
  dayValue?: number;
  nightValue?: number;
  ramp?: Ramp;
  deadband?: number;
  minValue?: number;
  maxValue?: number;
}

export interface Stage {
  id: string;
  recipeVersionId: string;
  name: StageType;
  duration: number; // days
  order: number;
  setpoints: SetpointTarget[];
}

export interface RecipeVersion {
  id: string;
  recipeId: string;
  version: number;
  createdBy: string;
  createdAt: string; // UTC
  notes: string;
  stages: Stage[];
  diff?: string;
}

export interface Recipe {
  id: string;
  name: string;
  ownerId: string;
  ownerName: string;
  status: RecipeStatus;
  currentVersion: number;
  versions: RecipeVersion[];
  createdAt: string;
  updatedAt: string;
}

export interface BlackoutWindow {
  start: string; // HH:mm
  end: string; // HH:mm
  reason: string;
}

export interface Schedule {
  id: string;
  scope: 'room' | 'pod' | 'batch_group' | 'site';
  scopeId: string;
  scopeName: string;
  timezone: string;
  dayStart: string; // HH:mm
  nightStart: string; // HH:mm
  blackoutWindows: BlackoutWindow[];
  activeRecipeId?: string;
  activeRecipeName?: string;
  activationTime?: string;
}

export interface Override {
  id: string;
  scopeId: string;
  scopeName: string;
  parameter: SetpointType;
  currentValue: number;
  overrideValue: number;
  unit: string;
  ttl: number; // seconds
  reason: string;
  actorId: string;
  actorName: string;
  precedence: 'Safety' | 'E-stop' | 'Manual Override' | 'Recipe' | 'DR';
  status: OverrideStatus;
  createdAt: string;
  expiresAt?: string;
  revertedAt?: string;
}

export interface BatchGroup {
  id: string;
  name: string;
  pods: string[];
  activeRecipeId?: string;
  activeRecipeName?: string;
  stage?: StageType;
  stageDay?: number;
  scheduledActivation?: string;
}

export interface AuditEvent {
  id: string;
  timestamp: string; // UTC
  eventType: 'recipe_change' | 'setpoint_update' | 'schedule_activation' | 'override_event' | 'irrigation_cycle' | 'dr_event';
  actor: string;
  scope: string;
  action: string;
  reason?: string;
  metadata?: Record<string, any>;
}

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface IrrigationProgram {
  id: string;
  name: string;
  zones: string[];
  preWet?: {
    duration: number; // seconds
    flowRate: number; // L/min
  };
  pulses: {
    count: number;
    duration: number; // seconds
    interval: number; // seconds
    ecTarget?: number;
    phTarget?: number;
  };
  flush?: {
    duration: number; // seconds
  };
}
