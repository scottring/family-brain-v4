# Family Brain V4 - Dual-Mode Productivity System

A modern productivity system that seamlessly blends individual productivity with family collaboration through daily itineraries and line-item template execution.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ (we're using 23.4.0)
- npm 10+
- Git
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/scottring/family-brain-v4.git
   cd family-brain-v4
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Update `.env.local` with your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🏗️ Architecture Overview

Family Brain V4 is built on a modern, scalable architecture:

### Technology Stack
- **Frontend**: Next.js 14 with App Router + TypeScript + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Real-time subscriptions)
- **State Management**: React Query + Context API
- **UI Components**: Custom glass morphism design system
- **Deployment**: Vercel + Supabase production

### Core Concepts

**Dual-Mode System (50/50 Split)**
- **Individual Productivity**: Personal goals, projects, tasks, and templates
- **Family Collaboration**: Shared goals, real-time coordination, and family planning sessions

**Planning Hierarchy**
```
Goals → Projects → Tasks → Line-Item Templates
```

**Primary Execution Interface**
- **Daily Itineraries**: Primary interface where users spend their time
- **Template Execution**: Secondary modal interface for detailed checkbox completion

## 🗂️ Project Structure

```
├── docs/                          # Project documentation
│   ├── PRD.md                     # Product Requirements Document
│   ├── PLAN.md                    # Technical Implementation Plan
│   └── TASKS.md                   # Development Task Breakdown
├── public/                        # Static assets
├── src/
│   ├── app/                       # Next.js App Router pages
│   ├── components/                # React components
│   ├── contexts/                  # React context providers
│   ├── hooks/                     # Custom React hooks
│   ├── lib/
│   │   ├── services/              # Service layer (business logic)
│   │   │   ├── base/              # Base service classes
│   │   │   ├── AuthService.ts     # Authentication service
│   │   │   ├── UserService.ts     # User profile management
│   │   │   ├── FamilyService.ts   # Family management
│   │   │   ├── TaskService.ts     # Goals/Projects/Tasks
│   │   │   ├── TemplateService.ts # Template management
│   │   │   ├── ItineraryService.ts# Daily itinerary management
│   │   │   └── ServiceContainer.ts# Dependency injection
│   │   ├── supabase/              # Supabase client configuration
│   │   ├── types/                 # TypeScript type definitions
│   │   └── utils.ts               # Utility functions
│   └── styles/                    # Global styles
├── supabase/
│   └── migrations/                # Database migrations
└── package.json
```

## 🎨 Design System

Family Brain V4 uses a glass morphism design system with context-aware theming:

### Context Colors
- **Work**: Deep blue (#1e40af) - Professional and focused
- **Personal**: Forest green (#059669) - Growth and wellness  
- **Family**: Warm orange (#ea580c) - Connection and warmth

### Glass Morphism
- Semi-transparent cards with backdrop blur
- Subtle shadows and border highlights
- Context-appropriate accent colors
- Smooth transitions and micro-interactions

## 🗄️ Database Schema

The database follows a hierarchical structure designed for multi-tenant family collaboration:

### Core Tables
- `user_profiles` - Extended user information
- `families` - Family groups
- `family_members` - Family membership and roles
- `goals` - Top-level objectives
- `projects` - Goal subdivisions
- `tasks` - Actionable items
- `templates` - Line-item checklists
- `template_line_items` - Individual checklist items
- `daily_itineraries` - Primary execution interface
- `template_executions` - Execution tracking

### Security
- **Row Level Security (RLS)** enabled on all tables
- Multi-tenant data isolation
- Family data sharing with proper permissions
- Real-time subscriptions respect security policies

## 🔧 Development Guidelines

### Service Layer Pattern

All business logic is encapsulated in services using dependency injection:

```typescript
// Get service container
const services = getServiceContainer()

// Use services
const result = await services.taskService.createGoal({
  title: 'My Goal',
  context: 'personal'
})

if (result.success) {
  console.log('Goal created:', result.data)
} else {
  console.error('Error:', result.error)
}
```

### Error Handling
- All service methods return `ServiceResult<T>` types
- Consistent error codes and messages
- Graceful error handling throughout the application

### Type Safety
- Full TypeScript strict mode
- Generated types from Supabase schema
- Comprehensive interface definitions

### Code Quality Standards
- **TypeScript**: Strict mode, zero errors, comprehensive type coverage
- **Testing**: >90% coverage with unit, integration, and E2E tests
- **Linting**: ESLint + Prettier with strict rules, zero warnings
- **Performance**: Web Vitals meeting "Good" thresholds on all devices

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test:watch

# Run tests with coverage
npm test:coverage

# Run E2E tests
npm test:e2e
```

## 📦 Building and Deployment

### Development Build
```bash
npm run build
```

### Production Deployment
The application is configured for deployment on Vercel with Supabase:

```bash
# Deploy to Vercel
vercel deploy --prod
```

### Environment Variables for Production
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## 🤝 Contributing

### Development Workflow
1. Create a feature branch from `main`
2. Implement your changes following the established patterns
3. Write/update tests for your changes
4. Run the full test suite
5. Submit a pull request

### Service Development
When adding new services:
1. Extend `BaseService` class
2. Add to `ServiceContainer`
3. Follow the established error handling patterns
4. Include comprehensive TypeScript types

### Database Changes
1. Create migration files in `supabase/migrations/`
2. Test migrations locally
3. Update TypeScript types with `npm run generate-types`
4. Update service layer accordingly

## 📚 Additional Documentation

- [Product Requirements Document](docs/PRD.md) - Comprehensive feature specifications
- [Technical Implementation Plan](docs/PLAN.md) - Detailed architecture and development phases
- [Task Breakdown](docs/TASKS.md) - Development task organization

## 🚨 Troubleshooting

### Common Issues

**Supabase Connection Issues**
- Verify environment variables are correctly set
- Check Supabase project status
- Ensure RLS policies are properly configured

**TypeScript Errors**
- Run `npm run type-check` to identify issues
- Regenerate types with `npm run generate-types`
- Check service layer implementations

**Build Errors**
- Clear Next.js cache: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules package-lock.json && npm install`

### Getting Help
- Check the [GitHub Issues](https://github.com/scottring/family-brain-v4/issues)
- Review the comprehensive documentation in the `docs/` folder

---

**Project Vision**: Create a bulletproof dual-mode productivity system where individuals thrive in personal productivity while families coordinate seamlessly through shared goals, projects, and template execution - making both individual work and family collaboration more effective and enjoyable.
