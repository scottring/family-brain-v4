import { NextRequest } from 'next/server'
import { requireFamilyAccess, createErrorResponse, createSuccessResponse } from '@/lib/auth/server'
import { scheduleService } from '@/lib/services/ScheduleService'

// POST /api/schedule-items/[itemId]/complete - Complete a schedule item
export async function POST(
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

    const scheduleItem = await scheduleService.completeScheduleItem(itemId, user.id)
    return createSuccessResponse({ scheduleItem })

  } catch (error) {
    console.error('Error completing schedule item:', error)
    return createErrorResponse('Failed to complete schedule item', 500)
  }
}

// DELETE /api/schedule-items/[itemId]/complete - Uncomplete a schedule item
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

    const scheduleItem = await scheduleService.uncompleteScheduleItem(itemId)
    return createSuccessResponse({ scheduleItem })

  } catch (error) {
    console.error('Error uncompleting schedule item:', error)
    return createErrorResponse('Failed to uncomplete schedule item', 500)
  }
}