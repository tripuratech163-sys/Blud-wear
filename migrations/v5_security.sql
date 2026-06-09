-- ==========================================
-- Migration: Security Hardening (v5)
-- Run this in your Supabase SQL Editor
-- ==========================================

-- 1. Create admin_users table to restrict admin access
CREATE TABLE IF NOT EXISTS public.admin_users (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on admin_users so users cannot see who the admins are
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read on admin_users" ON public.admin_users;
-- Only admins can see admins
CREATE POLICY "Admins can read admin_users" ON public.admin_users FOR SELECT USING (
  auth.uid() IN (SELECT user_id FROM public.admin_users)
);

-- 2. Fix review_videos policies (Was allowing ANY authenticated user to manage)
ALTER TABLE public.review_videos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read on review_videos" ON public.review_videos;
DROP POLICY IF EXISTS "Allow authenticated manage on review_videos" ON public.review_videos;

CREATE POLICY "Allow public read on review_videos" ON public.review_videos FOR SELECT USING (true);
CREATE POLICY "Allow admin manage on review_videos" ON public.review_videos FOR ALL TO authenticated USING (
  auth.uid() IN (SELECT user_id FROM public.admin_users)
) WITH CHECK (
  auth.uid() IN (SELECT user_id FROM public.admin_users)
);

-- 3. Fix contact_queries policies (Was allowing ANY authenticated user to read/delete)
ALTER TABLE public.contact_queries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public insert on contact_queries" ON public.contact_queries;
DROP POLICY IF EXISTS "Allow authenticated read on contact_queries" ON public.contact_queries;
DROP POLICY IF EXISTS "Allow authenticated delete on contact_queries" ON public.contact_queries;

CREATE POLICY "Allow public insert on contact_queries" ON public.contact_queries FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow admin read on contact_queries" ON public.contact_queries FOR SELECT TO authenticated USING (
  auth.uid() IN (SELECT user_id FROM public.admin_users)
);
CREATE POLICY "Allow admin delete on contact_queries" ON public.contact_queries FOR DELETE TO authenticated USING (
  auth.uid() IN (SELECT user_id FROM public.admin_users)
);

-- 4. Fix products policies (Ensure only admins can edit products)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read on products" ON public.products;
DROP POLICY IF EXISTS "Allow admin manage on products" ON public.products;

CREATE POLICY "Allow public read on products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Allow admin manage on products" ON public.products FOR ALL TO authenticated USING (
  auth.uid() IN (SELECT user_id FROM public.admin_users)
) WITH CHECK (
  auth.uid() IN (SELECT user_id FROM public.admin_users)
);

-- 5. Fix orders policies (Ensure users can only see THEIR orders, and admins can see ALL)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read own orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can read all orders" ON public.orders;
DROP POLICY IF EXISTS "Allow public insert on orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;

-- Anyone can insert an order
CREATE POLICY "Allow public insert on orders" ON public.orders FOR INSERT WITH CHECK (true);
-- Users can see their own orders based on the user_id column
CREATE POLICY "Users can read own orders" ON public.orders FOR SELECT USING (
  auth.uid() = user_id OR auth.uid() IN (SELECT user_id FROM public.admin_users)
);
-- Admins can update orders
CREATE POLICY "Admins can update orders" ON public.orders FOR UPDATE TO authenticated USING (
  auth.uid() IN (SELECT user_id FROM public.admin_users)
) WITH CHECK (
  auth.uid() IN (SELECT user_id FROM public.admin_users)
);
