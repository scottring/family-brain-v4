import { NextRequest } from 'next/server'
import { requireFamilyAccess, createErrorResponse, createSuccessResponse } from '@/lib/auth/server'
import { scheduleService } from '@/lib/services/ScheduleService'
import { templateService } from '@/lib/services/TemplateService'
import { ItemType } from '@/lib/types/database'

// POST /api/schedule-items - Create a schedule item
export async function POST(request: NextRequest) {
  const { user, error } = await requireFamilyAccess(request)
  if (error) return error

  try {
    const body = await request.json()
    const { 
      time_block_id, 
      title, 
      description, 
      item_type, 
      template_id, 
      order_position, 
      metadata 
    } = body

    if (!time_block_id || !title) {
      return createErrorResponse('Time block ID and title are required', 400)
    }

    if (!user.familyId) {
      return createErrorResponse('Family ID is required', 400)
    }

    // Validate item type
    const validItemTypes: ItemType[] = ['simple', 'procedure', 'template_ref']
    if (item_type && !validItemTypes.includes(item_type)) {
      return createErrorResponse('Invalid item type', 400)
    }

    const scheduleItem = await scheduleService.createScheduleItem(time_block_id, {
      title,
      description,
      item_type: item_type || 'simple',
      template_id,
      order_position,
      metadata
    })

    // If this is a template reference, create the template instance
    if (item_type === 'template_ref' && template_id) {
      await templateService.createTemplateInstance(
        template_id,
        scheduleItem.id
      )
    }

    return createSuccessResponse({ scheduleItem }, 201)

  } catch (error) {
    console.error('Error creating schedule item:', error)
    return createErrorResponse('Failed to create schedule item', 500)
  }
}