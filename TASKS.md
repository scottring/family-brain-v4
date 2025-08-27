# Itineraries App - Implementation Tasks

## Overview
Complete rebuild of the application as a simple, execution-focused daily itinerary system with smart checklists and spouse synchronization.

## Phase 0: Clean Slate (Day 1)
- [ ] **Document current database schema** for reference
- [ ] **Export any useful template data** before deletion
- [ ] **Clear all database tables** via Supabase dashboard
- [ ] **Delete all frontend code** except:
  - Package.json (update dependencies)
  - Environment files
  - Supabase client configuration
- [ ] **Update project name** to "Itineraries" in package.json
- [ ] **Create new folder structure**:
  ```
  /src
    /app
      /(auth)
      /(app)
        /planning
        /today
    /components
      /planning
      /execution
      /templates
      /common
    /lib
      /db
      /hooks
      /utils
    /styles
  ```

## Phase 1: Database Foundation (Days 2-3)

### Core Tables
- [ ] **Create users table** (extends auth.users)
  - id, email, full_name, avatar_url
  - preferences (JSON)
  - created_at, updated_at

- [ ] **Create families table**
  - id, name
  - settings (JSON)
  - created_at, updated_at

- [ ] **Create family_members table**
  - id, family_id, user_id
  - role (owner, member)
  - joined_at

### Schedule Tables
- [ ] **Create schedules table**
  - id, family_id, date
  - title (e.g., "CrossFit Tuesday")
  - day_theme
  - created_at, updated_at

- [ ] **Create time_blocks table**
  - id, schedule_id
  - start_time (TIME)
  - end_time (TIME)
  - created_at, updated_at

- [ ] **Create schedule_items table**
  - id, time_block_id
  - title, description
  - item_type (simple, procedure, template_ref)
  - template_id (nullable)
  - completed_at, completed_by
  - order_position
  - metadata (JSON)

### Template Tables
- [ ] **Create templates table**
  - id, family_id
  - title, description
  - category (morning, evening, checklist, etc.)
  - is_system (boolean for pre-built)
  - icon, color
  - created_by, updated_by
  - created_at, updated_at

- [ ] **Create template_steps table**
  - id, template_id
  - title, description
  - order_position
  - step_type (task, note, decision)
  - metadata (JSON)

- [ ] **Create template_instances table**
  - id, template_id, schedule_item_id
  - customizations (JSON)
  - created_at

- [ ] **Create template_instance_steps table**
  - id, template_instance_id, template_step_id
  - completed_at, completed_by
  - notes

### Database Setup
- [ ] **Create RLS policies** for all tables
- [ ] **Create database functions**:
  - copy_schedule(from_date, to_date)
  - create_schedule_from_template(date, template_id)
  - get_current_time_block(date, time)
- [ ] **Create indexes** for performance
- [ ] **Seed system templates**:
  - Morning Routine
  - Evening Routine
  - Bedwetting Response
  - Leaving Dog Alone
  - Grocery Shopping

## Phase 2: Authentication & Base UI (Days 4-5)

### Authentication
- [ ] **Setup Supabase Auth** with email/password
- [ ] **Create login page** with magic link option
- [ ] **Create signup page** with family creation
- [ ] **Implement auth middleware**
- [ ] **Create auth context/hooks**
- [ ] **Add family invitation flow**

### Base Layout
- [ ] **Create app shell** with navigation
- [ ] **Implement responsive layout**
- [ ] **Add loading states**
- [ ] **Create error boundaries**
- [ ] **Setup toast notifications**

## Phase 3: Planning Interface - Desktop (Days 6-8)

### Week View
- [ ] **Create week calendar grid**
  - 7 columns for days
  - Time slots (6 AM - 11 PM)
  - 15-minute increments
- [ ] **Add current week navigation**
- [ ] **Show schedule titles/themes**

### Template Sidebar
- [ ] **Create collapsible template sidebar**
- [ ] **Implement template categories**
- [ ] **Add template search/filter**
- [ ] **Create template preview cards**
- [ ] **Add template icons/colors**

### Drag and Drop
- [ ] **Implement drag from sidebar**
- [ ] **Drop onto time slots**
- [ ] **Visual feedback during drag**
- [ ] **Snap to 15-minute grid**
- [ ] **Handle collision detection**

### Planning Actions
- [ ] **Quick add items** (click on slot)
- [ ] **Edit items** (click existing)
- [ ] **Delete items** (right-click or button)
- [ ] **Copy/paste items**
- [ ] **Bulk actions** (select multiple)

### Template Editing
- [ ] **Create template editor modal**
- [ ] **Add/remove/reorder steps**
- [ ] **Edit step details**
- [ ] **Save template changes**
- [ ] **Version history** (stretch)

### Week Management
- [ ] **Copy previous week** button
- [ ] **Clear week** function
- [ ] **Save as typical week** template
- [ ] **Auto-save changes**

## Phase 4: Execution Interface - Mobile (Days 9-11)

### Today View
- [ ] **Create mobile-optimized layout**
- [ ] **Current time indicator**
- [ ] **Auto-scroll to current block**

### Hybrid Timeline
- [ ] **Current task card** (prominent)
- [ ] **Next 2-3 tasks** preview
- [ ] **Collapsible full timeline**
- [ ] **Empty slot auto-collapse**
- [ ] **Visual progress indicator**

### Item Interaction
- [ ] **Tap to expand** procedures
- [ ] **Check off completion**
- [ ] **Swipe gestures**:
  - Swipe right to complete
  - Swipe left for options
- [ ] **Long press for quick edit**

### Expanded Procedures
- [ ] **Create procedure view**
- [ ] **Step-by-step checklist**
- [ ] **Progress indicator**
- [ ] **Notes field per step**
- [ ] **Completion animation**

### Artifact Panels (Stretch)
- [ ] **Slide-in panel** from right
- [ ] **Rich content support**
- [ ] **Floating/docked modes**
- [ ] **Quick dismiss gesture**

## Phase 5: Real-time Sync (Days 12-13)

### Spouse Synchronization
- [ ] **Setup Supabase Realtime**
- [ ] **Subscribe to family changes**
- [ ] **Optimistic updates**
- [ ] **Conflict resolution**
- [ ] **Connection status indicator**

### Visual Indicators
- [ ] **Show spouse's current task**
- [ ] **Live completion updates**
- [ ] **"Partner completed" badge**
- [ ] **Activity feed** (optional)

### Offline Support
- [ ] **Local storage layer**
- [ ] **Queue offline changes**
- [ ] **Sync on reconnection**
- [ ] **Handle conflicts**

## Phase 6: Core Features (Days 14-16)

### Quick Actions
- [ ] **Quick add** floating button
- [ ] **Voice input** (stretch)
- [ ] **Quick reschedule** drag
- [ ] **Batch operations**

### Search and Filter
- [ ] **Search items/templates**
- [ ] **Filter by category**
- [ ] **Filter by completion**
- [ ] **Date range selection**

### Settings
- [ ] **User profile management**
- [ ] **Family settings**
- [ ] **Time zone handling**
- [ ] **Theme selection**
- [ ] **Notification preferences**

## Phase 7: Polish & Testing (Days 17-19)

### UI Polish
- [ ] **Animations**:
  - Check-off satisfaction
  - Smooth transitions
  - Loading skeletons
- [ ] **Micro-interactions**
- [ ] **Empty states**
- [ ] **Error states**
- [ ] **Success feedback**

### Performance
- [ ] **Optimize queries**
- [ ] **Implement caching**
- [ ] **Lazy loading**
- [ ] **Image optimization**
- [ ] **Bundle size reduction**

### Testing
- [ ] **Unit tests for utilities**
- [ ] **Integration tests for API**
- [ ] **E2E tests for critical flows**
- [ ] **Cross-browser testing**
- [ ] **Mobile device testing**

### Documentation
- [ ] **User onboarding flow**
- [ ] **Feature tooltips**
- [ ] **Help documentation**
- [ ] **API documentation**

## Phase 8: Launch Prep (Day 20)

### Production Setup
- [ ] **Environment configuration**
- [ ] **Error monitoring** (Sentry)
- [ ] **Analytics** (Posthog/Mixpanel)
- [ ] **Performance monitoring**
- [ ] **Backup strategy**

### PWA Features
- [ ] **Service worker setup**
- [ ] **App manifest**
- [ ] **Offline page**
- [ ] **Install prompt**
- [ ] **Push notifications** (stretch)

### Final Testing
- [ ] **Full regression test**
- [ ] **Load testing**
- [ ] **Security review**
- [ ] **Accessibility audit**
- [ ] **Partner testing**

## Future Enhancements (Post-MVP)

### Calendar Integration
- [ ] Google Calendar sync
- [ ] Apple Calendar sync
- [ ] Two-way sync
- [ ] Conflict handling

### Advanced Templates
- [ ] Template marketplace
- [ ] Community templates
- [ ] AI-suggested templates
- [ ] Template analytics

### Analytics Dashboard
- [ ] Completion rates
- [ ] Time tracking
- [ ] Pattern recognition
- [ ] Weekly/monthly reports

### Native Apps
- [ ] React Native setup
- [ ] iOS app
- [ ] Android app
- [ ] Watch apps

### Smart Features
- [ ] AI schedule optimization
- [ ] Smart notifications
- [ ] Predictive templates
- [ ] Natural language input

## Success Criteria

### Week 1
- Database designed and implemented
- Basic auth working
- Planning interface functional

### Week 2
- Execution interface complete
- Real-time sync working
- Core templates implemented

### Week 3
- Full feature set complete
- Testing comprehensive
- Production ready

## Technical Debt to Avoid

1. **Keep components small** and focused
2. **Use TypeScript strictly** from the start
3. **Implement proper error handling** everywhere
4. **Write tests as you go** not after
5. **Document decisions** in code comments
6. **Use consistent patterns** throughout
7. **Optimize early** for mobile performance
8. **Plan for scale** from day one

## Definition of Done

Each task is complete when:
- [ ] Feature works as designed
- [ ] Responsive on all screen sizes
- [ ] Accessible (WCAG AA)
- [ ] Error handling in place
- [ ] Loading states implemented
- [ ] Tests written and passing
- [ ] Code reviewed (if team)
- [ ] Documentation updated