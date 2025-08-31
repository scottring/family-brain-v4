// Database types for the Itineraries app

export type UserRole = 'owner' | 'member'
export type ItemType = 'simple' | 'procedure' | 'template_ref'
export type RecurrencePattern = 'daily' | 'weekdays' | 'weekly' | 'custom'
export type StepType = 'task' | 'note' | 'decision' | 'resource' | 'reference'
export type TemplateCategory = 
  | 'morning'
  | 'evening' 
  | 'household'
  | 'childcare'
  | 'shopping'
  | 'work'
  | 'personal'
  | 'health'
  | 'travel'
  | 'custom'

export interface UserProfile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  preferences: Record<string, any>
  created_at: string
  updated_at: string
}

export interface Family {
  id: string
  name: string
  settings: Record<string, any>
  created_at: string
  updated_at: string
}

export interface FamilyMember {
  id: string
  family_id: string
  user_id: string
  role: UserRole
  joined_at: string
}

export interface Schedule {
  id: string
  family_id: string
  date: string // YYYY-MM-DD format
  title: string | null
  day_theme: string | null
  created_at: string
  updated_at: string
  time_blocks?: TimeBlock[]
}

export interface TimeBlock {
  id: string
  schedule_id: string
  start_time: string // HH:MM format
  end_time: string // HH:MM format
  assigned_to?: string | null // User ID of assigned family member
  created_at: string
  schedule_items?: ScheduleItem[]
  assigned_user?: UserProfile // For when we join with user_profiles
}

export interface ScheduleItem {
  id: string
  time_block_id: string
  title: string
  description: string | null
  item_type: ItemType
  template_id: string | null
  completed_at: string | null
  completed_by: string | null
  order_position: number
  metadata: Record<string, any>
  recurrence_pattern?: RecurrencePattern | null
  recurrence_days?: number[] | null  // 0=Sunday, 6=Saturday
  recurrence_end_date?: string | null
  recurrence_group_id?: string | null
  created_at: string
  updated_at: string
  template_instance?: TemplateInstance
}

export interface Template {
  id: string
  family_id: string | null // null for system templates
  title: string
  description: string | null
  category: TemplateCategory
  is_system: boolean
  icon: string | null
  color: string | null
  created_by: string | null
  updated_by: string | null
  version: number
  created_at: string
  updated_at: string
  template_steps?: TemplateStep[]
}

export type AssigneeType = 'all_members' | 'all_children' | 'specific_member' | 'any_member'

export interface TemplateStepMetadata {
  assignee_type?: AssigneeType
  specific_member_id?: string
  exclude_members?: string[]
  [key: string]: any
}

export interface TemplateStep {
  id: string
  template_id: string
  title: string
  description: string | null
  order_position: number
  step_type: StepType
  metadata: TemplateStepMetadata
  created_at: string
  updated_at: string
}

export interface TemplateInstance {
  id: string
  template_id: string
  schedule_item_id: string
  customizations: Record<string, any>
  created_at: string
  template_instance_steps?: TemplateInstanceStep[]
  template?: Template
}

export interface TemplateInstanceStep {
  id: string
  template_instance_id: string
  template_step_id: string
  assigned_to: string | null  // The family member this step is assigned to
  completed_at: string | null
  completed_by: string | null
  notes: string | null
  created_at: string
  template_step?: TemplateStep
  assigned_user?: UserProfile  // When joined with user_profiles
}

// Helper types for API responses
export interface ScheduleWithDetails extends Schedule {
  time_blocks: (TimeBlock & {
    schedule_items: (ScheduleItem & {
      template_instance?: TemplateInstance & {
        template: Template & {
          template_steps: TemplateStep[]
        }
        template_instance_steps: (TemplateInstanceStep & {
          template_step: TemplateStep
        })[]
      }
    })[]
  })[]
}

export interface TemplateWithSteps extends Template {
  template_steps: TemplateStep[]
}

// Helper type for family members with their profiles
export interface FamilyMemberWithProfile extends FamilyMember {
  user_profile: UserProfile
}

// Helper type for schedules with time blocks
export interface ScheduleWithTimeBlocks extends Schedule {
  time_blocks: (TimeBlock & {
    schedule_items: ScheduleItem[]
  })[]
}

// Additional helper types for stores
export interface TimeBlockWithItems extends TimeBlock {
  schedule_items: ScheduleItemWithTemplate[]
}

export interface ScheduleItemWithTemplate extends ScheduleItem {
  template_instance?: TemplateInstanceWithSteps
}

export interface TemplateInstanceWithSteps extends TemplateInstance {
  template_instance_steps: (TemplateInstanceStep & {
    template_step: TemplateStep
  })[]
}