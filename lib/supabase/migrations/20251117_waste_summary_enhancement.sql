-- Migration: Enhance waste_summary view with analytics aggregations
-- Created: 2025-11-17
-- Purpose: Add by_type, by_source, cannabis metrics, and non-compliance counts to waste_summary view

-- Drop existing view
DROP VIEW IF EXISTS waste_summary;

-- Create enhanced waste_summary view
CREATE OR REPLACE VIEW waste_summary AS
WITH
-- Helper CTE to convert all units to kg
waste_with_kg AS (
  SELECT
    *,
    CASE unit_of_measure
      WHEN 'kg' THEN quantity
      WHEN 'g' THEN quantity / 1000
      WHEN 'lb' THEN quantity * 0.453592
      WHEN 'oz' THEN quantity * 0.0283495
      ELSE quantity -- Default to kg for other units
    END AS weight_kg,
    CASE
      WHEN waste_type IN ('plant_material', 'trim') THEN true
      ELSE false
    END AS is_cannabis
  FROM waste_logs
),
-- Aggregate by organization and site
base_summary AS (
  SELECT
    organization_id,
    site_id,
    TO_CHAR(disposed_at, 'YYYY-MM') as month,
    TO_CHAR(disposed_at, 'YYYY-"W"IW') as week,
    TO_CHAR(disposed_at, 'YYYY-MM-DD') as day,

    -- Total counts and weight
    COUNT(*) as total_waste_count,
    COALESCE(SUM(weight_kg), 0) as total_weight_kg,

    -- Cannabis-specific
    COUNT(*) FILTER (WHERE is_cannabis) as cannabis_waste_count,
    COALESCE(SUM(weight_kg) FILTER (WHERE is_cannabis), 0) as cannabis_waste_kg,

    -- Compliance metrics
    COUNT(*) FILTER (WHERE rendered_unusable = true) as rendered_count,
    COUNT(*) FILTER (WHERE witnessed_by IS NOT NULL) as witnessed_count,
    COUNT(*) FILTER (WHERE array_length(photo_urls, 1) >= 2) as photos_sufficient_count,
    COUNT(*) FILTER (
      WHERE rendered_unusable = true
      AND witnessed_by IS NOT NULL
      AND array_length(photo_urls, 1) >= 2
    ) as compliant_waste_count,

    -- Non-compliance metrics (cannabis waste that's missing requirements)
    COUNT(*) FILTER (WHERE is_cannabis AND rendered_unusable = false) as non_rendered_count,
    COUNT(*) FILTER (WHERE is_cannabis AND witnessed_by IS NULL) as non_witnessed_count,

    -- Metrc sync metrics
    COUNT(*) FILTER (WHERE metrc_sync_status = 'synced') as metrc_synced_count,
    COUNT(*) FILTER (WHERE metrc_sync_status = 'pending') as metrc_pending_count,
    COUNT(*) FILTER (WHERE metrc_sync_status = 'failed') as metrc_failed_count

  FROM waste_with_kg
  GROUP BY organization_id, site_id, month, week, day
),
-- Aggregate by waste type
by_type_agg AS (
  SELECT
    organization_id,
    site_id,
    TO_CHAR(disposed_at, 'YYYY-MM') as month,
    waste_type,
    COUNT(*) as count,
    COALESCE(SUM(weight_kg), 0) as total_weight_kg
  FROM waste_with_kg
  GROUP BY organization_id, site_id, month, waste_type
),
-- Aggregate by source type
by_source_agg AS (
  SELECT
    organization_id,
    site_id,
    TO_CHAR(disposed_at, 'YYYY-MM') as month,
    source_type,
    COUNT(*) as count,
    COALESCE(SUM(weight_kg), 0) as total_weight_kg
  FROM waste_with_kg
  GROUP BY organization_id, site_id, month, source_type
)
-- Final view with all aggregations
SELECT
  bs.*,

  -- Calculated rates
  CASE
    WHEN bs.total_waste_count > 0
    THEN (bs.compliant_waste_count::FLOAT / bs.total_waste_count::FLOAT)
    ELSE 0
  END as compliance_rate,

  CASE
    WHEN bs.total_waste_count > 0
    THEN (bs.metrc_synced_count::FLOAT / bs.total_waste_count::FLOAT)
    ELSE 0
  END as metrc_sync_rate,

  -- By type aggregations (as JSONB for easier querying)
  COALESCE(
    (
      SELECT jsonb_object_agg(
        waste_type,
        jsonb_build_object('count', count, 'total_weight_kg', total_weight_kg)
      )
      FROM by_type_agg bta
      WHERE bta.organization_id = bs.organization_id
        AND bta.site_id = bs.site_id
        AND bta.month = bs.month
    ),
    '{}'::jsonb
  ) as by_type,

  -- By source aggregations (as JSONB)
  COALESCE(
    (
      SELECT jsonb_object_agg(
        source_type,
        jsonb_build_object('count', count, 'total_weight_kg', total_weight_kg)
      )
      FROM by_source_agg bsa
      WHERE bsa.organization_id = bs.organization_id
        AND bsa.site_id = bs.site_id
        AND bsa.month = bs.month
    ),
    '{}'::jsonb
  ) as by_source

FROM base_summary bs;

-- Add comment
COMMENT ON VIEW waste_summary IS 'Enhanced waste summary view with type/source aggregations, cannabis metrics, and compliance tracking';

-- Grant permissions
GRANT SELECT ON waste_summary TO authenticated;
GRANT SELECT ON waste_summary TO service_role;
