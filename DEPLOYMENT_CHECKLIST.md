# KeCarajoComer - Deployment Checklist

## ✅ Build Status
- **Build**: Compiles successfully ✅
- **Warnings**: Only non-critical warnings remain
- **Type checking**: Passes with warnings

## 🔐 Environment Variables Needed

Copy `.env.production.example` to `.env.production.local` and fill in these values:

### Required for Basic Functionality:
```bash
# Supabase (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Security (REQUIRED)
NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32
NEXTAUTH_URL=https://your-domain.vercel.app
```

### Required for AI Features:
```bash
# At least ONE of these AI providers:
ANTHROPIC_API_KEY=your-claude-api-key          # For Claude AI
GOOGLE_GEMINI_API_KEY=your-gemini-api-key      # For Gemini AI
```

### Optional but Recommended:
```bash
# OAuth (for social login)
GOOGLE_CLIENT_ID=your-google-oauth-id
GOOGLE_CLIENT_SECRET=your-google-oauth-secret
```

## 🚀 Deployment Steps

### 1. Prepare Environment Variables
```bash
# Copy the example file
cp .env.production.example .env.production.local

# Edit and add your values
code .env.production.local
```

### 2. Test Build Locally
```bash
# Build for production
npm run build

# Test production build
npm run start
```

### 3. Deploy to Vercel

#### Option A: Vercel CLI
```bash
# Install Vercel CLI if needed
npm i -g vercel

# Deploy
vercel

# Deploy to production
vercel --prod
```

#### Option B: Git Push
```bash
# Commit all changes
git add .
git commit -m "Prepare for production deployment"

# Push to GitHub
git push origin main
```

### 4. Configure Vercel Environment Variables

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to Settings → Environment Variables
4. Add all variables from `.env.production.local`
5. Select "Production" environment

### 5. Configure Domains (Optional)
1. In Vercel Dashboard → Settings → Domains
2. Add your custom domain
3. Update `NEXTAUTH_URL` to match your domain

## 📋 Post-Deployment Checklist

- [ ] Verify build succeeds on Vercel
- [ ] Test authentication flow
- [ ] Check database connections work
- [ ] Test AI features (recipe generation)
- [ ] Verify photo uploads work
- [ ] Test shopping list functionality
- [ ] Check mobile responsiveness
- [ ] Monitor error logs

## 🔍 Monitoring

### Set up monitoring:
1. **Error Tracking**: Configure Sentry (optional)
2. **Analytics**: Add Vercel Analytics
3. **Performance**: Monitor Core Web Vitals
4. **Uptime**: Use Vercel's built-in monitoring

## 🚨 Common Issues

### Database Connection Issues
- Verify Supabase URL and keys are correct
- Check RLS policies are enabled
- Ensure tables exist (run migrations)

### AI Features Not Working
- Verify at least one AI API key is set
- Check API key quotas/limits
- Monitor usage in provider dashboards

### Authentication Issues
- Verify `NEXTAUTH_SECRET` is set
- Check `NEXTAUTH_URL` matches your domain
- Ensure OAuth credentials are correct

## 📞 Support Resources

- **Supabase**: [support.supabase.com](https://support.supabase.com)
- **Vercel**: [vercel.com/support](https://vercel.com/support)
- **Anthropic**: [support.anthropic.com](https://support.anthropic.com)
- **Google AI**: [ai.google.dev](https://ai.google.dev)

## ✅ Ready to Deploy!

Once you've:
1. ✅ Set all required environment variables
2. ✅ Tested the build locally
3. ✅ Committed all changes

You're ready to deploy to production! 🎉