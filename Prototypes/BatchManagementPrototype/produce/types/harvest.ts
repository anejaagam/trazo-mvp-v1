export interface ProducePlant {
  id: string;
  bedNumber?: string;
  rowNumber?: string;
  batchId: string;
  location: string;
  status: 'seedling' | 'growing' | 'ready_to_harvest' | 'harvested';
  plantedDate: string;
  varietyName: string;
}

export interface HarvestRecord {
  id: string;
  batchId: string;
  harvestZone?: string;
  bedRows?: string[];
  totalWeight: number; // lbs
  grade: 'Grade A' | 'Grade B' | 'Grade C' | 'Reject';
  harvestedBy: string;
  harvestDate: string;
  destinationLocation: string; // washing or storage
  temperature?: number; // field temperature at harvest
  qualityNotes?: string;
}

export interface PostHarvestFacility {
  id: string;
  name: string;
  type: 'washing_station' | 'cold_storage' | 'sorting_area' | 'packaging_area';
  location: string;
  capacity: number; // lbs or units
  currentLoad: number;
  temperature?: number;
  humidity?: number;
}
