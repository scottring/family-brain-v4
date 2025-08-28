import { NextRequest } from 'next/server'
import { requireFamilyAccess, createErrorResponse, createSuccessResponse } from '@/lib/auth/server'
import { scheduleService } from '@/lib/services/ScheduleService'

// POST /api/schedule-items/bulk - Bulk operations on schedule items
export async function POST(request: NextRequest) {
  const { user, error } = await requireFamilyAccess(request)
  if (error) return error

  try {
    const body = await request.json()
    const { operation, itemIds } = body

    if (!operation || !itemIds || !Array.isArray(itemIds)) {
      return createErrorResponse('Operation and itemIds array are required', 400)
    }

    if (!user.familyId) {
      return createErrorResponse('Family ID is required', 400)
    }

    let result

    switch (operation) {
      case 'complete':
        result = await scheduleService.bulkCompleteItems(itemIds, user.id)
        break

      case 'uncomplete':
        // For bulk uncomplete, we'll need to add this to the service
        const uncompletePromises = itemIds.map(itemId => 
          scheduleService.uncompleteScheduleItem(itemId)
        )
        result = await Promise.all(uncompletePromises)
        break

      default:
        return createErrorResponse('Invalid operation. Supported operations: complete, uncomplete', 400)
    }

    return createSuccessResponse({ 
      operation,
      itemCount: itemIds.length,
      items: result
    })

  } catch (error) {
    console.error('Error performing bulk operation:', error)
    return createErrorResponse('Failed to perform bulk operation', 500)
  }
}