import { BaseService, ServiceResult, withResult } from './base/BaseService'
import { Tables, TablesInsert } from '@/lib/types/database'
import { TaskService } from './TaskService'
import { TemplateService } from './TemplateService'

export interface DailyItinerary extends Tables<'daily_itineraries'> {}
export interface ItineraryTemplateSlot extends Tables<'itinerary_template_slots'> {}

/**
 * Itinerary service for managing daily itineraries (primary execution interface)
 */
export class ItineraryService extends BaseService {
  private taskService: TaskService
  private templateService: TemplateService

  constructor(supabase: any, taskService: TaskService, templateService: TemplateService) {
    super(supabase)
    this.taskService = taskService
    this.templateService = templateService
  }

  /**
   * Get daily itinerary for a specific date
   */
  async getDailyItinerary(date: string): Promise<ServiceResult<DailyItinerary | null>> {
    return withResult(async () => {
      const userId = await this.requireAuth()

      const { data, error } = await this.supabase
        .from('daily_itineraries')
        .select(`
          *,
          itinerary_template_slots (
            *,
            task_template_assignments (
              *,
              tasks (*),
              templates (
                *,
                template_line_items (*)
              )
            )
          )
        `)
        .eq('user_id', userId)
        .eq('date', date)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        this.handleError(error, 'Failed to get daily itinerary')
      }

      return data || null
    })
  }

  /**
   * Create or update daily itinerary
   */
  async createOrUpdateItinerary(
    date: string, 
    itineraryData: Partial<TablesInsert<'daily_itineraries'>>
  ): Promise<ServiceResult<DailyItinerary>> {
    return withResult(async () => {
      const userId = await this.requireAuth()

      const { data, error } = await this.supabase
        .from('daily_itineraries')
        .upsert({
          user_id: userId,
          date,
          ...itineraryData,
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        this.handleError(error, 'Failed to create or update itinerary')
      }

      return data
    })
  }
}