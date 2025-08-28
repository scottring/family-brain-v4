import { NextRequest } from 'next/server'
import { requireFamilyAccess, createErrorResponse, createSuccessResponse } from '@/lib/auth/server'
import { timeBlockService } from '@/lib/services/TimeBlockService'
import { scheduleService } from '@/lib/services/ScheduleService'

// GET /api/time-blocks - Generate time slots and get suggestions
export async function GET(request: NextRequest) {
  const { user, error } = await requireFamilyAccess(request)
  if (error) return error

  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const startHour = parseInt(searchParams.get('startHour') || '5')
    const endHour = parseInt(searchParams.get('endHour') || '23')
    const collapse = searchParams.get('collapse') === 'true'
    const minEmptyGroup = parseInt(searchParams.get('minEmptyGroup') || '4')
    const operation = searchParams.get('operation') // 'slots', 'suggestions', 'conflicts'

    if (!user.familyId) {
      return createErrorResponse('Family ID is required', 400)
    }

    // Get existing time blocks for the date if provided
    let existingTimeBlocks: any[] = []
    if (date) {
      const schedule = await scheduleService.getScheduleForDate(user.familyId, date)
      existingTimeBlocks = schedule?.time_blocks || []
    }

    if (operation === 'suggestions') {
      // Return suggested time block templates
      const suggestions = timeBlockService.getSuggestedTimeBlocks()
      return createSuccessResponse({ suggestions })
    }

    if (operation === 'conflicts') {
      // Check for conflicts - requires scheduleId, startTime, endTime in query params
      const scheduleId = searchParams.get('scheduleId')
      const startTime = searchParams.get('startTime')
      const endTime = searchParams.get('endTime')
      const excludeTimeBlockId = searchParams.get('excludeTimeBlockId')

      if (!scheduleId || !startTime || !endTime) {
        return createErrorResponse('scheduleId, startTime, and endTime are required for conflict checking', 400)
      }

      const conflicts = await timeBlockService.checkForConflicts(
        scheduleId,
        startTime,
        endTime,
        excludeTimeBlockId || undefined
      )

      return createSuccessResponse({ conflicts })
    }

    // Default: Generate time slots
    let timeSlots = timeBlockService.generateTimeSlots(startHour, endHour, existingTimeBlocks)
    
    if (collapse) {
      timeSlots = timeBlockService.collapseEmptySlots(timeSlots, minEmptyGroup)
    }

    // Calculate available time
    const availableMinutes = timeBlockService.calculateAvailableTime(timeSlots)

    return createSuccessResponse({ 
      timeSlots,
      availableMinutes,
      totalSlots: timeSlots.length,
      availableSlots: timeSlots.filter(slot => slot.available).length
    })

  } catch (error) {
    console.error('Error processing time blocks request:', error)
    return createErrorResponse('Failed to process time blocks request', 500)
  }
}

// POST /api/time-blocks - Find optimal time slot
export async function POST(request: NextRequest) {
  const { user, error } = await requireFamilyAccess(request)
  if (error) return error

  try {
    const body = await request.json()
    const { 
      date,
      durationMinutes, 
      preferredStartTime,
      startHour = 5,
      endHour = 23
    } = body

    if (!durationMinutes) {
      return createErrorResponse('Duration in minutes is required', 400)
    }

    if (!user.familyId) {
      return createErrorResponse('Family ID is required', 400)
    }

    // Get existing time blocks for the date
    let existingTimeBlocks: any[] = []
    if (date) {
      const schedule = await scheduleService.getScheduleForDate(user.familyId, date)
      existingTimeBlocks = schedule?.time_blocks || []
    }

    // Generate available time slots
    const timeSlots = timeBlockService.generateTimeSlots(startHour, endHour, existingTimeBlocks)
    
    // Find optimal slot
    const optimalSlot = timeBlockService.findOptimalTimeSlot(
      timeSlots,
      durationMinutes,
      preferredStartTime
    )

    if (!optimalSlot) {
      return createErrorResponse('No suitable time slot found for the requested duration', 404)
    }

    return createSuccessResponse({ 
      optimalSlot,
      durationMinutes,
      actualDuration: timeBlockService.getDurationMinutes(optimalSlot.start, optimalSlot.end)
    })

  } catch (error) {
    console.error('Error finding optimal time slot:', error)
    return createErrorResponse('Failed to find optimal time slot', 500)
  }
}