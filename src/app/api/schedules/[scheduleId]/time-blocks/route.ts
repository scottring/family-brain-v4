import { NextRequest } from 'next/server'
import { requireFamilyAccess, createErrorResponse, createSuccessResponse } from '@/lib/auth/server'
import { scheduleService } from '@/lib/services/ScheduleService'

// POST /api/schedules/[scheduleId]/time-blocks - Create a time block
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ scheduleId: string }> }
) {
  const { scheduleId } = await params;
  const { user, error } = await requireFamilyAccess(request)
  if (error) return error

  try {
    const body = await request.json()
    const { start_time, end_time } = body

    if (!start_time || !end_time) {
      return createErrorResponse('Start time and end time are required', 400)
    }

    if (!user.familyId) {
      return createErrorResponse('Family ID is required', 400)
    }

    // Check for conflicts
    const conflicts = await scheduleService.checkTimeConflicts(
      scheduleId,
      start_time,
      end_time
    )

    if (conflicts.hasConflict) {
      return createErrorResponse(
        `Time conflict detected with existing items: ${conflicts.conflictingItems.map(item => item.title).join(', ')}`,
        409
      )
    }

    const timeBlock = await scheduleService.createTimeBlock(
      scheduleId,
      start_time,
      end_time
    )

    return createSuccessResponse({ timeBlock }, 201)

  } catch (error) {
    console.error('Error creating time block:', error)
    return createErrorResponse('Failed to create time block', 500)
  }
}