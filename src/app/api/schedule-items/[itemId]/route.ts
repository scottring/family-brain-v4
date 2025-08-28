import { NextRequest } from 'next/server'
import { requireFamilyAccess, createErrorResponse, createSuccessResponse } from '@/lib/auth/server'
import { scheduleService } from '@/lib/services/ScheduleService'

// PUT /api/schedule-items/[itemId] - Update a schedule item
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const { itemId } = await params;
  const { user, error } = await requireFamilyAccess(request)
  if (error) return error

  try {
    const body = await request.json()
    const { title, description, order_position, metadata } = body

    if (!user.familyId) {
      return createErrorResponse('Family ID is required', 400)
    }

    const scheduleItem = await scheduleService.updateScheduleItem(itemId, {
      title,
      description,
      order_position,
      metadata
    })

    return createSuccessResponse({ scheduleItem })

  } catch (error) {
    console.error('Error updating schedule item:', error)
    return createErrorResponse('Failed to update schedule item', 500)
  }
}

// DELETE /api/schedule-items/[itemId] - Delete a schedule item
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const { itemId } = await params;
  const { user, error } = await requireFamilyAccess(request)
  if (error) return error

  try {
    if (!user.familyId) {
      return createErrorResponse('Family ID is required', 400)
    }

    await scheduleService.deleteScheduleItem(itemId)
    return createSuccessResponse({ message: 'Schedule item deleted successfully' })

  } catch (error) {
    console.error('Error deleting schedule item:', error)
    return createErrorResponse('Failed to delete schedule item', 500)
  }
}