-- Lab Testing (COA Management) Tables
-- Phase 3.5 Week 8 Implementation

-- Create lab test results table
CREATE TABLE IF NOT EXISTS lab_test_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_number TEXT NOT NULL, -- LAB-YYYY-MM-XXXXX format
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,

  -- Test information
  lab_name TEXT NOT NULL,
  lab_license_number TEXT,
  test_date DATE NOT NULL,
  received_date DATE NOT NULL DEFAULT CURRENT_DATE,

  -- COA document storage
  coa_file_url TEXT NOT NULL,
  coa_file_name TEXT NOT NULL,
  coa_file_size INTEGER, -- bytes
  coa_file_type TEXT CHECK (coa_file_type IN ('application/pdf', 'image/png', 'image/jpeg', 'image/jpg')),
  coa_uploaded_by UUID REFERENCES auth.users(id),

  -- Overall test status
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'in_progress', 'passed', 'failed', 'conditional', 'retesting')),

  -- Test types and results (JSONB for flexibility)
  test_results JSONB DEFAULT '{}',
  /*
  Example structure:
  {
    "potency": {
      "tested": true,
      "passed": true,
      "thc_percent": 24.5,
      "cbd_percent": 0.3,
      "total_cannabinoids": 28.2,
      "thc_mg_per_serving": 10.0
    },
    "pesticides": {
      "tested": true,
      "passed": true,
      "detected": [],
      "notes": "No pesticides detected"
    },
    "heavy_metals": {
      "tested": true,
      "passed": true,
      "lead_ppb": 0.05,
      "cadmium_ppb": 0.02,
      "mercury_ppb": 0.01,
      "arsenic_ppb": 0.03
    },
    "microbials": {
      "tested": true,
      "passed": false,
      "e_coli": "not_detected",
      "salmonella": "detected",
      "aspergillus": "not_detected",
      "total_yeast_mold_cfu": 1500
    },
    "mycotoxins": {
      "tested": false,
      "passed": null,
      "aflatoxin_ppb": null,
      "ochratoxin_ppb": null
    },
    "foreign_matter": {
      "tested": true,
      "passed": true,
      "detected": false
    },
    "moisture": {
      "tested": true,
      "passed": true,
      "percentage": 12.5
    },
    "water_activity": {
      "tested": true,
      "passed": true,
      "value": 0.65
    }
  }
  */

  -- Sample information
  sample_quantity DECIMAL(10, 3),
  sample_unit_of_measure TEXT,
  sample_collected_by TEXT,
  sample_collection_date DATE,

  -- Notes and comments
  notes TEXT,
  internal_notes TEXT, -- Not shown to external parties

  -- Metrc sync fields
  metrc_test_id TEXT,
  metrc_sync_status TEXT DEFAULT 'pending',
  metrc_sync_error TEXT,
  metrc_last_sync TIMESTAMP WITH TIME ZONE,

  -- Audit fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),

  -- Unique constraint on test number per org
  CONSTRAINT unique_test_number_per_org UNIQUE(organization_id, test_number)
);

-- Package test associations table
CREATE TABLE IF NOT EXISTS package_test_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID NOT NULL REFERENCES harvest_packages(id) ON DELETE CASCADE,
  test_result_id UUID NOT NULL REFERENCES lab_test_results(id) ON DELETE CASCADE,

  -- Package-specific status
  package_test_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (package_test_status IN ('pending', 'passed', 'failed', 'retesting', 'not_applicable')),

  -- Sample information for this package
  sample_taken BOOLEAN DEFAULT false,
  sample_quantity DECIMAL(10, 3),
  sample_unit_of_measure TEXT,

  -- Association metadata
  associated_by UUID REFERENCES auth.users(id),
  associated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Notes specific to this package's test
  notes TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Each package can only be associated with a test once
  CONSTRAINT unique_package_test UNIQUE(package_id, test_result_id)
);

-- Batch test associations table (optional - for batch-level testing)
CREATE TABLE IF NOT EXISTS batch_test_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  test_result_id UUID NOT NULL REFERENCES lab_test_results(id) ON DELETE CASCADE,

  -- Batch-specific status
  batch_test_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (batch_test_status IN ('pending', 'passed', 'failed', 'retesting', 'not_applicable')),

  -- Test stage (when in batch lifecycle was this tested)
  test_stage TEXT,

  -- Association metadata
  associated_by UUID REFERENCES auth.users(id),
  associated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  notes TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Each batch can have multiple tests but only one per test_result
  CONSTRAINT unique_batch_test UNIQUE(batch_id, test_result_id)
);

-- Create indexes for performance
CREATE INDEX idx_lab_test_results_org_site ON lab_test_results(organization_id, site_id);
CREATE INDEX idx_lab_test_results_status ON lab_test_results(status);
CREATE INDEX idx_lab_test_results_test_date ON lab_test_results(test_date DESC);
CREATE INDEX idx_lab_test_results_lab_name ON lab_test_results(lab_name);
CREATE INDEX idx_lab_test_results_created_at ON lab_test_results(created_at DESC);

CREATE INDEX idx_package_test_results_package ON package_test_results(package_id);
CREATE INDEX idx_package_test_results_test ON package_test_results(test_result_id);
CREATE INDEX idx_package_test_status ON package_test_results(package_test_status);

CREATE INDEX idx_batch_test_results_batch ON batch_test_results(batch_id);
CREATE INDEX idx_batch_test_results_test ON batch_test_results(test_result_id);
CREATE INDEX idx_batch_test_status ON batch_test_results(batch_test_status);

-- Create function to generate test numbers
CREATE OR REPLACE FUNCTION generate_test_number()
RETURNS TEXT AS $$
DECLARE
  v_date TEXT;
  v_sequence INTEGER;
  v_test_number TEXT;
BEGIN
  -- Get current date in YYYY-MM format
  v_date := TO_CHAR(CURRENT_DATE, 'YYYY-MM');

  -- Get the next sequence number for this month
  SELECT COALESCE(MAX(CAST(SUBSTRING(test_number FROM 10) AS INTEGER)), 0) + 1
  INTO v_sequence
  FROM lab_test_results
  WHERE test_number LIKE 'LAB-' || v_date || '-%';

  -- Format the test number
  v_test_number := 'LAB-' || v_date || '-' || LPAD(v_sequence::TEXT, 5, '0');

  RETURN v_test_number;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate test numbers
CREATE OR REPLACE FUNCTION set_test_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.test_number IS NULL OR NEW.test_number = '' THEN
    NEW.test_number := generate_test_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_test_number
  BEFORE INSERT ON lab_test_results
  FOR EACH ROW
  EXECUTE FUNCTION set_test_number();

-- Create trigger to update updated_at timestamp
CREATE TRIGGER trigger_update_lab_test_timestamp
  BEFORE UPDATE ON lab_test_results
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create view for packages with test status
CREATE OR REPLACE VIEW packages_with_test_status AS
SELECT
  hp.*,
  COALESCE(
    (
      SELECT ptr.package_test_status
      FROM package_test_results ptr
      JOIN lab_test_results ltr ON ltr.id = ptr.test_result_id
      WHERE ptr.package_id = hp.id
      ORDER BY ltr.test_date DESC
      LIMIT 1
    ),
    'not_tested'
  ) AS latest_test_status,
  EXISTS (
    SELECT 1
    FROM package_test_results ptr
    JOIN lab_test_results ltr ON ltr.id = ptr.test_result_id
    WHERE ptr.package_id = hp.id
    AND ptr.package_test_status = 'passed'
  ) AS has_passing_test,
  (
    SELECT COUNT(*)
    FROM package_test_results ptr
    WHERE ptr.package_id = hp.id
  ) AS total_tests,
  (
    SELECT ltr.test_date
    FROM package_test_results ptr
    JOIN lab_test_results ltr ON ltr.id = ptr.test_result_id
    WHERE ptr.package_id = hp.id
    ORDER BY ltr.test_date DESC
    LIMIT 1
  ) AS latest_test_date
FROM harvest_packages hp;

-- Create view for batches with test status
CREATE OR REPLACE VIEW batches_with_test_status AS
SELECT
  b.*,
  COALESCE(
    (
      SELECT btr.batch_test_status
      FROM batch_test_results btr
      JOIN lab_test_results ltr ON ltr.id = btr.test_result_id
      WHERE btr.batch_id = b.id
      ORDER BY ltr.test_date DESC
      LIMIT 1
    ),
    'not_tested'
  ) AS latest_test_status,
  EXISTS (
    SELECT 1
    FROM batch_test_results btr
    JOIN lab_test_results ltr ON ltr.id = btr.test_result_id
    WHERE btr.batch_id = b.id
    AND btr.batch_test_status = 'passed'
  ) AS has_passing_test,
  (
    SELECT COUNT(*)
    FROM batch_test_results btr
    WHERE btr.batch_id = b.id
  ) AS total_tests
FROM batches b;

-- RLS Policies
ALTER TABLE lab_test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE package_test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE batch_test_results ENABLE ROW LEVEL SECURITY;

-- Lab test results policies
CREATE POLICY "Users can view lab tests for their organization"
  ON lab_test_results
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_users
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create lab tests for their organization"
  ON lab_test_results
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id
      FROM organization_users
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update lab tests for their organization"
  ON lab_test_results
  FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_users
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id
      FROM organization_users
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete lab tests for their organization"
  ON lab_test_results
  FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_users
      WHERE user_id = auth.uid()
    )
  );

-- Package test results policies (inherit from lab_test_results org check)
CREATE POLICY "Users can view package test results"
  ON package_test_results
  FOR SELECT
  TO authenticated
  USING (
    test_result_id IN (
      SELECT id FROM lab_test_results
      WHERE organization_id IN (
        SELECT organization_id
        FROM organization_users
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage package test results"
  ON package_test_results
  FOR ALL
  TO authenticated
  USING (
    test_result_id IN (
      SELECT id FROM lab_test_results
      WHERE organization_id IN (
        SELECT organization_id
        FROM organization_users
        WHERE user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    test_result_id IN (
      SELECT id FROM lab_test_results
      WHERE organization_id IN (
        SELECT organization_id
        FROM organization_users
        WHERE user_id = auth.uid()
      )
    )
  );

-- Batch test results policies (similar pattern)
CREATE POLICY "Users can view batch test results"
  ON batch_test_results
  FOR SELECT
  TO authenticated
  USING (
    test_result_id IN (
      SELECT id FROM lab_test_results
      WHERE organization_id IN (
        SELECT organization_id
        FROM organization_users
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage batch test results"
  ON batch_test_results
  FOR ALL
  TO authenticated
  USING (
    test_result_id IN (
      SELECT id FROM lab_test_results
      WHERE organization_id IN (
        SELECT organization_id
        FROM organization_users
        WHERE user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    test_result_id IN (
      SELECT id FROM lab_test_results
      WHERE organization_id IN (
        SELECT organization_id
        FROM organization_users
        WHERE user_id = auth.uid()
      )
    )
  );

-- Add comments for documentation
COMMENT ON TABLE lab_test_results IS 'Stores Certificate of Analysis (COA) documents and test results from external labs';
COMMENT ON TABLE package_test_results IS 'Associates lab test results with specific harvest packages';
COMMENT ON TABLE batch_test_results IS 'Associates lab test results with batches for pre-harvest testing';
COMMENT ON COLUMN lab_test_results.test_number IS 'Auto-generated test number in format LAB-YYYY-MM-XXXXX';
COMMENT ON COLUMN lab_test_results.test_results IS 'JSONB structure containing all test types and their results';
COMMENT ON COLUMN lab_test_results.status IS 'Overall test status: pending, in_progress, passed, failed, conditional, retesting';
COMMENT ON COLUMN package_test_results.package_test_status IS 'Package-specific test status which may differ from overall test status';