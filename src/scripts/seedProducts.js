// ============================================================
// BludWear — One-Time Product Seed Script
// ============================================================
// HOW TO RUN:
//   1. Make sure you've set your keys in .env.local
//   2. Open browser console on any page of the dev server
//   3. Or import and call seedProducts() from main.jsx temporarily
// ============================================================

import { supabase } from '../lib/supabase';
import { mensProducts, womensProducts } from '../data/products';

export const seedProducts = async () => {
  if (!supabase) {
    console.error('❌ Supabase not configured. Add your keys to .env.local first.');
    return;
  }

  const allProducts = [...mensProducts, ...womensProducts];

  const formatted = allProducts.map(p => ({
    name: p.name,
    price: p.price,
    original_price: p.originalPrice || null,
    image: p.image,
    category: p.category,
    gender: p.gender,
    tag: p.tag || null,
  }));

  console.log(`🌱 Seeding ${formatted.length} products to Supabase...`);

  // Add a 10-second timeout to prevent hanging forever
  const timeout = new Promise((_, reject) => 
    setTimeout(() => reject(new Error('Request timed out after 10s. Check your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local and make sure your Supabase project is active.')), 10000)
  );

  const insertRequest = supabase
    .from('products')
    .insert(formatted)
    .select();

  const { data, error } = await Promise.race([insertRequest, timeout]);

  if (error) {
    console.error('❌ Seed failed:', error);
    throw new Error(error.message);
  }

  console.log(`✅ Successfully seeded ${data.length} products!`);
  return data;
};
