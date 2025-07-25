# Production Deployment Guide - KeCaraJoComer

## 📋 Pre-Deployment Checklist

### 1. Environment Setup
- [ ] Copy `.env.production.example` to `.env.production.local`
- [ ] Fill in all required environment variables
- [ ] Generate strong NEXTAUTH_SECRET: `openssl rand -base64 32`
- [ ] Verify Supabase project is production-ready
- [ ] Confirm API keys are production keys (not test keys)

### 2. Code Quality
- [ ] Run `npm run lint` and fix all errors
- [ ] Run `npm run type-check` to ensure TypeScript compliance
- [ ] Run `npm test` to verify all tests pass
- [ ] Build locally with `npm run build` to catch errors

### 3. Security Review
- [ ] Review all API endpoints for authentication
- [ ] Verify Supabase RLS policies are enabled
- [ ] Check that no secrets are exposed in client code
- [ ] Ensure debug modes are disabled in production
- [ ] Validate CORS settings

## 🚀 Deployment Steps

### Option 1: Vercel (Recommended)

#### Via Vercel Dashboard

1. **Connect Repository**
   ```
   1. Go to https://vercel.com/dashboard
   2. Click "Add New Project"
   3. Import your GitHub repository
   4. Select "KeCaraJoComer"
   ```

2. **Configure Project**
   - Framework: Next.js
   - Root Directory: ./
   - Build Command: `npm run build`
   - Output Directory: .next

3. **Set Environment Variables**
   - Go to Project Settings → Environment Variables
   - Add all variables from `.env.production.local`
   - Ensure sensitive keys are marked as "Sensitive"

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete (~5-10 minutes)
   - Verify deployment at provided URL

#### Via CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod

# Follow prompts to:
# - Link to existing project or create new
# - Configure project settings
# - Set environment variables
```

### Option 2: Docker Deployment

1. **Build Docker Image**
   ```bash
   # Build production image
   docker build -t kecarajocomer:latest .
   
   # Tag for registry
   docker tag kecarajocomer:latest your-registry/kecarajocomer:latest
   
   # Push to registry
   docker push your-registry/kecarajocomer:latest
   ```

2. **Deploy Container**
   ```bash
   # Run with environment file
   docker run -d \
     --name kecarajocomer \
     -p 3000:3000 \
     --env-file .env.production \
     --restart unless-stopped \
     your-registry/kecarajocomer:latest
   ```

### Option 3: Manual VPS Deployment

1. **Server Setup**
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y
   
   # Install Node.js 18+
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Install PM2
   sudo npm install -g pm2
   ```

2. **Deploy Application**
   ```bash
   # Clone repository
   git clone https://github.com/your-username/kecarajocomer.git
   cd kecarajocomer
   
   # Install dependencies
   npm install
   
   # Copy environment variables
   cp .env.production.example .env.production.local
   # Edit with your values
   nano .env.production.local
   
   # Build application
   npm run build
   
   # Start with PM2
   pm2 start npm --name "kecarajocomer" -- start
   pm2 save
   pm2 startup
   ```

3. **Configure Nginx**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

## 📊 Post-Deployment Tasks

### 1. Verification
- [ ] Test all main features (login, recipes, shopping list)
- [ ] Verify AI generation works
- [ ] Check image uploads function
- [ ] Test PWA installation
- [ ] Verify service worker registration

### 2. Performance Testing
```bash
# Run Lighthouse audit
npx lighthouse https://your-domain.com \
  --output=html \
  --output-path=./lighthouse-report.html

# Expected scores:
# - Performance: ≥ 80
# - Accessibility: ≥ 90
# - Best Practices: ≥ 80
# - SEO: ≥ 80
# - PWA: ≥ 80
```

### 3. Monitoring Setup

#### Sentry (Error Tracking)
```javascript
// Already configured in _app.tsx
// Just add DSN to environment variables
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn
```

#### Vercel Analytics
```javascript
// Automatically enabled on Vercel
// Add to other platforms:
npm install @vercel/analytics
```

#### Custom Health Check
```bash
# Create health check endpoint
curl https://your-domain.com/api/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2024-12-29T12:00:00Z",
  "version": "0.1.0",
  "services": {
    "database": "connected",
    "ai": "operational",
    "storage": "available"
  }
}
```

### 4. Setup Monitoring Alerts

#### Uptime Monitoring
- Use UptimeRobot, Pingdom, or similar
- Monitor: `/api/health`
- Alert threshold: 2 failures
- Check interval: 5 minutes

#### Error Rate Monitoring
- Set up Sentry alerts for:
  - Error rate > 1% 
  - New error types
  - Performance degradation

#### API Usage Monitoring
- Monitor Anthropic/Gemini API usage
- Set budget alerts
- Track usage patterns

## 🔧 Troubleshooting

### Common Issues

#### Build Failures
```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build

# Check for TypeScript errors
npm run type-check

# Fix linting issues
npm run lint -- --fix
```

#### Database Connection Issues
```bash
# Test Supabase connection
curl https://your-project.supabase.co/rest/v1/

# Verify environment variables
node scripts/validateEnv.ts
```

#### Performance Issues
```bash
# Analyze bundle size
npm run build
npm run analyze

# Check for large dependencies
npx depcheck

# Enable compression
# Already configured in next.config.js
```

## 🔄 Rollback Procedures

### Vercel Rollback
```bash
# List deployments
vercel ls

# Rollback to previous
vercel rollback [deployment-url]

# Or use dashboard:
# Deployments → Select previous → Promote to Production
```

### Docker Rollback
```bash
# Stop current container
docker stop kecarajocomer

# Start previous version
docker run -d \
  --name kecarajocomer \
  -p 3000:3000 \
  --env-file .env.production \
  your-registry/kecarajocomer:previous-tag
```

### Manual Rollback
```bash
# Revert to previous commit
git revert HEAD
git push origin main

# Or checkout specific version
git checkout [previous-commit-hash]
npm install
npm run build
pm2 restart kecarajocomer
```

## 📈 Scaling Considerations

### Database Optimization
- Enable Supabase connection pooling
- Add read replicas for heavy loads
- Implement caching strategy

### CDN Setup
- Use Vercel Edge Network (automatic)
- Or configure Cloudflare
- Cache static assets aggressively

### API Rate Limiting
- Implement rate limiting middleware
- Use Redis for distributed limiting
- Monitor and adjust limits

### Image Optimization
- Use Next.js Image component
- Configure image CDN (Cloudinary)
- Implement lazy loading

## 🔐 Security Hardening

### Additional Headers
```javascript
// Add to next.config.js headers
{
  key: 'X-DNS-Prefetch-Control',
  value: 'on'
},
{
  key: 'X-Permitted-Cross-Domain-Policies',
  value: 'none'
}
```

### API Security
- Implement request signing
- Add API versioning
- Use API gateway for rate limiting

### Data Protection
- Enable Supabase encryption at rest
- Implement field-level encryption for sensitive data
- Regular security audits

## 📝 Maintenance

### Regular Tasks
- Weekly: Review error logs
- Monthly: Update dependencies
- Quarterly: Security audit
- Yearly: Major version upgrades

### Backup Strategy
- Daily database backups (Supabase automatic)
- Weekly code repository backups
- Monthly full system snapshots

### Update Procedures
```bash
# Test updates locally first
npm update
npm run build
npm test

# Deploy to staging
vercel --env preview

# After verification, deploy to production
vercel --prod
```

## 🆘 Emergency Contacts

- **Vercel Support**: https://vercel.com/support
- **Supabase Support**: https://supabase.com/support
- **GitHub Issues**: https://github.com/your-username/kecarajocomer/issues

---

**Last Updated**: December 2024
**Version**: 1.0.0
**Maintained by**: KeCaraJoComer Team