import { PlantCountSnapshot } from '../types/plant-tracking';

export const mockPlantCountSnapshots: PlantCountSnapshot[] = [
  {
    id: 'snapshot-1',
    batchId: 'batch-1',
    timestamp: '2025-10-16T08:00:00Z',
    immatureLots: [],
    individualFloweringCount: 180,
    totalCount: 180,
    recordedBy: 'John Technician',
  },
  {
    id: 'snapshot-2',
    batchId: 'batch-1',
    timestamp: '2025-10-09T08:00:00Z',
    immatureLots: [],
    individualFloweringCount: 178,
    totalCount: 178,
    recordedBy: 'Jane Supervisor',
  },
  {
    id: 'snapshot-3',
    batchId: 'batch-2',
    timestamp: '2025-10-16T08:00:00Z',
    immatureLots: [{ lotId: 'lot-1', count: 120 }],
    individualFloweringCount: 0,
    totalCount: 120,
    recordedBy: 'Mike Technician',
  },
];
