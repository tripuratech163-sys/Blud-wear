-- ==========================================
-- Migration: Add Return Details to Orders (v4)
-- Run this in your Supabase SQL Editor
-- ==========================================

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS return_reason TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS return_details TEXT;
