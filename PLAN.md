# Itineraries App - Technical Architecture Plan

## System Overview

Itineraries is a Next.js 14+ application using Supabase for backend services, focusing on real-time synchronization and mobile-first performance. The architecture prioritizes simplicity, speed, and reliability for daily execution tasks.

## Technology Stack

### Frontend
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**: Zustand (simple, performant)
- **Forms**: React Hook Form + Zod validation
- **Drag & Drop**: @dnd-kit (accessible, performant)
- **Date/Time**: date-fns (lightweight)
- **PWA**: next-pwa for offline capability

### Backend
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Supabase Auth
- **Real-time**: Supabase Realtime
- **Storage**: Supabase Storage (future: images/attachments)
- **Edge Functions**: Supabase Edge Functions (future: AI features)

### Development Tools
- **Package Manager**: npm
- **Linting**: ESLint with strict rules
- **Formatting**: Prettier
- **Testing**: Vitest (unit), Playwright (E2E)
- **Type Generation**: Supabase CLI for database types

## Architecture Patterns

### 1. Layered Architecture

```
┌─────────────────────────────────────┐
│         Presentation Layer          │ ← React Components
├─────────────────────────────────────┤
│          Application Layer          │ ← Custom Hooks, Stores
├─────────────────────────────────────┤
│           Domain Layer              │ ← Business Logic, Types
├─────────────────────────────────────┤
│       Infrastructure Layer          │ ← Supabase, External APIs
└─────────────────────────────────────┘
```

### 2. Component Structure

```
/components
  /features
    /planning
      WeekView.tsx           ← Smart component
      TemplateSidebar.tsx    ← Smart component
      DraggableTemplate.tsx  ← Presentation component
    /execution
      TodayView.tsx          ← Smart component
      TimeBlock.tsx          ← Presentation component
      ChecklistItem.tsx      ← Presentation component
  /ui
    Button.tsx               ← Reusable UI component
    Card.tsx                 ← Reusable UI component
```

### 3. Data Flow Architecture

```
User Action → Component → Custom Hook → Zustand Store → Supabase
     ↑                                         ↓
     └──────── Real-time Updates ←─────────────┘
```

## Database Schema

### Core Tables Design

```sql
-- Users & Families
users (
  id: uuid PK,
  email: text UNIQUE,
  full_name: text,
  avatar_url: text,
  preferences: jsonb
)

families (
  id: uuid PK,
  name: text,
  settings: jsonb
)

family_members (
  id: uuid PK,
  family_id: uuid FK,
  user_id: uuid FK,
  role: enum('owner', 'member'),
  UNIQUE(family_id, user_id)
)

-- Schedules
schedules (
  id: uuid PK,
  family_id: uuid FK,
  date: date,
  title: text,
  day_theme: text,
  INDEX(family_id, date)
)

time_blocks (
  id: uuid PK,
  schedule_id: uuid FK,
  start_time: time,
  end_time: time,
  INDEX(schedule_id, start_time)
)

schedule_items (
  id: uuid PK,
  time_block_id: uuid FK,
  title: text,
  description: text,
  item_type: enum('simple', 'procedure', 'template_ref'),
  template_id: uuid FK NULL,
  completed_at: timestamp NULL,
  completed_by: uuid FK NULL,
  order_position: int,
  metadata: jsonb
)

-- Templates
templates (
  id: uuid PK,
  family_id: uuid FK NULL,  -- NULL for system templates
  title: text,
  description: text,
  category: text,
  is_system: boolean DEFAULT false,
  icon: text,
  color: text,
  created_by: uuid FK,
  updated_by: uuid FK,
  version: int DEFAULT 1,
  INDEX(family_id),
  INDEX(is_system)
)

template_steps (
  id: uuid PK,
  template_id: uuid FK,
  title: text,
  description: text,
  order_position: int,
  step_type: enum('task', 'note', 'decision', 'resource', 'reference'),
  metadata: jsonb,  -- Contains URLs, phone numbers, documents, etc.
  INDEX(template_id, order_position)
)

-- Template Instances (when template is used)
template_instances (
  id: uuid PK,
  template_id: uuid FK,
  schedule_item_id: uuid FK,
  customizations: jsonb
)

template_instance_steps (
  id: uuid PK,
  template_instance_id: uuid FK,
  template_step_id: uuid FK,
  completed_at: timestamp NULL,
  completed_by: uuid FK NULL,
  notes: text
)
```

### Row Level Security (RLS) Policies

```sql
-- Users can only see their own profile
CREATE POLICY users_select ON users
  FOR SELECT USING (auth.uid() = id);

-- Users can see families they belong to
CREATE POLICY families_select ON families
  FOR SELECT USING (
    id IN (
      SELECT family_id FROM family_members
      WHERE user_id = auth.uid()
    )
  );

-- Users can see/edit schedules for their family
CREATE POLICY schedules_all ON schedules
  FOR ALL USING (
    family_id IN (
      SELECT family_id FROM family_members
      WHERE user_id = auth.uid()
    )
  );

-- System templates visible to all, family templates to members
CREATE POLICY templates_select ON templates
  FOR SELECT USING (
    is_system = true OR
    family_id IN (
      SELECT family_id FROM family_members
      WHERE user_id = auth.uid()
    )
  );
```

## State Management

### Zustand Stores Structure

```typescript
// stores/scheduleStore.ts
interface ScheduleStore {
  // State
  currentWeek: Date
  schedules: Map<string, Schedule>  // keyed by date string
  selectedDate: Date
  
  // Actions
  loadWeek: (startDate: Date) => Promise<void>
  updateScheduleItem: (itemId: string, updates: Partial<ScheduleItem>) => void
  completeItem: (itemId: string) => Promise<void>
  
  // Real-time
  subscribeToUpdates: (familyId: string) => void
  unsubscribeFromUpdates: () => void
}

// stores/templateStore.ts
interface TemplateStore {
  // State
  templates: Template[]
  categories: string[]
  selectedTemplate: Template | null
  
  // Actions
  loadTemplates: () => Promise<void>
  createTemplate: (template: Template) => Promise<void>
  updateTemplate: (id: string, updates: Partial<Template>) => Promise<void>
}

// stores/executionStore.ts
interface ExecutionStore {
  // State
  currentTimeBlock: TimeBlock | null
  upcomingBlocks: TimeBlock[]
  focusMode: boolean
  
  // Actions
  loadToday: () => Promise<void>
  checkOffStep: (stepId: string) => Promise<void>
  skipTimeBlock: (blockId: string) => void
  toggleFocusMode: () => void
  
  // Computed
  get progress(): number
  get nextTask(): ScheduleItem | null
}
```

## API Layer

### Custom Hooks Pattern

```typescript
// hooks/useSchedule.ts
export function useSchedule(date: Date) {
  const { schedules, loadWeek } = useScheduleStore()
  
  useEffect(() => {
    loadWeek(startOfWeek(date))
  }, [date])
  
  const schedule = schedules.get(format(date, 'yyyy-MM-dd'))
  
  return {
    schedule,
    isLoading: !schedule,
    refetch: () => loadWeek(startOfWeek(date))
  }
}

// hooks/useRealtime.ts
export function useRealtime(familyId: string) {
  const { subscribeToUpdates, unsubscribeFromUpdates } = useScheduleStore()
  
  useEffect(() => {
    subscribeToUpdates(familyId)
    return () => unsubscribeFromUpdates()
  }, [familyId])
}

// hooks/useOptimisticUpdate.ts
export function useOptimisticUpdate<T>(
  mutationFn: (data: T) => Promise<void>,
  optimisticFn: (data: T) => void,
  rollbackFn: (data: T) => void
) {
  return async (data: T) => {
    optimisticFn(data)
    try {
      await mutationFn(data)
    } catch (error) {
      rollbackFn(data)
      throw error
    }
  }
}
```

### Service Layer

```typescript
// services/scheduleService.ts
export class ScheduleService {
  constructor(private supabase: SupabaseClient) {}
  
  async getWeekSchedules(familyId: string, startDate: Date) {
    const endDate = addDays(startDate, 6)
    
    const { data, error } = await this.supabase
      .from('schedules')
      .select(`
        *,
        time_blocks (
          *,
          schedule_items (
            *,
            template_instance:template_instances (
              *,
              template_instance_steps (*)
            )
          )
        )
      `)
      .eq('family_id', familyId)
      .gte('date', format(startDate, 'yyyy-MM-dd'))
      .lte('date', format(endDate, 'yyyy-MM-dd'))
    
    if (error) throw error
    return data
  }
  
  async completeItem(itemId: string, userId: string) {
    const { error } = await this.supabase
      .from('schedule_items')
      .update({
        completed_at: new Date().toISOString(),
        completed_by: userId
      })
      .eq('id', itemId)
    
    if (error) throw error
  }
}
```

## Real-time Synchronization

### Supabase Realtime Setup

```typescript
// lib/realtime.ts
export function setupRealtimeSubscription(
  supabase: SupabaseClient,
  familyId: string,
  handlers: {
    onScheduleUpdate: (payload: any) => void
    onItemComplete: (payload: any) => void
  }
) {
  const channel = supabase
    .channel(`family:${familyId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'schedule_items'
      },
      handlers.onItemComplete
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'schedules'
      },
      handlers.onScheduleUpdate
    )
    .subscribe()
  
  return () => {
    supabase.removeChannel(channel)
  }
}
```

### Optimistic Updates

```typescript
// Immediate UI update → Server sync → Rollback on error
const completeTask = useOptimisticUpdate(
  async (taskId: string) => {
    await scheduleService.completeItem(taskId, userId)
  },
  (taskId: string) => {
    // Update UI immediately
    updateScheduleItem(taskId, { completed_at: new Date() })
  },
  (taskId: string) => {
    // Rollback on error
    updateScheduleItem(taskId, { completed_at: null })
  }
)
```

## Performance Optimization

### Mobile Performance
1. **Virtual Scrolling** for long lists
2. **Lazy Loading** for templates and history
3. **Image Optimization** with next/image
4. **Code Splitting** per route
5. **Prefetching** next day's schedule

### Caching Strategy
```typescript
// SWR-style caching
const cacheStrategy = {
  staleTime: 5 * 60 * 1000,      // 5 minutes
  cacheTime: 10 * 60 * 1000,     // 10 minutes
  refetchOnFocus: true,
  refetchOnReconnect: true,
  refetchInterval: 60 * 1000      // 1 minute
}
```

### PWA Configuration
```javascript
// next.config.js
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'supabase-cache',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 5 // 5 minutes
        }
      }
    }
  ]
})
```

## Security Considerations

### Authentication Flow
1. Email/password or magic link login
2. Secure session management via Supabase Auth
3. JWT tokens with short expiration
4. Refresh token rotation

### Data Protection
1. RLS policies enforce data isolation
2. HTTPS everywhere
3. Sensitive data encryption at rest
4. No client-side storage of sensitive data

### Input Validation
```typescript
// Zod schemas for validation
const scheduleItemSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  item_type: z.enum(['simple', 'procedure', 'template_ref']),
  template_id: z.string().uuid().optional()
})

// Validate before database operations
const createItem = async (data: unknown) => {
  const validated = scheduleItemSchema.parse(data)
  return await scheduleService.createItem(validated)
}
```

## Testing Strategy

### Unit Tests (Vitest)
- Business logic functions
- Custom hooks
- Utility functions
- Store actions

### Integration Tests
- API endpoints
- Database operations
- Real-time sync

### E2E Tests (Playwright)
- Critical user flows:
  - Login/signup
  - Create schedule
  - Complete tasks
  - Weekly planning
  - Template usage

### Performance Tests
- Lighthouse CI for performance budgets
- Bundle size monitoring
- Database query performance

## Deployment Architecture

### Infrastructure
```
┌────────────┐     ┌────────────┐     ┌────────────┐
│            │────▶│            │────▶│            │
│   Vercel   │     │  Supabase  │     │ PostgreSQL │
│  (Next.js) │     │   (APIs)   │     │    (DB)    │
│            │◀────│            │◀────│            │
└────────────┘     └────────────┘     └────────────┘
       │                  │
       └──── CDN ────────┘
```

### Environment Management
- Development: Local Supabase instance
- Staging: Separate Supabase project
- Production: Production Supabase project

### CI/CD Pipeline
1. GitHub Actions for CI
2. Automated tests on PR
3. Vercel preview deployments
4. Production deployment on merge to main

## Monitoring & Observability

### Application Monitoring
- Vercel Analytics for performance
- Sentry for error tracking
- LogRocket for session replay (optional)

### Database Monitoring
- Supabase Dashboard for metrics
- Slow query logging
- Connection pool monitoring

### Business Metrics
- Daily active users
- Task completion rates
- Template usage
- User retention

## Migration Path

### From Current App
1. Export valuable template data
2. Clean database schema
3. Implement new schema with migrations
4. No data migration (clean start)

### Future Migrations
- Use Supabase migrations for schema changes
- Version API endpoints if needed
- Feature flags for gradual rollouts

## Scalability Considerations

### Horizontal Scaling
- Vercel auto-scales Next.js
- Supabase handles database scaling
- CDN for static assets

### Performance Budgets
- Initial load: < 3s on 3G
- Time to Interactive: < 5s
- Lighthouse score: > 90

### Database Optimization
- Proper indexing strategy
- Query optimization
- Connection pooling
- Read replicas (future)

## Development Workflow

### Git Branching
```
main
  ├── develop
  │     ├── feature/planning-ui
  │     ├── feature/execution-mode
  │     └── feature/realtime-sync
  └── hotfix/critical-bug
```

### Code Review Process
1. Feature branch from develop
2. PR with description and testing steps
3. Automated tests must pass
4. Code review required
5. Merge to develop
6. Deploy to staging
7. Test in staging
8. Merge to main
9. Auto-deploy to production

### Development Standards
- TypeScript strict mode
- ESLint + Prettier enforcement
- Conventional commits
- Component documentation
- 90% test coverage target

## Technical Decisions

### Why Next.js App Router?
- Server Components for performance
- Built-in optimization
- Excellent DX
- Easy deployment with Vercel

### Why Supabase?
- Integrated auth, database, realtime
- Open source
- Great DX
- Cost effective
- Easy local development

### Why Zustand over Redux?
- Simpler API
- Less boilerplate
- Better TypeScript support
- Smaller bundle size

### Why Tailwind CSS?
- Rapid development
- Consistent design system
- Small production bundle
- Great with component libraries

## Risk Mitigation

### Technical Risks
- **Risk**: Real-time sync conflicts
  - **Mitigation**: Last-write-wins + conflict UI
  
- **Risk**: Poor mobile performance
  - **Mitigation**: Performance budgets + monitoring

- **Risk**: Database scaling issues
  - **Mitigation**: Proper indexing + caching

### Business Risks
- **Risk**: Feature creep
  - **Mitigation**: Strict MVP scope
  
- **Risk**: Low adoption
  - **Mitigation**: Focus on core use case

## Conclusion

This architecture prioritizes simplicity, performance, and reliability while providing a foundation for future growth. The focus on mobile execution and real-time sync addresses the core user needs while avoiding the complexity that plagued the previous version.