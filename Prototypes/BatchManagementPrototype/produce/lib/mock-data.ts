import { Batch, BatchGroup, GrowingArea, TimelineEvent } from '../types/batch';

export const mockGrowingAreas: GrowingArea[] = [
  { 
    id: 'area-1', 
    name: 'Greenhouse 1', 
    location: 'North Wing', 
    capacity: 500,
    type: 'greenhouse',
    growingArea: 2000,
    usedGrowingArea: 1800
  },
  { 
    id: 'area-2', 
    name: 'Greenhouse 2', 
    location: 'North Wing', 
    capacity: 500,
    type: 'greenhouse',
    growingArea: 2000,
    usedGrowingArea: 1200
  },
  { 
    id: 'area-3', 
    name: 'High Tunnel A', 
    location: 'East Field', 
    capacity: 300,
    type: 'greenhouse',
    growingArea: 1500,
    usedGrowingArea: 1200
  },
  { 
    id: 'area-4', 
    name: 'Outdoor Field 1', 
    location: 'South Field', 
    capacity: 1000,
    type: 'outdoor',
    growingArea: 5000,
    usedGrowingArea: 500
  },
  { 
    id: 'area-5', 
    name: 'Hydroponic Bay', 
    location: 'Indoor Facility', 
    capacity: 200,
    type: 'hydroponics',
    growingArea: 800,
    usedGrowingArea: 100
  },
];

export const mockBatches: Batch[] = [
  {
    id: 'batch-1',
    name: 'BTH-2025-001',
    variety: 'Roma Tomato',
    varietyId: 'var-1',
    stage: 'growing',
    startDate: '2025-01-15',
    groupId: 'group-1',
    growingAreaIds: ['area-1', 'area-2'],
    plantCount: 450,
    createdAt: '2025-01-15T08:00:00Z',
    quarantineStatus: 'none',
  },
  {
    id: 'batch-2',
    name: 'BTH-2025-002',
    variety: 'Butterhead Lettuce',
    varietyId: 'var-2',
    stage: 'transplant',
    startDate: '2025-02-01',
    groupId: 'group-1',
    growingAreaIds: ['area-3'],
    plantCount: 300,
    createdAt: '2025-02-01T08:00:00Z',
    quarantineStatus: 'none',
  },
  {
    id: 'batch-3',
    name: 'BTH-2025-003',
    variety: 'Chandler Strawberry',
    varietyId: 'var-3',
    stage: 'seedling',
    startDate: '2025-03-10',
    growingAreaIds: ['area-4'],
    plantCount: 800,
    createdAt: '2025-03-10T08:00:00Z',
    quarantineStatus: 'none',
  },
  {
    id: 'batch-4',
    name: 'BTH-2024-089',
    variety: 'Bell Pepper Mix',
    varietyId: 'var-4',
    stage: 'closed',
    startDate: '2024-12-01',
    growingAreaIds: ['area-5'],
    plantCount: 200,
    createdAt: '2024-12-01T08:00:00Z',
    harvestDate: '2025-02-15',
    closedDate: '2025-03-01',
    quarantineStatus: 'none',
    yieldData: {
      totalYield: 850,
      grade_a: 680,
      grade_b: 150,
      waste: 20,
    },
  },
];

export const mockGroups: BatchGroup[] = [
  {
    id: 'group-1',
    name: 'Spring 2025 Production',
    description: 'Primary production batches for Q1 2025',
    batchIds: ['batch-1', 'batch-2'],
    createdAt: '2025-01-15T08:00:00Z',
  },
];

export const mockTimelineEvents: TimelineEvent[] = [
  {
    id: 'event-1',
    batchId: 'batch-1',
    type: 'stage_change',
    timestamp: '2025-01-15T08:00:00Z',
    description: 'Batch created in seedling stage',
    data: { fromStage: null, toStage: 'seedling' },
  },
  {
    id: 'event-2',
    batchId: 'batch-1',
    type: 'stage_change',
    timestamp: '2025-01-29T10:30:00Z',
    description: 'Transitioned to transplant stage',
    data: { fromStage: 'seedling', toStage: 'transplant' },
  },
  {
    id: 'event-3',
    batchId: 'batch-1',
    type: 'alarm',
    timestamp: '2025-02-05T14:20:00Z',
    description: 'High temperature alarm triggered in greenhouse',
    data: { metric: 'temperature', value: 95, threshold: 85 },
  },
  {
    id: 'event-4',
    batchId: 'batch-1',
    type: 'override',
    timestamp: '2025-02-05T14:45:00Z',
    description: 'Manual ventilation override applied',
    data: { parameter: 'ventilation', oldValue: 'auto', newValue: 'max' },
    userId: 'user-1',
  },
  {
    id: 'event-5',
    batchId: 'batch-1',
    type: 'stage_change',
    timestamp: '2025-02-28T09:00:00Z',
    description: 'Transitioned to growing stage',
    data: { fromStage: 'transplant', toStage: 'growing' },
  },
  {
    id: 'event-6',
    batchId: 'batch-1',
    type: 'qa_check',
    timestamp: '2025-03-15T11:00:00Z',
    description: 'Weekly quality and pest inspection',
    data: { inspector: 'Jane Smith', status: 'passed', notes: 'Plants healthy, fruit set looking good. No pest activity.' },
    evidenceUrls: ['https://images.unsplash.com/photo-1592841200221-a6898f307baa?w=400'],
  },
];
