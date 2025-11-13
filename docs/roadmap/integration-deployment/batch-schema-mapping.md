# Batch Management Schema Mapping

**Navigation:** [← Prototype Analysis](./batch-prototype-analysis.md) | [Integration Deployment Index →](./index.md)

**Date**: November 13, 2025  
**Phase**: 13 - Batch Management Integration  
**Status**: Schema Review Complete (Step 0.2)  
**Pattern Reference**: [Database Schema Phase](./integration-patterns.md#phase-1-database-schema-1-2-days)

---

## Overview

This document maps the Batch Management Prototype data models to the existing TRAZO platform database schema and identifies required enhancements.

---

## Existing Schema Review

### ✅ Tables Already in Place

#### 1. **batches** (lines 161-205)
**Status**: Good foundation, needs domain enhancement

**Current Fields**:
```sql
- id UUID PRIMARY KEY
- organization_id UUID (FK organizations)
- site_id UUID (FK sites)
- batch_number TEXT UNIQUE
- cultivar_id UUID (FK cultivars)
- stage TEXT CHECK (planning, germination, clone, vegetative, flowering, harvest, drying, curing, packaging, completed, destroyed)
- plant_count INTEGER
- start_date DATE
- expected_harvest_date DATE
- actual_harvest_date DATE
- parent_batch_id UUID (FK batches) -- for genealogy
- status TEXT CHECK (active, quarantined, completed, destroyed)
- metrc_batch_id TEXT
- license_number TEXT
- source_type TEXT CHECK (seed, clone, tissue_culture)
- source_batch_id UUID (FK batches)
- yield_weight_g DECIMAL(10,2)
- yield_units INTEGER
- waste_weight_g DECIMAL(10,2)
- quarantine_reason TEXT
- quarantined_at TIMESTAMPTZ
- quarantined_by UUID (FK users)
- quarantine_released_at TIMESTAMPTZ
- quarantine_released_by UUID (FK users)
- notes TEXT
- created_by UUID (FK users)
- created_at TIMESTAMPTZ
- updated_at TIMESTAMPTZ
```

**Assessment**: 
- ✅ Good: Has quarantine, genealogy (parent_batch_id), basic yield
- ✅ Good: Has METRC fields for compliance
- ❌ Missing: domain_type field
- ❌ Missing: Cannabis-specific fields (lighting, THC/CBD, drying/curing dates)
- ❌ Missing: Produce-specific fields (grade, ripeness, brix, certifications)
- ⚠️ Stage enum is cannabis-focused, needs produce stages

#### 2. **cultivars** (lines 138-160)
**Status**: Good for cannabis, needs produce enhancements

**Current Fields**:
```sql
- id UUID PRIMARY KEY
- organization_id UUID (FK organizations)
- name TEXT
- strain_type TEXT CHECK (indica, sativa, hybrid, cbd, auto, produce)
- genetics TEXT
- breeder TEXT
- thc_range_min DECIMAL(5,2)
- thc_range_max DECIMAL(5,2)
- cbd_range_min DECIMAL(5,2)
- cbd_range_max DECIMAL(5,2)
- flowering_days INTEGER
- harvest_notes TEXT
- grow_characteristics TEXT
- is_active BOOLEAN
- created_by UUID (FK users)
- created_at TIMESTAMPTZ
- updated_at TIMESTAMPTZ
```

**Assessment**:
- ✅ Good: Has strain_type with 'produce' option
- ✅ Good: Has genetics, THC/CBD ranges for cannabis
- ❌ Missing: Produce category (vegetable, fruit, herb, berry, etc.)
- ❌ Missing: Flavor profile for produce
- ❌ Missing: Storage life / shelf life
- ❌ Missing: Optimal temp/humidity ranges

#### 3. **batch_pod_assignments** (lines 205-218)
**Status**: Perfect for cannabis pods, works for produce growing areas

**Current Fields**:
```sql
- id UUID PRIMARY KEY
- batch_id UUID (FK batches)
- pod_id UUID (FK pods)
- assigned_at TIMESTAMPTZ
- assigned_by UUID (FK users)
- removed_at TIMESTAMPTZ
- removed_by UUID (FK users)
- plant_count INTEGER
- notes TEXT
- UNIQUE(batch_id, pod_id, assigned_at)
```

**Assessment**:
- ✅ Perfect: No changes needed
- ✅ Works for both pods (cannabis) and growing areas (produce)

#### 4. **batch_events** (lines 219-235)
**Status**: Excellent audit trail system

**Current Fields**:
```sql
- id UUID PRIMARY KEY
- batch_id UUID (FK batches)
- event_type TEXT CHECK (created, stage_change, plant_count_update, pod_assignment, pod_removal, quarantine, quarantine_release, harvest, destruction, note_added, recipe_applied)
- from_value JSONB
- to_value JSONB
- user_id UUID (FK users)
- timestamp TIMESTAMPTZ
- notes TEXT
- evidence_urls TEXT[]
```

**Assessment**:
- ✅ Perfect: Can handle all lifecycle events
- ✅ JSONB fields support domain-specific data
- ✅ Evidence URLs for compliance documentation
- ✅ Can track stage transitions, quality metrics, etc.

#### 5. **plant_tags** (lines 236-250)
**Status**: Cannabis-specific, optional for produce

**Current Fields**:
```sql
- id UUID PRIMARY KEY
- batch_id UUID (FK batches)
- tag_number TEXT UNIQUE
- metrc_tag_id TEXT
- plant_state TEXT CHECK (immature, vegetative, flowering, harvested, destroyed)
- location_pod_id UUID (FK pods)
- tagged_at TIMESTAMPTZ
- tagged_by UUID (FK users)
- destroyed_at TIMESTAMPTZ
- destroyed_by UUID (FK users)
- destruction_reason TEXT
- created_by UUID (FK users)
```

**Assessment**:
- ✅ Good for cannabis METRC compliance
- ℹ️ Not needed for most produce operations
- ℹ️ Keep as-is, will be used conditionally

---

## Missing Tables (To Create)

### 1. **batch_genealogy** (NEW)
**Purpose**: Track parent-child batch relationships beyond single parent

**Rationale**: Current `parent_batch_id` in batches table only supports single parent. Need to track:
- Batch splits (1 parent → multiple children)
- Batch merges (multiple parents → 1 child)
- Clone generations (mother → clone → clone of clone)
- Cross-breeding experiments

**Schema**:
```sql
CREATE TABLE batch_genealogy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  parent_batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  relationship_type TEXT CHECK (relationship_type IN (
    'clone', 'split', 'merge', 'seed', 'cross', 'tissue_culture'
  )),
  generation_level INTEGER DEFAULT 1, -- 1 = direct parent, 2 = grandparent, etc.
  contribution_percentage DECIMAL(5,2), -- For merges, % contribution
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(batch_id, parent_batch_id, relationship_type)
);

CREATE INDEX idx_genealogy_batch ON batch_genealogy(batch_id);
CREATE INDEX idx_genealogy_parent ON batch_genealogy(parent_batch_id);
```

### 2. **batch_quality_metrics** (NEW)
**Purpose**: Store quality measurements over time for trending and analysis

**Rationale**: Need to track:
- Cannabis: THC%, CBD%, terpenes, moisture, density
- Produce: Brix, firmness, color, size, pH, shelf life predictions
- Historical trends for cultivar performance
- Quality degradation over storage time

**Schema**:
```sql
CREATE TABLE batch_quality_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  metric_type TEXT NOT NULL, -- 'thc', 'cbd', 'brix', 'firmness', 'color', etc.
  value DECIMAL(10,2) NOT NULL,
  unit TEXT NOT NULL, -- '%', 'psi', 'score', 'days', etc.
  measured_at TIMESTAMPTZ DEFAULT NOW(),
  measured_by UUID REFERENCES users(id),
  measurement_method TEXT, -- 'lab_test', 'field_measurement', 'sensor', 'visual_inspection'
  lab_name TEXT, -- For certified lab tests
  certificate_url TEXT, -- COA or test report URL
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_quality_batch ON batch_quality_metrics(batch_id);
CREATE INDEX idx_quality_type ON batch_quality_metrics(metric_type);
CREATE INDEX idx_quality_measured ON batch_quality_metrics(measured_at);
```

### 3. **batch_stage_history** (NEW - OPTIONAL)
**Purpose**: Dedicated table for stage transitions (alternative to using batch_events)

**Rationale**: While `batch_events` can track stage changes, a dedicated table provides:
- Cleaner queries for stage duration analytics
- Better performance for stage-specific reports
- Domain-specific validation fields

**Decision**: **Use batch_events instead** - it's more flexible
- Use `event_type = 'stage_change'`
- Use `from_value` and `to_value` JSONB for stage data
- Simpler schema, same functionality

### 4. **harvest_records** (NEW)
**Purpose**: Detailed harvest workflow tracking with yield breakdown

**Rationale**: Current `batches` table only has basic yield fields. Need:
- Wet weight vs dry weight (cannabis)
- Waste tracking by reason
- Harvest by location (if batch spans multiple pods)
- Multiple harvests per batch (successive harvests for produce)
- Packaged vs unpackaged yield

**Schema**:
```sql
CREATE TABLE harvest_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  harvest_number INTEGER DEFAULT 1, -- For successive harvests
  harvest_date DATE NOT NULL,
  harvested_by UUID NOT NULL REFERENCES users(id),
  
  -- Weight tracking
  wet_weight_g DECIMAL(10,2), -- Cannabis pre-drying weight
  dry_weight_g DECIMAL(10,2), -- Cannabis post-drying weight
  final_weight_g DECIMAL(10,2) NOT NULL, -- Final packaged weight
  
  -- Yield breakdown
  yield_units INTEGER, -- Number of units (bags, jars, packages)
  unit_type TEXT, -- 'gram', 'ounce', 'pound', 'unit', 'case'
  
  -- Waste tracking
  waste_weight_g DECIMAL(10,2) DEFAULT 0,
  waste_reason TEXT CHECK (waste_reason IN (
    'trim', 'stem', 'defect', 'mold', 'pest_damage', 
    'undersize', 'overripe', 'damage', 'contamination', 'other'
  )),
  waste_notes TEXT,
  
  -- Location
  pod_id UUID REFERENCES pods(id), -- If harvested from specific pod
  location_notes TEXT,
  
  -- Quality at harvest
  quality_grade TEXT, -- Produce grade at harvest
  ripeness_level TEXT, -- Produce ripeness
  
  -- Compliance
  metrc_harvest_id TEXT, -- METRC tracking
  
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_harvest_batch ON harvest_records(batch_id);
CREATE INDEX idx_harvest_date ON harvest_records(harvest_date);
```

---

## Schema Enhancements Required

### Enhancement 1: Add domain_type to batches

**Purpose**: Enable discriminated union type safety

**SQL**:
```sql
-- Add domain_type column
ALTER TABLE batches 
ADD COLUMN domain_type TEXT 
CHECK (domain_type IN ('cannabis', 'produce')) 
DEFAULT 'cannabis';

-- Backfill existing batches as cannabis
UPDATE batches SET domain_type = 'cannabis' WHERE domain_type IS NULL;

-- Make NOT NULL after backfill
ALTER TABLE batches ALTER COLUMN domain_type SET NOT NULL;

-- Create index for filtering
CREATE INDEX idx_batches_domain_type ON batches(domain_type);
```

### Enhancement 2: Add Cannabis-Specific Fields

**Fields**:
```sql
-- Lighting & environment
ALTER TABLE batches ADD COLUMN lighting_schedule TEXT; -- '18/6', '12/12', '24/0'

-- Genealogy
ALTER TABLE batches ADD COLUMN mother_plant_id UUID REFERENCES batches(id);
ALTER TABLE batches ADD COLUMN clone_source_batch_id UUID REFERENCES batches(id);

-- Cannabinoid content
ALTER TABLE batches ADD COLUMN thc_content DECIMAL(5,2);
ALTER TABLE batches ADD COLUMN cbd_content DECIMAL(5,2);
ALTER TABLE batches ADD COLUMN cbg_content DECIMAL(5,2);
ALTER TABLE batches ADD COLUMN terpene_profile TEXT;

-- Post-harvest tracking
ALTER TABLE batches ADD COLUMN drying_start_date DATE;
ALTER TABLE batches ADD COLUMN drying_end_date DATE;
ALTER TABLE batches ADD COLUMN curing_start_date DATE;
ALTER TABLE batches ADD COLUMN curing_end_date DATE;
ALTER TABLE batches ADD COLUMN packaged_date DATE;

-- Testing
ALTER TABLE batches ADD COLUMN lab_tested BOOLEAN DEFAULT FALSE;
ALTER TABLE batches ADD COLUMN test_results_url TEXT;
```

### Enhancement 3: Add Produce-Specific Fields

**Fields**:
```sql
-- Grading & quality
ALTER TABLE batches ADD COLUMN grade TEXT 
  CHECK (grade IN ('A', 'B', 'C', 'Premium', 'Standard', 'Processing', 'Reject'));
ALTER TABLE batches ADD COLUMN ripeness_score INTEGER 
  CHECK (ripeness_score BETWEEN 1 AND 10);

-- Quality metrics
ALTER TABLE batches ADD COLUMN brix_level DECIMAL(5,2); -- Sugar content
ALTER TABLE batches ADD COLUMN firmness_score INTEGER 
  CHECK (firmness_score BETWEEN 1 AND 10);
ALTER TABLE batches ADD COLUMN color_score INTEGER 
  CHECK (color_score BETWEEN 1 AND 10);
ALTER TABLE batches ADD COLUMN defect_rate DECIMAL(5,2); -- Percentage

-- Certifications
ALTER TABLE batches ADD COLUMN gap_certified BOOLEAN DEFAULT FALSE;
ALTER TABLE batches ADD COLUMN organic_certified BOOLEAN DEFAULT FALSE;
ALTER TABLE batches ADD COLUMN primus_gfs_certified BOOLEAN DEFAULT FALSE;

-- Harvest window
ALTER TABLE batches ADD COLUMN estimated_harvest_date DATE;
ALTER TABLE batches ADD COLUMN optimal_harvest_start DATE;
ALTER TABLE batches ADD COLUMN optimal_harvest_end DATE;
```

### Enhancement 4: Expand Stage Enum for Produce

**Current**:
```sql
stage TEXT CHECK (stage IN (
  'planning', 'germination', 'clone', 'vegetative', 'flowering', 
  'harvest', 'drying', 'curing', 'packaging', 'completed', 'destroyed'
))
```

**Enhanced** (supports both domains):
```sql
-- Drop old constraint
ALTER TABLE batches DROP CONSTRAINT batches_stage_check;

-- Add new comprehensive constraint
ALTER TABLE batches ADD CONSTRAINT batches_stage_check 
CHECK (stage IN (
  -- Shared stages
  'planning', 'germination', 'harvest', 'packaging', 'completed', 'destroyed',
  
  -- Cannabis stages
  'clone', 'mother', 'vegetative', 'flowering', 'drying', 'curing', 'testing',
  
  -- Produce stages
  'seeding', 'seedling', 'transplant', 'growing', 'pre_harvest', 
  'washing', 'sorting', 'grading', 'ripening', 'storage', 'cold_storage'
));
```

### Enhancement 5: Add Produce Fields to Cultivars

**Fields**:
```sql
-- Produce categorization
ALTER TABLE cultivars ADD COLUMN category TEXT 
  CHECK (category IN (
    'vegetable', 'fruit', 'herb', 'leafy_green', 'root_vegetable', 
    'berry', 'citrus', 'microgreen', 'sprout'
  ));

-- Characteristics
ALTER TABLE cultivars ADD COLUMN flavor_profile TEXT;
ALTER TABLE cultivars ADD COLUMN storage_days INTEGER; -- Shelf life
ALTER TABLE cultivars ADD COLUMN avg_days_to_harvest INTEGER;

-- Optimal conditions
ALTER TABLE cultivars ADD COLUMN optimal_temp_min DECIMAL(5,2); -- °F
ALTER TABLE cultivars ADD COLUMN optimal_temp_max DECIMAL(5,2);
ALTER TABLE cultivars ADD COLUMN optimal_humidity_min DECIMAL(5,2); -- %
ALTER TABLE cultivars ADD COLUMN optimal_humidity_max DECIMAL(5,2);
ALTER TABLE cultivars ADD COLUMN optimal_ph_min DECIMAL(4,2);
ALTER TABLE cultivars ADD COLUMN optimal_ph_max DECIMAL(4,2);

-- Growing method preferences
ALTER TABLE cultivars ADD COLUMN growing_method TEXT 
  CHECK (growing_method IN (
    'hydroponics', 'aquaponics', 'soil', 'coco', 
    'vertical_farm', 'greenhouse', 'field', 'high_tunnel'
  ));
```

---

## Migration Strategy

### Migration Order

1. **012_batch_management_enhancement_part1.sql**
   - Add domain_type to batches
   - Add cannabis-specific fields to batches
   - Add produce-specific fields to batches
   - Expand stage enum
   - Create indexes

2. **012_batch_management_enhancement_part2.sql**
   - Create batch_genealogy table
   - Create batch_quality_metrics table
   - Create harvest_records table
   - Create all indexes and constraints

3. **012_batch_management_enhancement_part3.sql**
   - Add produce fields to cultivars
   - Update cultivars constraints
   - Create database functions

4. **012_batch_management_seed_data.sql**
   - Seed cannabis cultivars
   - Seed produce cultivars
   - Seed sample cannabis batches
   - Seed sample produce batches
   - Seed genealogy relationships
   - Seed quality metrics history

### Data Backfill Plan

```sql
-- All existing batches are cannabis (TRAZO is cannabis-first)
UPDATE batches SET domain_type = 'cannabis' WHERE domain_type IS NULL;

-- Existing cultivars with strain_type != 'produce' are cannabis
UPDATE cultivars SET category = NULL WHERE strain_type IN ('indica', 'sativa', 'hybrid', 'cbd', 'auto');

-- Existing cultivars with strain_type = 'produce' need categorization
-- (Manual review needed if any exist)
```

---

## Database Functions Needed

### 1. transition_batch_stage()
```sql
CREATE OR REPLACE FUNCTION transition_batch_stage(
  p_batch_id UUID,
  p_new_stage TEXT,
  p_user_id UUID,
  p_notes TEXT DEFAULT NULL
) RETURNS void AS $$
DECLARE
  v_old_stage TEXT;
  v_domain_type TEXT;
BEGIN
  -- Get current stage and domain
  SELECT stage, domain_type INTO v_old_stage, v_domain_type
  FROM batches WHERE id = p_batch_id;
  
  -- Validate transition (domain-specific rules)
  -- ... validation logic ...
  
  -- Update batch
  UPDATE batches 
  SET stage = p_new_stage, updated_at = NOW()
  WHERE id = p_batch_id;
  
  -- Log event
  INSERT INTO batch_events (batch_id, event_type, from_value, to_value, user_id, notes)
  VALUES (
    p_batch_id, 
    'stage_change',
    jsonb_build_object('stage', v_old_stage),
    jsonb_build_object('stage', p_new_stage),
    p_user_id,
    p_notes
  );
END;
$$ LANGUAGE plpgsql;
```

### 2. quarantine_batch()
```sql
CREATE OR REPLACE FUNCTION quarantine_batch(
  p_batch_id UUID,
  p_reason TEXT,
  p_user_id UUID
) RETURNS void AS $$
BEGIN
  UPDATE batches 
  SET 
    status = 'quarantined',
    quarantine_reason = p_reason,
    quarantined_at = NOW(),
    quarantined_by = p_user_id,
    updated_at = NOW()
  WHERE id = p_batch_id;
  
  INSERT INTO batch_events (batch_id, event_type, to_value, user_id, notes)
  VALUES (
    p_batch_id,
    'quarantine',
    jsonb_build_object('reason', p_reason),
    p_user_id,
    p_reason
  );
END;
$$ LANGUAGE plpgsql;
```

### 3. record_harvest()
```sql
CREATE OR REPLACE FUNCTION record_harvest(
  p_batch_id UUID,
  p_final_weight_g DECIMAL,
  p_yield_units INTEGER,
  p_waste_weight_g DECIMAL DEFAULT 0,
  p_user_id UUID,
  p_notes TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_harvest_id UUID;
BEGIN
  -- Create harvest record
  INSERT INTO harvest_records (
    batch_id, harvest_date, harvested_by, 
    final_weight_g, yield_units, waste_weight_g, notes
  )
  VALUES (
    p_batch_id, CURRENT_DATE, p_user_id,
    p_final_weight_g, p_yield_units, p_waste_weight_g, p_notes
  )
  RETURNING id INTO v_harvest_id;
  
  -- Update batch totals
  UPDATE batches 
  SET 
    yield_weight_g = COALESCE(yield_weight_g, 0) + p_final_weight_g,
    yield_units = COALESCE(yield_units, 0) + p_yield_units,
    waste_weight_g = COALESCE(waste_weight_g, 0) + p_waste_weight_g,
    updated_at = NOW()
  WHERE id = p_batch_id;
  
  -- Log event
  INSERT INTO batch_events (batch_id, event_type, to_value, user_id, notes)
  VALUES (
    p_batch_id,
    'harvest',
    jsonb_build_object(
      'harvest_id', v_harvest_id,
      'weight', p_final_weight_g,
      'units', p_yield_units
    ),
    p_user_id,
    p_notes
  );
  
  RETURN v_harvest_id;
END;
$$ LANGUAGE plpgsql;
```

### 4. get_batch_genealogy()
```sql
CREATE OR REPLACE FUNCTION get_batch_genealogy(p_batch_id UUID)
RETURNS TABLE (
  batch_id UUID,
  parent_batch_id UUID,
  relationship_type TEXT,
  generation_level INTEGER,
  batch_number TEXT,
  parent_batch_number TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE genealogy_tree AS (
    -- Base case: direct parents
    SELECT 
      bg.batch_id,
      bg.parent_batch_id,
      bg.relationship_type,
      bg.generation_level,
      b1.batch_number,
      b2.batch_number AS parent_batch_number
    FROM batch_genealogy bg
    JOIN batches b1 ON bg.batch_id = b1.id
    JOIN batches b2 ON bg.parent_batch_id = b2.id
    WHERE bg.batch_id = p_batch_id
    
    UNION ALL
    
    -- Recursive case: parents of parents
    SELECT 
      gt.batch_id,
      bg.parent_batch_id,
      bg.relationship_type,
      gt.generation_level + 1,
      gt.batch_number,
      b.batch_number AS parent_batch_number
    FROM genealogy_tree gt
    JOIN batch_genealogy bg ON gt.parent_batch_id = bg.batch_id
    JOIN batches b ON bg.parent_batch_id = b.id
  )
  SELECT * FROM genealogy_tree
  ORDER BY generation_level, parent_batch_number;
END;
$$ LANGUAGE plpgsql;
```

---

## Index Strategy

### Performance Indexes
```sql
-- Batch filtering (high frequency queries)
CREATE INDEX idx_batches_domain_stage ON batches(domain_type, stage);
CREATE INDEX idx_batches_domain_status ON batches(domain_type, status);
CREATE INDEX idx_batches_site_domain ON batches(site_id, domain_type);
CREATE INDEX idx_batches_cultivar ON batches(cultivar_id);

-- Date range queries
CREATE INDEX idx_batches_start_date ON batches(start_date);
CREATE INDEX idx_batches_harvest_date ON batches(expected_harvest_date);

-- Genealogy lookups
CREATE INDEX idx_batches_parent ON batches(parent_batch_id) WHERE parent_batch_id IS NOT NULL;
CREATE INDEX idx_batches_mother ON batches(mother_plant_id) WHERE mother_plant_id IS NOT NULL;

-- Quality metrics
CREATE INDEX idx_quality_batch_type ON batch_quality_metrics(batch_id, metric_type);
CREATE INDEX idx_quality_measured_date ON batch_quality_metrics(measured_at DESC);

-- Harvest records
CREATE INDEX idx_harvest_batch_date ON harvest_records(batch_id, harvest_date DESC);
```

---

## RLS (Row Level Security) Policies

All new tables must have RLS policies matching existing patterns:

```sql
-- batch_genealogy
ALTER TABLE batch_genealogy ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view genealogy for their org batches"
  ON batch_genealogy FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM batches b
      WHERE b.id = batch_genealogy.batch_id
      AND b.organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
  );

-- batch_quality_metrics
ALTER TABLE batch_quality_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view quality metrics for their org batches"
  ON batch_quality_metrics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM batches b
      WHERE b.id = batch_quality_metrics.batch_id
      AND b.organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
  );

-- harvest_records
ALTER TABLE harvest_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view harvest records for their org batches"
  ON harvest_records FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM batches b
      WHERE b.id = harvest_records.batch_id
      AND b.organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
  );
```

---

## Validation Rules

### Domain-Specific Constraints

**Cannabis batches must have**:
- cultivar_id (required)
- stage must be valid cannabis stage
- If stage = 'flowering': lighting_schedule required
- If stage = 'testing': lab_tested should be TRUE

**Produce batches must have**:
- cultivar_id (required)
- stage must be valid produce stage
- If stage = 'grading': grade field should be set
- If stage = 'storage': storage dates required

### Implementation Location
- Database: CHECK constraints for hard rules
- Application: Validation utilities for business rules
- Forms: zod schemas for user input validation

---

## Summary

### Tables Status
- ✅ **Keep as-is**: batch_pod_assignments, batch_events, plant_tags
- ⚠️ **Enhance**: batches, cultivars
- ✅ **Create new**: batch_genealogy, batch_quality_metrics, harvest_records

### Migration Complexity
- **Low Risk**: Adding nullable columns to batches/cultivars
- **Medium Risk**: Creating new tables (standard process)
- **High Risk**: Expanding stage enum (requires data validation)

### Estimated Migration Time
- **Writing SQL**: 3-4 hours
- **Testing in both regions**: 2 hours
- **Seed data creation**: 2 hours
- **Total**: 7-10 hours (1-2 days)

---

**Schema Mapping Complete**: November 13, 2025  
**Ready for**: Step 1.1 - Database Enhancement

---

## Alignment with Integration Patterns

This schema follows the established [Integration Patterns](./integration-patterns.md) used successfully for:
- ✅ Inventory Module (Phase 8)
- ✅ Monitoring Module (Phase 10)
- ✅ Recipe Module (Phase 11)

**Key Pattern Adherence:**
- ✅ All tables have `organization_id` and `site_id` for multi-tenancy
- ✅ All tables have `created_at`, `updated_at` timestamps
- ✅ All tables use `is_active` for soft deletes
- ✅ RLS policies follow org-scoped access pattern
- ✅ Indexes on foreign keys and query filters
- ✅ Audit triggers via `batch_events` table
- ✅ Helper functions for complex operations
