import { PlantCountSnapshot, GrowingBed, HarvestUnit } from '../types/plant-tracking';

export const mockGrowingBeds: GrowingBed[] = [
  {
    id: 'bed-1',
    batchId: 'batch-1',
    bedNumber: 'B-01',
    plantCount: 120,
    rowCount: 4,
    stage: 'growing',
    location: 'Greenhouse 1 - North',
    createdAt: '2025-01-15T08:00:00Z',
    notes: 'Drip irrigation, mulched',
  },
  {
    id: 'bed-2',
    batchId: 'batch-1',
    bedNumber: 'B-02',
    plantCount: 150,
    rowCount: 5,
    stage: 'growing',
    location: 'Greenhouse 1 - South',
    createdAt: '2025-01-15T08:00:00Z',
  },
  {
    id: 'bed-3',
    batchId: 'batch-2',
    bedNumber: 'B-03',
    plantCount: 200,
    rowCount: 8,
    stage: 'transplant',
    location: 'High Tunnel A',
    createdAt: '2025-02-01T08:00:00Z',
    notes: 'Recently transplanted from seedling trays',
  },
  {
    id: 'bed-4',
    batchId: 'batch-3',
    bedNumber: 'B-04',
    plantCount: 400,
    rowCount: 10,
    stage: 'seedling',
    location: 'Outdoor Field 1 - East',
    createdAt: '2025-03-10T08:00:00Z',
  },
];

export const mockHarvestUnits: HarvestUnit[] = [
  {
    id: 'unit-001',
    batchId: 'batch-1',
    unitNumber: 'U-001',
    bedNumber: 'B-01',
    rowNumber: 'R-1',
    stage: 'ready',
    location: 'Greenhouse 1 - North',
    health: 'excellent',
    plantedDate: '2025-01-15',
    estimatedHarvestDate: '2025-04-01',
    notes: 'Heavy fruit set, good color',
  },
  {
    id: 'unit-002',
    batchId: 'batch-1',
    unitNumber: 'U-002',
    bedNumber: 'B-01',
    rowNumber: 'R-2',
    stage: 'ready',
    location: 'Greenhouse 1 - North',
    health: 'good',
    plantedDate: '2025-01-15',
    estimatedHarvestDate: '2025-04-01',
  },
  {
    id: 'unit-003',
    batchId: 'batch-1',
    unitNumber: 'U-003',
    bedNumber: 'B-02',
    rowNumber: 'R-1',
    stage: 'harvested',
    location: 'Greenhouse 1 - South',
    health: 'good',
    plantedDate: '2025-01-15',
    harvestedDate: '2025-03-28',
    harvestWeight: 38.5,
  },
  {
    id: 'unit-004',
    batchId: 'batch-2',
    unitNumber: 'U-004',
    bedNumber: 'B-03',
    rowNumber: 'R-1',
    stage: 'ready',
    location: 'High Tunnel A',
    health: 'excellent',
    plantedDate: '2025-02-01',
    estimatedHarvestDate: '2025-03-28',
    notes: 'Optimal leaf quality',
  },
];

export const mockPlantCountSnapshots: PlantCountSnapshot[] = [
  {
    id: 'snapshot-1',
    batchId: 'batch-1',
    timestamp: '2025-11-06T08:00:00Z',
    growingBeds: [
      { bedId: 'bed-1', count: 120 },
      { bedId: 'bed-2', count: 150 }
    ],
    readyToHarvestCount: 45,
    totalCount: 270,
    recordedBy: 'John Martinez',
  },
  {
    id: 'snapshot-2',
    batchId: 'batch-1',
    timestamp: '2025-10-30T08:00:00Z',
    growingBeds: [
      { bedId: 'bed-1', count: 120 },
      { bedId: 'bed-2', count: 150 }
    ],
    readyToHarvestCount: 32,
    totalCount: 270,
    recordedBy: 'Maria Garcia',
  },
  {
    id: 'snapshot-3',
    batchId: 'batch-2',
    timestamp: '2025-11-06T08:00:00Z',
    growingBeds: [
      { bedId: 'bed-3', count: 200 }
    ],
    readyToHarvestCount: 0,
    totalCount: 200,
    recordedBy: 'Sarah Johnson',
  },
  {
    id: 'snapshot-4',
    batchId: 'batch-3',
    timestamp: '2025-11-06T08:00:00Z',
    growingBeds: [
      { bedId: 'bed-4', count: 400 }
    ],
    readyToHarvestCount: 0,
    totalCount: 400,
    recordedBy: 'Mike Thompson',
  },
];
