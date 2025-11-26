# Multi-Compliance Architecture: Strains, Items & Lab Tests

**Document Version:** 1.0
**Date:** November 26, 2025
**Purpose:** Define how Strains, Items, and Lab Tests integrate across Metrc, CTLS, and produce compliance systems

---

## Overview

TRAZO is designed to support **multiple compliance systems**:
- **Metrc** - Cannabis track-and-trace (US states)
- **CTLS** - Cannabis Tracking and Licensing System (Canada) - Future
- **PrimusGFS** - Produce food safety - Future

This document outlines how to implement Strains, Items, and Lab Tests in a way that:
1. Maintains platform-native models as the **source of truth**
2. Provides **compliance adapters** for each system
3. Enables **bi-directional sync** between platform and compliance systems
4. Supports **future compliance systems** without architectural changes

---

## Architecture Principle: Adapter Pattern

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        TRAZO PLATFORM (Source of Truth)                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────────┐  │
│  │   CULTIVARS     │  │    PRODUCTS     │  │       LAB TESTS             │  │
│  │   (Strains)     │  │    (Items)      │  │       (COA/Results)         │  │
│  ├─────────────────┤  ├─────────────────┤  ├─────────────────────────────┤  │
│  │ • id            │  │ • id            │  │ • id                        │  │
│  │ • organization  │  │ • organization  │  │ • organization_id           │  │
│  │ • name          │  │ • name          │  │ • package_id                │  │
│  │ • strain_type   │  │ • category      │  │ • test_type                 │  │
│  │ • genetics      │  │ • unit_of_meas  │  │ • result_status             │  │
│  │ • thc/cbd range │  │ • strain_id     │  │ • results (JSONB)           │  │
│  │ • domain_type   │  │ • domain_type   │  │ • coa_document_url          │  │
│  │ [cannabis|prod] │  │ [cannabis|prod] │  │ • compliance_sync_status    │  │
│  └────────┬────────┘  └────────┬────────┘  └──────────────┬──────────────┘  │
│           │                    │                          │                  │
└───────────┼────────────────────┼──────────────────────────┼──────────────────┘
            │                    │                          │
            ▼                    ▼                          ▼
┌───────────────────────────────────────────────────────────────────────────────┐
│                         COMPLIANCE ADAPTER LAYER                               │
├───────────────────────────────────────────────────────────────────────────────┤
│                                                                                │
│  ┌─────────────────────────────────────────────────────────────────────────┐  │
│  │                              METRC                                       │  │
│  │  ┌───────────────┐  ┌───────────────┐  ┌───────────────────────────┐   │  │
│  │  │ StrainsEndpt  │  │ ItemsEndpoint │  │ LabTestsEndpoint          │   │  │
│  │  │ /strains/v2/  │  │ /items/v2/    │  │ /labtests/v2/             │   │  │
│  │  └───────────────┘  └───────────────┘  └───────────────────────────┘   │  │
│  │  ┌───────────────┐  ┌───────────────┐  ┌───────────────────────────┐   │  │
│  │  │ StrainSync    │  │ ItemSync      │  │ LabTestSync               │   │  │
│  │  │ Service       │  │ Service       │  │ Service                   │   │  │
│  │  └───────────────┘  └───────────────┘  └───────────────────────────┘   │  │
│  └─────────────────────────────────────────────────────────────────────────┘  │
│                                                                                │
│  ┌─────────────────────────────────────────────────────────────────────────┐  │
│  │                           CTLS (Future)                                  │  │
│  │  ┌───────────────┐  ┌───────────────┐  ┌───────────────────────────┐   │  │
│  │  │ StrainAdapter │  │ ItemAdapter   │  │ LabTestAdapter            │   │  │
│  │  └───────────────┘  └───────────────┘  └───────────────────────────┘   │  │
│  └─────────────────────────────────────────────────────────────────────────┘  │
│                                                                                │
│  ┌─────────────────────────────────────────────────────────────────────────┐  │
│  │                        PrimusGFS (Future)                                │  │
│  │  ┌───────────────┐  ┌───────────────┐  ┌───────────────────────────┐   │  │
│  │  │ VarietyAdaptr │  │ ProductAdaptr │  │ FoodSafetyAdapter         │   │  │
│  │  └───────────────┘  └───────────────┘  └───────────────────────────┘   │  │
│  └─────────────────────────────────────────────────────────────────────────┘  │
│                                                                                │
└────────────────────────────────────────────────────────────────────────────────┘
```

---

## 1. CULTIVARS → STRAINS (Already Exists, Add Sync)

### Current State

TRAZO already has a robust `cultivars` table that serves as the platform-native strain model:

```sql
-- Existing table: lib/supabase/schema.sql lines 141-159
CREATE TABLE cultivars (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),
  name TEXT NOT NULL,
  strain_type cultivar_strain_type, -- 'indica'|'sativa'|'hybrid'|'cbd'|'auto'|'produce'

  -- Cannabis-specific
  genetics TEXT,
  breeder TEXT,
  thc_range_min DECIMAL,
  thc_range_max DECIMAL,
  cbd_range_min DECIMAL,
  cbd_range_max DECIMAL,
  flowering_days INTEGER,
  harvest_notes TEXT,
  grow_characteristics TEXT,

  -- Produce-specific
  category produce_category,
  flavor_profile TEXT,
  storage_life_days INTEGER,
  optimal_temp_min DECIMAL,
  optimal_temp_max DECIMAL,

  -- Tracking
  is_active BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### What to Add: Metrc Sync Fields

```sql
-- Migration: add_compliance_sync_to_cultivars.sql
ALTER TABLE cultivars ADD COLUMN IF NOT EXISTS metrc_strain_id INTEGER;
ALTER TABLE cultivars ADD COLUMN IF NOT EXISTS metrc_strain_name TEXT;
ALTER TABLE cultivars ADD COLUMN IF NOT EXISTS metrc_sync_status TEXT DEFAULT 'not_synced';
ALTER TABLE cultivars ADD COLUMN IF NOT EXISTS metrc_last_sync TIMESTAMPTZ;
ALTER TABLE cultivars ADD COLUMN IF NOT EXISTS metrc_sync_error TEXT;

-- Future: CTLS sync fields
ALTER TABLE cultivars ADD COLUMN IF NOT EXISTS ctls_strain_id TEXT;
ALTER TABLE cultivars ADD COLUMN IF NOT EXISTS ctls_sync_status TEXT DEFAULT 'not_synced';

-- Indexes
CREATE INDEX idx_cultivars_metrc_strain_id ON cultivars(metrc_strain_id) WHERE metrc_strain_id IS NOT NULL;
```

### Metrc Strains Endpoint

**File:** `lib/compliance/metrc/endpoints/strains.ts`

```typescript
/**
 * Metrc Strains Endpoint
 *
 * Maps TRAZO cultivars ↔ Metrc strains
 */

import type { MetrcClient } from '../client'
import type { MetrcStrain, MetrcStrainCreate, MetrcStrainUpdate } from '../types'

export class StrainsEndpoint {
  constructor(private client: MetrcClient) {}

  // ===== READ OPERATIONS =====

  async listActive(): Promise<MetrcStrain[]> {
    const { facilityLicenseNumber } = this.client.getConfig()
    return this.client.request<MetrcStrain[]>(
      `/strains/v2/active?licenseNumber=${facilityLicenseNumber}`,
      { method: 'GET' }
    )
  }

  async listInactive(): Promise<MetrcStrain[]> {
    const { facilityLicenseNumber } = this.client.getConfig()
    return this.client.request<MetrcStrain[]>(
      `/strains/v2/inactive?licenseNumber=${facilityLicenseNumber}`,
      { method: 'GET' }
    )
  }

  async getById(strainId: number): Promise<MetrcStrain> {
    return this.client.request<MetrcStrain>(
      `/strains/v2/${strainId}`,
      { method: 'GET' }
    )
  }

  // ===== WRITE OPERATIONS =====

  async create(strains: MetrcStrainCreate[]): Promise<void> {
    const { facilityLicenseNumber } = this.client.getConfig()
    await this.client.request<void>(
      `/strains/v2/?licenseNumber=${facilityLicenseNumber}`,
      { method: 'POST', body: strains }
    )
  }

  async update(strains: MetrcStrainUpdate[]): Promise<void> {
    const { facilityLicenseNumber } = this.client.getConfig()
    await this.client.request<void>(
      `/strains/v2/?licenseNumber=${facilityLicenseNumber}`,
      { method: 'PUT', body: strains }
    )
  }

  async delete(strainId: number): Promise<void> {
    const { facilityLicenseNumber } = this.client.getConfig()
    await this.client.request<void>(
      `/strains/v2/${strainId}?licenseNumber=${facilityLicenseNumber}`,
      { method: 'DELETE' }
    )
  }
}
```

### Metrc Strain Types

**Add to:** `lib/compliance/metrc/types.ts`

```typescript
/**
 * Metrc strain structure
 */
export interface MetrcStrain {
  Id: number
  Name: string
  TestingStatus: string // 'None' | 'InProcess' | 'ThcRequired' | 'ThcCompliant'
  ThcLevel?: number
  CbdLevel?: number
  IndicaPercentage?: number
  SativaPercentage?: number
  IsUsed: boolean
}

/**
 * Strain creation payload
 */
export interface MetrcStrainCreate {
  Name: string
  TestingStatus?: string
  ThcLevel?: number
  CbdLevel?: number
  IndicaPercentage?: number
  SativaPercentage?: number
}

/**
 * Strain update payload
 */
export interface MetrcStrainUpdate {
  Id: number
  Name: string
  TestingStatus?: string
  ThcLevel?: number
  CbdLevel?: number
  IndicaPercentage?: number
  SativaPercentage?: number
}
```

### Strain Sync Service

**File:** `lib/compliance/metrc/sync/strain-sync.ts`

```typescript
/**
 * Strain Sync Service
 *
 * Bi-directional sync between TRAZO cultivars and Metrc strains
 */

import { createClient } from '@/lib/supabase/server'
import type { MetrcClient } from '../client'
import type { MetrcStrain } from '../types'
import type { Cultivar } from '@/types/batch'
import type { SyncResult } from '@/lib/compliance/types'

export class StrainSyncService {
  constructor(private client: MetrcClient) {}

  /**
   * Pull strains from Metrc → TRAZO cultivars
   */
  async pullFromMetrc(organizationId: string): Promise<SyncResult> {
    const supabase = createClient()
    const startedAt = new Date().toISOString()
    let itemsProcessed = 0
    let itemsFailed = 0
    const errors: Array<{ field: string; message: string; code: string }> = []

    try {
      // Get all Metrc strains
      const [activeStrains, inactiveStrains] = await Promise.all([
        this.client.strains.listActive(),
        this.client.strains.listInactive()
      ])
      const metrcStrains = [...activeStrains, ...inactiveStrains]

      // Get existing cultivars with Metrc IDs
      const { data: existingCultivars } = await supabase
        .from('cultivars')
        .select('id, metrc_strain_id, name')
        .eq('organization_id', organizationId)
        .not('metrc_strain_id', 'is', null)

      const existingMetrcIds = new Set(
        existingCultivars?.map(c => c.metrc_strain_id) || []
      )

      // Upsert strains
      for (const strain of metrcStrains) {
        try {
          if (existingMetrcIds.has(strain.Id)) {
            // Update existing
            await supabase
              .from('cultivars')
              .update({
                metrc_strain_name: strain.Name,
                metrc_sync_status: 'synced',
                metrc_last_sync: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .eq('metrc_strain_id', strain.Id)
              .eq('organization_id', organizationId)
          } else {
            // Create new cultivar from Metrc strain
            await supabase
              .from('cultivars')
              .insert({
                organization_id: organizationId,
                name: strain.Name,
                strain_type: this.mapMetrcTestingStatusToStrainType(strain),
                thc_range_max: strain.ThcLevel,
                cbd_range_max: strain.CbdLevel,
                metrc_strain_id: strain.Id,
                metrc_strain_name: strain.Name,
                metrc_sync_status: 'synced',
                metrc_last_sync: new Date().toISOString()
              })
          }
          itemsProcessed++
        } catch (error) {
          itemsFailed++
          errors.push({
            field: 'strain',
            message: `Failed to sync strain ${strain.Name}: ${error}`,
            code: 'STRAIN_SYNC_FAILED'
          })
        }
      }

      return {
        success: itemsFailed === 0,
        syncId: crypto.randomUUID(),
        syncType: 'strain_pull',
        direction: 'pull',
        itemsProcessed,
        itemsFailed,
        errors,
        startedAt,
        completedAt: new Date().toISOString()
      }
    } catch (error) {
      return {
        success: false,
        syncId: crypto.randomUUID(),
        syncType: 'strain_pull',
        direction: 'pull',
        itemsProcessed,
        itemsFailed: 1,
        errors: [{ field: 'strain', message: String(error), code: 'SYNC_ERROR' }],
        startedAt,
        completedAt: new Date().toISOString()
      }
    }
  }

  /**
   * Push TRAZO cultivars → Metrc strains
   */
  async pushToMetrc(organizationId: string): Promise<SyncResult> {
    const supabase = createClient()
    const startedAt = new Date().toISOString()
    let itemsProcessed = 0
    let itemsFailed = 0
    const errors: Array<{ field: string; message: string; code: string }> = []

    try {
      // Get cultivars not yet synced to Metrc (cannabis only)
      const { data: cultivars } = await supabase
        .from('cultivars')
        .select('*')
        .eq('organization_id', organizationId)
        .is('metrc_strain_id', null)
        .neq('strain_type', 'produce')
        .eq('is_active', true)

      if (!cultivars || cultivars.length === 0) {
        return {
          success: true,
          syncId: crypto.randomUUID(),
          syncType: 'strain_push',
          direction: 'push',
          itemsProcessed: 0,
          itemsFailed: 0,
          errors: [],
          startedAt,
          completedAt: new Date().toISOString()
        }
      }

      // Create strains in Metrc
      const strainsToCreate = cultivars.map(c => ({
        Name: c.name,
        TestingStatus: 'None',
        ThcLevel: c.thc_range_max,
        CbdLevel: c.cbd_range_max,
        IndicaPercentage: c.strain_type === 'indica' ? 100 :
                         c.strain_type === 'sativa' ? 0 : 50,
        SativaPercentage: c.strain_type === 'sativa' ? 100 :
                          c.strain_type === 'indica' ? 0 : 50
      }))

      await this.client.strains.create(strainsToCreate)

      // Fetch created strains to get IDs
      const metrcStrains = await this.client.strains.listActive()

      // Map back to cultivars
      for (const cultivar of cultivars) {
        const metrcStrain = metrcStrains.find(s => s.Name === cultivar.name)
        if (metrcStrain) {
          await supabase
            .from('cultivars')
            .update({
              metrc_strain_id: metrcStrain.Id,
              metrc_strain_name: metrcStrain.Name,
              metrc_sync_status: 'synced',
              metrc_last_sync: new Date().toISOString()
            })
            .eq('id', cultivar.id)
          itemsProcessed++
        } else {
          itemsFailed++
          errors.push({
            field: 'strain',
            message: `Could not find created strain for ${cultivar.name}`,
            code: 'STRAIN_NOT_FOUND'
          })
        }
      }

      return {
        success: itemsFailed === 0,
        syncId: crypto.randomUUID(),
        syncType: 'strain_push',
        direction: 'push',
        itemsProcessed,
        itemsFailed,
        errors,
        startedAt,
        completedAt: new Date().toISOString()
      }
    } catch (error) {
      return {
        success: false,
        syncId: crypto.randomUUID(),
        syncType: 'strain_push',
        direction: 'push',
        itemsProcessed,
        itemsFailed: 1,
        errors: [{ field: 'strain', message: String(error), code: 'PUSH_ERROR' }],
        startedAt,
        completedAt: new Date().toISOString()
      }
    }
  }

  private mapMetrcTestingStatusToStrainType(strain: MetrcStrain): string {
    if (strain.IndicaPercentage && strain.IndicaPercentage > 70) return 'indica'
    if (strain.SativaPercentage && strain.SativaPercentage > 70) return 'sativa'
    return 'hybrid'
  }
}
```

---

## 2. PRODUCTS → ITEMS (New Table Required)

### Problem

TRAZO has `inventory_items` for **supplies** (nutrients, CO2, filters), but no table for **finished product definitions** (what Metrc calls "Items" - Flower, Concentrate, Edible, etc.).

### Solution: Create Products Table

This table represents the **product catalog** - the types of finished goods that can be created from harvests/production.

```sql
-- Migration: create_products_table.sql

-- Product categories (domain-aware)
CREATE TYPE product_category AS ENUM (
  -- Cannabis
  'flower',
  'shake_trim',
  'kief',
  'pre_roll',
  'concentrate',
  'extract',
  'edible',
  'topical',
  'tincture',
  'capsule',
  'vape_cartridge',
  'live_plant',
  'seed',
  'clone',
  'other_cannabis',
  -- Produce
  'fresh_produce',
  'processed_produce',
  'packaged_produce',
  'other_produce'
);

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),

  -- Core identity
  name TEXT NOT NULL,
  sku TEXT,
  category product_category NOT NULL,
  description TEXT,

  -- Domain awareness
  domain_type TEXT NOT NULL DEFAULT 'cannabis' CHECK (domain_type IN ('cannabis', 'produce')),

  -- Unit of measure
  unit_of_measure TEXT NOT NULL, -- 'Grams', 'Ounces', 'Each', 'Milligrams'
  default_quantity DECIMAL,

  -- Cannabis-specific
  strain_id UUID REFERENCES cultivars(id), -- Link to cultivar/strain
  thc_content_mg DECIMAL,
  cbd_content_mg DECIMAL,
  serving_size TEXT,
  number_of_doses INTEGER,

  -- Produce-specific
  organic_certified BOOLEAN DEFAULT false,
  grade TEXT,
  storage_requirements TEXT,
  shelf_life_days INTEGER,

  -- Compliance sync (Metrc)
  metrc_item_id INTEGER,
  metrc_item_name TEXT,
  metrc_item_category TEXT,
  metrc_sync_status TEXT DEFAULT 'not_synced',
  metrc_last_sync TIMESTAMPTZ,
  metrc_sync_error TEXT,

  -- Future: CTLS sync
  ctls_item_id TEXT,
  ctls_sync_status TEXT DEFAULT 'not_synced',

  -- Tracking
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(organization_id, name),
  UNIQUE(organization_id, sku)
);

-- Indexes
CREATE INDEX idx_products_org ON products(organization_id);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_strain ON products(strain_id) WHERE strain_id IS NOT NULL;
CREATE INDEX idx_products_metrc_id ON products(metrc_item_id) WHERE metrc_item_id IS NOT NULL;
CREATE INDEX idx_products_domain ON products(domain_type);

-- Link production batch outputs to products
ALTER TABLE production_batch_outputs
  ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id);
```

### Product Types

**File:** `types/product.ts`

```typescript
/**
 * Product Types
 *
 * Product definitions for finished goods (what Metrc calls "Items")
 */

export type ProductCategory =
  // Cannabis
  | 'flower'
  | 'shake_trim'
  | 'kief'
  | 'pre_roll'
  | 'concentrate'
  | 'extract'
  | 'edible'
  | 'topical'
  | 'tincture'
  | 'capsule'
  | 'vape_cartridge'
  | 'live_plant'
  | 'seed'
  | 'clone'
  | 'other_cannabis'
  // Produce
  | 'fresh_produce'
  | 'processed_produce'
  | 'packaged_produce'
  | 'other_produce'

export type DomainType = 'cannabis' | 'produce'

export interface Product {
  id: string
  organization_id: string
  name: string
  sku?: string
  category: ProductCategory
  description?: string
  domain_type: DomainType

  // Unit of measure
  unit_of_measure: string
  default_quantity?: number

  // Cannabis-specific
  strain_id?: string
  thc_content_mg?: number
  cbd_content_mg?: number
  serving_size?: string
  number_of_doses?: number

  // Produce-specific
  organic_certified?: boolean
  grade?: string
  storage_requirements?: string
  shelf_life_days?: number

  // Compliance sync
  metrc_item_id?: number
  metrc_item_name?: string
  metrc_item_category?: string
  metrc_sync_status: 'not_synced' | 'synced' | 'sync_failed' | 'pending'
  metrc_last_sync?: string
  metrc_sync_error?: string

  // Future: CTLS
  ctls_item_id?: string
  ctls_sync_status?: string

  // Tracking
  is_active: boolean
  created_by?: string
  created_at: string
  updated_at: string

  // Joined data
  strain?: {
    id: string
    name: string
    strain_type: string
  }
}

export interface ProductCreate {
  name: string
  sku?: string
  category: ProductCategory
  description?: string
  domain_type: DomainType
  unit_of_measure: string
  default_quantity?: number
  strain_id?: string
  thc_content_mg?: number
  cbd_content_mg?: number
  organic_certified?: boolean
  grade?: string
}

export interface ProductUpdate extends Partial<ProductCreate> {
  id: string
}

// Type guards
export function isCannabisProduct(product: Product): boolean {
  return product.domain_type === 'cannabis'
}

export function isProduceProduct(product: Product): boolean {
  return product.domain_type === 'produce'
}

// Category mappings for Metrc
export const METRC_ITEM_CATEGORY_MAP: Record<ProductCategory, string> = {
  'flower': 'Buds',
  'shake_trim': 'Shake/Trim',
  'kief': 'Kief',
  'pre_roll': 'Pre-Roll Flower',
  'concentrate': 'Concentrate (Each)',
  'extract': 'Extract (Weight)',
  'edible': 'Edible (Each)',
  'topical': 'Topical (Weight)',
  'tincture': 'Tincture (Volume)',
  'capsule': 'Capsule (Each)',
  'vape_cartridge': 'Vape Cartridge (Volume)',
  'live_plant': 'Mature Plant',
  'seed': 'Seeds (Each)',
  'clone': 'Immature Plant',
  'other_cannabis': 'Other',
  // Produce categories don't map to Metrc
  'fresh_produce': '',
  'processed_produce': '',
  'packaged_produce': '',
  'other_produce': ''
}
```

### Metrc Items Endpoint

**File:** `lib/compliance/metrc/endpoints/items.ts`

```typescript
/**
 * Metrc Items Endpoint
 *
 * Maps TRAZO products ↔ Metrc items
 */

import type { MetrcClient } from '../client'
import type {
  MetrcItem,
  MetrcItemCreate,
  MetrcItemUpdate,
  MetrcItemCategory,
  MetrcBrand
} from '../types'

export class ItemsEndpoint {
  constructor(private client: MetrcClient) {}

  // ===== READ OPERATIONS =====

  async listActive(): Promise<MetrcItem[]> {
    const { facilityLicenseNumber } = this.client.getConfig()
    return this.client.request<MetrcItem[]>(
      `/items/v2/active?licenseNumber=${facilityLicenseNumber}`,
      { method: 'GET' }
    )
  }

  async listInactive(): Promise<MetrcItem[]> {
    const { facilityLicenseNumber } = this.client.getConfig()
    return this.client.request<MetrcItem[]>(
      `/items/v2/inactive?licenseNumber=${facilityLicenseNumber}`,
      { method: 'GET' }
    )
  }

  async getById(itemId: number): Promise<MetrcItem> {
    return this.client.request<MetrcItem>(
      `/items/v2/${itemId}`,
      { method: 'GET' }
    )
  }

  async listCategories(): Promise<MetrcItemCategory[]> {
    const { facilityLicenseNumber } = this.client.getConfig()
    return this.client.request<MetrcItemCategory[]>(
      `/items/v2/categories?licenseNumber=${facilityLicenseNumber}`,
      { method: 'GET' }
    )
  }

  async listBrands(): Promise<MetrcBrand[]> {
    const { facilityLicenseNumber } = this.client.getConfig()
    return this.client.request<MetrcBrand[]>(
      `/items/v2/brands?licenseNumber=${facilityLicenseNumber}`,
      { method: 'GET' }
    )
  }

  // ===== WRITE OPERATIONS =====

  async create(items: MetrcItemCreate[]): Promise<void> {
    const { facilityLicenseNumber } = this.client.getConfig()
    await this.client.request<void>(
      `/items/v2/?licenseNumber=${facilityLicenseNumber}`,
      { method: 'POST', body: items }
    )
  }

  async update(items: MetrcItemUpdate[]): Promise<void> {
    const { facilityLicenseNumber } = this.client.getConfig()
    await this.client.request<void>(
      `/items/v2/?licenseNumber=${facilityLicenseNumber}`,
      { method: 'PUT', body: items }
    )
  }

  async delete(itemId: number): Promise<void> {
    const { facilityLicenseNumber } = this.client.getConfig()
    await this.client.request<void>(
      `/items/v2/${itemId}?licenseNumber=${facilityLicenseNumber}`,
      { method: 'DELETE' }
    )
  }
}
```

### Metrc Item Types

**Add to:** `lib/compliance/metrc/types.ts`

```typescript
/**
 * Metrc item structure
 */
export interface MetrcItem {
  Id: number
  Name: string
  ItemCategory: string
  UnitOfMeasure: string
  StrainId?: number
  StrainName?: string
  UnitThcContent?: number
  UnitThcContentUnitOfMeasure?: string
  UnitCbdContent?: number
  UnitCbdContentUnitOfMeasure?: string
  ServingSize?: string
  NumberOfDoses?: number
  IsUsed: boolean
}

/**
 * Item category from Metrc
 */
export interface MetrcItemCategory {
  Name: string
  ProductCategoryType: string
  QuantityType: string
  RequiresStrain: boolean
  RequiresItemBrand: boolean
  RequiresServingSize: boolean
  RequiresSupplyDurationDays: boolean
  RequiresNumberOfDoses: boolean
  RequiresIngredients: boolean
  RequiresProductPhoto: boolean
}

/**
 * Brand structure
 */
export interface MetrcBrand {
  Id: number
  Name: string
  IsActive: boolean
}

/**
 * Item creation payload
 */
export interface MetrcItemCreate {
  ItemCategory: string
  Name: string
  UnitOfMeasure: string
  Strain?: string // Strain name (required for some categories)
  UnitThcContent?: number
  UnitThcContentUnitOfMeasure?: string
  UnitCbdContent?: number
  UnitCbdContentUnitOfMeasure?: string
  ServingSize?: string
  NumberOfDoses?: number
}

/**
 * Item update payload
 */
export interface MetrcItemUpdate extends MetrcItemCreate {
  Id: number
}
```

---

## 3. LAB TESTS (Enhance Existing + Add Metrc Endpoint)

### Current State

TRAZO has internal lab test tracking in `lab_tests` table but NO Metrc API integration.

### What to Add

1. Compliance sync fields to `lab_tests` table
2. Metrc Lab Tests endpoint
3. Lab Test sync service

### Migration: Add Compliance Fields

```sql
-- Migration: add_compliance_sync_to_lab_tests.sql

ALTER TABLE lab_tests ADD COLUMN IF NOT EXISTS metrc_lab_test_id INTEGER;
ALTER TABLE lab_tests ADD COLUMN IF NOT EXISTS metrc_package_label TEXT;
ALTER TABLE lab_tests ADD COLUMN IF NOT EXISTS metrc_test_status TEXT;
ALTER TABLE lab_tests ADD COLUMN IF NOT EXISTS metrc_coa_document_id INTEGER;
ALTER TABLE lab_tests ADD COLUMN IF NOT EXISTS metrc_sync_status TEXT DEFAULT 'not_synced';
ALTER TABLE lab_tests ADD COLUMN IF NOT EXISTS metrc_last_sync TIMESTAMPTZ;
ALTER TABLE lab_tests ADD COLUMN IF NOT EXISTS metrc_sync_error TEXT;

CREATE INDEX idx_lab_tests_metrc_id ON lab_tests(metrc_lab_test_id) WHERE metrc_lab_test_id IS NOT NULL;
```

### Metrc Lab Tests Endpoint

**File:** `lib/compliance/metrc/endpoints/lab-tests.ts`

```typescript
/**
 * Metrc Lab Tests Endpoint
 *
 * COA and lab result management
 */

import type { MetrcClient } from '../client'
import type {
  MetrcLabTestState,
  MetrcLabTestType,
  MetrcLabTestBatch,
  MetrcLabTestResult,
  MetrcLabTestRecord,
  MetrcLabTestDocument
} from '../types'

export class LabTestsEndpoint {
  constructor(private client: MetrcClient) {}

  // ===== READ OPERATIONS =====

  /**
   * Get available lab test states
   */
  async listStates(): Promise<MetrcLabTestState[]> {
    return this.client.request<MetrcLabTestState[]>(
      '/labtests/v2/states',
      { method: 'GET' }
    )
  }

  /**
   * Get lab test types
   */
  async listTypes(): Promise<MetrcLabTestType[]> {
    return this.client.request<MetrcLabTestType[]>(
      '/labtests/v2/types',
      { method: 'GET' }
    )
  }

  /**
   * Get lab test batches
   */
  async listBatches(
    lastModifiedStart?: string,
    lastModifiedEnd?: string
  ): Promise<MetrcLabTestBatch[]> {
    const { facilityLicenseNumber } = this.client.getConfig()
    let endpoint = `/labtests/v2/batches?licenseNumber=${facilityLicenseNumber}`

    if (lastModifiedStart) endpoint += `&lastModifiedStart=${lastModifiedStart}`
    if (lastModifiedEnd) endpoint += `&lastModifiedEnd=${lastModifiedEnd}`

    return this.client.request<MetrcLabTestBatch[]>(endpoint, { method: 'GET' })
  }

  /**
   * Get lab test results for a package
   */
  async getResults(packageId: number): Promise<MetrcLabTestResult[]> {
    return this.client.request<MetrcLabTestResult[]>(
      `/labtests/v2/results?packageId=${packageId}`,
      { method: 'GET' }
    )
  }

  /**
   * Get COA document
   */
  async getDocument(labTestDocumentId: number): Promise<MetrcLabTestDocument> {
    return this.client.request<MetrcLabTestDocument>(
      `/labtests/v2/labtestdocument/${labTestDocumentId}`,
      { method: 'GET' }
    )
  }

  // ===== WRITE OPERATIONS =====

  /**
   * Record lab test results
   * Note: Only licensed testing labs can submit results
   */
  async record(results: MetrcLabTestRecord[]): Promise<void> {
    const { facilityLicenseNumber } = this.client.getConfig()
    await this.client.request<void>(
      `/labtests/v2/record?licenseNumber=${facilityLicenseNumber}`,
      { method: 'POST', body: results }
    )
  }

  /**
   * Upload COA document
   */
  async uploadDocument(
    labTestId: number,
    documentBase64: string,
    fileName: string
  ): Promise<void> {
    const { facilityLicenseNumber } = this.client.getConfig()
    await this.client.request<void>(
      `/labtests/v2/labtestdocument?licenseNumber=${facilityLicenseNumber}`,
      {
        method: 'PUT',
        body: [{
          LabTestId: labTestId,
          DocumentBase64: documentBase64,
          FileName: fileName
        }]
      }
    )
  }

  /**
   * Release lab test results
   */
  async releaseResults(labTestIds: number[]): Promise<void> {
    const { facilityLicenseNumber } = this.client.getConfig()
    await this.client.request<void>(
      `/labtests/v2/results/release?licenseNumber=${facilityLicenseNumber}`,
      {
        method: 'PUT',
        body: labTestIds.map(id => ({ LabTestId: id }))
      }
    )
  }
}
```

### Metrc Lab Test Types

**Add to:** `lib/compliance/metrc/types.ts`

```typescript
/**
 * Lab test state
 */
export interface MetrcLabTestState {
  Name: string
}

/**
 * Lab test type
 */
export interface MetrcLabTestType {
  Id: number
  Name: string
  RequiresTestValue: boolean
  RequiresTestPassed: boolean
  RequiresTestResultLevel: boolean
  RequiresExpirationDate: boolean
  IsArchived: boolean
}

/**
 * Lab test batch
 */
export interface MetrcLabTestBatch {
  Id: number
  LabFacilityLicenseNumber: string
  LabFacilityName: string
  PackageId: number
  PackageLabel: string
  TestResult: string
  ProductCategoryName: string
  TestPerformedDate: string
  TestResultDate?: string
}

/**
 * Lab test result
 */
export interface MetrcLabTestResult {
  LabTestResultId: number
  LabTestResultStatus: string
  LabTestTypeName: string
  TestValue?: number
  TestPassed: boolean
  TestResultLevel?: string
  Notes?: string
}

/**
 * Lab test record (for submission)
 */
export interface MetrcLabTestRecord {
  Label: string // Package label
  ResultDate: string
  Results: Array<{
    LabTestTypeName: string
    Quantity: number
    Passed: boolean
    Notes?: string
  }>
}

/**
 * Lab test document (COA)
 */
export interface MetrcLabTestDocument {
  LabTestDocumentId: number
  LabTestId: number
  DocumentFileName: string
  DocumentFileBase64?: string
}
```

---

## 4. Complete Connection Map

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              DATA FLOW DIAGRAM                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  CULTIVARS (Strains)                                                             │
│  ├── cultivars.id ─────────────────────────┐                                    │
│  │   ├── batches.cultivar_id ◄─────────────┤ (Batch uses strain)               │
│  │   ├── products.strain_id ◄──────────────┤ (Product links to strain)         │
│  │   └── metrc_strain_id ◄────────────────►│ Metrc Strains API                 │
│  │                                          │                                    │
│  BATCHES                                    │                                    │
│  ├── batches.id ───────────────────────────┤                                    │
│  │   ├── batch_pod_assignments.batch_id ◄──┤ (Pod assignment)                  │
│  │   ├── batch_events.batch_id ◄───────────┤ (Audit trail)                     │
│  │   ├── harvest_records.batch_id ◄────────┤ (Harvest)                         │
│  │   ├── inventory_movements.batch_id ◄────┤ (Item consumption)                │
│  │   ├── waste_logs.batch_id ◄─────────────┤ (Waste tracking)                  │
│  │   └── metrc_batch_id ◄─────────────────►│ Metrc Plant Batches API           │
│  │                                          │                                    │
│  PRODUCTS (Items)                           │                                    │
│  ├── products.id ──────────────────────────┤                                    │
│  │   ├── products.strain_id ───────────────┘ (Links to cultivar)               │
│  │   ├── production_batch_outputs.product_id ◄─ (What we make)                 │
│  │   ├── harvest_packages.product_id ◄──────── (Package type)                  │
│  │   └── metrc_item_id ◄──────────────────►  Metrc Items API                   │
│  │                                                                               │
│  HARVEST → PACKAGES                                                              │
│  ├── harvest_records.id ───────────────────┐                                    │
│  │   └── harvest_packages.harvest_id ◄─────┤ (Packages from harvest)           │
│  │       ├── product_id ───────────────────┘ (What type of product)            │
│  │       ├── lab_tests.package_id ◄──────────(Test results)                    │
│  │       └── metrc_package_tag ◄──────────►  Metrc Packages API                │
│  │                                                                               │
│  LAB TESTS                                                                       │
│  ├── lab_tests.id ─────────────────────────┐                                    │
│  │   ├── lab_tests.package_id ─────────────┘ (Test for this package)           │
│  │   ├── lab_tests.batch_id ───────────────── (Source batch)                   │
│  │   └── metrc_lab_test_id ◄──────────────►  Metrc Lab Tests API               │
│  │                                                                               │
│  PRODUCTION BATCHES                                                              │
│  ├── production_batches.id ────────────────┐                                    │
│  │   ├── source_harvest_id ────────────────┘ (Input from harvest)              │
│  │   ├── production_batch_inputs.package_id ◄ (Input packages)                 │
│  │   ├── production_batch_outputs.product_id ◄ (Output product type)           │
│  │   └── metrc_production_batch_id ◄──────► Metrc API                          │
│  │                                                                               │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Implementation Order

### Phase 1: Core Infrastructure (Week 1)

1. **Database Migrations**
   - Add compliance sync fields to `cultivars`
   - Create `products` table
   - Add compliance sync fields to `lab_tests`

2. **Type Definitions**
   - Create `types/product.ts`
   - Add Metrc types to `lib/compliance/metrc/types.ts`

### Phase 2: Metrc Endpoints (Week 1-2)

3. **Strains Endpoint**
   - Create `lib/compliance/metrc/endpoints/strains.ts`
   - Add to `MetrcClient`
   - Write tests

4. **Items Endpoint**
   - Create `lib/compliance/metrc/endpoints/items.ts`
   - Add to `MetrcClient`
   - Write tests

5. **Lab Tests Endpoint**
   - Create `lib/compliance/metrc/endpoints/lab-tests.ts`
   - Add to `MetrcClient`
   - Write tests

### Phase 3: Sync Services (Week 2-3)

6. **Strain Sync Service**
   - Create `lib/compliance/metrc/sync/strain-sync.ts`
   - Bi-directional sync between `cultivars` ↔ Metrc strains

7. **Item Sync Service**
   - Create `lib/compliance/metrc/sync/item-sync.ts`
   - Bi-directional sync between `products` ↔ Metrc items

8. **Lab Test Sync Service**
   - Enhance `lib/compliance/metrc/sync/lab-test-sync.ts`
   - COA upload and result submission

### Phase 4: UI Integration (Week 3)

9. **Cultivars UI Enhancement**
   - Add Metrc sync status indicator
   - Add "Sync to Metrc" action
   - Show Metrc strain ID

10. **Products UI**
    - Create product catalog page
    - Product CRUD operations
    - Metrc sync integration

11. **Lab Tests UI Enhancement**
    - Add COA upload to Metrc
    - Show Metrc sync status

---

## 6. Future: CTLS & PrimusGFS

The architecture supports adding new compliance systems:

### CTLS (Canada)

```typescript
// lib/compliance/ctls/endpoints/strains.ts
export class CTLSStrainsEndpoint {
  // Similar pattern to Metrc
}

// lib/compliance/ctls/sync/strain-sync.ts
export class CTLSStrainSyncService {
  async pullFromCTLS(orgId: string): Promise<SyncResult>
  async pushToCTLS(orgId: string): Promise<SyncResult>
}
```

### PrimusGFS (Produce)

```typescript
// lib/compliance/primus-gfs/adapters/variety-adapter.ts
export class PrimusGFSVarietyAdapter {
  // Map TRAZO cultivars (produce) to PrimusGFS varieties
}

// lib/compliance/primus-gfs/adapters/product-adapter.ts
export class PrimusGFSProductAdapter {
  // Map TRAZO products (produce) to PrimusGFS product codes
}
```

---

## Summary

| Component | Location | Purpose |
|-----------|----------|---------|
| **Cultivars (Strains)** | `cultivars` table | Platform-native strain model |
| **Products (Items)** | `products` table (NEW) | Finished product definitions |
| **Lab Tests** | `lab_tests` table | Test results and COAs |
| **Metrc Strains** | `endpoints/strains.ts` | Metrc API adapter |
| **Metrc Items** | `endpoints/items.ts` | Metrc API adapter |
| **Metrc Lab Tests** | `endpoints/lab-tests.ts` | Metrc API adapter |
| **Strain Sync** | `sync/strain-sync.ts` | Bi-directional sync |
| **Item Sync** | `sync/item-sync.ts` | Bi-directional sync |
| **Lab Test Sync** | `sync/lab-test-sync.ts` | COA and results sync |

This architecture ensures:
- ✅ Platform-native models remain the source of truth
- ✅ Compliance systems sync via adapters
- ✅ Future systems (CTLS, PrimusGFS) can be added
- ✅ Domain-awareness (cannabis vs produce) is maintained
- ✅ Full seed-to-sale traceability
