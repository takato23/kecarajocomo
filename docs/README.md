# kecarajocomer - AI-Powered Meal Planning & Recipe Management

A next-generation meal planning application that leverages AI to provide personalized recipe generation, intelligent pantry management, and optimized shopping experiences.

## 🚀 Overview

kecarajocomer is designed to be the "utopically perfect" meal planning app, combining cutting-edge AI technology with exceptional user experience. Built with Next.js 15, TypeScript, and powered by Claude and Gemini AI, it transforms how people plan, cook, and eat.

## ✨ Key Features

- **🤖 AI-Powered Recipe Generation**: Create personalized recipes based on dietary preferences, available ingredients, and cooking skills
- **📅 Smart Weekly Meal Planning**: AI-assisted meal plans that balance nutrition, variety, and budget
- **🏪 Intelligent Pantry Management**: Track inventory, expiration dates, and get alerts for items running low
- **🛒 Optimized Shopping Lists**: Automatically generated lists organized by store sections with price tracking
- **📊 Nutritional Dashboard**: Daily tracking with personalized insights and recommendations
- **⚡ Real-time Collaboration**: Share meal plans and shopping lists with family members
- **📱 Offline Support**: Core features work without internet connection

## 🛠️ Tech Stack

- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS
- **State Management**: Zustand with persistence
- **Backend**: Supabase (PostgreSQL, Auth, Realtime)
- **AI Integration**: Claude API, Gemini API
- **Deployment**: Vercel Edge Network
- **Testing**: Jest, Playwright, React Testing Library

## 📖 Documentation

Comprehensive documentation is available in the `docs/` folder:

### Core Documentation
- [API Documentation](./docs/API.md) - Complete API reference and examples
- [Component Documentation](./docs/COMPONENTS.md) - UI component system and usage guide
- [Feature Documentation](./docs/FEATURES.md) - Detailed feature modules and architecture
- [Testing Documentation](./docs/TESTING.md) - Testing strategy and guidelines
- [Deployment Documentation](./docs/DEPLOYMENT.md) - Deployment and production guide
- [Contributing Guide](./docs/CONTRIBUTING.md) - How to contribute to the project

### Architecture Documentation
- [Architecture Overview](./ARCHITECTURE.md) - System design and technical architecture
- [Database Schema](./DATABASE_SCHEMA.md) - Complete database design with migrations
- [API Design](./API_DESIGN.md) - RESTful and Edge Function APIs
- [Component Architecture](./COMPONENT_ARCHITECTURE.md) - UI component system and patterns
- [AI Integration Guide](./AI_INTEGRATION.md) - Claude and Gemini implementation details
- [Performance & Scalability](./PERFORMANCE_SCALABILITY.md) - Optimization strategies
- [Implementation Roadmap](./IMPLEMENTATION_ROADMAP.md) - 12-week development plan

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