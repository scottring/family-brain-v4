import { NextRequest } from 'next/server'
import { requireFamilyAccess, createErrorResponse, createSuccessResponse } from '@/lib/auth/server'
import { templateService } from '@/lib/services/TemplateService'
import { StepType } from '@/lib/types/database'

// POST /api/templates/[templateId]/steps - Create a template step
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ templateId: string }> }
) {
  const { templateId } = await params;
  const { user, error } = await requireFamilyAccess(request)
  if (error) return error

  try {
    const body = await request.json()
    const { title, description, step_type, order_position, metadata } = body

    if (!title || !step_type || order_position === undefined) {
      return createErrorResponse('Title, step type, and order position are required', 400)
    }

    if (!user.familyId) {
      return createErrorResponse('Family ID is required', 400)
    }

    // Validate step type
    const validStepTypes: StepType[] = ['task', 'note', 'decision', 'resource', 'reference']
    if (!validStepTypes.includes(step_type)) {
      return createErrorResponse('Invalid step type', 400)
    }

    // Check if template exists and user has access
    const template = await templateService.getTemplate(templateId)
    if (!template) {
      return createErrorResponse('Template not found', 404)
    }

    // Only allow editing family templates
    if (template.is_system || template.family_id !== user.familyId) {
      return createErrorResponse('Cannot edit this template', 403)
    }

    const templateStep = await templateService.createTemplateStep(templateId, {
      title,
      description,
      step_type,
      order_position,
      metadata: metadata || {}
    })

    return createSuccessResponse({ templateStep }, 201)

  } catch (error) {
    console.error('Error creating template step:', error)
    return createErrorResponse('Failed to create template step', 500)
  }
}