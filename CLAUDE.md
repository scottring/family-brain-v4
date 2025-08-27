# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

```bash
# Development
npm run dev                 # Start Next.js development server (port 3000)
npm run build              # Build production bundle
npm run start              # Start production server

# Code Quality
npm run lint               # Run ESLint checks

# TypeScript
npx tsc --noEmit          # Type checking (no type-check script defined)
```

## Architecture Overview

### Service Layer Pattern
All business logic is encapsulated in services using dependency injection pattern. Services extend `BaseService` and are managed through `ServiceContainer`.

```typescript
// Always use ServiceContainer for accessing services:
import { getServiceContainer } from '@/lib/services/ServiceContainer'

const services = getServiceContainer()
const result = await services.taskService.createGoal({ ... })

if (result.success) {
  // Handle success
} else {
  // Handle error
}
```

### Service Hierarchy
- `AuthService` - Authentication and session management
- `UserService` - User profile operations
- `FamilyService` - Family group management (depends on UserService)
- `TaskService` - Goals, projects, and tasks (depends on FamilyService)
- `TemplateService` - Template and line-item management (depends on FamilyService)
- `ItineraryService` - Daily itinerary operations (depends on TaskService and TemplateService)

### Error Handling Pattern
All service methods return `ServiceResult<T>` which is a discriminated union:
- `{ success: true, data: T }` for successful operations
- `{ success: false, error: ServiceError }` for failures

The `ServiceError` class provides consistent error handling with error codes.

### Database Access
- Supabase client is created via `@/lib/supabase/server` for server-side operations
- All database tables have Row Level Security (RLS) enabled
- Type definitions are in `@/lib/types/database.ts` (generated from Supabase schema)
- Migrations are in `supabase/migrations/` directory

### Key Architectural Decisions
1. **Dual-Mode System**: The app supports both individual productivity and family collaboration modes
2. **Planning Hierarchy**: Goals → Projects → Tasks → Line-Item Templates
3. **Context-Based Theming**: Work (blue), Personal (green), Family (orange)
4. **Service Container Pattern**: All services are accessed through a central container for dependency injection
5. **TypeScript Strict Mode**: Full type safety throughout the application

### Project Structure
- `/src/app/` - Next.js App Router pages
- `/src/lib/services/` - Business logic services
- `/src/lib/services/base/` - Base service classes
- `/src/lib/supabase/` - Supabase client configuration
- `/src/lib/types/` - TypeScript type definitions
- `/supabase/migrations/` - Database schema migrations

### Environment Variables Required
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

### Testing Approach
No test framework is currently configured. The README mentions tests should be implemented with >90% coverage target.