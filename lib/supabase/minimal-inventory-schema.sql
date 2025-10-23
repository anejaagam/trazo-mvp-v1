-- Minimal schema for inventory testing in dev mode
-- Apply this in Supabase SQL Editor: https://supabase.com/dashboard/project/srrrfkgbcrgtplpekwji/sql/new

-- Create inventory_items table (if not exists)
CREATE TABLE IF NOT EXISTS inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  site_id UUID NOT NULL,
  category_id UUID,
  item_type TEXT NOT NULL CHECK (item_type IN (
    'co2_tank', 'filter', 'nutrient', 'chemical', 'packaging', 
    'sanitation', 'equipment', 'seeds', 'clones', 'growing_medium', 'other'
  )),
  name TEXT NOT NULL,
  sku TEXT,
  unit_of_measure TEXT NOT NULL,
  current_quantity DECIMAL(10,2) DEFAULT 0,
  reserved_quantity DECIMAL(10,2) DEFAULT 0,
  minimum_quantity DECIMAL(10,2),
  maximum_quantity DECIMAL(10,2),
  reorder_point DECIMAL(10,2),
  storage_location TEXT,
  lot_number TEXT,
  expiry_date DATE,
  cost_per_unit DECIMAL(10,2),
  supplier_name TEXT,
  supplier_contact TEXT,
  material_safety_data_sheet_url TEXT,
  certificate_of_analysis_url TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create inventory_movements table
CREATE TABLE IF NOT EXISTS inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL,
  movement_type TEXT NOT NULL CHECK (movement_type IN (
    'receive', 'consume', 'adjust', 'transfer', 'waste', 'return'
  )),
  quantity DECIMAL(10,2) NOT NULL,
  unit_of_measure TEXT NOT NULL,
  from_location TEXT,
  to_location TEXT,
  batch_id UUID,
  reference_number TEXT,
  notes TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  recorded_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create inventory_lots table
CREATE TABLE IF NOT EXISTS inventory_lots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL,
  lot_code TEXT NOT NULL,
  quantity_received DECIMAL(10,2) NOT NULL,
  quantity_remaining DECIMAL(10,2) NOT NULL,
  unit_of_measure TEXT NOT NULL,
  received_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expiry_date DATE,
  manufacture_date DATE,
  supplier_name TEXT,
  purchase_order_number TEXT,
  invoice_number TEXT,
  cost_per_unit DECIMAL(10,2),
  certificate_of_analysis_url TEXT,
  material_safety_data_sheet_url TEXT,
  test_results_url TEXT,
  compliance_package_uid TEXT,
  compliance_package_type TEXT,
  storage_location TEXT,
  is_depleted BOOLEAN DEFAULT FALSE,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_inventory_items_site ON inventory_items(site_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_org ON inventory_items(organization_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_item ON inventory_movements(item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_lots_item ON inventory_lots(item_id);

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
DROP TRIGGER IF EXISTS update_inventory_items_updated_at ON inventory_items;
CREATE TRIGGER update_inventory_items_updated_at BEFORE UPDATE ON inventory_items
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_inventory_lots_updated_at ON inventory_lots;
CREATE TRIGGER update_inventory_lots_updated_at BEFORE UPDATE ON inventory_lots
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Disable RLS for dev mode (you can enable later for production)
ALTER TABLE inventory_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements DISABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_lots DISABLE ROW LEVEL SECURITY;

SELECT 'Minimal inventory schema created successfully!' as status;
