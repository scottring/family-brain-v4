import { createClient } from '@/lib/supabase/client'
import { TimeBlock, ScheduleItem } from '@/lib/types/database'

export interface TimeSlot {
  start: string
  end: string
  available: boolean
}

export interface ConflictCheck {
  hasConflict: boolean
  conflictingItems: ScheduleItem[]
}

export class TimeBlockService {
  private supabase = createClient()

  /**
   * Generate 15-minute time slots for a day
   */
  generateTimeSlots(
    startHour: number = 5,
    endHour: number = 23,
    existingTimeBlocks: TimeBlock[] = []
  ): TimeSlot[] {
    const slots: TimeSlot[] = []
    const increment = 15 // minutes

    // Create all possible 15-minute slots
    for (let hour = startHour; hour <= endHour; hour++) {
      for (let minute = 0; minute < 60; minute += increment) {
        const nextMinute = minute + increment
        const nextHour = nextMinute >= 60 ? hour + 1 : hour
        const adjustedNextMinute = nextMinute >= 60 ? 0 : nextMinute

        // Don't add slot if it would go past end hour
        if (nextHour > endHour) break

        const startTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        const endTime = `${nextHour.toString().padStart(2, '0')}:${adjustedNextMinute.toString().padStart(2, '0')}`

        // Check if this slot is available (not overlapping with existing time blocks)
        const available = !this.isTimeSlotOccupied(startTime, endTime, existingTimeBlocks)

        slots.push({
          start: startTime,
          end: endTime,
          available
        })
      }
    }

    return slots
  }

  /**
   * Auto-collapse empty slots logic
   * Groups consecutive empty slots together
   */
  collapseEmptySlots(timeSlots: TimeSlot[], minEmptyGroup: number = 4): TimeSlot[] {
    const collapsed: TimeSlot[] = []
    let currentEmptyGroup: TimeSlot[] = []

    for (let i = 0; i < timeSlots.length; i++) {
      const slot = timeSlots[i]

      if (slot.available) {
        // This is an empty slot
        currentEmptyGroup.push(slot)
      } else {
        // This slot is occupied
        // Process any accumulated empty group
        if (currentEmptyGroup.length > 0) {
          if (currentEmptyGroup.length >= minEmptyGroup) {
            // Collapse into a single larger slot
            collapsed.push({
              start: currentEmptyGroup[0].start,
              end: currentEmptyGroup[currentEmptyGroup.length - 1].end,
              available: true
            })
          } else {
            // Keep individual slots if group is too small
            collapsed.push(...currentEmptyGroup)
          }
          currentEmptyGroup = []
        }

        // Add the occupied slot
        collapsed.push(slot)
      }
    }

    // Handle any remaining empty group at the end
    if (currentEmptyGroup.length > 0) {
      if (currentEmptyGroup.length >= minEmptyGroup) {
        collapsed.push({
          start: currentEmptyGroup[0].start,
          end: currentEmptyGroup[currentEmptyGroup.length - 1].end,
          available: true
        })
      } else {
        collapsed.push(...currentEmptyGroup)
      }
    }

    return collapsed
  }

  /**
   * Check if a time slot is occupied by existing time blocks
   */
  private isTimeSlotOccupied(
    slotStart: string,
    slotEnd: string,
    existingTimeBlocks: TimeBlock[]
  ): boolean {
    return existingTimeBlocks.some(block => {
      return this.timesOverlap(slotStart, slotEnd, block.start_time, block.end_time)
    })
  }

  /**
   * Check if two time ranges overlap
   */
  private timesOverlap(
    start1: string,
    end1: string,
    start2: string,
    end2: string
  ): boolean {
    // Convert time strings to minutes for easier comparison
    const start1Minutes = this.timeToMinutes(start1)
    const end1Minutes = this.timeToMinutes(end1)
    const start2Minutes = this.timeToMinutes(start2)
    const end2Minutes = this.timeToMinutes(end2)

    // Check for overlap: ranges overlap if start1 < end2 AND start2 < end1
    return start1Minutes < end2Minutes && start2Minutes < end1Minutes
  }

  /**
   * Convert HH:MM time string to minutes since midnight
   */
  private timeToMinutes(timeString: string): number {
    const [hours, minutes] = timeString.split(':').map(Number)
    return hours * 60 + minutes
  }

  /**
   * Convert minutes since midnight back to HH:MM format
   */
  private minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
  }

  /**
   * Check for conflicts when creating or updating a time block
   */
  async checkForConflicts(
    scheduleId: string,
    startTime: string,
    endTime: string,
    excludeTimeBlockId?: string
  ): Promise<ConflictCheck> {
    try {
      let query = this.supabase
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
          // Add all schedule items from conflicting time blocks
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
      console.error('Error checking for conflicts:', error)
      throw new Error('Failed to check for time conflicts')
    }
  }

  /**
   * Find the optimal time slot for a given duration
   */
  findOptimalTimeSlot(
    timeSlots: TimeSlot[],
    durationMinutes: number,
    preferredStartTime?: string
  ): TimeSlot | null {
    const neededSlots = Math.ceil(durationMinutes / 15) // Number of 15-min slots needed

    // Find consecutive available slots
    for (let i = 0; i <= timeSlots.length - neededSlots; i++) {
      const consecutiveSlots = timeSlots.slice(i, i + neededSlots)
      
      // Check if all slots in this range are available
      if (consecutiveSlots.every(slot => slot.available)) {
        const startTime = consecutiveSlots[0].start
        const endTime = consecutiveSlots[consecutiveSlots.length - 1].end

        // If no preferred time, return first available slot
        if (!preferredStartTime) {
          return {
            start: startTime,
            end: endTime,
            available: true
          }
        }

        // Check if this slot is at or after preferred time
        if (this.timeToMinutes(startTime) >= this.timeToMinutes(preferredStartTime)) {
          return {
            start: startTime,
            end: endTime,
            available: true
          }
        }
      }
    }

    return null // No suitable slot found
  }

  /**
   * Calculate total available time in minutes for a day
   */
  calculateAvailableTime(timeSlots: TimeSlot[]): number {
    return timeSlots
      .filter(slot => slot.available)
      .reduce((total, slot) => {
        const duration = this.timeToMinutes(slot.end) - this.timeToMinutes(slot.start)
        return total + duration
      }, 0)
  }

  /**
   * Get suggested time blocks based on typical daily patterns
   */
  getSuggestedTimeBlocks(): Array<{
    start: string
    end: string
    label: string
    category: string
  }> {
    return [
      // Morning blocks
      { start: '05:00', end: '06:00', label: 'Early Morning', category: 'morning' },
      { start: '06:00', end: '07:00', label: 'Morning Prep', category: 'morning' },
      { start: '07:00', end: '08:00', label: 'Breakfast', category: 'morning' },
      { start: '08:00', end: '09:00', label: 'Morning Commute/Start', category: 'morning' },
      
      // Work/Day blocks
      { start: '09:00', end: '12:00', label: 'Morning Work', category: 'work' },
      { start: '12:00', end: '13:00', label: 'Lunch', category: 'personal' },
      { start: '13:00', end: '17:00', label: 'Afternoon Work', category: 'work' },
      { start: '17:00', end: '18:00', label: 'Evening Commute/End', category: 'work' },
      
      // Evening blocks
      { start: '18:00', end: '19:00', label: 'Dinner Prep', category: 'evening' },
      { start: '19:00', end: '20:00', label: 'Dinner', category: 'evening' },
      { start: '20:00', end: '21:00', label: 'Family Time', category: 'evening' },
      { start: '21:00', end: '22:00', label: 'Wind Down', category: 'evening' },
      { start: '22:00', end: '23:00', label: 'Bedtime Prep', category: 'evening' }
    ]
  }

  /**
   * Round time to nearest 15-minute increment
   */
  roundToNearestSlot(time: string, roundUp: boolean = false): string {
    const minutes = this.timeToMinutes(time)
    const remainder = minutes % 15
    
    if (remainder === 0) {
      return time // Already aligned
    }

    const adjustment = roundUp ? 15 - remainder : -remainder
    const roundedMinutes = minutes + adjustment
    
    // Ensure we don't go negative or past 24 hours
    const finalMinutes = Math.max(0, Math.min(1439, roundedMinutes)) // 1439 = 23:59
    
    return this.minutesToTime(finalMinutes)
  }

  /**
   * Get duration between two times in minutes
   */
  getDurationMinutes(startTime: string, endTime: string): number {
    const startMinutes = this.timeToMinutes(startTime)
    const endMinutes = this.timeToMinutes(endTime)
    return endMinutes - startMinutes
  }

  /**
   * Add duration to a time
   */
  addDuration(time: string, durationMinutes: number): string {
    const minutes = this.timeToMinutes(time) + durationMinutes
    return this.minutesToTime(Math.min(1439, minutes)) // Cap at 23:59
  }

  /**
   * Check if a time falls within a time block
   */
  isTimeInBlock(time: string, blockStart: string, blockEnd: string): boolean {
    const timeMinutes = this.timeToMinutes(time)
    const startMinutes = this.timeToMinutes(blockStart)
    const endMinutes = this.timeToMinutes(blockEnd)
    
    return timeMinutes >= startMinutes && timeMinutes < endMinutes
  }
}

// Export singleton instance
export const timeBlockService = new TimeBlockService()