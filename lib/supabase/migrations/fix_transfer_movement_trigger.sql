-- Fix Inventory Transfer Movement Logic
-- Issue: Transfers between locations were reducing stock quantities
-- Fix: Transfers now preserve quantities and only update storage_location

-- Drop and recreate the trigger function with corrected logic
CREATE OR REPLACE FUNCTION update_inventory_quantity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  quantity_delta DECIMAL(10,2);
BEGIN
  -- Calculate how much to add or subtract from current_quantity
  quantity_delta := CASE NEW.movement_type
    WHEN 'receive' THEN NEW.quantity
    WHEN 'return' THEN NEW.quantity
    WHEN 'consume' THEN -NEW.quantity
    WHEN 'dispose' THEN -NEW.quantity
    WHEN 'transfer' THEN 0  -- Transfers don't change total quantity, just location
    WHEN 'adjust' THEN NEW.quantity  -- Can be positive or negative
    WHEN 'reserve' THEN 0  -- Doesn't change total, only reserved
    WHEN 'unreserve' THEN 0
    ELSE 0
  END;
  
  -- Update item quantity
  UPDATE public.inventory_items
  SET 
    current_quantity = current_quantity + quantity_delta,
    reserved_quantity = CASE NEW.movement_type
      WHEN 'reserve' THEN reserved_quantity + NEW.quantity
      WHEN 'unreserve' THEN reserved_quantity - NEW.quantity
      ELSE reserved_quantity
    END,
    updated_at = NOW()
  WHERE id = NEW.item_id;
  
  -- If lot_id is provided, update lot quantity for consume/dispose only
  -- (Transfers are handled in the API to update storage_location)
  IF NEW.lot_id IS NOT NULL AND NEW.movement_type IN ('consume', 'dispose') THEN
    UPDATE public.inventory_lots
    SET 
      quantity_remaining = quantity_remaining - NEW.quantity,
      is_active = CASE WHEN (quantity_remaining - NEW.quantity) <= 0 THEN FALSE ELSE TRUE END,
      updated_at = NOW()
    WHERE id = NEW.lot_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- No need to recreate the trigger itself, just the function
-- The existing trigger will use the updated function
