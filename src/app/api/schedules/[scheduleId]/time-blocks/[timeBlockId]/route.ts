import { NextRequest } from 'next/server'
import { requireFamilyAccess, createErrorResponse, createSuccessResponse } from '@/lib/auth/server'
import { scheduleService } from '@/lib/services/ScheduleService'

// PUT /api/schedules/[scheduleId]/time-blocks/[timeBlockId] - Update a time block
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ scheduleId: string, timeBlockId: string }> }
) {
  const { scheduleId, timeBlockId } = await params;
  const { user, error } = await requireFamilyAccess(request)
  if (error) return error

  try {
    const body = await request.json()
    const { start_time, end_time } = body

    if (!user.familyId) {
      return createErrorResponse('Family ID is required', 400)
    }

    // Check for conflicts (excluding current time block)
    if (start_time && end_time) {
      const conflicts = await scheduleService.checkTimeConflicts(
        scheduleId,
        start_time,
        end_time,
        timeBlockId
      )

      if (conflicts.hasConflict) {
        return createErrorResponse(
          `Time conflict detected with existing items: ${conflicts.conflictingItems.map(item => item.title).join(', ')}`,
          409
        )
      }
    }

    const timeBlock = await scheduleService.updateTimeBlock(
      timeBlockId,
      { start_time, end_time }
    )

    return createSuccessResponse({ timeBlock })

  } catch (error) {
    console.error('Error updating time block:', error)
    return createErrorResponse('Failed to update time block', 500)
  }
}

// DELETE /api/schedules/[scheduleId]/time-blocks/[timeBlockId] - Delete a time block
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ scheduleId: string, timeBlockId: string }> }
) {
  const { timeBlockId } = await params;
  const { user, error } = await requireFamilyAccess(request)
  if (error) return error

  try {
    if (!user.familyId) {
      return createErrorResponse('Family ID is required', 400)
    }

    await scheduleService.deleteTimeBlock(timeBlockId)
    return createSuccessResponse({ message: 'Time block deleted successfully' })

  } catch (error) {
    console.error('Error deleting time block:', error)
    return createErrorResponse('Failed to delete time block', 500)
  }
}