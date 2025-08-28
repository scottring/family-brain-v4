import { NextRequest } from 'next/server'
import { requireFamilyAccess, createErrorResponse, createSuccessResponse } from '@/lib/auth/server'
import { templateService } from '@/lib/services/TemplateService'
import { TemplateCategory } from '@/lib/types/database'

// GET /api/templates - Get templates with optional filtering
export async function GET(request: NextRequest) {
  const { user, error } = await requireFamilyAccess(request)
  if (error) return error

  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') as TemplateCategory
    const search = searchParams.get('search')

    if (!user.familyId) {
      return createErrorResponse('Family ID is required', 400)
    }

    let templates

    if (search) {
      templates = await templateService.searchTemplates(search, user.familyId)
    } else if (category) {
      templates = await templateService.getTemplatesByCategory(category, user.familyId)
    } else {
      templates = await templateService.getTemplatesByFamily(user.familyId)
    }

    return createSuccessResponse({ templates })

  } catch (error) {
    console.error('Error fetching templates:', error)
    return createErrorResponse('Failed to fetch templates', 500)
  }
}

// POST /api/templates - Create a template
export async function POST(request: NextRequest) {
  const { user, error } = await requireFamilyAccess(request)
  if (error) return error

  try {
    const body = await request.json()
    const { title, description, category, icon, color } = body

    if (!title || !category) {
      return createErrorResponse('Title and category are required', 400)
    }

    if (!user.familyId) {
      return createErrorResponse('Family ID is required', 400)
    }

    // Validate category
    const validCategories: TemplateCategory[] = [
      'morning', 'evening', 'household', 'childcare', 'shopping', 
      'work', 'personal', 'health', 'travel', 'custom'
    ]
    
    if (!validCategories.includes(category)) {
      return createErrorResponse('Invalid template category', 400)
    }

    const template = await templateService.createTemplate({
      family_id: user.familyId,
      title,
      description,
      category,
      icon,
      color,
      created_by: user.id
    })

    return createSuccessResponse({ template }, 201)

  } catch (error) {
    console.error('Error creating template:', error)
    return createErrorResponse('Failed to create template', 500)
  }
}