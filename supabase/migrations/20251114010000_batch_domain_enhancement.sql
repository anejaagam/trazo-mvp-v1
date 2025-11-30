-- Batch Management Phase 1: Domain Enhancement
-- Add domain_type discriminator and domain-specific fields for cannabis and produce operations
-- Part of Phase 12 implementation (Nov 14, 2025)

-- ============================================================================
-- PART 1: ENHANCE BATCHES TABLE
-- ============================================================================

-- Add domain discriminator
ALTER TABLE batches ADD COLUMN domain_type TEXT CHECK (domain_type IN ('cannabis', 'produce'));
COMMENT ON COLUMN batches.domain_type IS 'Discriminator for cannabis vs produce operations';

-- Cannabis-specific fields
ALTER TABLE batches ADD COLUMN lighting_schedule TEXT;
ALTER TABLE batches ADD COLUMN thc_content DECIMAL(5,2);
ALTER TABLE batches ADD COLUMN cbd_content DECIMAL(5,2);
ALTER TABLE batches ADD COLUMN drying_date DATE;
ALTER TABLE batches ADD COLUMN curing_date DATE;
ALTER TABLE batches ADD COLUMN terpene_profile JSONB;

COMMENT ON COLUMN batches.lighting_schedule IS 'Cannabis: Light cycle (e.g., 18/6, 12/12)';
COMMENT ON COLUMN batches.thc_content IS 'Cannabis: THC percentage (0-100)';
COMMENT ON COLUMN batches.cbd_content IS 'Cannabis: CBD percentage (0-100)';
COMMENT ON COLUMN batches.drying_date IS 'Cannabis: Date drying process started';
COMMENT ON COLUMN batches.curing_date IS 'Cannabis: Date curing process started';
COMMENT ON COLUMN batches.terpene_profile IS 'Cannabis: Terpene analysis results';

-- Produce-specific fields
ALTER TABLE batches ADD COLUMN grade TEXT CHECK (grade IN ('A', 'B', 'C', 'culled'));
ALTER TABLE batches ADD COLUMN ripeness TEXT CHECK (ripeness IN ('unripe', 'turning', 'ripe', 'overripe'));
ALTER TABLE batches ADD COLUMN brix_level DECIMAL(5,2);
ALTER TABLE batches ADD COLUMN firmness TEXT;
ALTER TABLE batches ADD COLUMN color TEXT;
ALTER TABLE batches ADD COLUMN defect_rate DECIMAL(5,2);
ALTER TABLE batches ADD COLUMN certifications JSONB;
ALTER TABLE batches ADD COLUMN storage_temp_c DECIMAL(5,2);
ALTER TABLE batches ADD COLUMN storage_humidity_pct DECIMAL(5,2);

COMMENT ON COLUMN batches.grade IS 'Produce: Quality grade (A=premium, B=standard, C=utility, culled=waste)';
COMMENT ON COLUMN batches.ripeness IS 'Produce: Ripeness stage';
COMMENT ON COLUMN batches.brix_level IS 'Produce: Sugar content (°Brix)';
COMMENT ON COLUMN batches.firmness IS 'Produce: Firmness measurement (varies by produce type)';
COMMENT ON COLUMN batches.color IS 'Produce: Color classification';
COMMENT ON COLUMN batches.defect_rate IS 'Produce: Percentage of defective units (0-100)';
COMMENT ON COLUMN batches.certifications IS 'Produce: Organic, GAP, PrimusGFS certifications';
COMMENT ON COLUMN batches.storage_temp_c IS 'Produce: Optimal storage temperature';
COMMENT ON COLUMN batches.storage_humidity_pct IS 'Produce: Optimal storage humidity';

-- ============================================================================
-- PART 2: ENHANCE CULTIVARS TABLE
-- ============================================================================

-- Produce-specific cultivar fields
ALTER TABLE cultivars ADD COLUMN category TEXT CHECK (category IN ('vegetable', 'fruit', 'herb', 'berry', 'leafy_green', 'root_vegetable', 'mushroom'));
ALTER TABLE cultivars ADD COLUMN flavor_profile TEXT;
ALTER TABLE cultivars ADD COLUMN storage_life_days INTEGER;
ALTER TABLE cultivars ADD COLUMN optimal_temp_c_min DECIMAL(5,2);
ALTER TABLE cultivars ADD COLUMN optimal_temp_c_max DECIMAL(5,2);
ALTER TABLE cultivars ADD COLUMN optimal_humidity_min DECIMAL(5,2);
ALTER TABLE cultivars ADD COLUMN optimal_humidity_max DECIMAL(5,2);

COMMENT ON COLUMN cultivars.category IS 'Produce: Category of produce';
COMMENT ON COLUMN cultivars.flavor_profile IS 'Produce: Taste characteristics';
COMMENT ON COLUMN cultivars.storage_life_days IS 'Produce: Shelf life duration';
COMMENT ON COLUMN cultivars.optimal_temp_c_min IS 'Produce: Minimum optimal temperature';
COMMENT ON COLUMN cultivars.optimal_temp_c_max IS 'Produce: Maximum optimal temperature';
COMMENT ON COLUMN cultivars.optimal_humidity_min IS 'Produce: Minimum optimal humidity';
COMMENT ON COLUMN cultivars.optimal_humidity_max IS 'Produce: Maximum optimal humidity';

-- ============================================================================
-- PART 3: CREATE BATCH GENEALOGY TABLE
-- ============================================================================

CREATE TABLE batch_genealogy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  parent_batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL CHECK (relationship_type IN ('clone', 'split', 'merge', 'cross')),
  generation_level INTEGER NOT NULL DEFAULT 1,
  contribution_pct DECIMAL(5,2), -- For merges, percentage contributed by parent
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE batch_genealogy IS 'Parent-child relationships between batches for tracking lineage';
COMMENT ON COLUMN batch_genealogy.relationship_type IS 'clone=genetic copy, split=divided batch, merge=combined batches, cross=breeding';
COMMENT ON COLUMN batch_genealogy.generation_level IS 'Generation number (1=F1, 2=F2, etc.)';
COMMENT ON COLUMN batch_genealogy.contribution_pct IS 'For merges, percentage this parent contributed (0-100)';

CREATE INDEX idx_batch_genealogy_batch_id ON batch_genealogy(batch_id);
CREATE INDEX idx_batch_genealogy_parent_id ON batch_genealogy(parent_batch_id);
CREATE INDEX idx_batch_genealogy_relationship ON batch_genealogy(relationship_type);

-- ============================================================================
-- PART 4: CREATE BATCH QUALITY METRICS TABLE
-- ============================================================================

CREATE TABLE batch_quality_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  metric_type TEXT NOT NULL,
  value DECIMAL(10,4) NOT NULL,
  unit TEXT NOT NULL,
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  recorded_by UUID REFERENCES users(id),
  test_method TEXT,
  lab_certified BOOLEAN DEFAULT FALSE,
  certification_url TEXT,
  notes TEXT
);

COMMENT ON TABLE batch_quality_metrics IS 'Time-series quality measurements (THC%, Brix, moisture, etc.)';
COMMENT ON COLUMN batch_quality_metrics.metric_type IS 'Type of measurement (thc_pct, cbd_pct, brix, moisture, density, etc.)';
COMMENT ON COLUMN batch_quality_metrics.lab_certified IS 'TRUE if result from certified lab';

CREATE INDEX idx_quality_metrics_batch_id ON batch_quality_metrics(batch_id);
CREATE INDEX idx_quality_metrics_type ON batch_quality_metrics(metric_type);
CREATE INDEX idx_quality_metrics_recorded_at ON batch_quality_metrics(recorded_at);

-- ============================================================================
-- PART 5: ADD INDEXES
-- ============================================================================

CREATE INDEX idx_batches_domain_type ON batches(domain_type) WHERE domain_type IS NOT NULL;
CREATE INDEX idx_batches_stage ON batches(stage);
CREATE INDEX idx_batches_status ON batches(status);
CREATE INDEX idx_batches_cultivar_id ON batches(cultivar_id) WHERE cultivar_id IS NOT NULL;
CREATE INDEX idx_batches_parent_id ON batches(parent_batch_id) WHERE parent_batch_id IS NOT NULL;
CREATE INDEX idx_batches_org_site ON batches(organization_id, site_id);
CREATE INDEX idx_batches_start_date ON batches(start_date);

-- ============================================================================
-- PART 6: CREATE DATABASE FUNCTIONS
-- ============================================================================

-- Function: Get batch genealogy tree (recursive)
CREATE OR REPLACE FUNCTION get_batch_genealogy(p_batch_id UUID)
RETURNS TABLE (
  batch_id UUID,
  batch_number TEXT,
  parent_batch_id UUID,
  parent_batch_number TEXT,
  relationship_type TEXT,
  generation_level INTEGER,
  depth INTEGER
) AS $$
WITH RECURSIVE genealogy_tree AS (
  -- Base case: starting batch
  SELECT 
    bg.batch_id,
    b.batch_number,
    bg.parent_batch_id,
    pb.batch_number AS parent_batch_number,
    bg.relationship_type,
    bg.generation_level,
    0 AS depth
  FROM batch_genealogy bg
  JOIN batches b ON b.id = bg.batch_id
  JOIN batches pb ON pb.id = bg.parent_batch_id
  WHERE bg.batch_id = p_batch_id
  
  UNION ALL
  
  -- Recursive case: parent batches
  SELECT 
    bg.batch_id,
    b.batch_number,
    bg.parent_batch_id,
    pb.batch_number AS parent_batch_number,
    bg.relationship_type,
    bg.generation_level,
    gt.depth + 1
  FROM batch_genealogy bg
  JOIN batches b ON b.id = bg.batch_id
  JOIN batches pb ON pb.id = bg.parent_batch_id
  JOIN genealogy_tree gt ON bg.batch_id = gt.parent_batch_id
  WHERE gt.depth < 10 -- Prevent infinite loops
)
SELECT * FROM genealogy_tree;
$$ LANGUAGE sql STABLE;

COMMENT ON FUNCTION get_batch_genealogy IS 'Recursively retrieves ancestry tree for a batch (max 10 generations)';

-- Function: Transition batch stage
CREATE OR REPLACE FUNCTION transition_batch_stage(
  p_batch_id UUID,
  p_new_stage TEXT,
  p_user_id UUID,
  p_notes TEXT DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
  v_current_stage TEXT;
  v_old_stage TEXT;
BEGIN
  -- Get current stage
  SELECT stage INTO v_old_stage FROM batches WHERE id = p_batch_id;
  
  IF v_old_stage IS NULL THEN
    RAISE EXCEPTION 'Batch not found: %', p_batch_id;
  END IF;
  
  -- Update batch stage
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
  
  -- Log to stage history
  -- End previous stage
  UPDATE batch_stage_history
  SET ended_at = NOW()
  WHERE batch_id = p_batch_id AND ended_at IS NULL;
  
  -- Start new stage
  INSERT INTO batch_stage_history (batch_id, stage, started_at, transitioned_by, notes)
  VALUES (p_batch_id, p_new_stage, NOW(), p_user_id, p_notes);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION transition_batch_stage IS 'Transitions batch to new stage with event logging and history tracking';

-- Function: Quarantine batch
CREATE OR REPLACE FUNCTION quarantine_batch(
  p_batch_id UUID,
  p_reason TEXT,
  p_user_id UUID
) RETURNS VOID AS $$
BEGIN
  UPDATE batches
  SET 
    status = 'quarantined',
    quarantine_reason = p_reason,
    quarantined_at = NOW(),
    quarantined_by = p_user_id,
    updated_at = NOW()
  WHERE id = p_batch_id;
  
  -- Log event
  INSERT INTO batch_events (batch_id, event_type, to_value, user_id, notes)
  VALUES (
    p_batch_id,
    'quarantine',
    jsonb_build_object('reason', p_reason),
    p_user_id,
    'Batch placed under quarantine'
  );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION quarantine_batch IS 'Places batch under quarantine with reason tracking';

-- Function: Release from quarantine
CREATE OR REPLACE FUNCTION release_from_quarantine(
  p_batch_id UUID,
  p_user_id UUID,
  p_notes TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  UPDATE batches
  SET 
    status = 'active',
    quarantine_released_at = NOW(),
    quarantine_released_by = p_user_id,
    updated_at = NOW()
  WHERE id = p_batch_id AND status = 'quarantined';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Batch % is not currently quarantined', p_batch_id;
  END IF;
  
  -- Log event
  INSERT INTO batch_events (batch_id, event_type, user_id, notes)
  VALUES (p_batch_id, 'quarantine_release', p_user_id, p_notes);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION release_from_quarantine IS 'Releases batch from quarantine status';

-- Function: Calculate quality score
CREATE OR REPLACE FUNCTION calculate_quality_score(p_batch_id UUID)
RETURNS DECIMAL(5,2) AS $$
DECLARE
  v_domain_type TEXT;
  v_score DECIMAL(5,2);
BEGIN
  SELECT domain_type INTO v_domain_type FROM batches WHERE id = p_batch_id;
  
  IF v_domain_type = 'cannabis' THEN
    -- Cannabis: Score based on THC/CBD content, terpenes
    SELECT AVG(
      CASE 
        WHEN metric_type = 'thc_pct' AND value BETWEEN 15 AND 25 THEN 100
        WHEN metric_type = 'thc_pct' AND value BETWEEN 10 AND 30 THEN 80
        WHEN metric_type = 'cbd_pct' AND value > 0 THEN 100
        WHEN metric_type = 'moisture' AND value BETWEEN 9 AND 12 THEN 100
        ELSE 50
      END
    ) INTO v_score
    FROM batch_quality_metrics
    WHERE batch_id = p_batch_id;
    
  ELSIF v_domain_type = 'produce' THEN
    -- Produce: Score based on brix, grade, defect rate
    SELECT AVG(
      CASE
        WHEN metric_type = 'brix' AND value > 12 THEN 100
        WHEN metric_type = 'defect_rate' AND value < 5 THEN 100
        WHEN metric_type = 'firmness' AND value > 7 THEN 100
        ELSE 70
      END
    ) INTO v_score
    FROM batch_quality_metrics
    WHERE batch_id = p_batch_id;
  ELSE
    v_score := 0;
  END IF;
  
  RETURN COALESCE(v_score, 0);
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION calculate_quality_score IS 'Calculates domain-specific quality score (0-100) based on metrics';

-- ============================================================================
-- PART 7: ROW LEVEL SECURITY
-- ============================================================================

-- RLS for batch_genealogy
ALTER TABLE batch_genealogy ENABLE ROW LEVEL SECURITY;

CREATE POLICY batch_genealogy_select ON batch_genealogy
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM batches b
      WHERE b.id = batch_genealogy.batch_id
      AND b.organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
    )
  );

CREATE POLICY batch_genealogy_insert ON batch_genealogy
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM batches b
      WHERE b.id = batch_genealogy.batch_id
      AND b.organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
    )
  );

-- RLS for batch_quality_metrics
ALTER TABLE batch_quality_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY batch_quality_metrics_select ON batch_quality_metrics
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM batches b
      WHERE b.id = batch_quality_metrics.batch_id
      AND b.organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
    )
  );

CREATE POLICY batch_quality_metrics_insert ON batch_quality_metrics
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM batches b
      WHERE b.id = batch_quality_metrics.batch_id
      AND b.organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
    )
  );

CREATE POLICY batch_quality_metrics_update ON batch_quality_metrics
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM batches b
      WHERE b.id = batch_quality_metrics.batch_id
      AND b.organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
    )
  );
