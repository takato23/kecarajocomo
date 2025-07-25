# KeCarajoComer Documentation

## 📚 Documentation Structure

### Core Documentation
- **[SYSTEM_ARCHITECTURE.md](SYSTEM_ARCHITECTURE.md)** - Complete system architecture overview
- **[PRD.md](PRD.md)** - Product Requirements Document
- **[IMPLEMENTATION_ROADMAP.md](IMPLEMENTATION_ROADMAP.md)** - Development roadmap and phases
- **[TECHNICAL_STANDARDS.md](TECHNICAL_STANDARDS.md)** - Coding standards and conventions

### Feature Documentation  
- **[AI_INTEGRATION.md](AI_INTEGRATION.md)** - AI integration patterns and implementation
- **[API_DESIGN.md](API_DESIGN.md)** - API architecture and endpoints
- **[DATABASE_SCHEMA.md](DATABASE_SCHEMA.md)** - Database structure and models
- **[COMPONENT_ARCHITECTURE.md](COMPONENT_ARCHITECTURE.md)** - Frontend component design

### System Modules
- **[PROFILE_SYSTEM.md](PROFILE_SYSTEM.md)** - User profile management
- **[NAVIGATION_SYSTEM.md](NAVIGATION_SYSTEM.md)** - Navigation and routing

### Development Guides
- **[SETUP_INSTRUCTIONS.md](SETUP_INSTRUCTIONS.md)** - Project setup guide
- **[CONTRIBUTING.md](CONTRIBUTING.md)** - Contribution guidelines
- **[TESTING.md](TESTING.md)** - Testing strategies and guides
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Deployment procedures

### Feature Specifications
- **[UNIFIED_MEAL_PLANNER_SPEC.md](UNIFIED_MEAL_PLANNER_SPEC.md)** - Meal planning system
- **[VOICE_RECOGNITION_SYSTEM.md](VOICE_RECOGNITION_SYSTEM.md)** - Voice integration
- **[iOS26_DESIGN_SYSTEM_ARCHITECTURE.md](iOS26_DESIGN_SYSTEM_ARCHITECTURE.md)** - Design system

### Archive
Older documentation and session summaries have been moved to the `archive/` directory for reference.

## 🚦 Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- Supabase account
- Claude API key (Anthropic)
- Gemini API key (Google)
- Vercel account (for deployment)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/kecarajocomer.git
cd kecarajocomer

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API keys and Supabase credentials

# Run database migrations
npm run db:migrate

# Start development server
npm run dev
```

### Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# AI Providers
CLAUDE_API_KEY=your-claude-key
GEMINI_API_KEY=your-gemini-key

# Optional
NEXT_PUBLIC_APP_URL=http://localhost:3000
SENTRY_DSN=your-sentry-dsn
```

## 🏗️ Project Structure

```
kecarajocomer/
├── app/                    # Next.js 15 App Router
│   ├── (auth)/            # Authentication routes
│   ├── (dashboard)/       # Protected app routes
│   ├── api/               # API routes and Edge Functions
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── ui/               # Base UI components
│   ├── features/         # Feature-specific components
│   └── layouts/          # Layout components
├── lib/                   # Utilities and services
│   ├── ai/               # AI integration
│   ├── supabase/         # Database client
│   └── utils/            # Helper functions
├── stores/                # Zustand state management
├── hooks/                 # Custom React hooks
└── types/                 # TypeScript definitions
```

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e

# Run all tests with coverage
npm run test:all
```

## 📊 Performance Goals

- **Initial Load**: < 3s on 3G, < 1s on 4G
- **Core Web Vitals**: 
  - LCP < 2.5s
  - FID < 100ms
  - CLS < 0.1
- **API Response**: < 200ms (p95)
- **AI Generation**: < 5s with streaming

## 🚀 Deployment

The application is designed for deployment on Vercel:

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🙏 Acknowledgments

- Built with love using Next.js, Supabase, and AI
- Inspired by the need for better meal planning tools
- Special thanks to Claude and Gemini for AI capabilities

## 📧 Contact

For questions or support, please reach out to [support@kecarajocomer.com](mailto:support@kecarajocomer.com)

---

Built with ❤️ for food lovers everywhere