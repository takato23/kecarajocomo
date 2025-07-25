# Quick Start Guide - KeCarajoComer

**Time to First Run**: ~15 minutes  
**Prerequisites**: Node.js 18+, Git, Code Editor

## 🚀 Quick Setup (5 minutes)

### 1. Clone and Install

```bash
# Clone the repository
git clone https://github.com/yourusername/kecarajocomer.git
cd kecarajocomer

# Install dependencies
npm install
```

### 2. Environment Setup

```bash
# Copy environment template
cp .env.example .env.local
```

### 3. Configure Environment Variables

Edit `.env.local` with your credentials:

```env
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key

# AI Services (Required for AI features)
CLAUDE_API_KEY=your_claude_key
GEMINI_API_KEY=your_gemini_key

# Optional
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

### 4. Start Development Server

```bash
npm run dev
```

Visit [http://localhost:3001](http://localhost:3001) 🎉

---

## 🔧 Essential Commands

```bash
# Development
npm run dev              # Start dev server (port 3001)
npm run build           # Build for production
npm run start           # Start production server

# Code Quality
npm run lint            # Run ESLint
npm run type-check      # Check TypeScript

# Testing
npm test                # Run unit tests
npm run test:e2e        # Run E2E tests

# Database
npm run db:generate     # Generate TypeScript types
npm run seed:database   # Seed with sample data
```

---

## 🏗️ Project Structure Overview

```
kecarajocomer/
├── src/
│   ├── app/            # Pages & API routes
│   ├── components/     # Reusable components
│   ├── features/       # Feature modules
│   ├── hooks/          # Custom React hooks
│   └── lib/            # Utilities & services
├── public/             # Static assets
└── docs/               # Documentation
```

---

## 🎯 Key Features to Explore

### 1. **Authentication** (`/login`)
- Email/password login
- Social auth ready
- Profile setup flow

### 2. **Recipe Browser** (`/recetas`)
- Browse recipes
- Search and filter
- AI recipe generation

### 3. **Meal Planner** (`/planificador`)
- Weekly meal planning
- Drag-and-drop interface
- AI suggestions

### 4. **Pantry** (`/despensa`)
- Track ingredients
- Expiration monitoring
- Voice/photo input

### 5. **Shopping Lists** (`/lista-compras`)
- Auto-generation from meals
- Smart organization
- Price tracking

---

## 🛠️ Common Development Tasks

### Adding a New Component

```typescript
// src/components/ui/MyComponent.tsx
interface MyComponentProps {
  title: string;
  onClick?: () => void;
}

export function MyComponent({ title, onClick }: MyComponentProps) {
  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h3 className="text-lg font-semibold">{title}</h3>
      <button 
        onClick={onClick}
        className="mt-2 px-4 py-2 bg-blue-500 text-white rounded"
      >
        Click me
      </button>
    </div>
  );
}
```

### Creating an API Endpoint

```typescript
// src/app/api/my-endpoint/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Your logic here
  return NextResponse.json({ message: 'Hello!' });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  // Process data
  return NextResponse.json({ success: true });
}
```

### Using Supabase

```typescript
// src/lib/supabase/client.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Example query
const { data, error } = await supabase
  .from('recipes')
  .select('*')
  .limit(10);
```

### Adding AI Features

```typescript
// Using Claude or Gemini
import { generateRecipe } from '@/lib/ai/recipeGenerator';

const recipe = await generateRecipe({
  ingredients: ['tomatoes', 'pasta'],
  dietary: 'vegetarian',
  time: 30,
  provider: 'claude' // or 'gemini'
});
```

---

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Kill process on port 3001
lsof -ti:3001 | xargs kill -9
```

### TypeScript Errors
```bash
# Clear cache and rebuild
rm -rf .next
npm run dev
```

### Supabase Connection Issues
- Check environment variables
- Verify Supabase project is running
- Check Row Level Security policies

### Missing Dependencies
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

---

## 📚 Important Files to Review

1. **`/docs/CURRENT_PROJECT_STATE.md`** - Current status
2. **`/docs/DEVELOPMENT_ROADMAP.md`** - What's being built
3. **`/docs/COMPONENT_INVENTORY.md`** - Available components
4. **`/docs/API_DOCUMENTATION.md`** - API endpoints
5. **`/docs/DEVELOPMENT_GUIDELINES.md`** - Code standards

---

## 🎨 Styling Quick Reference

### Using Tailwind CSS
```jsx
// Basic styling
<div className="p-4 bg-white rounded-lg shadow-md">
  <h2 className="text-xl font-bold text-gray-800">Title</h2>
  <p className="mt-2 text-gray-600">Description</p>
</div>

// Responsive design
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Grid items */}
</div>

// Glass morphism (iOS26 style)
<div className="backdrop-blur-md bg-white/30 rounded-xl p-6">
  {/* Content */}
</div>
```

---

## 🔐 Authentication Flow

```typescript
// Check if user is authenticated
import { useAuth } from '@/hooks/useAuth';

function MyComponent() {
  const { user, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Please login</div>;
  
  return <div>Welcome {user.email}</div>;
}
```

---

## 🚀 Deployment

### Deploy to Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Follow prompts and add environment variables
```

### Manual Build

```bash
# Build for production
npm run build

# Test production build locally
npm run start
```

---

## 💡 Pro Tips

1. **Use the Command Palette**: Press `Cmd+K` for quick navigation
2. **Dark Mode**: Toggle in the header for dark theme
3. **TypeScript**: Hover over variables for type information
4. **Hot Reload**: Changes appear instantly in development
5. **Debug Panel**: Check ProfileDebug component for state info

---

## 🤝 Getting Help

1. **Documentation**: Check `/docs` folder
2. **Code Examples**: Look in `/src/examples`
3. **Type Definitions**: See `/src/types`
4. **Component Stories**: Run `npm run storybook`

---

## 🎯 Next Steps

1. **Explore the Codebase**: Start with `/src/app` for pages
2. **Try Features**: Login and test each feature
3. **Read Docs**: Review documentation files
4. **Make Changes**: Try modifying a component
5. **Run Tests**: Ensure everything works

---

## 📝 Quick Checklist

- [ ] Environment variables configured
- [ ] Development server running
- [ ] Can access http://localhost:3001
- [ ] Can login/register
- [ ] Reviewed key documentation
- [ ] Understand project structure
- [ ] Ready to code! 🚀

---

## 🔗 Useful Links

- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.io/docs)
- [Tailwind CSS](https://tailwindcss.com)
- [TypeScript](https://www.typescriptlang.org)

---

**Welcome to KeCarajoComer! Happy coding! 🍳**