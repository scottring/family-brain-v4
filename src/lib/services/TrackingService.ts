import { createClient } from '@/lib/supabase/client'
import { format, subDays, startOfDay, endOfDay } from 'date-fns'

export interface TrackingGoal {
  id: string
  family_id: string
  template_id: string
  member_id: string | null
  goal_type: 'streak' | 'count_in_period' | 'daily'
  target_count: number
  period_days: number
  reward_description: string | null
  reward_emoji: string
  is_active: boolean
  template?: {
    id: string
    title: string
    tracking_emoji: string | null
  }
  member?: {
    id: string
    full_name: string
  }
}

export interface GoalProgress {
  current_count: number
  target_count: number
  period_days: number
  current_streak: number
  is_complete: boolean
  days_remaining: number
  percentage: number
}

export interface TemplateCompletion {
  date: string
  completed: boolean
  completed_at: string | null
  completed_by: string | null
}

export interface TemplateStats {
  total_scheduled: number
  total_completed: number
  completion_rate: number
  current_streak: number
  longest_streak: number
  last_completed: string | null
}

export class TrackingService {
  private supabase: any
  
  constructor(supabase?: any) {
    this.supabase = supabase || createClient()
  }

  // Get all active tracking goals for a family
  async getActiveGoals(familyId: string): Promise<TrackingGoal[]> {
    try {
      const { data, error } = await this.supabase
        .from('template_tracking_goals')
        .select(`
          *,
          template:templates (
            id,
            title,
            tracking_emoji
          ),
          member:user_profiles (
            id,
            full_name
          )
        `)
        .eq('family_id', familyId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching active goals:', error)
      return []
    }
  }

  // Get tracking goals for a specific member
  async getMemberGoals(familyId: string, memberId: string): Promise<TrackingGoal[]> {
    try {
      const { data, error } = await this.supabase
        .from('template_tracking_goals')
        .select(`
          *,
          template:templates (
            id,
            title,
            tracking_emoji
          )
        `)
        .eq('family_id', familyId)
        .eq('is_active', true)
        .or(`member_id.eq.${memberId},member_id.is.null`)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching member goals:', error)
      return []
    }
  }

  // Get progress for a specific goal
  async getGoalProgress(goalId: string): Promise<GoalProgress | null> {
    try {
      const { data, error } = await this.supabase
        .rpc('get_tracking_goal_progress', { p_goal_id: goalId })
        .single()

      if (error) throw error
      
      if (!data) return null
      
      return {
        ...data,
        percentage: data.target_count > 0 
          ? Math.round((data.current_count / data.target_count) * 100)
          : 0
      }
    } catch (error) {
      console.error('Error fetching goal progress:', error)
      return null
    }
  }

  // Get template completions for a date range
  async getTemplateCompletions(
    templateId: string,
    startDate: Date,
    endDate: Date,
    memberId?: string
  ): Promise<TemplateCompletion[]> {
    try {
      const startStr = format(startDate, 'yyyy-MM-dd')
      const endStr = format(endDate, 'yyyy-MM-dd')
      
      // Get all dates in range
      const dates: string[] = []
      let currentDate = startDate
      while (currentDate <= endDate) {
        dates.push(format(currentDate, 'yyyy-MM-dd'))
        currentDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000)
      }
      
      // Query completions
      let query = this.supabase
        .from('template_completion_stats')
        .select('*')
        .eq('template_id', templateId)
        .gte('date', startStr)
        .lte('date', endStr)
      
      if (memberId) {
        query = query.eq('member_id', memberId)
      }
      
      const { data, error } = await query
      
      if (error) throw error
      
      // Map dates to completions
      const completionMap = new Map(
        (data || []).map(d => [d.date, d])
      )
      
      return dates.map(date => {
        const completion: any = completionMap.get(date)
        return {
          date,
          completed: completionMap.has(date) && completion?.completed_count > 0,
          completed_at: completion?.last_completed_at || null,
          completed_by: completion?.member_id || null
        }
      })
    } catch (error) {
      console.error('Error fetching template completions:', error)
      return []
    }
  }

  // Calculate current streak for a template
  async calculateStreak(
    templateId: string,
    memberId?: string,
    familyId?: string
  ): Promise<number> {
    try {
      const { data, error } = await this.supabase
        .rpc('calculate_template_streak', {
          p_template_id: templateId,
          p_member_id: memberId || null,
          p_family_id: familyId || null
        })

      if (error) throw error
      return data || 0
    } catch (error) {
      console.error('Error calculating streak:', error)
      return 0
    }
  }

  // Get template statistics
  async getTemplateStats(
    templateId: string,
    days: number = 30,
    memberId?: string
  ): Promise<TemplateStats> {
    try {
      const startDate = subDays(new Date(), days - 1)
      const completions = await this.getTemplateCompletions(
        templateId,
        startDate,
        new Date(),
        memberId
      )
      
      const completed = completions.filter(c => c.completed)
      const currentStreak = await this.calculateStreak(templateId, memberId)
      
      // Calculate longest streak
      let longestStreak = 0
      let currentCount = 0
      for (const completion of completions) {
        if (completion.completed) {
          currentCount++
          longestStreak = Math.max(longestStreak, currentCount)
        } else {
          currentCount = 0
        }
      }
      
      const lastCompleted = completed.length > 0
        ? completed[completed.length - 1].completed_at
        : null
      
      return {
        total_scheduled: completions.length,
        total_completed: completed.length,
        completion_rate: completions.length > 0
          ? Math.round((completed.length / completions.length) * 100)
          : 0,
        current_streak: currentStreak,
        longest_streak: longestStreak,
        last_completed: lastCompleted
      }
    } catch (error) {
      console.error('Error fetching template stats:', error)
      return {
        total_scheduled: 0,
        total_completed: 0,
        completion_rate: 0,
        current_streak: 0,
        longest_streak: 0,
        last_completed: null
      }
    }
  }

  // Create or update a tracking goal
  async upsertTrackingGoal(goal: Partial<TrackingGoal>): Promise<TrackingGoal | null> {
    try {
      const { data, error } = await this.supabase
        .from('template_tracking_goals')
        .upsert({
          ...goal,
          updated_at: new Date().toISOString()
        })
        .select(`
          *,
          template:templates (
            id,
            title,
            tracking_emoji
          ),
          member:user_profiles (
            id,
            full_name
          )
        `)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error upserting tracking goal:', error)
      return null
    }
  }

  // Deactivate a tracking goal
  async deactivateGoal(goalId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('template_tracking_goals')
        .update({ is_active: false })
        .eq('id', goalId)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Error deactivating goal:', error)
      return false
    }
  }

  // Check if a reward has been earned
  async checkRewardEligibility(goalId: string): Promise<boolean> {
    const progress = await this.getGoalProgress(goalId)
    return progress?.is_complete || false
  }

  // Get today's completions for all tracked templates
  async getTodayCompletions(familyId: string, memberId?: string): Promise<{
    completed: number
    total: number
    templates: Array<{
      id: string
      title: string
      completed: boolean
      emoji: string | null
    }>
  }> {
    try {
      // Get all trackable templates for the family
      const { data: templates, error: templatesError } = await this.supabase
        .from('templates')
        .select('id, title, tracking_emoji')
        .eq('family_id', familyId)
        .eq('is_trackable', true)

      if (templatesError) throw templatesError
      
      if (!templates || templates.length === 0) {
        return { completed: 0, total: 0, templates: [] }
      }

      // Get today's completions
      const today = format(new Date(), 'yyyy-MM-dd')
      let query = this.supabase
        .from('template_completion_stats')
        .select('template_id, completed_count')
        .eq('date', today)
        .in('template_id', templates.map((t: any) => t.id))

      if (memberId) {
        query = query.eq('member_id', memberId)
      }

      const { data: completions, error: completionsError } = await query
      
      if (completionsError) throw completionsError

      const completionMap = new Map(
        (completions || []).map(c => [c.template_id, c.completed_count > 0])
      )

      const templateResults = templates.map((t: any) => ({
        id: t.id,
        title: t.title,
        completed: completionMap.get(t.id) || false,
        emoji: t.tracking_emoji
      }))

      const completedCount = templateResults.filter(t => t.completed).length

      return {
        completed: completedCount,
        total: templates.length,
        templates: templateResults
      }
    } catch (error) {
      console.error('Error fetching today completions:', error)
      return { completed: 0, total: 0, templates: [] }
    }
  }

  // Create a new tracking goal
  async createGoal(goal: Omit<TrackingGoal, 'id' | 'created_at'>): Promise<TrackingGoal> {
    const { data, error } = await this.supabase
      .from('template_tracking_goals')
      .insert(goal)
      .select('*, template:templates(*), member:user_profiles(*)')
      .single()

    if (error) throw error
    return data
  }

  // Record a template completion
  async recordCompletion(
    templateId: string,
    date: Date,
    completed: boolean,
    memberId?: string,
    metadata?: any
  ): Promise<TemplateCompletion> {
    const dateStr = date.toISOString().split('T')[0]
    
    // Check if completion already exists
    const { data: existing } = await this.supabase
      .from('template_completions')
      .select('*')
      .eq('template_id', templateId)
      .eq('date', dateStr)
      .eq('member_id', memberId || '')
      .single()

    if (existing) {
      // Update existing completion
      const { data, error } = await this.supabase
        .from('template_completions')
        .update({ 
          completed, 
          completed_at: completed ? new Date().toISOString() : null,
          metadata 
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) throw error
      return data
    } else {
      // Create new completion
      const { data, error } = await this.supabase
        .from('template_completions')
        .insert({
          template_id: templateId,
          member_id: memberId,
          date: dateStr,
          completed,
          completed_at: completed ? new Date().toISOString() : null,
          metadata
        })
        .select()
        .single()

      if (error) throw error
      return data
    }
  }
}

// Export singleton instance
export const trackingService = new TrackingService()