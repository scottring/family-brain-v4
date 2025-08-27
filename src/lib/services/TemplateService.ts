import { BaseService, ServiceResult, withResult } from './base/BaseService'
import { Tables, TablesInsert } from '@/lib/types/database'
import { FamilyService } from './FamilyService'

export interface Template extends Tables<'templates'> {}
export interface TemplateLineItem extends Tables<'template_line_items'> {}

/**
 * Template service for managing line-item templates
 */
export class TemplateService extends BaseService {
  private familyService: FamilyService

  constructor(supabase: any, familyService: FamilyService) {
    super(supabase)
    this.familyService = familyService
  }

  /**
   * Get user's templates with line items
   */
  async getTemplates(): Promise<ServiceResult<Template[]>> {
    return withResult(async () => {
      const userId = await this.requireAuth()

      const { data, error } = await this.supabase
        .from('templates')
        .select(`
          *,
          template_line_items (*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        this.handleError(error, 'Failed to get templates')
      }

      return data || []
    })
  }

  /**
   * Create a new template
   */
  async createTemplate(templateData: Omit<TablesInsert<'templates'>, 'user_id' | 'id'>): Promise<ServiceResult<Template>> {
    return withResult(async () => {
      const userId = await this.requireAuth()

      const { data, error } = await this.supabase
        .from('templates')
        .insert({
          ...templateData,
          user_id: userId
        })
        .select()
        .single()

      if (error) {
        this.handleError(error, 'Failed to create template')
      }

      return data
    })
  }
}