import { BaseService, ServiceResult, withResult } from './base/BaseService'
import { Tables, TablesInsert, TablesUpdate } from '@/lib/types/database'
import { FamilyService } from './FamilyService'

export interface Goal extends Tables<'goals'> {}
export interface Project extends Tables<'projects'> {}
export interface Task extends Tables<'tasks'> {}

/**
 * Task service for managing the Goals → Projects → Tasks hierarchy
 */
export class TaskService extends BaseService {
  private familyService: FamilyService

  constructor(supabase: any, familyService: FamilyService) {
    super(supabase)
    this.familyService = familyService
  }

  /**
   * Get user's goals with projects and tasks
   */
  async getGoalsWithHierarchy(): Promise<ServiceResult<Goal[]>> {
    return withResult(async () => {
      const userId = await this.requireAuth()

      const { data, error } = await this.supabase
        .from('goals')
        .select(`
          *,
          projects (
            *,
            tasks (*)
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        this.handleError(error, 'Failed to get goals hierarchy')
      }

      return data || []
    })
  }

  /**
   * Create a new goal
   */
  async createGoal(goalData: Omit<TablesInsert<'goals'>, 'user_id' | 'id'>): Promise<ServiceResult<Goal>> {
    return withResult(async () => {
      const userId = await this.requireAuth()

      const { data, error } = await this.supabase
        .from('goals')
        .insert({
          ...goalData,
          user_id: userId
        })
        .select()
        .single()

      if (error) {
        this.handleError(error, 'Failed to create goal')
      }

      return data
    })
  }

  /**
   * Create a new project under a goal
   */
  async createProject(projectData: Omit<TablesInsert<'projects'>, 'user_id' | 'id'>): Promise<ServiceResult<Project>> {
    return withResult(async () => {
      const userId = await this.requireAuth()

      const { data, error } = await this.supabase
        .from('projects')
        .insert({
          ...projectData,
          user_id: userId
        })
        .select()
        .single()

      if (error) {
        this.handleError(error, 'Failed to create project')
      }

      return data
    })
  }

  /**
   * Create a new task under a project
   */
  async createTask(taskData: Omit<TablesInsert<'tasks'>, 'user_id' | 'id'>): Promise<ServiceResult<Task>> {
    return withResult(async () => {
      const userId = await this.requireAuth()

      const { data, error } = await this.supabase
        .from('tasks')
        .insert({
          ...taskData,
          user_id: userId
        })
        .select()
        .single()

      if (error) {
        this.handleError(error, 'Failed to create task')
      }

      return data
    })
  }
}