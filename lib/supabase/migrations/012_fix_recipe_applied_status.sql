-- =====================================================
-- Fix Recipe Applied Status
-- Updates recipe status to 'applied' when activated
-- =====================================================

-- Function to update recipe status when activated
CREATE OR REPLACE FUNCTION update_recipe_status_on_activation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- When a recipe activation is created with is_active = TRUE
  IF (TG_OP = 'INSERT' AND NEW.is_active = TRUE) OR
     (TG_OP = 'UPDATE' AND NEW.is_active = TRUE AND OLD.is_active = FALSE) THEN
    
    -- Update recipe status to 'applied' if it's currently 'published' or 'draft'
    UPDATE recipes
    SET status = 'applied',
        updated_at = NOW()
    WHERE id = NEW.recipe_id
      AND status IN ('published', 'draft');
    
  END IF;
  
  -- When a recipe activation is deactivated, check if there are any other active activations
  IF (TG_OP = 'UPDATE' AND NEW.is_active = FALSE AND OLD.is_active = TRUE) THEN
    
    -- If no more active activations for this recipe, revert status back to 'published'
    IF NOT EXISTS (
      SELECT 1 FROM recipe_activations
      WHERE recipe_id = NEW.recipe_id
        AND is_active = TRUE
        AND id != NEW.id
    ) THEN
      UPDATE recipes
      SET status = 'published',
          updated_at = NOW()
      WHERE id = NEW.recipe_id
        AND status = 'applied';
    END IF;
    
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS recipe_activation_status_sync ON recipe_activations;

-- Create trigger on recipe_activations
CREATE TRIGGER recipe_activation_status_sync
  AFTER INSERT OR UPDATE ON recipe_activations
  FOR EACH ROW
  EXECUTE FUNCTION update_recipe_status_on_activation();

-- Backfill: Update existing recipes that have active activations
UPDATE recipes
SET status = 'applied',
    updated_at = NOW()
WHERE id IN (
  SELECT DISTINCT recipe_id
  FROM recipe_activations
  WHERE is_active = TRUE
)
AND status IN ('published', 'draft');

-- Add comment
COMMENT ON FUNCTION update_recipe_status_on_activation IS 
  'Automatically updates recipe status to "applied" when activated and back to "published" when deactivated';

COMMENT ON TRIGGER recipe_activation_status_sync ON recipe_activations IS
  'Keeps recipe.status in sync with recipe_activations.is_active';

