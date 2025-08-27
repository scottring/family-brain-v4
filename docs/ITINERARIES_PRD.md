# Itineraries App - Product Requirements Document

## Executive Summary

Itineraries is a smart daily companion app designed for busy parents to execute their day efficiently through time-blocked schedules and interactive checklists. The app focuses on simplicity and execution over complex planning, with a shared workspace for spouses to coordinate their daily activities in real-time.

## Vision

Transform chaotic family days into smooth, executable routines by providing a simple yet powerful system that combines time-based scheduling with smart, expandable procedures and checklists.

## Core Concept

A daily execution app where:
- Time-blocked schedules provide structure (15-minute increments)
- Each block can contain simple items or expand into full interactive procedures
- Spouses share the same workspace with real-time synchronization
- Templates make recurring activities quick to schedule
- Mobile-first execution with desktop planning

## User Problems Being Solved

1. **Execution Paralysis**: Parents know what needs to be done but lack a system to execute efficiently
2. **Spouse Coordination**: Difficulty syncing on who's doing what and when
3. **Routine Complexity**: Some tasks (bedwetting response, leaving dog alone) require detailed steps that are hard to remember
4. **Context Switching**: Jumping between different apps and lists throughout the day
5. **Planning Overhead**: Spending too much time planning instead of doing

## Target Users

Primary: Busy parents (ages 30-45) managing work, family, and personal responsibilities
Secondary: Couples who want better coordination and visibility into each other's days

## Core Features

### 1. Time-Blocked Daily Schedule
- **15-minute time slots** from wake to sleep
- **Auto-collapsing empty slots** to reduce visual clutter
- **Visual time indicators** showing current time and progress
- **Day themes** (e.g., "CrossFit Tuesday", "Recovery Thursday")
- **Calendar integration** to pre-populate events from Google/Apple calendars

### 2. Interactive Schedule Items
- **Simple items**: Quick text entries (e.g., "Coffee", "Email")
- **Expandable procedures**: Items that open into detailed checklists
- **Smart artifact panels**: Claude-style side panels containing:
  - Step-by-step checklists
  - Relevant documents/links
  - Phone numbers and dial-in info
  - Background knowledge/context
  - Quick reference guides
  - Decision trees
  - Related templates
- **Check-off capability**: Mark items complete as you go
- **Time estimates**: Optional duration for each item

### 3. Smart Templates (Editable)
- **Pre-built templates** for common routines:
  - Morning routine
  - Evening routine
  - Bedwetting response checklist
  - Leaving dog alone checklist
  - Grocery shopping list
  - Packing lists (vacation, gym, work)
  - Friendship management (e.g., "Mateo talk topics")
- **Custom template creation**
- **Template editing and versioning**
- **Quick template insertion** via drag-and-drop

### 4. Weekly Planning Interface (Desktop)
- **Template sidebar** with categorized templates
- **Drag-and-drop** templates onto specific days/times
- **Week view** showing all 7 days
- **Copy previous week** functionality
- **Recurring schedule setup** for typical weeks

### 5. Mobile Execution View
- **Hybrid timeline** that shows:
  - Current task prominently
  - Next 2-3 tasks preview
  - Collapsible full day timeline
- **Quick check-off** with satisfying animations
- **Swipe gestures** for navigation
- **Focus mode** showing only current task

### 6. Spouse Synchronization
- **Shared family workspace**
- **Real-time updates** when spouse checks items
- **Separate personal spaces** for individual items
- **Visual indicators** showing spouse's current activity
- **Optional notifications** for specific events

## User Flows

### Weekly Planning (Desktop)
1. Couple sits down Sunday evening
2. Opens week view with template sidebar
3. Reviews recurring schedule (auto-populated)
4. Drags specific templates to days/times
5. Adjusts times and adds custom items
6. Saves week (auto-syncs to both phones)

### Daily Execution (Mobile)
1. Wake up, open app
2. See current time block highlighted
3. Tap item to expand checklist if needed
4. Check off items as completed
5. Swipe or auto-advance to next block
6. Artifact panel slides in for complex procedures

### Template Creation
1. Complete a routine manually
2. Select "Save as Template"
3. Name and categorize template
4. Edit steps if needed
5. Template appears in sidebar for future use

## Data Model (Simplified)

### Core Entities
- **Users**: Individual accounts
- **Families**: Shared workspace for spouses
- **Days**: Date-specific schedules
- **TimeBlocks**: 15-minute increments with content
- **Items**: Simple text or expandable procedures
- **Templates**: Reusable procedures and checklists
- **ChecklistSteps**: Individual steps within procedures

### Key Relationships
- Users belong to Families (1-2 users per family typically)
- Days contain TimeBlocks
- TimeBlocks contain Items
- Items can reference Templates
- Templates contain ChecklistSteps

## Technical Requirements

### Platform Support
- **Web**: Next.js responsive web app
- **Mobile Web**: PWA capabilities for app-like experience
- **Native Apps**: Future consideration (not MVP)

### Performance
- **Instant sync**: <100ms for spouse updates
- **Fast load**: <2s initial load on mobile
- **Offline capable**: Local storage with sync when online

### Authentication
- **Email/password** login
- **Magic link** option
- **Persistent sessions**

## Design Principles

1. **Execution over Planning**: Optimize for doing, not organizing
2. **Glanceable Information**: See what's needed in 1 second
3. **Satisfying Interactions**: Make checking things off feel good
4. **Smart Defaults**: Reduce setup time with intelligent assumptions
5. **Progressive Disclosure**: Hide complexity until needed

## MVP Scope

### Must Have
- Time-blocked daily schedule (15-min slots)
- Simple and expandable items
- Basic templates (5-6 pre-built)
- Weekly planning desktop view
- Mobile execution view
- Spouse sharing and sync
- Template editing

### Nice to Have (Post-MVP)
- Calendar integration
- Artifact-style panels
- Custom template creation UI
- Recurring schedule automation
- Time tracking/analytics
- Notification system

### Out of Scope (V1)
- Goal tracking
- Long-term planning
- Financial tracking
- Photo/file attachments
- Multi-family support
- Team/work collaboration

## Success Metrics

1. **Daily Active Usage**: 80% of users open app daily
2. **Task Completion Rate**: >70% of scheduled items checked off
3. **Template Usage**: Average 5+ template uses per week
4. **Spouse Sync**: Both spouses active in 60% of families
5. **Retention**: 60% 30-day retention

## Competitive Differentiation

Unlike other apps:
- **Not another todo list**: Time-based, not list-based
- **Not a calendar**: Focused on execution, not scheduling
- **Not a project manager**: Daily tactics, not long-term strategy
- **Built for couples**: Real spouse coordination, not single-user

## Example Use Cases

### Bedwetting Response (2 AM)
1. Alert triggers scheduled bedwetting template
2. Tap to expand full checklist:
   - Change sheets
   - Clean child
   - Fresh pajamas
   - Comfort and reassure
   - Document incident
3. Check off each step
4. Spouse sees completion in real-time

### Mateo Friendship Management
1. "Mateo Talk" appears in afternoon slot
2. Tap opens smart artifact panel with:
   - **Checklist**: Topics to discuss today
   - **Background**: Previous conversations and context
   - **Resources**: 
     - Parent's phone number
     - Playdate location addresses
     - Shared activities/interests
   - **Guidelines**: Social skills to practice
   - **Questions**: Conversation starters
   - **Follow-up**: Action items for next time
3. Use as live reference during interaction
4. Update notes for next time

### Grocery Run
1. "Grocery Shopping" in Saturday morning
2. Expands to categorized list:
   - Produce
   - Dairy
   - Pantry
   - Frozen
3. Check off items while shopping
4. Spouse sees progress and can add last-minute items

## Risk Mitigation

1. **Over-complexity**: Start extremely simple, add features based on usage
2. **Adoption friction**: Provide quick-start templates and onboarding
3. **Sync conflicts**: Use last-write-wins with conflict resolution
4. **Mobile performance**: Progressive web app with offline support

## Development Priorities

### Phase 1: Foundation (Week 1-2)
- Basic time-blocked schedule
- Simple item creation and checking
- User authentication
- Family workspace

### Phase 2: Templates (Week 3)
- Pre-built templates
- Template editing
- Drag-and-drop planning
- Week view

### Phase 3: Mobile Excellence (Week 4)
- Mobile-optimized execution view
- Offline support
- Real-time sync
- PWA features

### Phase 4: Polish (Week 5)
- Animations and transitions
- Artifact panels
- Additional templates
- User feedback incorporation

## Conclusion

Itineraries represents a fundamental shift from complex planning apps to simple execution tools. By focusing on the daily reality of busy parents and providing just enough structure with maximum flexibility, we can create a tool that actually gets used every day rather than abandoned after the initial setup.

The key is maintaining radical simplicity while providing powerful capabilities through progressive disclosure. Every feature must earn its place by directly supporting daily execution, not adding planning overhead.