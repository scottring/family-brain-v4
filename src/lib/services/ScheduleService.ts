import { createClient } from '@/lib/supabase/client'
import {
  Schedule,
  TimeBlock,
  ScheduleItem,
  ScheduleWithDetails,
  ScheduleWithTimeBlocks,
  ItemType
} from '@/lib/types/database'

export class ScheduleService {
  private getSupabase() {
    return createClient()
  }

  // Schedule operations
  async getScheduleForDate(familyId: string, date: string): Promise<ScheduleWithTimeBlocks | null> {
    try {
      const supabase = this.getSupabase()
      console.log('Fetching schedule for date:', { familyId, date })
      
      // First get the schedule
      const { data: schedule, error: scheduleError } = await supabase
        .from('schedules')
        .select('*')
        .eq('family_id', familyId)
        .eq('date', date)
        .single()

      if (scheduleError) {
        if (scheduleError.code === 'PGRST116') {
          console.log('No schedule found for date')
          return null
        }
        console.error('Error fetching schedule:', JSON.stringify(scheduleError, null, 2))
        throw scheduleError
      }

      if (!schedule) return null

      // Then get time blocks with assigned user profiles
      const { data: timeBlocks, error: blocksError } = await supabase
        .from('time_blocks')
        .select(`
          *,
          assigned_user:user_profiles!assigned_to (
            id,
            email,
            full_name,
            avatar_url
          )
        `)
        .eq('schedule_id', schedule.id)
        .order('start_time', { ascending: true })

      if (blocksError) {
        console.error('Error fetching time blocks:', blocksError)
        throw blocksError
      }

      // Get schedule items for all time blocks
      const timeBlockIds = timeBlocks?.map(tb => tb.id) || []
      
      if (timeBlockIds.length === 0) {
        return {
          ...schedule,
          time_blocks: []
        } as ScheduleWithTimeBlocks
      }

      // Get schedule items without deep nesting
      const { data: scheduleItems, error: itemsError } = await supabase
        .from('schedule_items')
        .select('*')
        .in('time_block_id', timeBlockIds)
        .order('order_position', { ascending: true })

      if (itemsError) {
        console.error('Error fetching schedule items:', itemsError)
        throw itemsError
      }

      // Map items to their time blocks (simplified structure)
      const timeBlocksWithItems = timeBlocks?.map(block => ({
        ...block,
        schedule_items: (scheduleItems || []).filter(item => item.time_block_id === block.id)
      })) || []

      return {
        ...schedule,
        time_blocks: timeBlocksWithItems
      } as ScheduleWithTimeBlocks
    } catch (error) {
      console.error('Error in getScheduleForDate:', error)
      throw new Error('Failed to fetch schedule')
    }
  }

  async getSchedulesForWeek(familyId: string, startDate: string, endDate: string): Promise<ScheduleWithTimeBlocks[]> {
    try {
      const supabase = this.getSupabase()
      // Get all schedules for the week
      const { data: schedules, error: schedulesError } = await supabase
        .from('schedules')
        .select('*')
        .eq('family_id', familyId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true })

      if (schedulesError) throw schedulesError
      if (!schedules || schedules.length === 0) return []

      const scheduleIds = schedules.map(s => s.id)

      // Get all time blocks for these schedules with assigned users
      const { data: timeBlocks, error: blocksError } = await supabase
        .from('time_blocks')
        .select(`
          *,
          assigned_user:user_profiles!assigned_to (
            id,
            email,
            full_name,
            avatar_url
          )
        `)
        .in('schedule_id', scheduleIds)
        .order('start_time', { ascending: true })

      if (blocksError) throw blocksError

      const timeBlockIds = timeBlocks?.map(tb => tb.id) || []
      
      // Get all schedule items if there are time blocks (simplified without deep nesting)
      let scheduleItems: any[] = []
      if (timeBlockIds.length > 0) {
        const { data: items, error: itemsError } = await supabase
          .from('schedule_items')
          .select('*')
          .in('time_block_id', timeBlockIds)
          .order('order_position', { ascending: true })

        if (itemsError) throw itemsError
        scheduleItems = items || []
      }

      // Assemble the nested structure
      return schedules.map(schedule => {
        const scheduleTimeBlocks = (timeBlocks || []).filter(tb => tb.schedule_id === schedule.id)
        const timeBlocksWithItems = scheduleTimeBlocks.map(block => ({
          ...block,
          schedule_items: scheduleItems.filter(item => item.time_block_id === block.id)
        }))

        return {
          ...schedule,
          time_blocks: timeBlocksWithItems
        } as ScheduleWithTimeBlocks
      })
    } catch (error) {
      console.error('Error fetching schedules for week:', error)
      throw new Error('Failed to fetch schedules')
    }
  }

  async createOrUpdateSchedule(
    familyId: string,
    date: string,
    data: {
      title?: string
      day_theme?: string
    }
  ): Promise<Schedule> {
    try {
      const supabase = this.getSupabase()
      const { data: schedule, error } = await supabase
        .from('schedules')
        .upsert({
          family_id: familyId,
          date,
          ...data
        })
        .select()
        .single()

      if (error) throw error
      return schedule
    } catch (error) {
      console.error('Error creating/updating schedule:', error)
      throw new Error('Failed to create/update schedule')
    }
  }

  async getOrCreateScheduleForDate(familyId: string, date: string): Promise<ScheduleWithTimeBlocks> {
    try {
      // Validate inputs
      if (!familyId || !date) {
        console.error('Invalid inputs to getOrCreateScheduleForDate:', { familyId, date })
        throw new Error('Family ID and date are required')
      }
      
      // First try to get existing schedule
      let schedule = await this.getScheduleForDate(familyId, date)
      
      if (!schedule) {
        // Create new schedule if doesn't exist
        const newSchedule = await this.createOrUpdateSchedule(familyId, date, {})
        
        // Return as ScheduleWithTimeBlocks format
        schedule = {
          ...newSchedule,
          time_blocks: []
        } as ScheduleWithTimeBlocks
      }
      
      // Transform ScheduleWithDetails to ScheduleWithTimeBlocks if needed
      const result: ScheduleWithTimeBlocks = {
        id: schedule.id,
        family_id: schedule.family_id,
        date: schedule.date,
        title: schedule.title,
        day_theme: schedule.day_theme,
        created_at: schedule.created_at,
        updated_at: schedule.updated_at,
        time_blocks: schedule.time_blocks?.map(timeBlock => ({
          ...timeBlock,
          schedule_items: timeBlock.schedule_items || []
        })) || []
      }
      
      return result
    } catch (error) {
      console.error('Error getting/creating schedule:', {
        familyId,
        date,
        error: error instanceof Error ? error.message : error
      })
      throw new Error('Failed to get/create schedule')
    }
  }

  async getScheduleByDate(familyId: string, date: string): Promise<ScheduleWithTimeBlocks | null> {
    return this.getOrCreateScheduleForDate(familyId, date)
  }

  // Time Block operations
  async createTimeBlock(
    scheduleId: string,
    startTime: string,
    endTime: string
  ): Promise<TimeBlock> {
    try {
      const supabase = this.getSupabase()
      const { data: timeBlock, error } = await supabase
        .from('time_blocks')
        .insert({
          schedule_id: scheduleId,
          start_time: startTime,
          end_time: endTime
        })
        .select()
        .single()

      if (error) throw error
      return timeBlock
    } catch (error) {
      console.error('Error creating time block:', error)
      throw new Error('Failed to create time block')
    }
  }

  async updateTimeBlock(
    timeBlockId: string,
    data: {
      start_time?: string
      end_time?: string
      assigned_to?: string | null
    }
  ): Promise<TimeBlock> {
    try {
      const supabase = this.getSupabase()
      const { data: timeBlock, error } = await supabase
        .from('time_blocks')
        .update(data)
        .eq('id', timeBlockId)
        .select()
        .single()

      if (error) throw error
      return timeBlock
    } catch (error) {
      console.error('Error updating time block:', error)
      throw new Error('Failed to update time block')
    }
  }

  async deleteTimeBlock(timeBlockId: string): Promise<void> {
    try {
      const supabase = this.getSupabase()
      const { error } = await supabase
        .from('time_blocks')
        .delete()
        .eq('id', timeBlockId)

      if (error) throw error
    } catch (error) {
      console.error('Error deleting time block:', error)
      throw new Error('Failed to delete time block')
    }
  }

  // Schedule Item operations
  async createScheduleItem(
    timeBlockId: string,
    data: {
      title: string
      description?: string
      item_type: ItemType
      template_id?: string
      order_position?: number
      metadata?: Record<string, any>
    }
  ): Promise<ScheduleItem> {
    try {
      const supabase = this.getSupabase()
      const { data: item, error } = await supabase
        .from('schedule_items')
        .insert({
          time_block_id: timeBlockId,
          order_position: data.order_position || 0,
          metadata: data.metadata || {},
          ...data
        })
        .select()
        .single()

      if (error) throw error
      return item
    } catch (error) {
      console.error('Error creating schedule item:', error)
      throw new Error('Failed to create schedule item')
    }
  }

  async updateScheduleItem(
    itemId: string,
    data: Partial<Pick<ScheduleItem, 'title' | 'description' | 'order_position' | 'metadata'>>
  ): Promise<ScheduleItem> {
    try {
      const supabase = this.getSupabase()
      const { data: item, error } = await supabase
        .from('schedule_items')
        .update(data)
        .eq('id', itemId)
        .select()
        .single()

      if (error) throw error
      return item
    } catch (error) {
      console.error('Error updating schedule item:', error)
      throw new Error('Failed to update schedule item')
    }
  }

  async completeScheduleItem(itemId: string, userId: string): Promise<ScheduleItem> {
    try {
      const supabase = this.getSupabase()
      const { data: item, error } = await supabase
        .from('schedule_items')
        .update({
          completed_at: new Date().toISOString(),
          completed_by: userId
        })
        .eq('id', itemId)
        .select()
        .single()

      if (error) throw error
      return item
    } catch (error) {
      console.error('Error completing schedule item:', error)
      throw new Error('Failed to complete item')
    }
  }

  async uncompleteScheduleItem(itemId: string): Promise<ScheduleItem> {
    try {
      const supabase = this.getSupabase()
      const { data: item, error } = await supabase
        .from('schedule_items')
        .update({
          completed_at: null,
          completed_by: null
        })
        .eq('id', itemId)
        .select()
        .single()

      if (error) throw error
      return item
    } catch (error) {
      console.error('Error uncompleting schedule item:', error)
      throw new Error('Failed to uncomplete item')
    }
  }

  async deleteScheduleItem(itemId: string): Promise<void> {
    try {
      const supabase = this.getSupabase()
      const { error } = await supabase
        .from('schedule_items')
        .delete()
        .eq('id', itemId)

      if (error) throw error
    } catch (error) {
      console.error('Error deleting schedule item:', error)
      throw new Error('Failed to delete schedule item')
    }
  }

  async moveScheduleItem(
    itemId: string,
    newTimeBlockId: string,
    newOrderPosition: number
  ): Promise<ScheduleItem> {
    try {
      const supabase = this.getSupabase()
      const { data: item, error } = await supabase
        .from('schedule_items')
        .update({
          time_block_id: newTimeBlockId,
          order_position: newOrderPosition
        })
        .eq('id', itemId)
        .select()
        .single()

      if (error) throw error
      return item
    } catch (error) {
      console.error('Error moving schedule item:', error)
      throw new Error('Failed to move item')
    }
  }

  async createTimeBlockFromTemplate(
    familyId: string,
    date: string,
    startTime: string,
    template: any
  ): Promise<TimeBlock> {
    try {
      console.log('Creating time block from template:', { familyId, date, startTime, template })
      
      // Get or create schedule for the date
      const schedule = await this.getOrCreateScheduleForDate(familyId, date)
      
      // Calculate end time based on template duration or default to 30 minutes
      const duration = template.default_duration || 30
      const [hours, minutes] = startTime.split(':').map(Number)
      const startDate = new Date()
      startDate.setHours(hours, minutes, 0, 0)
      const endDate = new Date(startDate.getTime() + duration * 60000)
      const endTime = `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}:00`
      
      // Create the time block
      const timeBlock = await this.createTimeBlock(schedule.id, startTime, endTime)
      
      // Create schedule item for the template
      await this.createScheduleItem(timeBlock.id, {
        title: template.title,
        description: template.description,
        item_type: 'template_ref',
        template_id: template.id,
        order_position: 0
      })
      
      return timeBlock
    } catch (error) {
      console.error('Error creating time block from template:', error)
      throw new Error('Failed to create time block from template')
    }
  }

  // Utility methods
  async getCurrentTimeBlock(familyId: string): Promise<TimeBlock | null> {
    try {
      const supabase = this.getSupabase()
      const now = new Date()
      const today = now.toISOString().split('T')[0]
      const currentTime = now.toTimeString().split(' ')[0] // HH:MM:SS format

      // First get today's schedule
      const { data: schedule, error: scheduleError } = await supabase
        .from('schedules')
        .select('*')
        .eq('family_id', familyId)
        .eq('date', today)
        .single()

      if (scheduleError || !schedule) {
        return null
      }

      // Get the current time block
      const { data, error } = await supabase
        .from('time_blocks')
        .select('*')
        .eq('schedule_id', schedule.id)
        .lte('start_time', currentTime)
        .gte('end_time', currentTime)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      return data || null
    } catch (error) {
      console.error('Error getting current time block:', error)
      return null
    }
  }

  async copySchedule(
    fromFamilyId: string,
    fromDate: string,
    toFamilyId: string,
    toDate: string
  ): Promise<ScheduleWithTimeBlocks> {
    try {
      const sourceSchedule = await this.getScheduleForDate(fromFamilyId, fromDate)
      if (!sourceSchedule) {
        throw new Error('Source schedule not found')
      }

      // Create new schedule
      const newSchedule = await this.createOrUpdateSchedule(toFamilyId, toDate, {
        title: sourceSchedule.title,
        day_theme: sourceSchedule.day_theme
      })

      // Copy time blocks and items
      for (const timeBlock of sourceSchedule.time_blocks) {
        const newTimeBlock = await this.createTimeBlock(
          newSchedule.id,
          timeBlock.start_time,
          timeBlock.end_time
        )

        // Copy schedule items
        for (const item of timeBlock.schedule_items) {
          await this.createScheduleItem(newTimeBlock.id, {
            title: item.title,
            description: item.description,
            item_type: item.item_type,
            template_id: item.template_id,
            order_position: item.order_position,
            metadata: item.metadata
          })
        }
      }

      // Return the complete new schedule
      const result = await this.getScheduleForDate(toFamilyId, toDate)
      if (!result) throw new Error('Failed to get copied schedule')
      return result
    } catch (error) {
      console.error('Error copying schedule:', error)
      throw new Error('Failed to copy schedule')
    }
  }

  // Generate time slots for a day (15-minute increments)
  generateTimeSlots(startHour: number = 5, endHour: number = 23): Array<{start: string, end: string}> {
    const slots = []
    const increment = 15 // minutes

    for (let hour = startHour; hour <= endHour; hour++) {
      for (let minute = 0; minute < 60; minute += increment) {
        const nextMinute = minute + increment
        const nextHour = nextMinute >= 60 ? hour + 1 : hour
        const adjustedNextMinute = nextMinute >= 60 ? 0 : nextMinute

        // Don't add slot if it would go past end hour
        if (nextHour > endHour) break

        const startTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        const endTime = `${nextHour.toString().padStart(2, '0')}:${adjustedNextMinute.toString().padStart(2, '0')}`

        slots.push({ start: startTime, end: endTime })
      }
    }

    return slots
  }

  // Get today's schedule for a user
  async getTodaysSchedule(familyId: string): Promise<ScheduleWithTimeBlocks | null> {
    try {
      const today = new Date().toISOString().split('T')[0]
      return await this.getScheduleForDate(familyId, today)
    } catch (error) {
      console.error('Error fetching today\'s schedule:', error)
      throw new Error('Failed to fetch today\'s schedule')
    }
  }

  // Get schedules by date range with optional filtering
  async getSchedulesByDateRange(
    familyId: string, 
    startDate: string, 
    endDate: string,
    options?: {
      includeCompleted?: boolean
      templateCategoryFilter?: string[]
    }
  ): Promise<ScheduleWithTimeBlocks[]> {
    try {
      const supabase = this.getSupabase()
      // First get all schedules for the date range
      const { data: schedules, error: schedulesError } = await supabase
        .from('schedules')
        .select('*')
        .eq('family_id', familyId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true })

      if (schedulesError) throw schedulesError
      if (!schedules || schedules.length === 0) return []

      const scheduleIds = schedules.map(s => s.id)

      // Get all time blocks for these schedules with assigned users
      const { data: timeBlocks, error: blocksError } = await supabase
        .from('time_blocks')
        .select(`
          *,
          assigned_user:user_profiles!assigned_to (
            id,
            email,
            full_name,
            avatar_url
          )
        `)
        .in('schedule_id', scheduleIds)
        .order('start_time', { ascending: true })

      if (blocksError) throw blocksError

      const timeBlockIds = timeBlocks?.map(tb => tb.id) || []
      
      // Get all schedule items if there are time blocks (simplified without deep nesting)
      let scheduleItems: any[] = []
      if (timeBlockIds.length > 0) {
        const { data: items, error: itemsError } = await supabase
          .from('schedule_items')
          .select('*')
          .in('time_block_id', timeBlockIds)
          .order('order_position', { ascending: true })

        if (itemsError) throw itemsError
        scheduleItems = items || []
      }

      // Assemble the nested structure
      let result = schedules.map(schedule => {
        const scheduleTimeBlocks = (timeBlocks || []).filter(tb => tb.schedule_id === schedule.id)
        const timeBlocksWithItems = scheduleTimeBlocks.map(block => ({
          ...block,
          schedule_items: scheduleItems.filter(item => item.time_block_id === block.id)
        }))

        return {
          ...schedule,
          time_blocks: timeBlocksWithItems
        } as ScheduleWithTimeBlocks
      })

      // Apply filters if provided
      if (options) {
        result = result.map(schedule => ({
          ...schedule,
          time_blocks: schedule.time_blocks.map(timeBlock => ({
            ...timeBlock,
            schedule_items: timeBlock.schedule_items.filter(item => {
              // Filter by completion status
              if (options.includeCompleted === false && item.completed_at) {
                return false
              }

              // Note: Template category filtering would require additional queries
              // to fetch template data. For now, skip this filter.

              return true
            })
          }))
        })) as ScheduleWithTimeBlocks[]
      }

      return result
    } catch (error) {
      console.error('Error fetching schedules by date range:', error)
      throw new Error('Failed to fetch schedules')
    }
  }

  // Check for time conflicts when creating/updating time blocks
  async checkTimeConflicts(
    scheduleId: string,
    startTime: string,
    endTime: string,
    excludeTimeBlockId?: string
  ): Promise<{hasConflict: boolean, conflictingItems: ScheduleItem[]}> {
    try {
      const supabase = this.getSupabase()
      let query = supabase
        .from('time_blocks')
        .select(`
          *,
          schedule_items (*)
        `)
        .eq('schedule_id', scheduleId)

      // Exclude current time block if updating
      if (excludeTimeBlockId) {
        query = query.neq('id', excludeTimeBlockId)
      }

      const { data: timeBlocks, error } = await query

      if (error) throw error

      const conflictingItems: ScheduleItem[] = []
      let hasConflict = false

      for (const timeBlock of timeBlocks || []) {
        if (this.timesOverlap(startTime, endTime, timeBlock.start_time, timeBlock.end_time)) {
          hasConflict = true
          if (timeBlock.schedule_items) {
            conflictingItems.push(...timeBlock.schedule_items)
          }
        }
      }

      return {
        hasConflict,
        conflictingItems
      }
    } catch (error) {
      console.error('Error checking for time conflicts:', error)
      throw new Error('Failed to check for time conflicts')
    }
  }

  // Helper method to check if two time ranges overlap
  private timesOverlap(start1: string, end1: string, start2: string, end2: string): boolean {
    // Convert time strings to minutes for easier comparison
    const start1Minutes = this.timeToMinutes(start1)
    const end1Minutes = this.timeToMinutes(end1)
    const start2Minutes = this.timeToMinutes(start2)
    const end2Minutes = this.timeToMinutes(end2)

    // Check for overlap: ranges overlap if start1 < end2 AND start2 < end1
    return start1Minutes < end2Minutes && start2Minutes < end1Minutes
  }

  // Helper method to convert HH:MM time string to minutes since midnight
  private timeToMinutes(timeString: string): number {
    const [hours, minutes] = timeString.split(':').map(Number)
    return hours * 60 + minutes
  }

  // Get current activity (what should be happening now)
  async getCurrentActivity(familyId: string): Promise<ScheduleItem | null> {
    try {
      const supabase = this.getSupabase()
      const now = new Date()
      const today = now.toISOString().split('T')[0]
      const currentTime = now.toTimeString().split(' ')[0] // HH:MM:SS format

      // First get the schedule for today
      const { data: schedule, error: scheduleError } = await supabase
        .from('schedules')
        .select('*')
        .eq('family_id', familyId)
        .eq('date', today)
        .single()

      if (scheduleError || !schedule) {
        return null
      }

      // Get time blocks for the current time
      const { data: timeBlocks, error: blocksError } = await supabase
        .from('time_blocks')
        .select('*')
        .eq('schedule_id', schedule.id)
        .lte('start_time', currentTime)
        .gte('end_time', currentTime)

      if (blocksError || !timeBlocks || timeBlocks.length === 0) {
        return null
      }

      // Get the first schedule item from the current time block
      const { data: items, error: itemsError } = await supabase
        .from('schedule_items')
        .select('*')
        .eq('time_block_id', timeBlocks[0].id)
        .order('order_position', { ascending: true })
        .limit(1)
        .single()

      if (itemsError && itemsError.code !== 'PGRST116') {
        throw itemsError
      }

      return items || null
    } catch (error) {
      console.error('Error getting current activity:', error)
      return null
    }
  }

  // Get upcoming activities for the rest of the day
  async getUpcomingActivities(familyId: string, limit: number = 5): Promise<ScheduleItem[]> {
    try {
      const supabase = this.getSupabase()
      const now = new Date()
      const today = now.toISOString().split('T')[0]
      const currentTime = now.toTimeString().split(' ')[0] // HH:MM:SS format

      // First get the schedule for today
      const { data: schedule, error: scheduleError } = await supabase
        .from('schedules')
        .select('*')
        .eq('family_id', familyId)
        .eq('date', today)
        .single()

      if (scheduleError || !schedule) {
        return []
      }

      // Get upcoming time blocks
      const { data: timeBlocks, error: blocksError } = await supabase
        .from('time_blocks')
        .select('*')
        .eq('schedule_id', schedule.id)
        .gt('start_time', currentTime)
        .order('start_time', { ascending: true })

      if (blocksError || !timeBlocks || timeBlocks.length === 0) {
        return []
      }

      const timeBlockIds = timeBlocks.map(tb => tb.id)

      // Get schedule items from upcoming time blocks
      const { data: items, error: itemsError } = await supabase
        .from('schedule_items')
        .select('*')
        .in('time_block_id', timeBlockIds)
        .order('order_position', { ascending: true })
        .limit(limit)

      if (itemsError) throw itemsError
      return items || []
    } catch (error) {
      console.error('Error getting upcoming activities:', error)
      throw new Error('Failed to get upcoming activities')
    }
  }

  // Bulk complete multiple schedule items
  async bulkCompleteItems(itemIds: string[], userId: string): Promise<ScheduleItem[]> {
    try {
      const supabase = this.getSupabase()
      const { data, error } = await supabase
        .from('schedule_items')
        .update({
          completed_at: new Date().toISOString(),
          completed_by: userId
        })
        .in('id', itemIds)
        .select()

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error bulk completing items:', error)
      throw new Error('Failed to bulk complete items')
    }
  }

  // Get schedule statistics
  async getScheduleStats(familyId: string, date: string): Promise<{
    totalItems: number
    completedItems: number
    completionRate: number
    totalTimeBlocks: number
    scheduledMinutes: number
  }> {
    try {
      const schedule = await this.getScheduleForDate(familyId, date)
      
      if (!schedule) {
        return {
          totalItems: 0,
          completedItems: 0,
          completionRate: 0,
          totalTimeBlocks: 0,
          scheduledMinutes: 0
        }
      }

      let totalItems = 0
      let completedItems = 0
      let scheduledMinutes = 0

      schedule.time_blocks.forEach(timeBlock => {
        // Calculate time block duration
        const duration = this.timeToMinutes(timeBlock.end_time) - this.timeToMinutes(timeBlock.start_time)
        scheduledMinutes += duration

        timeBlock.schedule_items.forEach(item => {
          totalItems++
          if (item.completed_at) {
            completedItems++
          }
        })
      })

      return {
        totalItems,
        completedItems,
        completionRate: totalItems > 0 ? (completedItems / totalItems) * 100 : 0,
        totalTimeBlocks: schedule.time_blocks.length,
        scheduledMinutes
      }
    } catch (error) {
      console.error('Error getting schedule statistics:', error)
      throw new Error('Failed to get schedule statistics')
    }
  }
}

// Export singleton instance
export const scheduleService = new ScheduleService()