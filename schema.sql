-- ==========================================
-- BLUDWEAR - Supabase Database Schema
-- ==========================================

-- 1. PRODUCTS TABLE
CREATE TABLE products (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  price TEXT NOT NULL,
  original_price TEXT,
  image TEXT NOT NULL,
  category TEXT NOT NULL,
  gender TEXT NOT NULL,
  tag TEXT,
  gsm TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS (Row Level Security) for products
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
-- Policy: Anyone can read products
CREATE POLICY "Products are viewable by everyone" ON products FOR SELECT USING (true);
-- Policy: Allow insert for seeding (can be restricted to authenticated users in production)
CREATE POLICY "Products can be inserted" ON products FOR INSERT WITH CHECK (true);
-- Policy: Allow delete (for admin cleanup)
CREATE POLICY "Products can be deleted" ON products FOR DELETE USING (true);


-- 2. CART TABLE
CREATE TABLE cart (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  quantity INTEGER DEFAULT 1 NOT NULL,
  color TEXT,
  size TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for cart
ALTER TABLE cart ENABLE ROW LEVEL SECURITY;
-- Policies: Users can only see and manage their own cart items
CREATE POLICY "Users can view their own cart" ON cart FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert into their own cart" ON cart FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own cart" ON cart FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own cart" ON cart FOR DELETE USING (auth.uid() = user_id);


-- 3. WISHLIST TABLE
CREATE TABLE wishlist (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, product_id) -- Prevent duplicate wishlist entries
);

-- Enable RLS for wishlist
ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;
-- Policies: Users can only see and manage their own wishlist
CREATE POLICY "Users can view their own wishlist" ON wishlist FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert into their own wishlist" ON wishlist FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own wishlist" ON wishlist FOR DELETE USING (auth.uid() = user_id);


-- 4. ORDERS TABLE
CREATE TABLE orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  total_amount NUMERIC NOT NULL,
  status TEXT DEFAULT 'pending' NOT NULL,
  shipping_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for orders
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
-- Policies: Users can only see their own orders
CREATE POLICY "Users can view their own orders" ON orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own orders" ON orders FOR INSERT WITH CHECK (auth.uid() = user_id);


-- 5. ORDER_ITEMS TABLE
CREATE TABLE order_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL, -- Don't delete order history if a product is removed
  quantity INTEGER NOT NULL,
  price_at_time TEXT NOT NULL, -- Snapshot of the price
  color TEXT,
  size TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for order_items
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
-- Policy: Users can only see order items linked to their own orders
CREATE POLICY "Users can view their own order items" ON order_items FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_items.order_id
    AND orders.user_id = auth.uid()
  )
);
CREATE POLICY "Users can insert their own order items" ON order_items FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_items.order_id
    AND orders.user_id = auth.uid()
  )
);

-- ==========================================
-- OPTIONAL: SEED DATA (Test Products)
-- ==========================================
INSERT INTO products (name, price, image, category, gender, tag) VALUES
('Crimson Core Hoodie', '$180', '/hoodie.png', 'Outerwear', 'men', 'BESTSELLER'),
('Onyx Performance Jacket', '$240', '/jacket.png', 'Outerwear', 'men', 'NEW'),
('Phantom Leggings', '$110', '/leggings.png', 'Bottoms', 'women', 'BESTSELLER');
