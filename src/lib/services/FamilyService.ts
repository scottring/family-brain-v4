import { BaseService, ServiceResult, withResult } from './base/BaseService'
import { Tables, TablesInsert } from '@/lib/types/database'
import { UserService } from './UserService'

export interface Family extends Tables<'families'> {}
export interface FamilyMember extends Tables<'family_members'> {}

/**
 * Family service for managing families and family memberships
 */
export class FamilyService extends BaseService {
  private userService: UserService

  constructor(supabase: any, userService: UserService) {
    super(supabase)
    this.userService = userService
  }

  /**
   * Get user's families
   */
  async getUserFamilies(): Promise<ServiceResult<Family[]>> {
    return withResult(async () => {
      const userId = await this.requireAuth()

      const { data, error } = await this.supabase
        .from('families')
        .select(`
          *,
          family_members!inner(*)
        `)
        .eq('family_members.user_id', userId)

      if (error) {
        this.handleError(error, 'Failed to get user families')
      }

      return data || []
    })
  }

  /**
   * Create a new family
   */
  async createFamily(familyData: { name: string; description?: string }): Promise<ServiceResult<Family>> {
    return withResult(async () => {
      const userId = await this.requireAuth()

      const { data: family, error: familyError } = await this.supabase
        .from('families')
        .insert({
          name: familyData.name,
          description: familyData.description,
          settings: {}
        })
        .select()
        .single()

      if (familyError) {
        this.handleError(familyError, 'Failed to create family')
      }

      // Add creator as admin
      const { error: memberError } = await this.supabase
        .from('family_members')
        .insert({
          family_id: family.id,
          user_id: userId,
          role: 'admin'
        })

      if (memberError) {
        this.handleError(memberError, 'Failed to add user as family admin')
      }

      return family
    })
  }
}