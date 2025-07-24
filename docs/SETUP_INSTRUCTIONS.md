# KeCaraJoComer - Setup Instructions

## 🚀 Quick Start Guide

### Prerequisites
- Node.js 20+ and npm/yarn/pnpm
- Supabase account (free tier works)
- Anthropic API key for Claude
- Git

### Step 1: Clone and Install

```bash
# Clone the repository
git clone https://github.com/yourusername/kecarajocomer.git
cd kecarajocomer

# Install dependencies
npm install
```

### Step 2: Supabase Setup

1. **Create a new Supabase project**
   - Go to [app.supabase.com](https://app.supabase.com)
   - Click "New Project"
   - Name it "kecarajocomer"
   - Save your database password
   - Wait for project to initialize

2. **Get your Supabase credentials**
   - Go to Settings → API
   - Copy:
     - Project URL
     - Anon public key
     - Service role key (keep this secret!)

3. **Run database migrations**
   ```bash
   # Option 1: Using Supabase CLI
   npx supabase login
   npx supabase link --project-ref your-project-ref
   npx supabase db push

   # Option 2: Using SQL Editor in Supabase Dashboard
   # Copy contents of lib/supabase/schema.sql and run in SQL editor
   ```

4. **Configure Authentication**
   - Go to Authentication → Providers
   - Enable Email/Password
   - (Optional) Enable Google OAuth:
     - Add authorized redirect URL: `http://localhost:3000/auth/callback`
   - (Optional) Enable GitHub OAuth:
     - Add authorized redirect URL: `http://localhost:3000/auth/callback`

### Step 3: Environment Setup

1. **Copy environment template**
   ```bash
   cp .env.example .env.local
   ```

2. **Fill in your credentials**
   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_key

   # Claude AI
   ANTHROPIC_API_KEY=your_anthropic_api_key

   # Application
   NEXT_PUBLIC_APP_URL=http://localhost:3000

   # Optional services (can add later)
   # REDIS_URL=
   # SENTRY_DSN=
   # RESEND_API_KEY=
   ```

### Step 4: Run the Application

```bash
# Development mode
npm run dev

# Build for production
npm run build
npm run start

# Run tests
npm run test
```

### Step 5: Initial Setup

1. **Visit http://localhost:3000**
2. **Create your first account**
3. **Complete profile setup**
4. **Start using the app!**

## 📋 Project Structure

```
kecarajocomer/
├── app/                    # Next.js 15 App Router
│   ├── (auth)/            # Authentication pages
│   ├── (app)/             # Protected app pages
│   ├── api/               # API routes
│   └── layout.tsx         # Root layout
├── features/              # Feature modules
│   ├── landing-page/      # ✅ Complete
│   ├── app-shell/         # ✅ Complete
│   ├── auth/              # 🚧 In Progress
│   ├── recipes/           # 📅 Planned
│   ├── meal-planning/     # 📅 Planned
│   ├── pantry/            # 📅 Planned
│   └── shopping/          # 📅 Planned
├── lib/                   # Utilities
│   ├── supabase/          # Database client
│   ├── ai/                # Claude integration
│   └── utils/             # Helpers
├── stores/                # Zustand stores
└── docs/                  # Documentation
```

## 🔧 Development Workflow

### Database Changes
1. Modify `lib/supabase/schema.sql`
2. Create migration in `lib/supabase/migrations/`
3. Run migration: `npx supabase db push`

### Adding Features
1. Create feature folder in `features/`
2. Add components, hooks, and tests
3. Update routing in `app/`
4. Add to Zustand stores if needed

### Testing
```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Type checking
npm run type-check

# Linting
npm run lint
```

## 🚨 Common Issues

### Supabase Connection Error
- Check your environment variables
- Ensure Supabase project is running
- Verify RLS policies are correct

### TypeScript Errors
- Run `npm run type-check`
- Generate fresh types: `npx supabase gen types typescript`

### Build Errors
- Clear Next.js cache: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && npm install`

## 📚 Next Steps

1. **Complete Phase 1 Tasks**
   - Set up authentication UI
   - Create Zustand stores
   - Build API utilities

2. **Start Phase 2**
   - Recipe CRUD operations
   - Meal planning calendar
   - Pantry management

3. **Integrate AI Features**
   - Recipe generation
   - Meal plan suggestions
   - Cooking assistant

## 🤝 Contributing

1. Create feature branch: `git checkout -b feature/your-feature`
2. Make changes and test
3. Commit: `git commit -m "feat: add your feature"`
4. Push: `git push origin feature/your-feature`
5. Create Pull Request

## 📞 Support

- Documentation: `/docs` folder
- Issues: GitHub Issues
- Discussions: GitHub Discussions

---

Happy cooking! 🍳