// scripts/generate-sitemap.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const baseUrl = 'https://izixport.com';

// ─── PUBLIC ROUTES (only indexable pages) ─────────────────────
const staticPages = [
  '/',
  '/login',
  '/signup',
  '/how-it-works',
  '/privacy',
  '/terms',
  '/marketplace',
  '/exporters',
  '/about',
  '/contact',
  '/faq',
  '/category/sesame-seeds',
  '/category/cashew-nuts',
  '/category/cocoa-beans',
  '/category/ginger',
  '/category/hibiscus',
  '/category/shea-butter',
  '/category/palm-oil',
  '/category/chili-pepper',
];

// ─── DYNAMIC ROUTES (optional – uncomment if you want to fetch from Supabase) ──
// import { createClient } from '@supabase/supabase-js';
// const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
// const { data: listings } = await supabase.from('listings').select('id, slug').eq('status', 'active');
// const listingRoutes = listings.map(l => `/listing/${l.slug || l.id}`);
// const allRoutes = [...staticPages, ...listingRoutes];

const allRoutes = staticPages;

// ─── Generate sitemap XML ──────────────────────────────────────
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${allRoutes.map(page => `
  <url>
    <loc>${baseUrl}${page}</loc>
    <changefreq>${page === '/' ? 'daily' : 'weekly'}</changefreq>
    <priority>${page === '/' ? '1.0' : '0.8'}</priority>
  </url>
  `).join('')}
</urlset>`;

// ─── Write to dist/spa ──────────────────────────────────────────
const distPath = path.resolve(__dirname, '../dist/spa/sitemap.xml');
const publicPath = path.resolve(__dirname, '../public/sitemap.xml');

// Write to dist (for production)
fs.mkdirSync(path.dirname(distPath), { recursive: true });
fs.writeFileSync(distPath, sitemap);
console.log('✅ sitemap.xml written to dist/spa/');

// Also write to public (for local dev, if needed)
fs.mkdirSync(path.dirname(publicPath), { recursive: true });
fs.writeFileSync(publicPath, sitemap);
console.log('✅ sitemap.xml written to public/');