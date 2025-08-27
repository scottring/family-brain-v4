import { BaseService, ServiceResult, withResult } from './base/BaseService'
import { Tables, TablesUpdate } from '@/lib/types/database'

export interface UserProfile extends Tables<'user_profiles'> {}

/**
 * User service for managing user profiles and preferences
 */
export class UserService extends BaseService {
  
  /**
   * Get current user profile
   */
  async getProfile(): Promise<ServiceResult<UserProfile>> {
    return withResult(async () => {
      const userId = await this.requireAuth()

      const { data, error } = await this.supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        this.handleError(error, 'Failed to get user profile')
      }

      return data
    })
  }

  /**
   * Update user profile
   */
  async updateProfile(updates: Partial<TablesUpdate<'user_profiles'>>): Promise<ServiceResult<UserProfile>> {
    return withResult(async () => {
      const userId = await this.requireAuth()

      const { data, error } = await this.supabase
        .from('user_profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single()

      if (error) {
        this.handleError(error, 'Failed to update user profile')
      }

      return data
    })
  }
}