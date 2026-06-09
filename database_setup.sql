-- Run this script in your Supabase SQL Editor (Dashboard -> SQL Editor -> New Query)

-- 1. Create or Update Products Table
-- Assuming 'products' table already exists based on your setup, we will just add the missing columns.
-- If it doesn't exist, this will create it.

CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  price TEXT NOT NULL,
  original_price TEXT,
  image TEXT NOT NULL,
  images TEXT[] DEFAULT '{}', -- Array of image URLs
  description TEXT,
  category TEXT NOT NULL,
  gender TEXT NOT NULL,
  tag TEXT,
  stock INTEGER DEFAULT 0, -- Base stock for products without variants
  variants JSONB DEFAULT '[]'::jsonb, -- Array of variant objects { color, size, price, stock, image }
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- If the table already existed but without 'images', 'description', and 'variants' columns,
-- you can run these ALTER TABLE commands. (If they already exist, this will error safely, you can ignore the error)
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS variants JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT 0;

-- Add variant support to cart (if you have a cart table)
-- ALTER TABLE public.cart ADD COLUMN IF NOT EXISTS color TEXT;
-- ALTER TABLE public.cart ADD COLUMN IF NOT EXISTS size TEXT;

-- 2. Create Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Connect to logged in user if available
  items JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of products and quantities
  total_amount DECIMAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending', -- Pending, Processing, Shipped, Delivered, Cancelled
  shipping_address JSONB,
  contact_info JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Set up Row Level Security (RLS)
-- Products: Anyone can read, only authenticated users can insert/update/delete
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on products"
  ON public.products FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated users to insert products"
  ON public.products FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update products"
  ON public.products FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete products"
  ON public.products FOR DELETE
  TO authenticated
  USING (true);

-- Orders: Authenticated users can read their own orders. Admins (any authenticated user for now) can read all.
-- Note: In a real production app, you would check an 'is_admin' flag on the user. For this setup, we allow authenticated users to manage.
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated to insert orders"
  ON public.orders FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow users to read own orders"
  ON public.orders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Allow public to insert orders"
  ON public.orders FOR INSERT
  TO anon
  WITH CHECK (true); -- Allow guest checkout

-- For the Admin panel, we temporarily allow all authenticated users to manage all orders. 
CREATE POLICY "Allow authenticated to manage all orders"
  ON public.orders FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
