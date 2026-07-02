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

const today = new Date().toISOString().split('T')[0];

async function generateSitemap() {
  console.log("Generating sitemap...");
  try {
    // Fetch all active products
    const { data: products, error } = await supabase
      .from('products')
      .select('name, gender, created_at');

    if (error) throw error;

    // Static routes with priority and changefreq
    const staticRoutes = [
      { path: '', priority: '1.0', changefreq: 'daily' },
      { path: '/collection', priority: '0.9', changefreq: 'daily' },
      { path: '/collection?category=men', priority: '0.8', changefreq: 'daily' },
      { path: '/collection?category=women', priority: '0.8', changefreq: 'daily' },
      { path: '/about', priority: '0.7', changefreq: 'monthly' },
      { path: '/contact-us', priority: '0.6', changefreq: 'monthly' },
      { path: '/sustainability', priority: '0.7', changefreq: 'monthly' },
      { path: '/guides', priority: '0.8', changefreq: 'weekly' },
    ];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    // Add static routes
    for (const route of staticRoutes) {
      xml += `  <url>\n`;
      xml += `    <loc>${BASE_URL}${route.path}</loc>\n`;
      xml += `    <lastmod>${today}</lastmod>\n`;
      xml += `    <changefreq>${route.changefreq}</changefreq>\n`;
      xml += `    <priority>${route.priority}</priority>\n`;
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
          : today;

        xml += `  <url>\n`;
        xml += `    <loc>${BASE_URL}/products/${slug}</loc>\n`;
        xml += `    <lastmod>${lastmod}</lastmod>\n`;
        xml += `    <changefreq>daily</changefreq>\n`;
        xml += `    <priority>0.9</priority>\n`;
        xml += `  </url>\n`;
      }
    }

    xml += `</urlset>`;

    const totalUrls = staticRoutes.length + (products?.length || 0);

    // Write to dist/ (for production builds)
    const distPath = path.resolve(__dirname, '../dist');
    if (!fs.existsSync(distPath)) {
      console.warn("Dist directory not found! Ensure this script runs after vite build.");
      fs.mkdirSync(distPath, { recursive: true });
    }
    const distSitemapPath = path.join(distPath, 'sitemap.xml');
    fs.writeFileSync(distSitemapPath, xml);
    console.log(`Written sitemap to ${distSitemapPath}`);

    // Also write to public/ (for dev server and as a fresh fallback)
    const publicSitemapPath = path.resolve(__dirname, '../public/sitemap.xml');
    fs.writeFileSync(publicSitemapPath, xml);
    console.log(`Written sitemap to ${publicSitemapPath}`);

    console.log(`Successfully generated sitemap with ${totalUrls} URLs.`);
  } catch (err) {
    console.error("Error generating sitemap:", err);
    process.exit(1);
  }
}

generateSitemap();
