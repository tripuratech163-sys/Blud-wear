-- ==========================================
-- Migration: Add Checkout Fields to Orders
-- Run this in your Supabase SQL editor
-- ==========================================

-- Subtotal and GST breakdown
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS subtotal NUMERIC DEFAULT 0;
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS gst_amount NUMERIC DEFAULT 0;
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS discount_amount NUMERIC DEFAULT 0;

-- Shipping Details
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS shipping_name TEXT;
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS shipping_phone TEXT;
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS shipping_pincode TEXT;
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS shipping_state TEXT;
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS shipping_city TEXT;

-- Payment Details
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';

-- Update policy to allow updates for payment status if needed
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'orders' AND policyname = 'Users can update their own orders'
  ) THEN
    CREATE POLICY "Users can update their own orders" ON orders FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;
