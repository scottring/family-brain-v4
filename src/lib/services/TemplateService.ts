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
      // Get user for created_by field
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) {
        console.warn('No authenticated user found')
        return []
      }

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

      if (error) {
        console.error('Template fetch error:', error)
        throw error
      }
      
      // If no templates exist, create some default system templates
      if (!data || data.length === 0) {
        console.log('No templates found, creating default system templates')
        await this.createDefaultSystemTemplates(user.id)
        // Re-fetch after creating
        const { data: newData } = await query
        return newData as TemplateWithSteps[] || []
      }
      
      // Ensure each template has template_steps array
      const templates = (data as TemplateWithSteps[]) || []
      return templates.map(template => ({
        ...template,
        template_steps: template.template_steps || []
      }))
    } catch (error) {
      console.error('Error fetching templates:', error)
      return [] // Return empty array instead of throwing
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
      // Ensure each template has template_steps array
      const templates = (data as TemplateWithSteps[]) || []
      return templates.map(template => ({
        ...template,
        template_steps: template.template_steps || []
      }))
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
      console.log('Attempting to delete template:', templateId)
      
      const { data, error } = await this.supabase
        .from('templates')
        .delete()
        .eq('id', templateId)
        .select()
      
      if (error) {
        console.error('Supabase delete error:', error)
        throw error
      }
      
      console.log('Delete result:', data)
      
      // If no rows were deleted, check if template exists
      if (!data || data.length === 0) {
        const { data: existingTemplate } = await this.supabase
          .from('templates')
          .select('id, title, is_system, created_by')
          .eq('id', templateId)
          .single()
        
        if (existingTemplate) {
          console.error('Template still exists after delete attempt:', existingTemplate)
          throw new Error('Failed to delete template - permission denied')
        } else {
          console.log('Template successfully deleted or did not exist')
        }
      }
    } catch (error) {
      console.error('Error deleting template:', error)
      throw error
    }
  }

  private async createDefaultSystemTemplates(userId: string): Promise<void> {
    try {
      const systemTemplates = [
        {
          title: 'Morning Routine',
          description: 'Start your day right',
          category: 'morning' as TemplateCategory,
          icon: '🌅',
          is_system: true,
          created_by: userId
        },
        {
          title: 'Evening Routine',
          description: 'Wind down for the night',
          category: 'evening' as TemplateCategory,
          icon: '🌙',
          is_system: true,
          created_by: userId
        },
        {
          title: 'Quick Clean',
          description: '15-minute tidy up',
          category: 'household' as TemplateCategory,
          icon: '🧹',
          is_system: true,
          created_by: userId
        },
        {
          title: 'Meal Prep',
          description: 'Prepare meals for the week',
          category: 'household' as TemplateCategory,
          icon: '🍱',
          is_system: true,
          created_by: userId
        },
        {
          title: 'Homework Time',
          description: 'Dedicated study period',
          category: 'childcare' as TemplateCategory,
          icon: '📚',
          is_system: true,
          created_by: userId
        },
        {
          title: 'Grocery Shopping',
          description: 'Weekly shopping trip',
          category: 'shopping' as TemplateCategory,
          icon: '🛒',
          is_system: true,
          created_by: userId
        },
        {
          title: 'Work Focus Block',
          description: 'Deep work session',
          category: 'work' as TemplateCategory,
          icon: '💼',
          is_system: true,
          created_by: userId
        },
        {
          title: 'Exercise',
          description: 'Daily workout',
          category: 'health' as TemplateCategory,
          icon: '🏃',
          is_system: true,
          created_by: userId
        }
      ]

      for (const template of systemTemplates) {
        const { error } = await this.supabase
          .from('templates')
          .insert(template)

        if (error) {
          console.error('Error creating system template:', error)
        }
      }

      console.log('Created default system templates')
    } catch (error) {
      console.error('Error creating default system templates:', error)
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
      // First check if a template instance already exists for this schedule item
      const { data: existingInstance, error: checkError } = await this.supabase
        .from('template_instances')
        .select('*')
        .eq('schedule_item_id', scheduleItemId)
        .maybeSingle()  // Use maybeSingle() to avoid error when no row exists

      if (existingInstance) {
        console.log('Template instance already exists for schedule item:', scheduleItemId)
        // Update the existing instance instead of creating a new one
        const { data: updatedInstance, error: updateError } = await this.supabase
          .from('template_instances')
          .update({
            template_id: templateId,
            customizations: customizations || {}
          })
          .eq('id', existingInstance.id)
          .select('id')
          .single()

        if (updateError) {
          console.error('Error updating template instance:', updateError)
          throw updateError
        }

        return updatedInstance as TemplateInstance
      }

      // No existing instance, create a new one
      const { data: insertedData, error: insertError } = await this.supabase
        .from('template_instances')
        .insert({
          template_id: templateId,
          schedule_item_id: scheduleItemId,
          customizations: customizations || {}
        })
        .select('id')
        .single()

      if (insertError) {
        // Handle duplicate key error gracefully
        if (insertError.code === '23505') {
          console.log('Template instance already exists (race condition), fetching existing')
          const { data: existing } = await this.supabase
            .from('template_instances')
            .select('*')
            .eq('schedule_item_id', scheduleItemId)
            .single()
          
          if (existing) {
            return existing as TemplateInstance
          }
        }
        
        console.error('Error inserting template instance:', JSON.stringify(insertError, null, 2))
        throw insertError
      }

      if (!insertedData || !insertedData.id) {
        console.error('No ID returned from insert:', insertedData)
        throw new Error('Failed to create template instance - no ID returned')
      }

      console.log('Successfully inserted template instance with ID:', insertedData.id)

      // Now fetch the complete instance with relations
      const { data: instance, error } = await this.supabase
        .from('template_instances')
        .select(`
          *,
          template:templates (*),
          template_instance_steps (
            *,
            template_step:template_steps (*)
          )
        `)
        .eq('id', insertedData.id)
        .single()

      if (error) {
        console.error('Error fetching template instance after insert:', error)
        // Return a minimal instance if fetch fails but insert succeeded
        return insertedData as TemplateInstance
      }

      // Create instance steps for all template steps with assignee support
      const template = await this.getTemplate(templateId)
      if (template?.template_steps && template.template_steps.length > 0) {
        // Get current user for default assignment
        const { data: { user } } = await this.supabase.auth.getUser()
        
        // Get family members if needed for multi-member assignments
        let familyMembers: any[] = []
        if (template.family_id) {
          const { data: members } = await this.supabase
            .from('family_members')
            .select('user_id, role, user:user_profiles(id, full_name)')
            .eq('family_id', template.family_id)
          
          familyMembers = members || []
        }
        
        const instanceSteps: any[] = []
        
        for (const step of template.template_steps) {
          // For now, create basic instance steps without assigned_to
          // TODO: Re-enable assigned_to when column is confirmed in production
          instanceSteps.push({
            template_instance_id: instance.id,
            template_step_id: step.id
            // assigned_to field commented out until migration is confirmed
            // assigned_to: null
          })
        }

        if (instanceSteps.length > 0) {
          const { error: stepsError } = await this.supabase
            .from('template_instance_steps')
            .insert(instanceSteps)
          
          if (stepsError) {
            console.error('Error creating instance steps:', JSON.stringify(stepsError, null, 2))
            // Don't throw here, continue with what we have
          }
        }
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

      if (fetchError) {
        console.error('Error fetching complete instance:', JSON.stringify(fetchError, null, 2))
        throw fetchError
      }
      
      return completeInstance as TemplateInstance
    } catch (error: any) {
      console.error('Error creating template instance - full error:', error)
      console.error('Error type:', typeof error)  
      console.error('Error stringify:', JSON.stringify(error, null, 2))
      console.error('Error stack:', error?.stack)
      throw error
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
      // Ensure each template has template_steps array
      const templates = (data as TemplateWithSteps[]) || []
      return templates.map(template => ({
        ...template,
        template_steps: template.template_steps || []
      }))
    } catch (error) {
      console.error('Error searching templates:', error)
      throw new Error('Failed to search templates')
    }
  }
}

// Export singleton instance
export const templateService = new TemplateService()