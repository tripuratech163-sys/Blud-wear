-- ==========================================
-- Migration: Add "About This Product" fields
-- Run this in your Supabase SQL editor
-- ==========================================

-- Add about_description column (extended product description for the About section)
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS about_description TEXT;

-- Add key_features column (JSONB array of feature strings)
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS key_features JSONB DEFAULT '[]'::jsonb;

-- Allow admins to update these new columns (update policy)
-- If you already have an update policy, this may already be covered.
-- Run only if you don't have an UPDATE policy for products yet:
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'products' AND policyname = 'Products can be updated'
  ) THEN
    CREATE POLICY "Products can be updated" ON products FOR UPDATE USING (true);
  END IF;
END $$;
