# KeCaraJoComer Deployment Guide

Comprehensive deployment guide for the KeCaraJoComer cooking assistant application.

## Overview

KeCaraJoComer is built with Next.js 15 and can be deployed to various platforms including Vercel, Docker containers, and other cloud providers.

## Prerequisites

- Node.js 18 or higher
- pnpm package manager
- Supabase project configured
- Anthropic API key for Claude AI

## Environment Variables

Create a `.env.local` file with the following variables:

```bash
# Database
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# AI Integration
ANTHROPIC_API_KEY=your_anthropic_api_key

# Optional: Analytics
NEXT_PUBLIC_ANALYTICS_ID=your_analytics_id
```

## Deployment Options

### 1. Vercel (Recommended)

#### Automatic Deployment

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on git push

#### Manual Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

#### Vercel Configuration

The `vercel.json` file includes:
- Build and dev commands
- Function timeouts
- Cache headers for PWA
- URL redirects
- Service worker configuration

### 2. Docker Deployment

#### Build Docker Image

```bash
# Build the image
docker build -t kecarajocomer .

# Run the container
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=your_supabase_url \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key \
  -e SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key \
  -e ANTHROPIC_API_KEY=your_anthropic_api_key \
  kecarajocomer
```

#### Docker Compose

```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
    restart: unless-stopped
```

### 3. Static Export (Limited Features)

```bash
# Build static export
pnpm build
pnpm export

# Deploy static files from 'out' directory
```

**Note**: Static export doesn't support API routes or server-side features.

## CI/CD Pipeline

### GitHub Actions

The `.github/workflows/ci.yml` file provides:

1. **Testing Pipeline**:
   - Type checking
   - Linting
   - Unit tests
   - Build verification

2. **Deployment Pipeline**:
   - Automatic deployment to Vercel on main branch
   - Environment-specific deployments

3. **Quality Checks**:
   - Lighthouse CI performance audits
   - PWA validation
   - Accessibility scoring

### Required Secrets

Configure these secrets in your GitHub repository:

```bash
# Vercel
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=your_vercel_org_id
VERCEL_PROJECT_ID=your_vercel_project_id

# Environment Variables
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
ANTHROPIC_API_KEY=your_anthropic_api_key

# Optional: Lighthouse CI
LHCI_GITHUB_APP_TOKEN=your_lighthouse_token
```

## Database Setup

### Supabase Migration

1. Create a new Supabase project
2. Run the SQL schema from `lib/supabase/schema.sql`
3. Configure Row Level Security (RLS)
4. Set up authentication providers

```sql
-- Run in Supabase SQL editor
\i lib/supabase/schema.sql
```

## Performance Optimization

### Build Optimizations

- Next.js SWC minification enabled
- Image optimization with WebP/AVIF
- CSS optimization
- Server React optimization
- Standalone output for Docker

### PWA Features

- Service worker for offline functionality
- App manifest for installation
- Caching strategies
- Background sync capabilities
- Push notifications support

### Monitoring

#### Lighthouse CI

Automated performance audits check:
- Performance score ≥ 80%
- Accessibility score ≥ 90%
- Best practices ≥ 80%
- SEO score ≥ 80%
- PWA score ≥ 80%

#### Error Tracking

Recommended integrations:
- Sentry for error tracking
- Vercel Analytics for performance
- Google Analytics for user behavior

## Security

### Headers

Security headers configured:
- Content Security Policy
- X-Frame-Options
- X-Content-Type-Options
- X-XSS-Protection
- Referrer Policy
- Permissions Policy

### Environment Security

- Secrets stored in environment variables
- API keys never exposed to client
- Supabase RLS for data protection
- Input validation and sanitization

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check Node.js version (18+)
   - Verify environment variables
   - Clear .next cache: `rm -rf .next`

2. **Database Connection**
   - Verify Supabase URL and keys
   - Check network connectivity
   - Validate RLS policies

3. **AI Integration**
   - Confirm Anthropic API key
   - Check API rate limits
   - Verify request format

4. **PWA Issues**
   - Clear browser cache
   - Check service worker registration
   - Validate manifest.json

### Debugging

```bash
# Enable verbose logging
DEBUG=* pnpm dev

# Check build output
pnpm build --debug

# Lighthouse audit
npx lighthouse http://localhost:3000 --output=html
```

## Scaling

### Performance Considerations

- Database connection pooling
- CDN for static assets
- Image optimization service
- API rate limiting
- Caching strategies

### Monitoring Metrics

- Response times
- Error rates
- User sessions
- Database performance
- API usage

## Support

For deployment issues:
1. Check this guide
2. Review GitHub Issues
3. Check Vercel/platform documentation
4. Contact support team

---

**Last Updated**: December 2024
**Version**: 1.0.0