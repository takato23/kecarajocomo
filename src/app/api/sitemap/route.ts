import { NextResponse } from 'next/server';

interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://kecarajocomer.com';
  const currentDate = new Date().toISOString().split('T')[0];

  // Define your site's URLs
  const urls: SitemapUrl[] = [
    // Main pages
    {
      loc: `${baseUrl}/`,
      lastmod: currentDate,
      changefreq: 'daily',
      priority: 1.0,
    },
    {
      loc: `${baseUrl}/recetas`,
      lastmod: currentDate,
      changefreq: 'daily',
      priority: 0.9,
    },
    {
      loc: `${baseUrl}/despensa`,
      lastmod: currentDate,
      changefreq: 'weekly',
      priority: 0.8,
    },
    {
      loc: `${baseUrl}/lista-compras`,
      lastmod: currentDate,
      changefreq: 'weekly',
      priority: 0.8,
    },
    {
      loc: `${baseUrl}/meal-planning`,
      lastmod: currentDate,
      changefreq: 'weekly',
      priority: 0.8,
    },
    {
      loc: `${baseUrl}/perfil`,
      lastmod: currentDate,
      changefreq: 'monthly',
      priority: 0.6,
    },
    // Auth pages (lower priority)
    {
      loc: `${baseUrl}/login`,
      lastmod: currentDate,
      changefreq: 'yearly',
      priority: 0.5,
    },
    {
      loc: `${baseUrl}/registro`,
      lastmod: currentDate,
      changefreq: 'yearly',
      priority: 0.5,
    },
    // Legal pages
    {
      loc: `${baseUrl}/privacy`,
      lastmod: currentDate,
      changefreq: 'yearly',
      priority: 0.3,
    },
    {
      loc: `${baseUrl}/terms`,
      lastmod: currentDate,
      changefreq: 'yearly',
      priority: 0.3,
    },
  ];

  // Generate XML sitemap
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
${urls
  .map(
    (url) => `  <url>
    <loc>${url.loc}</loc>
    ${url.lastmod ? `<lastmod>${url.lastmod}</lastmod>` : ''}
    ${url.changefreq ? `<changefreq>${url.changefreq}</changefreq>` : ''}
    ${url.priority !== undefined ? `<priority>${url.priority}</priority>` : ''}
  </url>`
  )
  .join('\n')}
</urlset>`;

  return new NextResponse(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}

// Optional: Generate dynamic sitemap with recipes from database
export async function generateDynamicSitemap() {
  // This would fetch recipes from database and add them to sitemap
  // Implement if you want individual recipe pages indexed
  /*
  const supabase = createClient();
  const { data: recipes } = await supabase
    .from('recipes')
    .select('id, slug, updated_at')
    .eq('is_public', true);

  const recipeUrls = recipes?.map(recipe => ({
    loc: `${baseUrl}/recetas/${recipe.slug || recipe.id}`,
    lastmod: recipe.updated_at.split('T')[0],
    changefreq: 'monthly' as const,
    priority: 0.7,
  })) || [];
  */
}