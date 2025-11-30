/**
 * Domain Configuration
 * 
 * Provides domain-specific terminology, UI labels, and configuration
 */

import type { DomainType } from '../types/domains';

/**
 * Terminology mappings for each domain
 * Allows UI to adapt labels based on domain
 */
export interface TerminologyMap {
  // Entity names
  batch: string;
  batches: string;
  cultivar: string;
  cultivars: string;
  location: string;
  locations: string;
  
  // Measurements
  weight: string;
  area: string;
  
  // Common terms
  geneticSource: string; // "Strain" vs "Variety"
  growingSpace: string; // "Pod/Room" vs "Growing Area"
  qualityMetric: string; // "Potency" vs "Grade"
}

/**
 * Full domain configuration
 */
export interface DomainConfig {
  domain: DomainType;
  name: string;
  terminology: TerminologyMap;
  features: {
    compliance: string; // "METRC" vs "PrimusGFS"
    tagging: boolean; // Plant/product tagging
    testing: boolean; // Lab testing requirements
    grading: boolean; // Quality grading
    ripeness: boolean; // Ripeness tracking
  };
  units: {
    weight: 'grams' | 'lbs';
    area: 'sqft' | 'acres';
    temperature: 'fahrenheit' | 'celsius';
  };
}

/**
 * Cannabis Domain Configuration
 */
export const cannabisConfig: DomainConfig = {
  domain: 'cannabis',
  name: 'Cannabis',
  terminology: {
    batch: 'Batch',
    batches: 'Batches',
    cultivar: 'Strain',
    cultivars: 'Strains',
    location: 'Pod/Room',
    locations: 'Pods/Rooms',
    weight: 'Weight',
    area: 'Canopy Area',
    geneticSource: 'Strain',
    growingSpace: 'Pod',
    qualityMetric: 'Potency',
  },
  features: {
    compliance: 'METRC',
    tagging: true,
    testing: true,
    grading: false,
    ripeness: false,
  },
  units: {
    weight: 'grams',
    area: 'sqft',
    temperature: 'fahrenheit',
  },
};

/**
 * Produce Domain Configuration
 */
export const produceConfig: DomainConfig = {
  domain: 'produce',
  name: 'Produce',
  terminology: {
    batch: 'Batch',
    batches: 'Batches',
    cultivar: 'Variety',
    cultivars: 'Varieties',
    location: 'Growing Area',
    locations: 'Growing Areas',
    weight: 'Yield',
    area: 'Growing Area',
    geneticSource: 'Variety',
    growingSpace: 'Growing Area',
    qualityMetric: 'Grade',
  },
  features: {
    compliance: 'PrimusGFS',
    tagging: false,
    testing: false,
    grading: true,
    ripeness: true,
  },
  units: {
    weight: 'lbs',
    area: 'sqft',
    temperature: 'fahrenheit',
  },
};

/**
 * Get configuration for a specific domain
 */
export function getDomainConfig(domain: DomainType): DomainConfig {
  return domain === 'cannabis' ? cannabisConfig : produceConfig;
}

/**
 * Domain-specific field visibility
 */
export interface FieldVisibility {
  // Batch fields
  metrcTags: boolean;
  motherPlant: boolean;
  lightingSchedule: boolean;
  grade: boolean;
  ripeness: boolean;
  harvestWindow: boolean;
  storageConditions: boolean;
  
  // Cultivar fields
  strainType: boolean;
  genetics: boolean;
  thcCbd: boolean;
  terpenes: boolean;
  category: boolean;
  flavorProfile: boolean;
  storageLife: boolean;
  
  // Location fields
  roomType: boolean;
  canopyArea: boolean;
  lighting: boolean;
  areaType: boolean;
  irrigation: boolean;
  climateControl: boolean;
}

export function getFieldVisibility(domain: DomainType): FieldVisibility {
  if (domain === 'cannabis') {
    return {
      // Cannabis batch fields
      metrcTags: true,
      motherPlant: true,
      lightingSchedule: true,
      grade: false,
      ripeness: false,
      harvestWindow: false,
      storageConditions: false,
      
      // Cannabis cultivar fields
      strainType: true,
      genetics: true,
      thcCbd: true,
      terpenes: true,
      category: false,
      flavorProfile: false,
      storageLife: false,
      
      // Cannabis location fields
      roomType: true,
      canopyArea: true,
      lighting: true,
      areaType: false,
      irrigation: false,
      climateControl: false,
    };
  } else {
    return {
      // Produce batch fields
      metrcTags: false,
      motherPlant: false,
      lightingSchedule: false,
      grade: true,
      ripeness: true,
      harvestWindow: true,
      storageConditions: true,
      
      // Produce cultivar fields
      strainType: false,
      genetics: false,
      thcCbd: false,
      terpenes: false,
      category: true,
      flavorProfile: true,
      storageLife: true,
      
      // Produce location fields
      roomType: false,
      canopyArea: false,
      lighting: false,
      areaType: true,
      irrigation: true,
      climateControl: true,
    };
  }
}

/**
 * Domain color schemes for UI consistency
 */
export interface DomainColors {
  primary: string;
  secondary: string;
  accent: string;
}

export function getDomainColors(domain: DomainType): DomainColors {
  if (domain === 'cannabis') {
    return {
      primary: 'emerald',
      secondary: 'green',
      accent: 'lime',
    };
  } else {
    return {
      primary: 'orange',
      secondary: 'amber',
      accent: 'yellow',
    };
  }
}
