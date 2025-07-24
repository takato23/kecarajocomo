# Contributing Guide

Welcome to KeCaraJoComer! We're excited to have you contribute to our AI-powered meal planning application. This guide will help you get started with contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Submitting Changes](#submitting-changes)
- [Community Guidelines](#community-guidelines)
- [Resources](#resources)

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](./CODE_OF_CONDUCT.md). Please read it before contributing.

### Our Pledge

We pledge to make participation in our project a harassment-free experience for everyone, regardless of age, body size, disability, ethnicity, gender identity and expression, level of experience, nationality, personal appearance, race, religion, or sexual identity and orientation.

### Our Standards

Examples of behavior that contributes to creating a positive environment include:

- Using welcoming and inclusive language
- Being respectful of differing viewpoints and experiences
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

## Getting Started

### Prerequisites

Before contributing, make sure you have:

- Node.js 18+ installed
- npm, yarn, or pnpm package manager
- Git for version control
- A GitHub account
- Basic knowledge of React, TypeScript, and Next.js

### Development Environment

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/yourusername/kecarajocomer.git
   cd kecarajocomer
   ```

3. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/originalowner/kecarajocomer.git
   ```

4. **Install dependencies**:
   ```bash
   npm install
   ```

5. **Set up environment variables**:
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your API keys
   ```

6. **Start the development server**:
   ```bash
   npm run dev
   ```

## Development Setup

### Required API Keys

To contribute effectively, you'll need access to these services:

1. **Supabase** (Database & Auth)
   - Create a project at [supabase.com](https://supabase.com)
   - Get your project URL and anon key
   - Set up the database schema using provided migrations

2. **Claude API** (AI Recipe Generation)
   - Get API key from [console.anthropic.com](https://console.anthropic.com)
   - Optional for frontend development

3. **Gemini API** (AI Recipe Generation)
   - Get API key from [aistudio.google.com](https://aistudio.google.com)
   - Optional for frontend development

### Environment Configuration

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_service_key

# Optional for AI features
ANTHROPIC_API_KEY=your_claude_key
GEMINI_API_KEY=your_gemini_key
```

### Database Setup

1. **Run migrations**:
   ```bash
   npm run db:migrate
   ```

2. **Seed test data**:
   ```bash
   npm run seed:database
   ```

3. **Generate TypeScript types**:
   ```bash
   npm run db:generate
   ```

## Project Structure

Understanding the project structure is crucial for effective contribution:

```
kecarajocomer/
├── app/                    # Next.js 15 App Router
│   ├── [locale]/          # Internationalized routes
│   ├── api/               # API routes
│   └── globals.css        # Global styles
├── components/            # Reusable UI components
│   ├── design-system/     # Design system components
│   ├── ui/               # Application UI components
│   └── accessibility/     # Accessibility components
├── features/              # Feature-based modules
│   ├── auth/             # Authentication & onboarding
│   ├── dashboard/        # Dashboard overview
│   ├── pantry/           # Pantry management
│   ├── recipes/          # Recipe management
│   └── planner/          # Meal planning
├── lib/                   # Utilities and configurations
├── __tests__/            # Test files
├── e2e/                  # End-to-end tests
├── docs/                 # Documentation
├── public/               # Static assets
└── types/                # TypeScript definitions
```

### Feature Module Structure

Each feature follows this structure:

```
feature/
├── components/           # Feature-specific components
├── hooks/               # Custom React hooks
├── services/            # API services and business logic
├── store/               # Zustand state management
├── types/               # TypeScript types
├── utils/               # Utility functions
├── api/                 # API route handlers
├── supabase/            # Database schemas
├── page.tsx             # Next.js page component
├── README.md            # Feature documentation
└── index.ts             # Public API exports
```

## Development Workflow

### Branch Strategy

We use a Git Flow-inspired branching model:

- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/*` - Individual feature branches
- `bugfix/*` - Bug fix branches
- `hotfix/*` - Critical production fixes

### Creating a Feature Branch

```bash
# Make sure you're on develop
git checkout develop
git pull upstream develop

# Create feature branch
git checkout -b feature/your-feature-name

# Make your changes
# ... commit your work ...

# Push to your fork
git push origin feature/your-feature-name
```

### Commit Message Convention

We follow the [Conventional Commits](https://conventionalcommits.org/) specification:

```
type(scope): description

[optional body]

[optional footer(s)]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(pantry): add expiration date tracking
fix(auth): resolve login redirect issue
docs(api): update authentication documentation
test(recipes): add unit tests for recipe generation
```

### Development Commands

```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm run start           # Start production server

# Code Quality
npm run lint            # Run ESLint
npm run type-check      # Run TypeScript checking
npm run format          # Format code with Prettier

# Testing
npm run test            # Run unit tests
npm run test:watch      # Run tests in watch mode
npm run test:coverage   # Run tests with coverage
npm run test:e2e        # Run end-to-end tests

# Database
npm run db:migrate      # Run database migrations
npm run db:generate     # Generate TypeScript types
npm run seed:database   # Seed test data
```

## Coding Standards

### TypeScript Guidelines

1. **Use TypeScript for all code**
   - No `any` types unless absolutely necessary
   - Define interfaces for all data structures
   - Use proper generic types

2. **Type Definitions**
   ```typescript
   // Good
   interface PantryItem {
     id: string;
     ingredient_name: string;
     quantity: number;
     unit: string;
     expiration_date?: Date;
   }

   // Bad
   const item: any = {
     id: "123",
     name: "Tomatoes"
   };
   ```

3. **Function Signatures**
   ```typescript
   // Good
   function addPantryItem(item: PantryItem): Promise<PantryItem> {
     // implementation
   }

   // Bad
   function addPantryItem(item: any): any {
     // implementation
   }
   ```

### React Guidelines

1. **Component Structure**
   ```typescript
   // Good
   interface ButtonProps {
     variant?: 'primary' | 'secondary';
     size?: 'sm' | 'md' | 'lg';
     disabled?: boolean;
     children: React.ReactNode;
     onClick?: () => void;
   }

   export function Button({ 
     variant = 'primary', 
     size = 'md', 
     disabled = false,
     children,
     onClick 
   }: ButtonProps) {
     return (
       <button
         className={`btn btn-${variant} btn-${size}`}
         disabled={disabled}
         onClick={onClick}
       >
         {children}
       </button>
     );
   }
   ```

2. **Hooks Usage**
   ```typescript
   // Good
   function usePantryItems() {
     const [items, setItems] = useState<PantryItem[]>([]);
     const [loading, setLoading] = useState(false);
     const [error, setError] = useState<string | null>(null);

     const fetchItems = useCallback(async () => {
       setLoading(true);
       try {
         const response = await api.pantry.getItems();
         setItems(response.data);
       } catch (err) {
         setError(err instanceof Error ? err.message : 'Unknown error');
       } finally {
         setLoading(false);
       }
     }, []);

     return { items, loading, error, fetchItems };
   }
   ```

3. **Error Handling**
   ```typescript
   // Good
   try {
     const result = await api.addPantryItem(item);
     setItems(prev => [...prev, result.data]);
   } catch (error) {
     console.error('Failed to add item:', error);
     setError(error instanceof Error ? error.message : 'Unknown error');
   }
   ```

### CSS and Styling

1. **Use Tailwind CSS** for styling
2. **Follow mobile-first** responsive design
3. **Use CSS custom properties** for theme values
4. **Maintain accessibility** standards

```jsx
// Good
<button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50">
  Save Item
</button>

// Bad
<button style={{ backgroundColor: 'blue', color: 'white' }}>
  Save Item
</button>
```

### API Design

1. **RESTful conventions**
   ```typescript
   // Good
   GET /api/pantry/items
   POST /api/pantry/items
   PUT /api/pantry/items/[id]
   DELETE /api/pantry/items/[id]

   // Bad
   GET /api/getPantryItems
   POST /api/createPantryItem
   ```

2. **Consistent response format**
   ```typescript
   interface APIResponse<T> {
     success: boolean;
     data?: T;
     error?: string;
     message?: string;
   }
   ```

3. **Error handling**
   ```typescript
   // Good
   export async function POST(request: NextRequest) {
     try {
       const body = await request.json();
       const result = await service.createItem(body);
       return NextResponse.json({ success: true, data: result });
     } catch (error) {
       console.error('API Error:', error);
       return NextResponse.json(
         { success: false, error: 'Failed to create item' },
         { status: 500 }
       );
     }
   }
   ```

## Testing Guidelines

### Unit Testing

1. **Test component behavior, not implementation**
   ```typescript
   // Good
   test('shows error message when form submission fails', async () => {
     const mockSubmit = jest.fn().mockRejectedValue(new Error('API Error'));
     render(<PantryItemForm onSubmit={mockSubmit} />);
     
     fireEvent.click(screen.getByText('Save'));
     
     await waitFor(() => {
       expect(screen.getByText('Failed to save item')).toBeInTheDocument();
     });
   });

   // Bad
   test('calls handleSubmit when form is submitted', () => {
     const handleSubmit = jest.fn();
     render(<PantryItemForm onSubmit={handleSubmit} />);
     
     fireEvent.click(screen.getByText('Save'));
     
     expect(handleSubmit).toHaveBeenCalled();
   });
   ```

2. **Use proper test data**
   ```typescript
   // Good
   const mockPantryItem: PantryItem = {
     id: '1',
     ingredient_name: 'Tomatoes',
     quantity: 5,
     unit: 'pieces',
     expiration_date: new Date('2024-01-15'),
     location: 'refrigerator'
   };

   // Bad
   const mockItem = {
     id: '1',
     name: 'Tomatoes'
   };
   ```

3. **Mock external dependencies**
   ```typescript
   // Mock API calls
   jest.mock('../services/api', () => ({
     pantry: {
       getItems: jest.fn(),
       addItem: jest.fn(),
     },
   }));
   ```

### Integration Testing

1. **Test feature workflows**
   ```typescript
   test('user can add item to pantry', async () => {
     render(<PantryDashboard />);
     
     fireEvent.click(screen.getByText('Add Item'));
     fireEvent.change(screen.getByLabelText('Ingredient'), { target: { value: 'Tomatoes' } });
     fireEvent.click(screen.getByText('Save'));
     
     await waitFor(() => {
       expect(screen.getByText('Tomatoes')).toBeInTheDocument();
     });
   });
   ```

### End-to-End Testing

1. **Test complete user journeys**
   ```typescript
   test('user can complete meal planning workflow', async ({ page }) => {
     await page.goto('/planner');
     
     await page.click('[data-testid="add-meal-button"]');
     await page.selectOption('[data-testid="recipe-select"]', 'pasta-recipe');
     await page.click('[data-testid="save-button"]');
     
     await expect(page.locator('[data-testid="meal-plan"]')).toContainText('Pasta');
   });
   ```

### Testing Checklist

- [ ] Unit tests for all components
- [ ] Integration tests for features
- [ ] API route tests
- [ ] E2E tests for critical paths
- [ ] Accessibility tests
- [ ] Performance tests
- [ ] Error handling tests

## Submitting Changes

### Pull Request Process

1. **Create a pull request** from your feature branch to `develop`
2. **Fill out the PR template** completely
3. **Ensure all checks pass**:
   - Tests pass
   - Code coverage meets requirements
   - Linting passes
   - Type checking passes
   - Build succeeds

4. **Request review** from maintainers
5. **Address feedback** and update PR as needed
6. **Squash and merge** once approved

### Pull Request Template

```markdown
## Description
Brief description of the changes made.

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] E2E tests added/updated
- [ ] Manual testing completed

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No breaking changes (or properly documented)
```

### Code Review Guidelines

#### For Contributors

1. **Self-review** your code before submitting
2. **Write descriptive** commit messages
3. **Keep PRs focused** on a single feature/fix
4. **Add tests** for new functionality
5. **Update documentation** as needed
6. **Be responsive** to feedback

#### For Reviewers

1. **Be constructive** and respectful
2. **Focus on code quality** and maintainability
3. **Check for security** issues
4. **Verify tests** are adequate
5. **Consider performance** implications
6. **Approve when ready** or request changes

### Review Criteria

- **Functionality**: Does the code work as intended?
- **Code Quality**: Is the code clean, readable, and maintainable?
- **Testing**: Are there adequate tests covering the changes?
- **Performance**: Does the code perform well?
- **Security**: Are there any security concerns?
- **Documentation**: Is the code and changes documented?
- **Accessibility**: Does the UI meet accessibility standards?

## Community Guidelines

### Communication

- **Be respectful** and professional
- **Ask questions** when unclear
- **Provide helpful feedback**
- **Share knowledge** with others
- **Be patient** with newcomers

### Getting Help

1. **Check documentation** first
2. **Search existing issues** for similar problems
3. **Ask in discussions** for general questions
4. **Create an issue** for bugs or feature requests
5. **Join our Discord** for real-time help

### Issue Guidelines

#### Bug Reports

```markdown
## Bug Description
A clear description of the bug.

## Steps to Reproduce
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

## Expected Behavior
What you expected to happen.

## Actual Behavior
What actually happened.

## Environment
- OS: [e.g. iOS]
- Browser: [e.g. chrome, safari]
- Version: [e.g. 22]

## Additional Context
Any other context about the problem.
```

#### Feature Requests

```markdown
## Feature Description
A clear description of the feature.

## Problem Statement
What problem does this feature solve?

## Proposed Solution
How should this feature work?

## Alternatives Considered
What other approaches did you consider?

## Additional Context
Any other context about the feature.
```

### Recognition

We recognize contributors through:

- **GitHub contributor graph**
- **Release notes** acknowledgments
- **Hall of Fame** in documentation
- **Special badges** for significant contributions

## Development Best Practices

### Performance

1. **Optimize bundle size**
   - Use dynamic imports for large components
   - Implement code splitting
   - Optimize images and assets

2. **Database queries**
   - Use indexes for common queries
   - Implement pagination
   - Cache frequently accessed data

3. **API optimization**
   - Use efficient data fetching
   - Implement proper caching
   - Minimize API calls

### Security

1. **Input validation**
   - Validate all user inputs
   - Sanitize data before storage
   - Use parameterized queries

2. **Authentication**
   - Implement proper session management
   - Use secure authentication methods
   - Protect sensitive routes

3. **Data protection**
   - Use HTTPS everywhere
   - Implement proper CORS
   - Follow data privacy regulations

### Accessibility

1. **Keyboard navigation**
   - Ensure all interactive elements are keyboard accessible
   - Implement proper focus management
   - Use semantic HTML

2. **Screen readers**
   - Provide proper ARIA labels
   - Use descriptive alt text
   - Implement live regions for dynamic content

3. **Color and contrast**
   - Ensure sufficient color contrast
   - Don't rely solely on color for information
   - Test with color vision deficiency

### Internationalization

1. **Text externalization**
   - Use translation keys for all user-facing text
   - Support RTL languages
   - Handle pluralization properly

2. **Date and number formatting**
   - Use locale-aware formatting
   - Handle different calendar systems
   - Support various number formats

## Resources

### Documentation

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Supabase Documentation](https://supabase.com/docs)

### Tools

- [VS Code](https://code.visualstudio.com/) - Recommended editor
- [React Developer Tools](https://react.dev/learn/react-developer-tools)
- [Supabase Studio](https://supabase.com/dashboard)
- [Vercel Dashboard](https://vercel.com/dashboard)

### Community

- [GitHub Discussions](https://github.com/kecarajocomer/kecarajocomer/discussions)
- [Discord Server](https://discord.gg/kecarajocomer)
- [Twitter](https://twitter.com/kecarajocomer)

### Learning Resources

- [Next.js Learn](https://nextjs.org/learn)
- [React Tutorial](https://react.dev/learn)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [Modern Web Development](https://web.dev/)

## Thank You

Thank you for contributing to KeCaraJoComer! Your efforts help make meal planning easier and more enjoyable for everyone. Every contribution, no matter how small, makes a difference.

Happy coding! 🚀👨‍🍳👩‍🍳