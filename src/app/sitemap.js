import { sql } from '@/lib/db';

export default async function sitemap() {
  const baseUrl = process.env.NEXTAUTH_URL || 'https://menyphis.com';

  // Static marketing & discovery routes
  const staticRoutes = [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/shop`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/stores`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/become-a-seller`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/track`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  let productUrls = [];
  try {
    const products = await sql.query(
      `SELECT slug, created_at FROM products WHERE slug IS NOT NULL ORDER BY id DESC LIMIT 5000`
    );
    const rows = Array.isArray(products) ? products : (products.rows || products);
    productUrls = rows.map((p) => ({
      url: `${baseUrl}/product/${p.slug}`,
      lastModified: p.created_at ? new Date(p.created_at) : new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    }));
  } catch (err) {
    console.warn('[Sitemap Error] Products fetch failed:', err);
  }

  let storeUrls = [];
  try {
    const stores = await sql.query(
      `SELECT slug, created_at FROM stores WHERE is_active = true AND slug IS NOT NULL`
    );
    const storeRows = Array.isArray(stores) ? stores : (stores.rows || stores);
    storeUrls = storeRows.map((s) => ({
      url: `${baseUrl}/store/${s.slug}`,
      lastModified: s.created_at ? new Date(s.created_at) : new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    }));
  } catch (err) {
    console.warn('[Sitemap Error] Stores fetch failed:', err);
  }

  return [...staticRoutes, ...productUrls, ...storeUrls];
}
