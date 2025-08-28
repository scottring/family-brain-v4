import { NextRequest } from 'next/server'
import { requireFamilyAccess, createErrorResponse, createSuccessResponse } from '@/lib/auth/server'
import { templateService } from '@/lib/services/TemplateService'
import { TemplateCategory } from '@/lib/types/database'

// GET /api/templates/[templateId] - Get a specific template
export async function GET(
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

    const template = await templateService.getTemplate(templateId)
    
    if (!template) {
      return createErrorResponse('Template not found', 404)
    }

    // Check access - user can access system templates or their family's templates
    if (!template.is_system && template.family_id !== user.familyId) {
      return createErrorResponse('Access denied to this template', 403)
    }

    return createSuccessResponse({ template })

  } catch (error) {
    console.error('Error fetching template:', error)
    return createErrorResponse('Failed to fetch template', 500)
  }
}

// PUT /api/templates/[templateId] - Update a template
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ templateId: string }> }
) {
  const { templateId } = await params;
  const { user, error } = await requireFamilyAccess(request)
  if (error) return error

  try {
    const body = await request.json()
    const { title, description, category, icon, color } = body

    if (!user.familyId) {
      return createErrorResponse('Family ID is required', 400)
    }

    // Validate category if provided
    if (category) {
      const validCategories: TemplateCategory[] = [
        'morning', 'evening', 'household', 'childcare', 'shopping', 
        'work', 'personal', 'health', 'travel', 'custom'
      ]
      
      if (!validCategories.includes(category)) {
        return createErrorResponse('Invalid template category', 400)
      }
    }

    // Check if template exists and user has access
    const existingTemplate = await templateService.getTemplate(templateId)
    if (!existingTemplate) {
      return createErrorResponse('Template not found', 404)
    }

    // Only allow editing family templates (not system templates)
    if (existingTemplate.is_system || existingTemplate.family_id !== user.familyId) {
      return createErrorResponse('Cannot edit this template', 403)
    }

    const template = await templateService.updateTemplate(templateId, {
      title,
      description,
      category,
      icon,
      color
    })

    return createSuccessResponse({ template })

  } catch (error) {
    console.error('Error updating template:', error)
    return createErrorResponse('Failed to update template', 500)
  }
}

// DELETE /api/templates/[templateId] - Delete a template
export async function DELETE(
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

    // Check if template exists and user has access
    const existingTemplate = await templateService.getTemplate(templateId)
    if (!existingTemplate) {
      return createErrorResponse('Template not found', 404)
    }

    // Only allow deleting family templates (not system templates)
    if (existingTemplate.is_system || existingTemplate.family_id !== user.familyId) {
      return createErrorResponse('Cannot delete this template', 403)
    }

    await templateService.deleteTemplate(templateId)
    return createSuccessResponse({ message: 'Template deleted successfully' })

  } catch (error) {
    console.error('Error deleting template:', error)
    return createErrorResponse('Failed to delete template', 500)
  }
}