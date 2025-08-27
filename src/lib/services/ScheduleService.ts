import { createClient } from '@/lib/supabase/client'
import {
  Schedule,
  TimeBlock,
  ScheduleItem,
  ScheduleWithDetails,
  ItemType
} from '@/lib/types/database'

export class ScheduleService {
  private supabase = createClient()

  // Schedule operations
  async getScheduleForDate(familyId: string, date: string): Promise<ScheduleWithDetails | null> {
    try {
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
                template:templates (
                  *,
                  template_steps (*)
                ),
                template_instance_steps (
                  *,
                  template_step:template_steps (*)
                )
              )
            )
          )
        `)
        .eq('family_id', familyId)
        .eq('date', date)
        .order('start_time', { referencedTable: 'time_blocks', ascending: true })
        .order('order_position', { referencedTable: 'schedule_items', ascending: true })
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      return data as ScheduleWithDetails || null
    } catch (error) {
      console.error('Error fetching schedule:', error)
      throw new Error('Failed to fetch schedule')
    }
  }

  async getSchedulesForWeek(familyId: string, startDate: string, endDate: string): Promise<ScheduleWithDetails[]> {
    try {
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
                template:templates (
                  *,
                  template_steps (*)
                ),
                template_instance_steps (
                  *,
                  template_step:template_steps (*)
                )
              )
            )
          )
        `)
        .eq('family_id', familyId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true })
        .order('start_time', { referencedTable: 'time_blocks', ascending: true })
        .order('order_position', { referencedTable: 'schedule_items', ascending: true })

      if (error) throw error
      return data as ScheduleWithDetails[] || []
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
      const { data: schedule, error } = await this.supabase
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

  // Time Block operations
  async createTimeBlock(
    scheduleId: string,
    startTime: string,
    endTime: string
  ): Promise<TimeBlock> {
    try {
      const { data: timeBlock, error } = await this.supabase
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
    }
  ): Promise<TimeBlock> {
    try {
      const { data: timeBlock, error } = await this.supabase
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
      const { error } = await this.supabase
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
      const { data: item, error } = await this.supabase
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
      const { data: item, error } = await this.supabase
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
      const { data: item, error } = await this.supabase
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
      const { data: item, error } = await this.supabase
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
      const { error } = await this.supabase
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
      const { data: item, error } = await this.supabase
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

  // Utility methods
  async getCurrentTimeBlock(familyId: string): Promise<TimeBlock | null> {
    try {
      const now = new Date()
      const today = now.toISOString().split('T')[0]
      const currentTime = now.toTimeString().split(' ')[0].slice(0, 5) // HH:MM format

      const { data, error } = await this.supabase
        .from('time_blocks')
        .select(`
          *,
          schedule:schedules!inner (*)
        `)
        .eq('schedules.family_id', familyId)
        .eq('schedules.date', today)
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
  ): Promise<ScheduleWithDetails> {
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
      return await this.getScheduleForDate(toFamilyId, toDate) as ScheduleWithDetails
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
}

// Export singleton instance
export const scheduleService = new ScheduleService()