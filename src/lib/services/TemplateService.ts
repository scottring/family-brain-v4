import { createClient } from '@/lib/supabase/client'
import {
  Template,
  TemplateStep,
  TemplateWithSteps,
  TemplateInstance,
  TemplateInstanceStep,
  TemplateCategory,
  StepType
} from '@/lib/types/database'

export class TemplateService {
  private supabase = createClient()

  // Template CRUD operations
  async getTemplatesByFamily(familyId?: string): Promise<TemplateWithSteps[]> {
    try {
      let query = this.supabase
        .from('templates')
        .select(`
          *,
          template_steps (*)
        `)
        .order('category', { ascending: true })
        .order('title', { ascending: true })
        .order('order_position', { referencedTable: 'template_steps', ascending: true })

      if (familyId) {
        query = query.or(`family_id.eq.${familyId},is_system.eq.true`)
      } else {
        query = query.eq('is_system', true)
      }

      const { data, error } = await query

      if (error) throw error
      return data as TemplateWithSteps[] || []
    } catch (error) {
      console.error('Error fetching templates:', error)
      throw new Error('Failed to fetch templates')
    }
  }

  async getTemplatesByCategory(category: TemplateCategory, familyId?: string): Promise<TemplateWithSteps[]> {
    try {
      let query = this.supabase
        .from('templates')
        .select(`
          *,
          template_steps (*)
        `)
        .eq('category', category)
        .order('title', { ascending: true })
        .order('order_position', { referencedTable: 'template_steps', ascending: true })

      if (familyId) {
        query = query.or(`family_id.eq.${familyId},is_system.eq.true`)
      } else {
        query = query.eq('is_system', true)
      }

      const { data, error } = await query

      if (error) throw error
      return data as TemplateWithSteps[] || []
    } catch (error) {
      console.error('Error fetching templates by category:', error)
      throw new Error('Failed to fetch templates')
    }
  }

  async getTemplate(templateId: string): Promise<TemplateWithSteps | null> {
    try {
      const { data, error } = await this.supabase
        .from('templates')
        .select(`
          *,
          template_steps (*)
        `)
        .eq('id', templateId)
        .order('order_position', { referencedTable: 'template_steps', ascending: true })
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      return data as TemplateWithSteps || null
    } catch (error) {
      console.error('Error fetching template:', error)
      throw new Error('Failed to fetch template')
    }
  }

  async createTemplate(
    data: {
      family_id?: string
      title: string
      description?: string
      category: TemplateCategory
      icon?: string
      color?: string
      created_by?: string
    }
  ): Promise<TemplateWithSteps> {
    try {
      const { data: template, error } = await this.supabase
        .from('templates')
        .insert({
          is_system: false,
          version: 1,
          ...data
        })
        .select(`
          *,
          template_steps (*)
        `)
        .single()

      if (error) throw error
      return template
    } catch (error) {
      console.error('Error creating template:', error)
      throw new Error('Failed to create template')
    }
  }

  async updateTemplate(
    templateId: string,
    data: Partial<Pick<Template, 'title' | 'description' | 'category' | 'icon' | 'color'>>
  ): Promise<TemplateWithSteps> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')
      
      // Filter out undefined values
      const filteredData = Object.entries(data).reduce((acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = value
        }
        return acc
      }, {} as any)
      
      const updateData = {
        ...filteredData,
        updated_by: user.id,
        updated_at: new Date().toISOString()
      }
      
      console.log('Updating template with ID:', templateId)
      console.log('Update data:', updateData)
      
      const { data: template, error } = await this.supabase
        .from('templates')
        .update(updateData)
        .eq('id', templateId)
        .select(`
          *,
          template_steps (*)
        `)
        .single()

      if (error) {
        console.error('Supabase error updating template:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
          fullError: error
        })
        // Create a proper error object with the code
        const err = new Error(error.message || 'Failed to update template') as any
        err.code = error.code
        err.details = error.details
        throw err
      }
      
      if (!template) {
        throw new Error('No template returned after update')
      }
      
      return template
    } catch (error: any) {
      // Only log if it's not a "not found" error that we expect
      if (error?.code !== 'PGRST116') {
        console.error('Error updating template:', error)
        console.error('Error details:', {
          code: error?.code,
          message: error?.message,
          details: error?.details,
          stack: error?.stack
        })
      }
      // Re-throw the original error to preserve error code
      throw error
    }
  }

  async deleteTemplate(templateId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('templates')
        .delete()
        .eq('id', templateId)

      if (error) throw error
    } catch (error) {
      console.error('Error deleting template:', error)
      throw new Error('Failed to delete template')
    }
  }

  // Template Step operations
  async createTemplateStep(
    templateId: string,
    data: {
      title: string
      description?: string
      step_type: StepType
      order_position: number
      metadata?: Record<string, any>
    }
  ): Promise<TemplateStep> {
    try {
      const { data: step, error } = await this.supabase
        .from('template_steps')
        .insert({
          template_id: templateId,
          metadata: {},
          ...data
        })
        .select()
        .single()

      if (error) throw error
      return step
    } catch (error) {
      console.error('Error creating template step:', error)
      throw new Error('Failed to create template step')
    }
  }

  async updateTemplateStep(
    stepId: string,
    data: Partial<Pick<TemplateStep, 'title' | 'description' | 'step_type' | 'order_position' | 'metadata'>>
  ): Promise<TemplateStep> {
    try {
      const { data: step, error } = await this.supabase
        .from('template_steps')
        .update(data)
        .eq('id', stepId)
        .select()
        .single()

      if (error) throw error
      return step
    } catch (error) {
      console.error('Error updating template step:', error)
      throw new Error('Failed to update template step')
    }
  }

  async deleteTemplateStep(stepId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('template_steps')
        .delete()
        .eq('id', stepId)

      if (error) throw error
    } catch (error) {
      console.error('Error deleting template step:', error)
      throw new Error('Failed to delete template step')
    }
  }

  async reorderTemplateSteps(
    templateId: string,
    stepIds: string[]
  ): Promise<TemplateStep[]> {
    try {
      const updates = stepIds.map((stepId, index) => ({
        id: stepId,
        order_position: index
      }))

      const { data: steps, error } = await this.supabase
        .from('template_steps')
        .upsert(updates)
        .select()

      if (error) throw error
      return steps
    } catch (error) {
      console.error('Error reordering template steps:', error)
      throw new Error('Failed to reorder template steps')
    }
  }

  // Template Instance operations (when templates are used in schedules)
  async createTemplateInstance(
    templateId: string,
    scheduleItemId: string,
    customizations?: Record<string, any>
  ): Promise<TemplateInstance> {
    try {
      const { data: instance, error } = await this.supabase
        .from('template_instances')
        .insert({
          template_id: templateId,
          schedule_item_id: scheduleItemId,
          customizations: customizations || {}
        })
        .select(`
          *,
          template:templates (*),
          template_instance_steps (
            *,
            template_step:template_steps (*)
          )
        `)
        .single()

      if (error) throw error

      // Create instance steps for all template steps
      const template = await this.getTemplate(templateId)
      if (template?.template_steps) {
        const instanceSteps = template.template_steps.map(step => ({
          template_instance_id: instance.id,
          template_step_id: step.id
        }))

        await this.supabase
          .from('template_instance_steps')
          .insert(instanceSteps)
      }

      // Refetch with complete data
      const { data: completeInstance, error: fetchError } = await this.supabase
        .from('template_instances')
        .select(`
          *,
          template:templates (*),
          template_instance_steps (
            *,
            template_step:template_steps (*)
          )
        `)
        .eq('id', instance.id)
        .single()

      if (fetchError) throw fetchError
      return completeInstance as TemplateInstance
    } catch (error) {
      console.error('Error creating template instance:', error)
      throw new Error('Failed to create template instance')
    }
  }

  async completeTemplateInstanceStep(
    instanceStepId: string,
    userId: string,
    notes?: string
  ): Promise<TemplateInstanceStep> {
    try {
      const { data: step, error } = await this.supabase
        .from('template_instance_steps')
        .update({
          completed_at: new Date().toISOString(),
          completed_by: userId,
          notes: notes || null
        })
        .eq('id', instanceStepId)
        .select()
        .single()

      if (error) throw error
      return step
    } catch (error) {
      console.error('Error completing template instance step:', error)
      throw new Error('Failed to complete step')
    }
  }

  async uncompleteTemplateInstanceStep(instanceStepId: string): Promise<TemplateInstanceStep> {
    try {
      const { data: step, error } = await this.supabase
        .from('template_instance_steps')
        .update({
          completed_at: null,
          completed_by: null,
          notes: null
        })
        .eq('id', instanceStepId)
        .select()
        .single()

      if (error) throw error
      return step
    } catch (error) {
      console.error('Error uncompleting template instance step:', error)
      throw new Error('Failed to uncomplete step')
    }
  }

  // Utility methods
  async duplicateTemplate(templateId: string, familyId: string, userId: string): Promise<TemplateWithSteps> {
    try {
      const originalTemplate = await this.getTemplate(templateId)
      if (!originalTemplate) {
        throw new Error('Template not found')
      }

      // Create new template
      const newTemplate = await this.createTemplate({
        family_id: familyId,
        title: `${originalTemplate.title} (Copy)`,
        description: originalTemplate.description,
        category: originalTemplate.category,
        icon: originalTemplate.icon,
        color: originalTemplate.color,
        created_by: userId
      })

      // Copy all template steps
      const stepPromises = originalTemplate.template_steps.map(step =>
        this.createTemplateStep(newTemplate.id, {
          title: step.title,
          description: step.description,
          step_type: step.step_type,
          order_position: step.order_position,
          metadata: step.metadata
        })
      )

      await Promise.all(stepPromises)

      // Return complete template with steps
      return await this.getTemplate(newTemplate.id) as TemplateWithSteps
    } catch (error) {
      console.error('Error duplicating template:', error)
      throw new Error('Failed to duplicate template')
    }
  }

  // Search templates by title or description
  async searchTemplates(query: string, familyId?: string): Promise<TemplateWithSteps[]> {
    try {
      let dbQuery = this.supabase
        .from('templates')
        .select(`
          *,
          template_steps (*)
        `)
        .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
        .order('title', { ascending: true })
        .order('order_position', { referencedTable: 'template_steps', ascending: true })

      if (familyId) {
        dbQuery = dbQuery.or(`family_id.eq.${familyId},is_system.eq.true`)
      } else {
        dbQuery = dbQuery.eq('is_system', true)
      }

      const { data, error } = await dbQuery

      if (error) throw error
      return data as TemplateWithSteps[] || []
    } catch (error) {
      console.error('Error searching templates:', error)
      throw new Error('Failed to search templates')
    }
  }
}

// Export singleton instance
export const templateService = new TemplateService()