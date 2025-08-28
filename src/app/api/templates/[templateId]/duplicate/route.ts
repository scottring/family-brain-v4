import { NextRequest } from 'next/server'
import { requireFamilyAccess, createErrorResponse, createSuccessResponse } from '@/lib/auth/server'
import { templateService } from '@/lib/services/TemplateService'

// POST /api/templates/[templateId]/duplicate - Duplicate a template
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ templateId: string }> }
) {
  const { templateId } = await params;
  const { user, error } = await requireFamilyAccess(request)
  if (error) return error

  try {
    if (!user.familyId) {
      return createErrorResponse('Family ID is required', 400)
    }

    // Check if template exists and user has access (can duplicate system or family templates)
    const template = await templateService.getTemplate(templateId)
    if (!template) {
      return createErrorResponse('Template not found', 404)
    }

    // User can duplicate system templates or their family's templates
    if (!template.is_system && template.family_id !== user.familyId) {
      return createErrorResponse('Access denied to this template', 403)
    }

    const duplicatedTemplate = await templateService.duplicateTemplate(
      templateId,
      user.familyId,
      user.id
    )

    return createSuccessResponse({ template: duplicatedTemplate }, 201)

  } catch (error) {
    console.error('Error duplicating template:', error)
    return createErrorResponse('Failed to duplicate template', 500)
  }
}