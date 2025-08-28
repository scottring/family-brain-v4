import { NextRequest } from 'next/server'
import { requireFamilyAccess, createErrorResponse, createSuccessResponse } from '@/lib/auth/server'
import { scheduleService } from '@/lib/services/ScheduleService'

// GET /api/today - Get today's schedule with current activity and upcoming items
export async function GET(request: NextRequest) {
  const { user, error } = await requireFamilyAccess(request)
  if (error) return error

  try {
    const { searchParams } = new URL(request.url)
    const includeStats = searchParams.get('includeStats') === 'true'
    const upcomingLimit = parseInt(searchParams.get('upcomingLimit') || '5')

    if (!user.familyId) {
      return createErrorResponse('Family ID is required', 400)
    }

    // Get today's schedule
    const schedule = await scheduleService.getTodaysSchedule(user.familyId)
    
    // Get current activity
    const currentActivity = await scheduleService.getCurrentActivity(user.familyId)
    
    // Get upcoming activities
    const upcomingActivities = await scheduleService.getUpcomingActivities(
      user.familyId, 
      upcomingLimit
    )

    // Get schedule statistics if requested
    let stats = null
    if (includeStats && schedule) {
      const today = new Date().toISOString().split('T')[0]
      stats = await scheduleService.getScheduleStats(user.familyId, today)
    }

    return createSuccessResponse({
      schedule,
      currentActivity,
      upcomingActivities,
      stats
    })

  } catch (error) {
    console.error('Error fetching today\'s data:', error)
    return createErrorResponse('Failed to fetch today\'s data', 500)
  }
}