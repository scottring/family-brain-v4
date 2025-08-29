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

## Product Development Roadmap

### Phase 1: Core App Polish (Current - Month 2)
**Goal**: Nail the basics and create a delightful user experience

#### Priorities:
1. **Planning View Refinement**
   - Improve item legibility in time slots
   - Polish drag-and-drop interactions
   - Enhance template management UI
   - Mobile-responsive planning interface

2. **Execution View Excellence**
   - Smooth transitions and animations
   - Intuitive gesture controls
   - Focus mode for current tasks
   - Clear progress indicators

3. **Template System**
   - Rich template editor
   - Step-by-step procedures
   - Template categories and search
   - Quick template creation from existing schedules

4. **Family Collaboration**
   - Real-time sync refinement
   - Visual indicators for family member activities
   - Shared template library
   - Permission management

#### Success Metrics:
- App loads in < 3s on 3G
- Zero critical bugs
- Intuitive enough for non-technical users
- Works flawlessly offline

### Phase 2: Google Calendar Integration via n8n (Month 3-4)
**Goal**: Seamless integration with existing calendar workflows

#### Architecture:
```
Your App ←→ n8n Workflows ←→ Google Calendar API
              ↓
        Webhook Events
```

#### n8n Workflows to Build:
1. **Sync Time Blocks to Calendar**
   - Trigger: Schedule created/updated in app
   - Action: Create/update Google Calendar events
   - Include template names in event titles
   - Add checklist items to descriptions

2. **Import from Google Calendar**
   - Trigger: User-initiated or scheduled
   - Action: Import events as time blocks
   - Smart template matching based on event titles

3. **Bi-directional Sync**
   - Real-time updates via webhooks
   - Conflict resolution (last-write-wins with UI)
   - Sync status indicators

4. **Recurring Events Handler**
   - Map Google recurring events to template schedules
   - Handle exceptions and modifications

#### Implementation:
- Self-hosted n8n on Railway/Render
- OAuth 2.0 for Google Calendar
- Webhook endpoints in Next.js app
- Queue system for sync operations

### Phase 3: User Testing & Data Collection (Month 4-6)
**Goal**: Learn from real usage and refine based on feedback

#### Focus Areas:
1. **Onboard Beta Families**
   - 10-20 active families
   - Diverse use cases (kids, no kids, different schedules)
   - Weekly feedback sessions

2. **Analytics Implementation**
   - Track feature usage
   - Monitor completion rates
   - Identify friction points
   - Collect search queries (for future RAG)

3. **Feature Refinement**
   - Quick fixes based on feedback
   - UI/UX improvements
   - Performance optimizations
   - Bug fixes

4. **Content Building**
   - Expand template library
   - Document common patterns
   - Build knowledge base

#### Data to Collect for Future RAG:
- Most used templates
- Common modifications to templates
- Search queries that return no results
- Time patterns and correlations
- Completion success factors

### Phase 4: Intelligence Layer with RAG (Month 6+)
**Goal**: Add smart features once we have data and proven patterns

#### RAG Architecture:
```
Content Sources:
├── Templates & SOPs
├── Completed Schedules  
├── User Patterns
└── Family Preferences
         ↓
Vector Database (Supabase pgvector)
         ↓
Embedding Pipeline (OpenAI ada-002)
         ↓
Semantic Search & Retrieval
         ↓
LLM Integration (GPT-3.5/4)
         ↓
Smart Features
```

#### Smart Features to Add:
1. **Intelligent Search**
   - "Show me morning routines with kids"
   - "What did we do last Tuesday evening?"
   - "Find templates for meal prep"

2. **Contextual Suggestions**
   - Template recommendations based on time/day
   - Smart scheduling based on patterns
   - Conflict detection and resolution

3. **Adaptive Learning**
   - Learn from completion patterns
   - Suggest optimizations
   - Personalized templates

4. **Natural Language Input**
   - "Add grocery shopping at 2pm Saturday"
   - "Schedule bedtime routine every night at 8"
   - "Copy last week but skip the dentist appointment"

#### Implementation Strategy:
- Start with Supabase pgvector (free with existing setup)
- Use OpenAI embeddings API (cost-effective)
- Implement gradually with feature flags
- A/B test smart features vs. basic

## Integration Architecture

### n8n Workflow Platform
**Purpose**: Handle all external integrations without cluttering core app

#### Setup Architecture:
```
┌─────────────────────────────────────────┐
│           Next.js App                   │
│         (Core Business Logic)           │
└────────────┬────────────────────────────┘
             │ Webhooks
             ↓
┌─────────────────────────────────────────┐
│            n8n Instance                 │
│     (Self-hosted or n8n.cloud)         │
├─────────────────────────────────────────┤
│  Workflows:                             │
│  • Calendar Sync                        │
│  • Email Notifications                  │
│  • Data Exports                         │
│  • Third-party Integrations             │
└────────┬────────────────────────────────┘
         │
         ↓
┌─────────────────────────────────────────┐
│       External Services                 │
│  • Google Calendar API                  │
│  • SendGrid/Resend                      │
│  • Slack/Discord                        │
│  • Future: Apple Calendar, Outlook      │
└─────────────────────────────────────────┘
```

#### Key Workflows:

1. **Schedule to Calendar Sync**
```javascript
// Webhook from your app
POST /webhooks/schedule-created
{
  scheduleId: "uuid",
  familyId: "uuid",
  date: "2024-03-15",
  timeBlocks: [...]
}

// n8n processes and creates Google Calendar events
// Returns calendar event IDs for linking
```

2. **Calendar Change Detection**
```javascript
// Google Calendar webhook → n8n → Your app
// Handles moves, deletes, updates
// Maintains sync state in your database
```

3. **Template Sharing Workflow**
```javascript
// Export template → Generate share link
// Import shared template → Validate & save
// Community template moderation
```

### Google Calendar Integration Details

#### Data Mapping:
```typescript
// Your App Schema → Google Calendar Event
{
  timeBlock: {
    id: "uuid",
    start_time: "09:00",
    end_time: "10:30",
    schedule_items: [...]
  }
}
→
{
  summary: "Morning Routine (3 tasks)",
  start: { dateTime: "2024-03-15T09:00:00" },
  end: { dateTime: "2024-03-15T10:30:00" },
  description: "✓ Task 1\n✓ Task 2\n✓ Task 3",
  extendedProperties: {
    private: {
      appId: "uuid",
      templateId: "uuid"
    }
  }
}
```

#### Sync Strategy:
- **Push**: Real-time updates via webhooks
- **Pull**: Hourly sync for changes made in Google Calendar
- **Conflict Resolution**: Show both versions, user chooses
- **Offline Queue**: Store changes, sync when online

### Future Integration Possibilities:
1. **Apple Calendar** via CalDAV
2. **Microsoft Outlook** via Graph API
3. **Todoist/Notion** for task management
4. **IFTTT/Zapier** for automation
5. **Home Assistant** for smart home triggers

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