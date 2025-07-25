# Operations Runbook - KeCaraJoComer

## 🚀 Quick Reference

### Critical URLs
- **Production**: https://your-domain.com
- **Health Check**: https://your-domain.com/api/health
- **Monitoring**: [Vercel Dashboard](https://vercel.com/dashboard)
- **Logs**: [Vercel Functions Logs](https://vercel.com/dashboard/functions)
- **Database**: [Supabase Dashboard](https://app.supabase.com)

### Emergency Contacts
- **On-Call Engineer**: +1-XXX-XXX-XXXX
- **Platform Support**: support@vercel.com
- **Database Support**: support@supabase.com

## 🔥 Common Issues & Solutions

### 1. Site is Down

**Symptoms**: Main site returns 500/503 errors or doesn't load

**Immediate Actions**:
```bash
# 1. Check health endpoint
curl -I https://your-domain.com/api/health

# 2. Check Vercel status
open https://www.vercel-status.com/

# 3. Check Supabase status
open https://status.supabase.com/

# 4. Check recent deployments
vercel ls --prod
```

**Resolution Steps**:
1. If health check fails → Check database connection
2. If recent deployment → Rollback to previous version
3. If external service issue → Activate maintenance mode
4. If unknown → Check logs for errors

### 2. Database Connection Issues

**Symptoms**: "Database connection failed" errors, slow queries

**Diagnosis**:
```bash
# Test database connection
curl -X GET https://your-project.supabase.co/rest/v1/ \
  -H "apikey: YOUR_ANON_KEY"

# Check connection pool
# In Supabase dashboard → Database → Connection Pooling
```

**Resolution**:
1. Restart connection pool in Supabase
2. Check if hitting connection limits
3. Scale up database if needed
4. Implement connection retry logic

### 3. AI Generation Failures

**Symptoms**: Recipe generation fails, AI features not working

**Quick Checks**:
```javascript
// Test Anthropic API
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{"model": "claude-3-sonnet-20240229", "max_tokens": 10, "messages": [{"role": "user", "content": "Hi"}]}'

// Test Gemini API
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=$GOOGLE_GEMINI_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"contents":[{"parts":[{"text":"Hello"}]}]}'
```

**Common Fixes**:
1. Check API key validity
2. Verify rate limits not exceeded
3. Check API service status
4. Failover to alternate AI provider
5. Clear API cache if implemented

### 4. Performance Degradation

**Symptoms**: Slow page loads, high response times

**Diagnostics**:
```bash
# Run Lighthouse audit
npx lighthouse https://your-domain.com --view

# Check Vercel Analytics
open https://vercel.com/dashboard/analytics

# Monitor API response times
curl -w "@curl-format.txt" -o /dev/null -s https://your-domain.com/api/health
```

**Solutions**:
1. Check for memory leaks in functions
2. Review recent code changes
3. Enable caching if disabled
4. Scale functions if needed
5. Optimize database queries

### 5. Authentication Issues

**Symptoms**: Users can't login, sessions expired

**Debug Steps**:
```javascript
// Check NextAuth configuration
// Verify NEXTAUTH_URL matches production URL
// Ensure NEXTAUTH_SECRET is set

// Test auth endpoint
curl -X POST https://your-domain.com/api/auth/session
```

**Fixes**:
1. Verify environment variables
2. Check session cookie settings
3. Clear auth cache
4. Restart auth service
5. Check OAuth provider settings

## 📊 Monitoring & Alerts

### Key Metrics to Watch

| Metric | Normal | Warning | Critical | Action |
|--------|--------|---------|----------|--------|
| Response Time | <500ms | 500-2000ms | >2000ms | Scale up, optimize |
| Error Rate | <0.1% | 0.1-1% | >1% | Check logs, fix bugs |
| CPU Usage | <50% | 50-80% | >80% | Scale, optimize code |
| Memory Usage | <60% | 60-85% | >85% | Restart, check leaks |
| Database Connections | <50 | 50-80 | >80 | Increase pool size |
| AI API Calls | <1000/day | 1000-5000 | >5000 | Check usage, budget |

### Alert Response Procedures

#### High Error Rate Alert
1. Check error logs for patterns
2. Identify affected endpoints
3. Review recent deployments
4. Rollback if needed
5. Hotfix and deploy

#### Database Performance Alert
1. Check slow query log
2. Review connection pool
3. Check for locks/deadlocks
4. Optimize problematic queries
5. Consider read replicas

#### Resource Limit Alert
1. Check current usage
2. Identify resource hogs
3. Implement caching
4. Optimize code
5. Scale infrastructure

## 🛠️ Maintenance Procedures

### Daily Tasks
```bash
# Morning health check (9 AM)
curl https://your-domain.com/api/health | jq '.'

# Check error logs
vercel logs --prod --since 24h | grep ERROR

# Monitor key metrics
# Check dashboard for anomalies
```

### Weekly Tasks
```bash
# 1. Update dependencies (Monday)
npm outdated
npm update --save

# 2. Database maintenance (Tuesday)
# Run vacuum/analyze in Supabase

# 3. Security scan (Wednesday)
npm audit
snyk test

# 4. Performance review (Thursday)
# Analyze Vercel Analytics

# 5. Backup verification (Friday)
# Test restore procedure
```

### Monthly Tasks
1. **Security Updates**
   - Update all dependencies
   - Review security advisories
   - Rotate API keys

2. **Performance Optimization**
   - Analyze slow queries
   - Review bundle sizes
   - Clean up unused code

3. **Capacity Planning**
   - Review growth trends
   - Plan scaling needs
   - Budget review

## 🔄 Deployment Procedures

### Standard Deployment
```bash
# 1. Run tests locally
npm test
npm run build

# 2. Deploy to preview
vercel

# 3. Test preview URL
# Run smoke tests

# 4. Deploy to production
vercel --prod

# 5. Verify deployment
curl https://your-domain.com/api/health
```

### Emergency Hotfix
```bash
# 1. Create hotfix branch
git checkout -b hotfix/issue-description

# 2. Make minimal fix
# Only fix the critical issue

# 3. Test locally
npm test

# 4. Deploy directly to prod
vercel --prod --force

# 5. Monitor closely
# Watch logs for 30 minutes
```

### Rollback Procedure
```bash
# 1. List recent deployments
vercel ls

# 2. Find last working deployment
# Look for deployment before issue

# 3. Promote to production
vercel promote [deployment-url]

# 4. Verify rollback
curl https://your-domain.com/api/health

# 5. Investigate issue
# Fix in development
```

## 🚨 Disaster Recovery

### Data Loss Recovery
1. **Stop all writes**
   ```bash
   # Enable read-only mode
   # Set environment variable
   READONLY_MODE=true vercel env pull
   ```

2. **Assess damage**
   - Identify affected tables
   - Determine last good backup
   - Calculate data loss window

3. **Restore from backup**
   ```sql
   -- In Supabase SQL editor
   -- Restore specific tables
   ```

4. **Verify data integrity**
   - Run consistency checks
   - Validate critical data
   - Test functionality

5. **Resume operations**
   - Disable read-only mode
   - Monitor closely
   - Communicate status

### Security Breach Response
1. **Immediate Actions**
   - Revoke all API keys
   - Force logout all users
   - Enable maintenance mode
   - Preserve evidence

2. **Investigation**
   - Review access logs
   - Check for data exfiltration
   - Identify attack vector
   - Document timeline

3. **Remediation**
   - Patch vulnerabilities
   - Update dependencies
   - Strengthen security
   - Reset credentials

4. **Recovery**
   - Generate new API keys
   - Update configurations
   - Test all features
   - Resume service

5. **Post-Incident**
   - Write incident report
   - Update procedures
   - Implement monitoring
   - User communication

## 📝 Maintenance Mode

### Enable Maintenance Mode
```typescript
// Set environment variable
MAINTENANCE_MODE=true

// Or create maintenance.json
{
  "enabled": true,
  "message": "Scheduled maintenance in progress",
  "estimatedEndTime": "2024-01-01T12:00:00Z"
}
```

### Maintenance Page
```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  if (process.env.MAINTENANCE_MODE === 'true') {
    return NextResponse.rewrite(new URL('/maintenance', request.url));
  }
}
```

## 📊 Useful Queries

### Database Health Checks
```sql
-- Check table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Active connections
SELECT count(*) FROM pg_stat_activity;

-- Slow queries
SELECT 
  query,
  mean_exec_time,
  calls
FROM pg_stat_statements
WHERE mean_exec_time > 1000
ORDER BY mean_exec_time DESC
LIMIT 10;
```

### Application Metrics
```javascript
// API endpoint performance
const metrics = await fetch('/api/metrics').then(r => r.json());
console.log('Average response time:', metrics.avgResponseTime);
console.log('Error rate:', metrics.errorRate);
console.log('Active users:', metrics.activeUsers);
```

## 🔧 Troubleshooting Scripts

### Clear Cache
```bash
# Clear Vercel cache
vercel --force

# Clear function cache
curl -X POST https://your-domain.com/api/cache/clear \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### Debug Mode
```bash
# Enable debug logging
DEBUG=* vercel dev

# Production debug (temporary)
vercel env add DEBUG_MODE true --production
```

### Health Check Script
```bash
#!/bin/bash
# health-check.sh

URL="https://your-domain.com/api/health"
EXPECTED="healthy"

response=$(curl -s $URL | jq -r '.status')

if [ "$response" != "$EXPECTED" ]; then
  echo "Health check failed: $response"
  # Send alert
  curl -X POST $SLACK_WEBHOOK -d '{"text":"Health check failed!"}'
  exit 1
fi

echo "Health check passed"
```

---

**Remember**: Stay calm during incidents. Follow the procedures. Document everything.

**Last Updated**: December 2024
**Version**: 1.0.0