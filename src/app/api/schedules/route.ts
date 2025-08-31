import { NextRequest } from 'next/server'
import { requireFamilyAccess, createErrorResponse, createSuccessResponse } from '@/lib/auth/server'
import { createClient } from '@/lib/supabase/server'
import { ScheduleService } from '@/lib/services/ScheduleService'

// GET /api/schedules - Get schedules with optional date range and filters
export async function GET(request: NextRequest) {
  const { user, error } = await requireFamilyAccess(request)
  if (error) return error

  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const date = searchParams.get('date')
    const includeCompleted = searchParams.get('includeCompleted') === 'true'
    const templateCategories = searchParams.get('templateCategories')?.split(',')

    if (!user.familyId) {
      return createErrorResponse('Family ID is required', 400)
    }

    // Create service with server-side client
    const supabase = await createClient()
    const scheduleService = new ScheduleService(supabase)

    // Single date request
    if (date) {
      console.log('API: Fetching schedule for date:', date, 'familyId:', user.familyId)
      const schedule = await scheduleService.getScheduleForDate(user.familyId, date)
      console.log('API: Schedule result:', {
        found: !!schedule,
        scheduleId: schedule?.id,
        timeBlocksCount: schedule?.time_blocks?.length || 0
      })
      
      // Log detailed time block data
      if (schedule?.time_blocks) {
        schedule.time_blocks.forEach((tb: any, index: number) => {
          console.log(`API: Time block ${index}:`, {
            id: tb.id,
            time: `${tb.start_time}-${tb.end_time}`,
            itemsCount: tb.schedule_items?.length || 0,
            items: tb.schedule_items?.map((item: any) => ({
              id: item.id,
              title: item.title,
              type: item.item_type,
              hasTemplate: !!item.template,
              templateTitle: item.template?.title
            }))
          })
        })
      }
      
      return createSuccessResponse({ schedule })
    }

    // Date range request
    if (startDate && endDate) {
      const schedules = await scheduleService.getSchedulesByDateRange(
        user.familyId,
        startDate,
        endDate,
        {
          includeCompleted,
          templateCategoryFilter: templateCategories
        }
      )
      return createSuccessResponse({ schedules })
    }

    // Default to today's schedule
    const schedule = await scheduleService.getTodaysSchedule(user.familyId)
    return createSuccessResponse({ schedule })

  } catch (error) {
    console.error('Error fetching schedules:', error)
    return createErrorResponse('Failed to fetch schedules', 500)
  }
}

// POST /api/schedules - Create or update a schedule
export async function POST(request: NextRequest) {
  const { user, error } = await requireFamilyAccess(request)
  if (error) return error

  try {
    const body = await request.json()
    const { date, title, day_theme } = body

    if (!date) {
      return createErrorResponse('Date is required', 400)
    }

    if (!user.familyId) {
      return createErrorResponse('Family ID is required', 400)
    }

    const schedule = await scheduleService.createOrUpdateSchedule(
      user.familyId,
      date,
      { title, day_theme }
    )

    return createSuccessResponse({ schedule }, 201)

  } catch (error) {
    console.error('Error creating schedule:', error)
    return createErrorResponse('Failed to create schedule', 500)
  }
}