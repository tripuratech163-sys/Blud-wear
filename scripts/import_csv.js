import fs from 'fs';
import { parse } from 'csv-parse';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const importCsv = async () => {
  const products = [];
  
  fs.createReadStream('old_products.csv')
    .pipe(parse({ columns: true, skip_empty_lines: true }))
    .on('data', (row) => {
      // Parse JSON fields
      let images = [];
      let variants = [];
      let key_features = [];
      
      try {
        if (row.images) images = JSON.parse(row.images);
      } catch (e) { console.log('Error parsing images for', row.name); }
      
      try {
        if (row.variants) variants = JSON.parse(row.variants);
      } catch (e) { console.log('Error parsing variants for', row.name); }
      
      try {
        if (row.key_features) key_features = JSON.parse(row.key_features);
      } catch (e) { console.log('Error parsing key_features for', row.name); }

      products.push({
        id: row.id,
        name: row.name,
        price: row.price,
        original_price: row.original_price || null,
        image: row.image || '',
        category: row.category,
        gender: row.gender,
        tag: row.tag || null,
        gsm: row.gsm || null,
        is_featured: row.is_featured === 'true' || row.is_featured === 't' || row.is_featured === true,
        description: row.description || null,
        about_description: row.about_description || null,
        stock: parseInt(row.stock) || 0,
        images: images,
        variants: variants,
        key_features: key_features,
        created_at: row.created_at || new Date().toISOString()
      });
    })
    .on('end', async () => {
      console.log(`Parsed ${products.length} products. Uploading to Supabase...`);
      
      const { data, error } = await supabase
        .from('products')
        .insert(products);
        
      if (error) {
        console.error("Upload failed:", error);
      } else {
        console.log("Successfully migrated all products to your new database!");
      }
    });
};

importCsv();
