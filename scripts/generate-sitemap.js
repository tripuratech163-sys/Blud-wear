import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables from .env and .env.local
dotenv.config();
dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const BASE_URL = 'https://www.bludwear.com';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("Missing Supabase credentials in environment variables.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Helper to generate slug matching frontend
const createProductSlug = (product) => {
  const normalize = (val) => String(val || '').trim().toLowerCase();
  return `${normalize(product.gender)}-${normalize(product.name)}`
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
};

async function generateSitemap() {
  console.log("Generating sitemap...");
  try {
    // Fetch all active products
    const { data: products, error } = await supabase
      .from('products')
      .select('name, gender, created_at');

    if (error) throw error;

    // Static routes
    const staticRoutes = [
      '',
      '/collection',
      '/about',
      '/contact-us',
      '/sustainability',
      '/guides'
    ];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    // Add static routes
    for (const route of staticRoutes) {
      xml += `  <url>\n`;
      xml += `    <loc>${BASE_URL}${route}</loc>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>${route === '' ? '1.0' : '0.8'}</priority>\n`;
      xml += `  </url>\n`;
    }

    // Add product routes
    if (products) {
      for (const product of products) {
        const slug = createProductSlug(product);
        if (!slug) continue;
        
        // Format lastmod correctly if available
        const lastmod = product.created_at 
          ? new Date(product.created_at).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0];

        xml += `  <url>\n`;
        xml += `    <loc>${BASE_URL}/products/${slug}</loc>\n`;
        xml += `    <lastmod>${lastmod}</lastmod>\n`;
        xml += `    <changefreq>daily</changefreq>\n`;
        xml += `    <priority>0.9</priority>\n`;
        xml += `  </url>\n`;
      }
    }

    xml += `</urlset>`;

    // Ensure dist directory exists
    const distPath = path.resolve(__dirname, '../dist');
    if (!fs.existsSync(distPath)) {
      console.warn("Dist directory not found! Ensure this script runs after vite build.");
      fs.mkdirSync(distPath, { recursive: true });
    }

    const sitemapPath = path.join(distPath, 'sitemap.xml');
    fs.writeFileSync(sitemapPath, xml);

    console.log(`Successfully generated sitemap with ${staticRoutes.length + (products?.length || 0)} URLs at ${sitemapPath}`);
  } catch (err) {
    console.error("Error generating sitemap:", err);
    process.exit(1);
  }
}

generateSitemap();
