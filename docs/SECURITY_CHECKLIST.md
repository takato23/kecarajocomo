# Security Checklist - KeCaraJoComer Production

## 🔐 Pre-Deployment Security Audit

### Environment Variables & Secrets
- [ ] All API keys are using production keys (not development/test keys)
- [ ] NEXTAUTH_SECRET is a strong, unique 32+ character string
- [ ] No secrets are hardcoded in the codebase
- [ ] Environment variables are properly typed and validated
- [ ] `.env` files are in `.gitignore`
- [ ] Production secrets are stored securely (Vercel/platform vault)

### Authentication & Authorization
- [ ] Email/password authentication is properly configured
- [ ] OAuth providers (if used) have correct redirect URLs
- [ ] Session cookies are httpOnly and secure
- [ ] Password reset flows are secure (token expiration, single use)
- [ ] Rate limiting on auth endpoints (login, register, reset)
- [ ] Account lockout after failed attempts

### Database Security
- [ ] Supabase RLS (Row Level Security) policies are enabled
- [ ] All tables have appropriate RLS policies
- [ ] Service role key is never exposed to client
- [ ] Database backups are configured
- [ ] Connection strings use SSL
- [ ] No direct SQL queries from client-side

### API Security
- [ ] All API routes check authentication where needed
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention (content sanitization)
- [ ] CSRF protection enabled
- [ ] Rate limiting configured per endpoint
- [ ] API versioning implemented
- [ ] Error messages don't leak sensitive info

### Frontend Security
- [ ] Content Security Policy (CSP) configured
- [ ] No sensitive data in localStorage
- [ ] Secure cookie settings
- [ ] HTTPS enforced everywhere
- [ ] External scripts validated
- [ ] User input sanitized before display
- [ ] File upload restrictions (type, size)

## 🛡️ Security Headers Configuration

Verify these headers in `vercel.json` or `next.config.js`:

```javascript
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "camera=(), microphone=(self), geolocation=(self)"
        },
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=31536000; includeSubDomains"
        },
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; ..."
        }
      ]
    }
  ]
}
```

## 🔍 Vulnerability Scanning

### Dependency Security
```bash
# Check for known vulnerabilities
npm audit

# Fix automatically where possible
npm audit fix

# Check for outdated packages
npm outdated

# Use Snyk for deeper scanning
npx snyk test
```

### Code Security Scanning
```bash
# ESLint security plugin
npm install --save-dev eslint-plugin-security

# Run security linting
npx eslint . --ext .js,.jsx,.ts,.tsx

# Use GitHub security scanning
# Enable in repo settings: Security → Code scanning
```

## 🚨 Rate Limiting Implementation

### API Route Example
```typescript
// src/middleware/rateLimit.ts
import { LRUCache } from 'lru-cache';
import { NextResponse } from 'next/server';

const tokenCache = new LRUCache<string, number[]>({
  max: 500,
  ttl: 1000 * 60 * 15, // 15 minutes
});

export function rateLimit(options: {
  uniqueTokenPerInterval?: number;
  interval?: number;
}) {
  return async function middleware(request: Request) {
    const { uniqueTokenPerInterval = 500, interval = 60000 } = options;
    
    const token = request.headers.get('x-forwarded-for') ?? 'anonymous';
    const tokenCount = tokenCache.get(token) || [0];
    const currentTime = Date.now();
    const windowStart = currentTime - interval;
    
    const requestsInWindow = tokenCount.filter(
      timestamp => timestamp > windowStart
    );
    
    if (requestsInWindow.length >= uniqueTokenPerInterval) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }
    
    requestsInWindow.push(currentTime);
    tokenCache.set(token, requestsInWindow);
  };
}
```

## 🔐 Data Protection

### Sensitive Data Handling
- [ ] PII is encrypted at rest
- [ ] Sensitive fields use field-level encryption
- [ ] Data retention policies implemented
- [ ] User data export functionality available
- [ ] Data deletion properly cascades
- [ ] Audit logs for sensitive operations

### File Upload Security
```typescript
// Validate file uploads
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export function validateFile(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: 'Invalid file type' };
  }
  
  if (file.size > MAX_SIZE) {
    return { valid: false, error: 'File too large' };
  }
  
  // Additional checks: file content validation, virus scanning
  return { valid: true };
}
```

## 🚫 Common Security Mistakes to Avoid

### Never Do This:
```typescript
// ❌ BAD: Exposing service role key
const supabase = createClient(url, SERVICE_ROLE_KEY); // Client-side

// ❌ BAD: Trusting client input
const userId = request.body.userId; // Trust without validation

// ❌ BAD: Storing sensitive data in localStorage
localStorage.setItem('apiKey', key);

// ❌ BAD: SQL injection vulnerable
const query = `SELECT * FROM users WHERE email = '${email}'`;

// ❌ BAD: Exposing error details
catch (error) {
  return res.json({ error: error.stack }); // Leaks internals
}
```

### Always Do This:
```typescript
// ✅ GOOD: Use anon key client-side
const supabase = createClient(url, ANON_KEY);

// ✅ GOOD: Validate and use session
const session = await getSession();
const userId = session.user.id;

// ✅ GOOD: Use secure, httpOnly cookies
cookies().set('session', token, { 
  httpOnly: true, 
  secure: true,
  sameSite: 'lax'
});

// ✅ GOOD: Parameterized queries
const { data } = await supabase
  .from('users')
  .select()
  .eq('email', email);

// ✅ GOOD: Generic error messages
catch (error) {
  logger.error(error);
  return res.json({ error: 'An error occurred' });
}
```

## 📋 Security Monitoring

### Setup Alerts For:
- [ ] Multiple failed login attempts
- [ ] Unusual API usage patterns
- [ ] Large data exports
- [ ] Permission escalation attempts
- [ ] File upload anomalies
- [ ] Database query anomalies

### Regular Security Tasks
- [ ] Weekly: Review security logs
- [ ] Monthly: Update dependencies
- [ ] Quarterly: Security audit
- [ ] Yearly: Penetration testing

## 🔒 HTTPS & SSL

### Vercel (Automatic)
- SSL certificates auto-provisioned
- Automatic renewal
- Force HTTPS redirect

### Custom Domain
```nginx
# Force HTTPS redirect
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

## 🚨 Incident Response Plan

### If Breach Detected:
1. **Immediate Actions**
   - Rotate all API keys
   - Force logout all users
   - Enable maintenance mode
   - Preserve logs

2. **Investigation**
   - Identify attack vector
   - Assess data impact
   - Check for backdoors
   - Review access logs

3. **Recovery**
   - Patch vulnerabilities
   - Reset user passwords
   - Notify affected users
   - Update security measures

4. **Post-Incident**
   - Document lessons learned
   - Update security policies
   - Implement additional monitoring
   - Consider security audit

## 📝 Compliance

### GDPR Compliance
- [ ] Privacy policy updated
- [ ] Cookie consent implemented
- [ ] Data export functionality
- [ ] Right to deletion implemented
- [ ] Data processing agreements

### Security Standards
- [ ] OWASP Top 10 reviewed
- [ ] Security.txt file added
- [ ] Responsible disclosure policy
- [ ] Bug bounty program (optional)

## 🔧 Security Tools

### Recommended Services
- **Snyk**: Vulnerability scanning
- **OWASP ZAP**: Security testing
- **Mozilla Observatory**: Security headers check
- **SSL Labs**: SSL/TLS configuration test
- **SecurityHeaders.com**: Header analysis

### Testing Commands
```bash
# Test security headers
curl -I https://your-domain.com

# Check SSL configuration
nmap --script ssl-enum-ciphers -p 443 your-domain.com

# Run OWASP dependency check
npx owasp-dependency-check --scan . --format HTML

# Security audit
npm audit --production
```

---

**Remember**: Security is an ongoing process, not a one-time checklist. Regular reviews and updates are essential.

**Last Updated**: December 2024
**Version**: 1.0.0