# Family Brain V4 - Technical Implementation Plan

## Executive Summary

**Project**: Family Brain V4 - Dual-Mode Productivity System  
**Architecture**: Greenfield Next.js 14 + Supabase + TypeScript  
**Timeline**: 16 weeks (4 phases, 4 weeks each)  
**Team Size**: 5-6 developers + PM + Designer  
**Core Technology**: Modern web stack with real-time collaboration  

### Technical Vision
Build a bulletproof productivity system with daily itineraries as the primary execution interface and line-item templates as executable components within the schedule, supporting seamless individual and family coordination through real-time synchronization and context-aware design.

---

## System Architecture

### High-Level Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (Next.js 14)                  │
├─────────────────────────────────────────────────────────────┤
│  App Router │ TypeScript │ Tailwind │ Glass Morphism UI    │
│  Service Layer │ React Query │ Context API │ PWA Support   │
├─────────────────────────────────────────────────────────────┤
│                 Real-time Synchronization                  │
│  WebSockets │ Supabase Realtime │ Optimistic Updates      │
├─────────────────────────────────────────────────────────────┤
│                   Backend (Supabase)                       │
│  PostgreSQL │ Row Level Security │ Auth │ Real-time API    │
│  Edge Functions │ Storage │ Database Triggers              │
├─────────────────────────────────────────────────────────────┤
│                   Infrastructure                           │
│  Vercel Hosting │ CDN │ Analytics │ Monitoring            │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack Decision Matrix

| Component | Technology | Reasoning | Alternatives Considered |
|-----------|------------|-----------|------------------------|
| **Frontend Framework** | Next.js 14 App Router | Modern React with SSR, excellent performance, great DX | Vite + React, Remix |
| **Language** | TypeScript | Type safety critical for complex family data models | JavaScript |
| **Styling** | Tailwind CSS | Rapid development, consistent design system | Styled Components, CSS Modules |
| **Backend** | Supabase | Real-time built-in, RLS for multi-tenancy, great DX | Firebase, Custom Node.js |
| **Database** | PostgreSQL | Relational data, complex queries, RLS support | MongoDB, MySQL |
| **Real-time** | Supabase Realtime | WebSocket abstraction, RLS integration | Socket.io, Pusher |
| **Deployment** | Vercel | Next.js optimization, edge functions, great DX | Netlify, Railway |
| **State Management** | React Query + Context | Server state + client state separation | Redux Toolkit, Zustand |

---

## Database Architecture

### Core Schema Design

**Multi-Tenant Architecture with Row Level Security**:
```sql
-- Users and Family Management
users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  default_context context_type DEFAULT 'personal',
  timezone TEXT DEFAULT 'UTC',
  preferences JSONB DEFAULT '{}',
  family_id UUID REFERENCES families(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

families (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  settings JSONB DEFAULT '{}',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

family_members (
  id UUID PRIMARY KEY,
  family_id UUID REFERENCES families(id),
  user_id UUID REFERENCES users(id),
  role family_role DEFAULT 'member',
  permissions TEXT[] DEFAULT '{}',
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(family_id, user_id)
);
```

**Planning Hierarchy Schema**:
```sql
-- Goals → Projects → Tasks → Templates hierarchy
goals (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  family_id UUID REFERENCES families(id),
  title TEXT NOT NULL,
  description TEXT,
  context context_type NOT NULL,
  status goal_status DEFAULT 'planning',
  priority priority_level DEFAULT 'medium',
  target_date DATE,
  is_shared BOOLEAN DEFAULT FALSE,
  sharing_level sharing_level DEFAULT 'private',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

projects (
  id UUID PRIMARY KEY,
  goal_id UUID REFERENCES goals(id),
  user_id UUID REFERENCES users(id),
  family_id UUID REFERENCES families(id),
  title TEXT NOT NULL,
  description TEXT,
  context context_type NOT NULL,
  status project_status DEFAULT 'planning',
  priority priority_level DEFAULT 'medium',
  due_date DATE,
  is_shared BOOLEAN DEFAULT FALSE,
  sharing_level sharing_level DEFAULT 'private',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

tasks (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  user_id UUID REFERENCES users(id),
  family_id UUID REFERENCES families(id),
  assigned_to UUID REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT,
  context context_type NOT NULL,
  status task_status DEFAULT 'todo',
  priority priority_level DEFAULT 'medium',
  due_date TIMESTAMP,
  estimated_minutes INTEGER,
  is_shared BOOLEAN DEFAULT FALSE,
  sharing_level sharing_level DEFAULT 'private',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Template System Schema**:
```sql
-- Line-Item Template System
templates (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  family_id UUID REFERENCES families(id),
  title TEXT NOT NULL,
  description TEXT,
  context context_type NOT NULL,
  category TEXT,
  tags TEXT[] DEFAULT '{}',
  is_shared BOOLEAN DEFAULT FALSE,
  sharing_level sharing_level DEFAULT 'private',
  usage_count INTEGER DEFAULT 0,
  average_completion_time INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

template_line_items (
  id UUID PRIMARY KEY,
  template_id UUID REFERENCES templates(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL,
  estimated_minutes INTEGER,
  is_required BOOLEAN DEFAULT TRUE,
  depends_on_item_id UUID REFERENCES template_line_items(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Daily Itinerary System (Primary Execution Interface)
daily_itineraries (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  family_id UUID REFERENCES families(id),
  date DATE NOT NULL,
  timezone TEXT DEFAULT 'UTC',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, date)
);

itinerary_template_slots (
  id UUID PRIMARY KEY,
  itinerary_id UUID REFERENCES daily_itineraries(id) ON DELETE CASCADE,
  template_id UUID REFERENCES templates(id),
  task_id UUID REFERENCES tasks(id),
  scheduled_start_time TIME NOT NULL,
  estimated_duration_minutes INTEGER,
  actual_duration_minutes INTEGER,
  status itinerary_status DEFAULT 'scheduled',
  slot_order INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Template Assignment and Execution (Secondary to Daily Itinerary)
template_assignments (
  id UUID PRIMARY KEY,
  itinerary_slot_id UUID REFERENCES itinerary_template_slots(id),
  task_id UUID REFERENCES tasks(id),
  template_id UUID REFERENCES templates(id),
  assigned_by UUID REFERENCES users(id),
  assigned_to UUID REFERENCES users(id),
  assigned_date DATE DEFAULT CURRENT_DATE,
  scheduled_start TIMESTAMP,
  status assignment_status DEFAULT 'assigned',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

template_executions (
  id UUID PRIMARY KEY,
  assignment_id UUID REFERENCES template_assignments(id),
  user_id UUID REFERENCES users(id),
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  total_time_minutes INTEGER,
  completion_percentage FLOAT DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

line_item_completions (
  id UUID PRIMARY KEY,
  execution_id UUID REFERENCES template_executions(id),
  line_item_id UUID REFERENCES template_line_items(id),
  completed_at TIMESTAMP,
  time_minutes INTEGER,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(execution_id, line_item_id)
);
```

### Custom Types and Enums
```sql
-- Custom Types for Type Safety
CREATE TYPE context_type AS ENUM ('personal', 'family', 'work');
CREATE TYPE priority_level AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE goal_status AS ENUM ('planning', 'active', 'completed', 'cancelled', 'paused');
CREATE TYPE project_status AS ENUM ('planning', 'active', 'completed', 'cancelled', 'paused');
CREATE TYPE task_status AS ENUM ('todo', 'in_progress', 'completed', 'cancelled');
CREATE TYPE assignment_status AS ENUM ('assigned', 'in_progress', 'completed', 'skipped');
CREATE TYPE itinerary_status AS ENUM ('scheduled', 'in_progress', 'completed', 'skipped', 'postponed');
CREATE TYPE sharing_level AS ENUM ('private', 'family_read', 'family_edit');
CREATE TYPE family_role AS ENUM ('admin', 'member', 'child');
```

### Row Level Security (RLS) Policies

**Multi-Tenant Security Implementation**:
```sql
-- Users can only see their own data or family-shared data
CREATE POLICY "Users can view own and family data" ON goals
  FOR SELECT USING (
    user_id = auth.uid() OR 
    (is_shared = true AND family_id IN (
      SELECT family_id FROM family_members WHERE user_id = auth.uid()
    ))
  );

-- Users can only edit their own data or family-collaborative data
CREATE POLICY "Users can edit own data or collaborative family data" ON goals
  FOR UPDATE USING (
    user_id = auth.uid() OR 
    (sharing_level = 'family_edit' AND family_id IN (
      SELECT family_id FROM family_members WHERE user_id = auth.uid()
    ))
  );

-- Template execution visibility for family coordination
CREATE POLICY "Family can view shared template executions" ON template_executions
  FOR SELECT USING (
    user_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM template_assignments ta
      JOIN templates t ON ta.template_id = t.id
      WHERE ta.id = assignment_id 
      AND t.is_shared = true 
      AND t.family_id IN (
        SELECT family_id FROM family_members WHERE user_id = auth.uid()
      )
    )
  );
```

### Database Triggers and Functions

**Automatic Progress Tracking**:
```sql
-- Update task progress based on template completion
CREATE OR REPLACE FUNCTION update_task_progress()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate completion percentage for the template execution
  UPDATE template_executions 
  SET completion_percentage = (
    SELECT COUNT(*) FILTER (WHERE completed_at IS NOT NULL)::FLOAT / COUNT(*)
    FROM line_item_completions lic
    JOIN template_line_items tli ON lic.line_item_id = tli.id
    WHERE lic.execution_id = NEW.execution_id
  )
  WHERE id = NEW.execution_id;

  -- Update task status based on template completion
  UPDATE tasks
  SET status = CASE
    WHEN (SELECT completion_percentage FROM template_executions WHERE id = NEW.execution_id) = 1.0 
    THEN 'completed'::task_status
    WHEN (SELECT completion_percentage FROM template_executions WHERE id = NEW.execution_id) > 0 
    THEN 'in_progress'::task_status
    ELSE status
  END,
  updated_at = NOW()
  WHERE id = (
    SELECT task_id FROM template_assignments 
    WHERE id = (SELECT assignment_id FROM template_executions WHERE id = NEW.execution_id)
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_task_progress
  AFTER INSERT OR UPDATE ON line_item_completions
  FOR EACH ROW EXECUTE FUNCTION update_task_progress();
```

**Family Activity Tracking**:
```sql
-- Log family activity for real-time coordination
CREATE OR REPLACE FUNCTION log_family_activity()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO family_activity_log (
    family_id, user_id, activity_type, resource_type, resource_id, details
  ) VALUES (
    NEW.family_id,
    NEW.user_id,
    TG_OP,
    TG_TABLE_NAME,
    NEW.id,
    json_build_object('title', NEW.title, 'context', NEW.context)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## Service Layer Architecture

### Clean Architecture Implementation

**Service Container Pattern**:
```typescript
// Service registry and dependency injection
interface ServiceContainer {
  authService: AuthService;
  userService: UserService;
  familyService: FamilyService;
  goalService: GoalService;
  projectService: ProjectService;
  taskService: TaskService;
  templateService: TemplateService;
  itineraryService: ItineraryService;
  executionService: ExecutionService;
  planningService: PlanningService;
  realtimeService: RealtimeService;
}

class ServiceRegistry {
  private static instance: ServiceContainer;
  
  public static getInstance(): ServiceContainer {
    if (!ServiceRegistry.instance) {
      ServiceRegistry.instance = this.initializeServices();
    }
    return ServiceRegistry.instance;
  }
  
  private static initializeServices(): ServiceContainer {
    const supabaseClient = createSupabaseClient();
    
    return {
      authService: new AuthService(supabaseClient),
      userService: new UserService(supabaseClient),
      familyService: new FamilyService(supabaseClient),
      goalService: new GoalService(supabaseClient),
      projectService: new ProjectService(supabaseClient),
      taskService: new TaskService(supabaseClient),
      templateService: new TemplateService(supabaseClient),
      itineraryService: new ItineraryService(supabaseClient),
      executionService: new ExecutionService(supabaseClient),
      planningService: new PlanningService(supabaseClient),
      realtimeService: new RealtimeService(supabaseClient),
    };
  }
}
```

**Base Service Implementation**:
```typescript
// Base service with common patterns and error handling
export abstract class BaseService {
  protected client: SupabaseClient;
  protected serviceName: string;
  
  constructor(client: SupabaseClient, serviceName: string) {
    this.client = client;
    this.serviceName = serviceName;
  }
  
  // Standardized query execution with error handling
  protected async executeQuery<T>(
    query: () => PostgrestFilterBuilder<any, any, any>,
    operation: string
  ): Promise<ServiceResult<T>> {
    try {
      const { data, error } = await query();
      
      if (error) {
        return this.handleError(error, operation);
      }
      
      return { success: true, data };
    } catch (error) {
      return this.handleError(error, operation);
    }
  }
  
  // Consistent error handling across all services
  private handleError(error: any, operation: string): ServiceResult<never> {
    console.error(`${this.serviceName}::${operation}:`, error);
    
    return {
      success: false,
      error: {
        message: error.message || 'An unexpected error occurred',
        code: error.code || 'UNKNOWN_ERROR',
        details: error.details || {},
        operation: `${this.serviceName}::${operation}`
      }
    };
  }
}

// Service result type for consistent return values
export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: ServiceError;
}

export interface ServiceError {
  message: string;
  code: string;
  details: Record<string, any>;
  operation: string;
}
```

### Core Service Implementations

**Template Service (Most Complex)**:
```typescript
export class TemplateService extends BaseService {
  constructor(client: SupabaseClient) {
    super(client, 'TemplateService');
  }
  
  // Create template with line items in transaction
  async createTemplate(
    template: CreateTemplateRequest
  ): Promise<ServiceResult<TemplateWithLineItems>> {
    return this.executeQuery(async () => {
      // Start transaction
      const { data: templateData, error: templateError } = await this.client
        .from('templates')
        .insert({
          user_id: template.userId,
          family_id: template.familyId,
          title: template.title,
          description: template.description,
          context: template.context,
          category: template.category,
          tags: template.tags,
          is_shared: template.isShared,
          sharing_level: template.sharingLevel,
        })
        .select()
        .single();
        
      if (templateError) throw templateError;
      
      // Insert line items with order
      const lineItemsWithOrder = template.lineItems.map((item, index) => ({
        ...item,
        template_id: templateData.id,
        order_index: index,
      }));
      
      const { data: lineItemsData, error: lineItemsError } = await this.client
        .from('template_line_items')
        .insert(lineItemsWithOrder)
        .select();
        
      if (lineItemsError) throw lineItemsError;
      
      return {
        ...templateData,
        line_items: lineItemsData,
      };
    }, 'createTemplate');
  }
  
  // Get templates with family sharing visibility
  async getTemplatesForUser(
    userId: string,
    context?: ContextType,
    includeFamily: boolean = true
  ): Promise<ServiceResult<TemplateWithLineItems[]>> {
    return this.executeQuery(async () => {
      let query = this.client
        .from('templates')
        .select(`
          *,
          line_items:template_line_items(*)
        `)
        .or(`user_id.eq.${userId}${includeFamily ? ',and(is_shared.eq.true,family_id.in.(select family_id from family_members where user_id.eq.' + userId + '))' : ''}`);
      
      if (context) {
        query = query.eq('context', context);
      }
      
      return query.order('created_at', { ascending: false });
    }, 'getTemplatesForUser');
  }
  
  // Assign template to task with validation
  async assignTemplateToTask(
    assignment: CreateAssignmentRequest
  ): Promise<ServiceResult<TemplateAssignment>> {
    return this.executeQuery(async () => {
      // Validate task ownership/access
      const { data: taskData } = await this.client
        .from('tasks')
        .select('user_id, family_id, assigned_to')
        .eq('id', assignment.taskId)
        .single();
        
      if (!taskData) throw new Error('Task not found');
      
      // Validate template access
      const { data: templateData } = await this.client
        .from('templates')
        .select('user_id, family_id, is_shared')
        .eq('id', assignment.templateId)
        .single();
        
      if (!templateData) throw new Error('Template not found');
      
      // Create assignment
      return this.client
        .from('template_assignments')
        .insert({
          task_id: assignment.taskId,
          template_id: assignment.templateId,
          assigned_by: assignment.assignedBy,
          assigned_to: assignment.assignedTo,
          scheduled_start: assignment.scheduledStart,
        })
        .select()
        .single();
    }, 'assignTemplateToTask');
  }
}
```

**Real-time Service for Family Coordination**:
```typescript
export class RealtimeService extends BaseService {
  private subscriptions: Map<string, RealtimeChannel> = new Map();
  
  // Subscribe to family activity with RLS
  async subscribeFamilyActivity(
    familyId: string,
    callback: (activity: FamilyActivity) => void
  ): Promise<void> {
    const channelName = `family:${familyId}:activity`;
    
    if (this.subscriptions.has(channelName)) {
      return; // Already subscribed
    }
    
    const channel = this.client
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'template_executions',
          filter: `family_id=eq.${familyId}`,
        },
        (payload) => {
          callback({
            type: 'template_execution',
            payload: payload.new,
            timestamp: new Date(),
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'line_item_completions',
        },
        async (payload) => {
          // Get family context for this completion
          const { data } = await this.client
            .from('line_item_completions')
            .select(`
              *,
              execution:template_executions(
                assignment:template_assignments(
                  template:templates(family_id)
                )
              )
            `)
            .eq('id', payload.new.id)
            .single();
            
          if (data?.execution?.assignment?.template?.family_id === familyId) {
            callback({
              type: 'line_item_completion',
              payload: payload.new,
              timestamp: new Date(),
            });
          }
        }
      )
      .subscribe();
      
    this.subscriptions.set(channelName, channel);
  }
  
  // Cleanup subscriptions
  cleanup(): void {
    this.subscriptions.forEach((channel) => {
      this.client.removeChannel(channel);
    });
    this.subscriptions.clear();
  }
}
```

---

## Frontend Architecture

### Next.js 14 App Router Structure
```
app/
├── (auth)/                    # Auth group routing
│   ├── login/
│   ├── register/
│   └── layout.tsx
├── (dashboard)/               # Main app group (desktop-optimized)
│   ├── dashboard/
│   ├── itinerary/             # Primary execution interface
│   ├── goals/                 # Desktop-first planning
│   ├── projects/              # Desktop-first planning  
│   ├── tasks/                 # Desktop-first planning
│   ├── templates/             # Template management
│   ├── planning/              # Rich planning interfaces
│   └── layout.tsx
├── (mobile)/                  # Mobile-optimized execution routes
│   ├── today/                 # Mobile daily itinerary
│   ├── execute/[templateId]/  # Mobile template execution
│   └── layout.tsx
├── api/                       # API routes (minimal)
│   └── webhooks/
├── globals.css
├── layout.tsx                 # Root layout
└── page.tsx                   # Landing page
```

### Component Architecture

**Design System Components**:
```typescript
// Glass morphism base components
export const GlassCard = ({ 
  context = 'personal', 
  children, 
  className,
  ...props 
}: GlassCardProps) => {
  const contextStyles = {
    personal: 'bg-indigo-50/80 border-indigo-200/50',
    family: 'bg-pink-50/80 border-pink-200/50',
    work: 'bg-emerald-50/80 border-emerald-200/50',
  };
  
  return (
    <div
      className={cn(
        'backdrop-blur-lg border rounded-xl p-6 shadow-lg',
        'hover:shadow-xl transition-all duration-200',
        contextStyles[context],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

// Context-aware button component
export const ContextButton = ({ 
  context = 'personal',
  variant = 'primary',
  children,
  ...props
}: ContextButtonProps) => {
  const contextStyles = {
    personal: {
      primary: 'bg-indigo-600 hover:bg-indigo-700 text-white',
      secondary: 'bg-indigo-100 hover:bg-indigo-200 text-indigo-900',
    },
    family: {
      primary: 'bg-pink-600 hover:bg-pink-700 text-white',
      secondary: 'bg-pink-100 hover:bg-pink-200 text-pink-900',
    },
    work: {
      primary: 'bg-emerald-600 hover:bg-emerald-700 text-white',
      secondary: 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900',
    },
  };
  
  return (
    <button
      className={cn(
        'px-4 py-2 rounded-lg font-medium transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        contextStyles[context][variant],
        'hover:scale-105 active:scale-95'
      )}
      {...props}
    >
      {children}
    </button>
  );
};
```

**Daily Itinerary Interface (Primary Execution Component)**:
```typescript
export const DailyItineraryView = ({ date }: { date: string }) => {
  const {
    itinerary,
    templateSlots,
    familyItineraries,
    currentSlot,
    progress,
    executeTemplate,
    completeSlot,
    rescheduleSlot,
    isLoading,
  } = useDailyItinerary(date);
  
  const { familyMembers, showFamilyView } = useFamilyCoordination(itinerary?.family_id);
  
  if (isLoading || !itinerary) {
    return <DailyItinerarySkeleton />;
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Family coordination sidebar */}
      {showFamilyView && (
        <FamilyItineraryPanel
          familyItineraries={familyItineraries}
          familyMembers={familyMembers}
          className="fixed right-4 top-20 w-80 z-40"
        />
      )}
      
      {/* Main itinerary interface */}
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Itinerary header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Today's Schedule</h1>
            <p className="text-slate-600 mb-4">{format(new Date(date), 'EEEE, MMMM do, yyyy')}</p>
            
            {/* Daily progress */}
            <div className="flex items-center gap-6">
              <div className="flex-1 bg-slate-200 rounded-full h-3">
                <div 
                  className="h-3 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-700"
                  style={{ width: `${progress.percentage}%` }}
                />
              </div>
              <span className="text-lg font-medium text-slate-700">
                {progress.completed}/{progress.total} templates completed
              </span>
            </div>
          </div>
          
          {/* Timeline view */}
          <div className="space-y-3">
            {templateSlots.map((slot, index) => (
              <ItineraryTemplateSlot
                key={slot.id}
                slot={slot}
                isActive={currentSlot?.id === slot.id}
                onExecute={() => executeTemplate(slot.template_id, slot.id)}
                onReschedule={(newTime) => rescheduleSlot(slot.id, newTime)}
                context={slot.template.context}
                className="transition-all duration-300 hover:scale-[1.01]"
              />
            ))}
          </div>
          
          {/* Quick actions */}
          <div className="mt-8 flex justify-center gap-4">
            <ContextButton
              context="personal"
              variant="secondary"
              onClick={() => window.open('/planning/weekly', '_blank')}
            >
              Plan Tomorrow
            </ContextButton>
            
            <ContextButton
              context="family"
              onClick={() => setShowFamilyView(!showFamilyView)}
            >
              {showFamilyView ? 'Hide' : 'Show'} Family Schedule
            </ContextButton>
          </div>
        </div>
      </div>
    </div>
  );
};

**Template Execution Modal (Secondary Interface)**:
```typescript
export const TemplateExecutionModal = ({ slotId, templateId, onComplete }: TemplateExecutionProps) => {
  // Template execution happens in modal/overlay context
  // Returns to daily itinerary upon completion
  // Maintains schedule context throughout execution
};
```

### State Management Strategy

**React Query for Server State**:
```typescript
// Template execution hooks with React Query
export const useTemplateExecution = (assignmentId: string) => {
  const services = useServices();
  
  // Get assignment and template data
  const { data: assignment } = useQuery({
    queryKey: ['template-assignment', assignmentId],
    queryFn: () => services.templateService.getAssignment(assignmentId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Get or create execution
  const { data: execution, refetch: refetchExecution } = useQuery({
    queryKey: ['template-execution', assignmentId],
    queryFn: () => services.executionService.getOrCreateExecution(assignmentId),
    enabled: !!assignment,
  });
  
  // Real-time updates for family coordination
  useRealtimeSubscription(
    `template-execution:${execution?.id}`,
    (update) => {
      // Optimistically update execution data
      queryClient.setQueryData(
        ['template-execution', assignmentId],
        (old: TemplateExecution) => ({ ...old, ...update })
      );
    },
    [execution?.id]
  );
  
  // Mutations with optimistic updates
  const completeItemMutation = useMutation({
    mutationFn: (lineItemId: string) => 
      services.executionService.completeLineItem(execution!.id, lineItemId),
    onMutate: async (lineItemId) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['template-execution', assignmentId] });
      
      const previousExecution = queryClient.getQueryData(['template-execution', assignmentId]);
      
      queryClient.setQueryData(['template-execution', assignmentId], (old: TemplateExecution) => ({
        ...old,
        completions: [
          ...old.completions,
          { line_item_id: lineItemId, completed_at: new Date().toISOString() }
        ]
      }));
      
      return { previousExecution };
    },
    onError: (err, lineItemId, context) => {
      // Rollback on error
      queryClient.setQueryData(['template-execution', assignmentId], context?.previousExecution);
    },
    onSettled: () => {
      // Refetch to ensure consistency
      refetchExecution();
    },
  });
  
  return {
    assignment,
    execution,
    completeItem: completeItemMutation.mutate,
    isCompleting: completeItemMutation.isPending,
  };
};
```

**Context API for Global State**:
```typescript
// Family context for real-time coordination
export const FamilyContext = createContext<FamilyContextValue | null>(null);

export const FamilyProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [familyActivity, setFamilyActivity] = useState<FamilyActivity[]>([]);
  
  // Real-time family activity subscription
  useEffect(() => {
    if (!user?.family_id) return;
    
    const services = ServiceRegistry.getInstance();
    
    services.realtimeService.subscribeFamilyActivity(
      user.family_id,
      (activity) => {
        setFamilyActivity(prev => [activity, ...prev.slice(0, 49)]); // Keep latest 50
      }
    );
    
    return () => services.realtimeService.cleanup();
  }, [user?.family_id]);
  
  return (
    <FamilyContext.Provider value={{
      familyMembers,
      familyActivity,
      isConnected: true, // WebSocket connection status
    }}>
      {children}
    </FamilyContext.Provider>
  );
};
```

---

## Development Workflow

### Environment Setup
```bash
# Development environment requirements
Node.js >= 18.0.0
npm >= 9.0.0
PostgreSQL >= 14.0 (for local development)
Git >= 2.40.0

# Project initialization
npx create-next-app@latest family-brain-v4 --typescript --tailwind --app
cd family-brain-v4
npm install @supabase/supabase-js @tanstack/react-query
npm install -D @types/node typescript eslint prettier
```

**Environment Configuration**:
```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
DATABASE_URL=your_local_postgres_url_for_migrations
```

### Code Quality Standards

**TypeScript Configuration**:
```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/hooks/*": ["./src/hooks/*"],
      "@/types/*": ["./src/types/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

**ESLint Configuration**:
```json
// .eslintrc.json
{
  "extends": [
    "next/core-web-vitals",
    "@typescript-eslint/recommended",
    "prettier"
  ],
  "parser": "@typescript-eslint/parser",
  "plugins": ["@typescript-eslint"],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/explicit-function-return-type": "off",
    "prefer-const": "error",
    "no-var": "error"
  }
}
```

**Testing Strategy**:
```bash
# Testing tools
npm install -D jest @testing-library/react @testing-library/jest-dom
npm install -D @testing-library/user-event jest-environment-jsdom
npm install -D playwright @playwright/test # E2E testing
```

### Git Workflow & CI/CD

**Branch Strategy**:
```
main              # Production-ready code
├── develop       # Integration branch
├── feature/*     # Feature development
├── bugfix/*      # Bug fixes
└── release/*     # Release preparation
```

**GitHub Actions Workflow**:
```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run type-check
      - run: npm run lint
      - run: npm run test:ci
      - run: npm run build
      
      - name: E2E Tests
        run: npx playwright test
        
  deploy-staging:
    if: github.ref == 'refs/heads/develop'
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to Vercel (Staging)
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          
  deploy-production:
    if: github.ref == 'refs/heads/main'
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to Vercel (Production)
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

---

## Deployment & Infrastructure

### Production Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                    Vercel Edge Network                      │
├─────────────────────────────────────────────────────────────┤
│  CDN │ Edge Functions │ Server Components │ Static Assets   │
├─────────────────────────────────────────────────────────────┤
│                    Next.js Application                     │
│  App Router │ React Server Components │ Client Components   │
├─────────────────────────────────────────────────────────────┤
│                   Supabase Platform                        │
│  PostgreSQL │ Auth │ Real-time │ Edge Functions │ Storage   │
├─────────────────────────────────────────────────────────────┤
│                   Monitoring & Analytics                   │
│  Vercel Analytics │ Sentry │ PostHog │ Supabase Metrics   │
└─────────────────────────────────────────────────────────────┘
```

### Environment Configuration

**Production Environment Variables**:
```env
# Production .env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_production_service_role_key
NEXT_PUBLIC_APP_URL=https://familybrain.app
NEXT_PUBLIC_POSTHOG_KEY=your_analytics_key
SENTRY_DSN=your_sentry_dsn
```

**Database Migration Strategy**:
```bash
# Supabase CLI for database migrations
npx supabase init
npx supabase db reset --linked
npx supabase db push --linked

# Migration files in supabase/migrations/
# Managed through Supabase Dashboard or CLI
```

### Monitoring & Observability

**Error Tracking (Sentry)**:
```typescript
// src/lib/sentry.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,
  integrations: [
    new Sentry.BrowserTracing({
      tracingOrigins: ["localhost", "familybrain.app"],
    }),
  ],
});

// Error boundary with Sentry reporting
export const ErrorBoundary = ({ children }: { children: ReactNode }) => {
  return (
    <Sentry.ErrorBoundary fallback={ErrorFallback} showDialog>
      {children}
    </Sentry.ErrorBoundary>
  );
};
```

**Performance Monitoring**:
```typescript
// src/lib/analytics.ts
import { Analytics } from '@vercel/analytics/react';
import posthog from 'posthog-js';

// User behavior analytics
export const trackEvent = (eventName: string, properties?: Record<string, any>) => {
  posthog.capture(eventName, properties);
};

// Template execution analytics
export const trackTemplateExecution = (templateId: string, duration: number) => {
  trackEvent('template_completed', {
    template_id: templateId,
    duration_minutes: Math.round(duration / 60),
    context: 'execution',
  });
};
```

---

## Security Implementation

### Authentication & Authorization

**Row Level Security Implementation**:
```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_executions ENABLE ROW LEVEL SECURITY;

-- Comprehensive RLS policies for multi-tenant security
CREATE POLICY "Users can only access their own profile" ON users
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Family members can view shared content" ON goals
  FOR SELECT USING (
    user_id = auth.uid() OR 
    (is_shared = true AND family_id IN (
      SELECT family_id FROM family_members WHERE user_id = auth.uid()
    ))
  );

-- Template execution visibility with privacy controls
CREATE POLICY "Template execution family visibility" ON template_executions
  FOR SELECT USING (
    user_id = auth.uid() OR
    (
      -- Allow family members to see executions of shared templates
      EXISTS (
        SELECT 1 FROM template_assignments ta
        JOIN templates t ON ta.template_id = t.id
        WHERE ta.id = assignment_id
        AND t.is_shared = true
        AND t.family_id IN (
          SELECT family_id FROM family_members WHERE user_id = auth.uid()
        )
      )
    )
  );
```

**API Route Protection**:
```typescript
// src/lib/auth-middleware.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { NextRequest, NextResponse } from 'next/server';

export async function withAuth(
  handler: (req: NextRequest, user: User) => Promise<Response>
) {
  return async (req: NextRequest) => {
    const supabase = createRouteHandlerClient({ cookies });
    
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();
    
    if (error || !session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    return handler(req, session.user);
  };
}

// Usage in API routes
export const POST = withAuth(async (req, user) => {
  // Protected API logic with authenticated user
  return NextResponse.json({ success: true });
});
```

### Data Privacy & GDPR Compliance

**User Data Export**:
```typescript
// src/lib/data-export.ts
export class UserDataExportService {
  static async exportUserData(userId: string): Promise<UserDataExport> {
    const supabase = createServiceClient();
    
    // Export all user data across all tables
    const [
      userData,
      goals,
      projects, 
      tasks,
      templates,
      executions
    ] = await Promise.all([
      supabase.from('users').select('*').eq('id', userId).single(),
      supabase.from('goals').select('*').eq('user_id', userId),
      supabase.from('projects').select('*').eq('user_id', userId),
      supabase.from('tasks').select('*').eq('user_id', userId),
      supabase.from('templates').select('*').eq('user_id', userId),
      supabase.from('template_executions').select('*').eq('user_id', userId),
    ]);
    
    return {
      user: userData.data,
      goals: goals.data || [],
      projects: projects.data || [],
      tasks: tasks.data || [],
      templates: templates.data || [],
      executions: executions.data || [],
      exported_at: new Date().toISOString(),
    };
  }
  
  static async deleteUserData(userId: string): Promise<void> {
    const supabase = createServiceClient();
    
    // Delete user data in correct order (handle foreign keys)
    await supabase.from('line_item_completions').delete().eq('user_id', userId);
    await supabase.from('template_executions').delete().eq('user_id', userId);
    await supabase.from('template_assignments').delete().eq('assigned_to', userId);
    await supabase.from('tasks').delete().eq('user_id', userId);
    await supabase.from('projects').delete().eq('user_id', userId);
    await supabase.from('goals').delete().eq('user_id', userId);
    await supabase.from('templates').delete().eq('user_id', userId);
    await supabase.from('family_members').delete().eq('user_id', userId);
    await supabase.from('users').delete().eq('id', userId);
  }
}
```

---

## Testing Strategy

### Testing Architecture
```
tests/
├── unit/                      # Unit tests for services and utilities
│   ├── services/
│   ├── components/
│   └── hooks/
├── integration/               # Integration tests for API routes
│   └── api/
├── e2e/                       # End-to-end Playwright tests
│   ├── auth.spec.ts
│   ├── template-execution.spec.ts
│   └── family-coordination.spec.ts
└── __mocks__/                 # Test mocks and fixtures
    ├── supabase.ts
    └── fixtures/
```

**Unit Testing (Jest + React Testing Library)**:
```typescript
// tests/unit/services/template-service.test.ts
import { TemplateService } from '@/lib/services/TemplateService';
import { createMockSupabaseClient } from '../__mocks__/supabase';

describe('TemplateService', () => {
  let templateService: TemplateService;
  let mockSupabase: any;
  
  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    templateService = new TemplateService(mockSupabase);
  });
  
  describe('createTemplate', () => {
    it('should create template with line items in transaction', async () => {
      const templateData = {
        title: 'Morning Routine',
        context: 'personal',
        lineItems: [
          { title: 'Wake up', estimated_minutes: 5 },
          { title: 'Drink water', estimated_minutes: 2 },
        ],
      };
      
      mockSupabase.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: 'template-1', ...templateData },
              error: null,
            }),
          }),
        }),
      });
      
      const result = await templateService.createTemplate(templateData);
      
      expect(result.success).toBe(true);
      expect(result.data?.title).toBe('Morning Routine');
      expect(mockSupabase.from).toHaveBeenCalledWith('templates');
    });
  });
});
```

**Component Testing**:
```typescript
// tests/unit/components/TemplateLineItem.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { TemplateLineItem } from '@/components/templates/TemplateLineItem';

describe('TemplateLineItem', () => {
  const mockItem = {
    id: 'item-1',
    title: 'Complete task',
    description: 'A test task',
    estimated_minutes: 10,
  };
  
  it('should render line item with checkbox', () => {
    render(
      <TemplateLineItem
        item={mockItem}
        isCompleted={false}
        onComplete={jest.fn()}
        context="personal"
      />
    );
    
    expect(screen.getByText('Complete task')).toBeInTheDocument();
    expect(screen.getByRole('checkbox')).not.toBeChecked();
  });
  
  it('should call onComplete when checkbox is clicked', () => {
    const onComplete = jest.fn();
    
    render(
      <TemplateLineItem
        item={mockItem}
        isCompleted={false}
        onComplete={onComplete}
        context="personal"
      />
    );
    
    fireEvent.click(screen.getByRole('checkbox'));
    expect(onComplete).toHaveBeenCalledWith('item-1');
  });
});
```

**E2E Testing (Playwright)**:
```typescript
// tests/e2e/template-execution.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Template Execution', () => {
  test.beforeEach(async ({ page }) => {
    // Login with test user
    await page.goto('/login');
    await page.fill('[data-testid="email"]', 'test@example.com');
    await page.fill('[data-testid="password"]', 'password');
    await page.click('[data-testid="login-button"]');
    
    // Wait for dashboard
    await expect(page).toHaveURL('/dashboard');
  });
  
  test('should execute template with real-time family visibility', async ({ page, context }) => {
    // Create second browser context for family member
    const familyPage = await context.newPage();
    
    // Navigate to template execution
    await page.goto('/templates/morning-routine/execute');
    
    // Start execution
    await page.click('[data-testid="start-execution"]');
    
    // Complete first item
    await page.click('[data-testid="line-item-0-checkbox"]');
    
    // Verify progress updated
    await expect(page.locator('[data-testid="progress-bar"]')).toHaveAttribute(
      'aria-valuenow', 
      '20' // 1 of 5 items = 20%
    );
    
    // Family member should see update
    await familyPage.goto('/family/activity');
    await expect(familyPage.locator('[data-testid="activity-feed"]')).toContainText(
      'started Morning Routine'
    );
    
    // Complete remaining items
    for (let i = 1; i < 5; i++) {
      await page.click(`[data-testid="line-item-${i}-checkbox"]`);
    }
    
    // Verify completion
    await expect(page.locator('[data-testid="completion-celebration"]')).toBeVisible();
    
    // Verify task status updated
    await page.goto('/tasks');
    await expect(page.locator('[data-testid="task-status"]')).toHaveText('Completed');
  });
});
```

### Performance Testing

**Lighthouse CI Integration**:
```yaml
# .github/workflows/performance.yml
name: Performance Testing

on:
  pull_request:
    branches: [main, develop]

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      
      - run: npm ci
      - run: npm run build
      - run: npm run start &
      
      - name: Wait for server
        run: sleep 10
      
      - name: Run Lighthouse CI
        run: |
          npm install -g @lhci/cli
          lhci autorun
        env:
          LHCI_GITHUB_APP_TOKEN: ${{ secrets.LHCI_GITHUB_APP_TOKEN }}
```

---

## Risk Mitigation Strategies

### Technical Risk Mitigation

**Risk**: Real-time coordination complexity  
**Mitigation Strategy**:
- Phase 1: Implement with polling (simple, reliable)
- Phase 2: Upgrade to WebSocket with fallback
- Phase 3: Add conflict resolution for simultaneous edits
- Testing: Simulate network conditions and concurrent users

**Risk**: Mobile performance with glass morphism  
**Mitigation Strategy**:
- Performance budgets in CI/CD pipeline
- Conditional glass effects based on device capability
- Progressive enhancement: simple styles → glass effects
- Regular device testing on various hardware

**Risk**: Data consistency in family collaboration  
**Mitigation Strategy**:
- Optimistic updates with rollback on error
- Last-write-wins with conflict detection
- Clear visual indicators for concurrent editing
- Comprehensive integration testing

### Business Risk Mitigation

**Risk**: Low user adoption of template-first approach  
**Mitigation Strategy**:
- Progressive onboarding with familiar task list view
- Template suggestions and examples
- Hybrid interface supporting both paradigms initially
- User testing and feedback incorporation

**Risk**: Family privacy concerns  
**Mitigation Strategy**:
- Granular privacy controls from day one
- Clear visual indicators for sharing status
- Opt-in sharing model with easy revocation
- Privacy-first messaging and education

---

**Document Version**: 1.0  
**Created**: December 2025  
**Next Review**: End of Phase 1  
**Responsible**: Technical Lead + Product Manager