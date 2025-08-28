# Family Brain V4 - Backend API Documentation

## Overview
This document outlines the complete backend implementation for the Itineraries app. The backend is built with Next.js App Router, TypeScript, and Supabase, providing a robust foundation for family schedule management.

## Architecture

### Services Layer
- **ScheduleService**: Manages schedules, time blocks, and schedule items
- **TemplateService**: Handles templates and template instances
- **TimeBlockService**: Provides time slot generation and conflict detection
- **FamilyService**: Manages families and user profiles

### Authentication & Authorization
- Server-side authentication using Supabase
- Family-based access control (users only see their family's data)
- Role-based permissions (owner/member)

## API Endpoints

### Schedules

#### `GET /api/schedules`
Get schedules with optional filtering
- **Query Parameters:**
  - `date`: Single date (YYYY-MM-DD)
  - `startDate` & `endDate`: Date range
  - `includeCompleted`: Include completed items (true/false)
  - `templateCategories`: Comma-separated list of categories

#### `POST /api/schedules`
Create or update a schedule
- **Body:** `{ date, title?, day_theme? }`

### Time Blocks

#### `POST /api/schedules/[scheduleId]/time-blocks`
Create a time block with conflict detection
- **Body:** `{ start_time, end_time }`

#### `PUT /api/schedules/[scheduleId]/time-blocks/[timeBlockId]`
Update a time block
- **Body:** `{ start_time?, end_time? }`

#### `DELETE /api/schedules/[scheduleId]/time-blocks/[timeBlockId]`
Delete a time block

### Schedule Items

#### `POST /api/schedule-items`
Create a schedule item
- **Body:** `{ time_block_id, title, description?, item_type?, template_id?, order_position?, metadata? }`

#### `PUT /api/schedule-items/[itemId]`
Update a schedule item
- **Body:** `{ title?, description?, order_position?, metadata? }`

#### `DELETE /api/schedule-items/[itemId]`
Delete a schedule item

#### `POST /api/schedule-items/[itemId]/complete`
Complete a schedule item

#### `DELETE /api/schedule-items/[itemId]/complete`
Uncomplete a schedule item

#### `POST /api/schedule-items/bulk`
Bulk operations on schedule items
- **Body:** `{ operation: 'complete'|'uncomplete', itemIds: string[] }`

### Templates

#### `GET /api/templates`
Get templates with optional filtering
- **Query Parameters:**
  - `category`: Filter by template category
  - `search`: Search templates by title/description

#### `POST /api/templates`
Create a template
- **Body:** `{ title, description?, category, icon?, color? }`

#### `GET /api/templates/[templateId]`
Get a specific template

#### `PUT /api/templates/[templateId]`
Update a template (family templates only)
- **Body:** `{ title?, description?, category?, icon?, color? }`

#### `DELETE /api/templates/[templateId]`
Delete a template (family templates only)

#### `POST /api/templates/[templateId]/steps`
Create a template step
- **Body:** `{ title, description?, step_type, order_position, metadata? }`

#### `POST /api/templates/[templateId]/duplicate`
Duplicate a template to user's family

### Today's Schedule

#### `GET /api/today`
Get comprehensive today's data
- **Query Parameters:**
  - `includeStats`: Include completion statistics (true/false)
  - `upcomingLimit`: Number of upcoming activities (default: 5)
- **Returns:**
  - Complete today's schedule
  - Current activity (what should be happening now)
  - Upcoming activities
  - Optional statistics

### Time Block Utilities

#### `GET /api/time-blocks`
Generate time slots and get suggestions
- **Query Parameters:**
  - `date`: Date to check existing blocks
  - `startHour`: Start hour (default: 5)
  - `endHour`: End hour (default: 23)
  - `collapse`: Auto-collapse empty slots (true/false)
  - `minEmptyGroup`: Min slots to collapse (default: 4)
  - `operation`: 'slots', 'suggestions', or 'conflicts'

#### `POST /api/time-blocks`
Find optimal time slot
- **Body:** `{ date?, durationMinutes, preferredStartTime?, startHour?, endHour? }`

### Statistics

#### `GET /api/schedules/stats`
Get schedule statistics
- **Query Parameters:**
  - `date`: Single date stats
  - `startDate` & `endDate`: Date range stats

## Services Documentation

### TimeBlockService Features
- Generate 15-minute time slots
- Auto-collapse consecutive empty slots
- Conflict detection for overlapping time blocks
- Find optimal time slots for given duration
- Time manipulation utilities (rounding, duration calculation)
- Suggested time block templates

### ScheduleService Features
- Complete CRUD operations for schedules, time blocks, and items
- Today's schedule with current/upcoming activities
- Date range queries with filtering
- Time conflict checking
- Bulk operations for item completion
- Schedule statistics and completion tracking
- Schedule copying functionality

### TemplateService Features
- CRUD operations for templates and steps
- Template categories and filtering
- Template instances (when used in schedules)
- Template duplication
- Search functionality
- System vs family templates

## TypeScript Types
All services use strongly typed interfaces defined in `/src/lib/types/database.ts`:
- `Schedule`, `TimeBlock`, `ScheduleItem`
- `Template`, `TemplateStep`, `TemplateInstance`
- `Family`, `UserProfile`
- Helper types: `ScheduleWithDetails`, `TemplateWithSteps`

## Error Handling
- Consistent error responses with meaningful messages
- Proper HTTP status codes
- Family access validation
- Input validation
- Database error handling

## Security Features
- Server-side authentication required for all endpoints
- Family-based data isolation
- Role-based permissions for template editing
- Proper error messages without data leakage

## Usage Examples

### Creating a Schedule with Time Blocks
```javascript
// 1. Create schedule
const schedule = await fetch('/api/schedules', {
  method: 'POST',
  body: JSON.stringify({
    date: '2024-01-15',
    title: 'Monday Routine'
  })
})

// 2. Add time block
const timeBlock = await fetch(`/api/schedules/${schedule.id}/time-blocks`, {
  method: 'POST',
  body: JSON.stringify({
    start_time: '07:00',
    end_time: '08:00'
  })
})

// 3. Add schedule item
await fetch('/api/schedule-items', {
  method: 'POST',
  body: JSON.stringify({
    time_block_id: timeBlock.id,
    title: 'Morning Exercise',
    item_type: 'simple'
  })
})
```

### Getting Today's Complete View
```javascript
const todayData = await fetch('/api/today?includeStats=true&upcomingLimit=10')
const { schedule, currentActivity, upcomingActivities, stats } = await todayData.json()
```

### Finding Optimal Time Slot
```javascript
const optimalSlot = await fetch('/api/time-blocks', {
  method: 'POST',
  body: JSON.stringify({
    date: '2024-01-15',
    durationMinutes: 45,
    preferredStartTime: '09:00'
  })
})
```

## Development Notes
- All API routes use proper Next.js App Router patterns
- Server-side rendering compatible
- Supabase Row Level Security (RLS) policies ensure data protection
- Services can be used directly in server components
- Comprehensive error handling and logging

This backend implementation provides a solid foundation for the Family Brain V4 frontend to consume, with proper separation of concerns, type safety, and security considerations.