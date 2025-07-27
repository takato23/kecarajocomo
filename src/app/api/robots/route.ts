import { NextResponse } from 'next/server';

export async function GET() {
  const robotsTxt = `# KeCaraJoComer Robots.txt
# https://www.robotstxt.org/robotstxt.html

User-agent: *
Allow: /
Disallow: /api/
Disallow: /auth/
Disallow: /_next/
Disallow: /static/
Disallow: /*.json$
Disallow: /*?*
Disallow: /404
Disallow: /500

# Sitemaps
Sitemap: ${process.env.NEXT_PUBLIC_APP_URL || 'https://kecarajocomer.com'}/sitemap.xml

# Crawl-delay
Crawl-delay: 1

# Specific bot rules
User-agent: Googlebot
Allow: /
Crawl-delay: 0

User-agent: Bingbot
Allow: /
Crawl-delay: 1

# Block bad bots
User-agent: AhrefsBot
Disallow: /

User-agent: SemrushBot
Disallow: /

User-agent: DotBot
Disallow: /

User-agent: MJ12bot
Disallow: /

# Block AI training bots (optional - remove if you want AI training)
User-agent: GPTBot
Disallow: /

User-agent: ChatGPT-User
Disallow: /

User-agent: CCBot
Disallow: /

User-agent: anthropic-ai
Disallow: /

User-agent: Claude-Web
Disallow: /`;

  return new NextResponse(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600'
    }
  });
}