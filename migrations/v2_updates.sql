-- ==========================================
-- Migration: E-Commerce Updates (v2)
-- Run this in your Supabase SQL Editor
-- ==========================================

-- 1. Ensure order_items table has color and size columns
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS color TEXT;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS size TEXT;

-- 2. Add Shiprocket shipment columns to orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shiprocket_order_id TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shiprocket_shipment_id TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shiprocket_status TEXT DEFAULT 'Not Shipped';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shiprocket_awb TEXT;

-- 3. Create contact_queries table
CREATE TABLE IF NOT EXISTS public.contact_queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS policies for contact_queries
ALTER TABLE public.contact_queries ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'contact_queries' AND policyname = 'Allow public insert on contact_queries'
  ) THEN
    CREATE POLICY "Allow public insert on contact_queries" ON public.contact_queries FOR INSERT WITH CHECK (true);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'contact_queries' AND policyname = 'Allow authenticated read on contact_queries'
  ) THEN
    CREATE POLICY "Allow authenticated read on contact_queries" ON public.contact_queries FOR SELECT TO authenticated USING (true);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'contact_queries' AND policyname = 'Allow authenticated delete on contact_queries'
  ) THEN
    CREATE POLICY "Allow authenticated delete on contact_queries" ON public.contact_queries FOR DELETE TO authenticated USING (true);
  END IF;
END $$;

-- 4. Create review_videos table
CREATE TABLE IF NOT EXISTS public.review_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS policies for review_videos
ALTER TABLE public.review_videos ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'review_videos' AND policyname = 'Allow public read on review_videos'
  ) THEN
    CREATE POLICY "Allow public read on review_videos" ON public.review_videos FOR SELECT USING (true);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'review_videos' AND policyname = 'Allow authenticated manage on review_videos'
  ) THEN
    CREATE POLICY "Allow authenticated manage on review_videos" ON public.review_videos FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

-- 5. Seed some initial review videos if table is empty
INSERT INTO public.review_videos (title, video_url, thumbnail_url)
SELECT 'BludWear Core Hoodie Review', 'https://assets.mixkit.co/videos/preview/mixkit-man-holding-a-basketball-on-his-neck-40097-large.mp4', 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&q=80&w=400'
WHERE NOT EXISTS (SELECT 1 FROM public.review_videos);

INSERT INTO public.review_videos (title, video_url, thumbnail_url)
SELECT 'Performance Compression Gear Test', 'https://assets.mixkit.co/videos/preview/mixkit-boxer-training-in-the-gym-40082-large.mp4', 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=400'
WHERE (SELECT COUNT(*) FROM public.review_videos) < 2;

INSERT INTO public.review_videos (title, video_url, thumbnail_url)
SELECT 'BludWear Legacy Collection Run', 'https://assets.mixkit.co/videos/preview/mixkit-athlete-running-on-a-running-track-40089-large.mp4', 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&q=80&w=400'
WHERE (SELECT COUNT(*) FROM public.review_videos) < 3;
