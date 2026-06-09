-- ==========================================
-- Migration: Product Reviews & Ratings (v3)
-- Run this in your Supabase SQL Editor
-- ==========================================

-- 1. Create product_reviews table
CREATE TABLE IF NOT EXISTS public.product_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  body TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'product_reviews' AND policyname = 'Allow public read on product_reviews'
  ) THEN
    CREATE POLICY "Allow public read on product_reviews" ON public.product_reviews 
      FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'product_reviews' AND policyname = 'Allow public insert on product_reviews'
  ) THEN
    CREATE POLICY "Allow public insert on product_reviews" ON public.product_reviews 
      FOR INSERT WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'product_reviews' AND policyname = 'Allow admin delete on product_reviews'
  ) THEN
    CREATE POLICY "Allow admin delete on product_reviews" ON public.product_reviews 
      FOR DELETE TO authenticated USING (true);
  END IF;
END $$;

-- 4. Seed initial review entries for all products currently in the DB
-- This ensures the pages look alive right away
INSERT INTO public.product_reviews (product_id, name, email, rating, title, body)
SELECT 
  id as product_id,
  'Arjun S.' as name,
  'arjun@example.com' as email,
  5 as rating,
  'Best compression gear!' as title,
  'Incredible fit — hugs the muscles perfectly without being too tight. The moisture-wicking really works during intense sessions. Will definitely buy more colors.' as body
FROM public.products
ON CONFLICT DO NOTHING;

INSERT INTO public.product_reviews (product_id, name, email, rating, title, body)
SELECT 
  id as product_id,
  'Priya M.' as name,
  'priya@example.com' as email,
  5 as rating,
  'Gym essential!' as title,
  'Wore this for a 90-min HIIT class and stayed completely dry. The stretch is amazing and it doesn''t lose shape after washing. Highly recommend.' as body
FROM public.products
ON CONFLICT DO NOTHING;

INSERT INTO public.product_reviews (product_id, name, email, rating, title, body)
SELECT 
  id as product_id,
  'Rohit K.' as name,
  'rohit@example.com' as email,
  4 as rating,
  'Great quality, fast delivery' as title,
  'Solid build quality and the compression is spot-on. Fabric feels premium. Docking one star only because I wish there were more color options. Overall excellent!' as body
FROM public.products
ON CONFLICT DO NOTHING;
