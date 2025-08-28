import { NextRequest } from 'next/server'
import { requireFamilyAccess, createErrorResponse, createSuccessResponse } from '@/lib/auth/server'
import { scheduleService } from '@/lib/services/ScheduleService'

// GET /api/schedules/stats - Get schedule statistics
export async function GET(request: NextRequest) {
  const { user, error } = await requireFamilyAccess(request)
  if (error) return error

  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (!user.familyId) {
      return createErrorResponse('Family ID is required', 400)
    }

    // Single date statistics
    if (date) {
      const stats = await scheduleService.getScheduleStats(user.familyId, date)
      return createSuccessResponse({ date, stats })
    }

    // Date range statistics
    if (startDate && endDate) {
      const schedules = await scheduleService.getSchedulesByDateRange(
        user.familyId,
        startDate,
        endDate
      )

      let totalItems = 0
      let totalCompletedItems = 0
      let totalTimeBlocks = 0
      let totalScheduledMinutes = 0
      const dailyStats = []

      for (const schedule of schedules) {
        const stats = await scheduleService.getScheduleStats(user.familyId, schedule.date)
        
        totalItems += stats.totalItems
        totalCompletedItems += stats.completedItems
        totalTimeBlocks += stats.totalTimeBlocks
        totalScheduledMinutes += stats.scheduledMinutes

        dailyStats.push({
          date: schedule.date,
          ...stats
        })
      }

      const overallCompletionRate = totalItems > 0 ? (totalCompletedItems / totalItems) * 100 : 0

      return createSuccessResponse({
        dateRange: { startDate, endDate },
        overall: {
          totalItems,
          completedItems: totalCompletedItems,
          completionRate: overallCompletionRate,
          totalTimeBlocks,
          scheduledMinutes: totalScheduledMinutes,
          scheduledHours: totalScheduledMinutes / 60
        },
        daily: dailyStats
      })
    }

    // Default to today's stats
    const today = new Date().toISOString().split('T')[0]
    const stats = await scheduleService.getScheduleStats(user.familyId, today)
    return createSuccessResponse({ date: today, stats })

  } catch (error) {
    console.error('Error fetching schedule statistics:', error)
    return createErrorResponse('Failed to fetch schedule statistics', 500)
  }
}