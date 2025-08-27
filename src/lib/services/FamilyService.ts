import { createClient } from '@/lib/supabase/client'
import {
  Family,
  FamilyMember,
  UserProfile,
  UserRole
} from '@/lib/types/database'

export class FamilyService {
  private supabase = createClient()

  // Family operations
  async getFamilyById(familyId: string): Promise<Family | null> {
    try {
      const { data, error } = await this.supabase
        .from('families')
        .select('*')
        .eq('id', familyId)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      return data || null
    } catch (error) {
      console.error('Error fetching family:', error)
      throw new Error('Failed to fetch family')
    }
  }

  async getFamiliesByUser(userId: string): Promise<Family[]> {
    try {
      const { data, error } = await this.supabase
        .from('families')
        .select(`
          *,
          family_members!inner (user_id)
        `)
        .eq('family_members.user_id', userId)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching user families:', error)
      throw new Error('Failed to fetch families')
    }
  }

  async createFamily(name: string, ownerId: string): Promise<Family> {
    try {
      // Create family
      const { data: family, error: familyError } = await this.supabase
        .from('families')
        .insert({ name })
        .select()
        .single()

      if (familyError) throw familyError

      // Add owner as family member
      const { error: memberError } = await this.supabase
        .from('family_members')
        .insert({
          family_id: family.id,
          user_id: ownerId,
          role: 'owner'
        })

      if (memberError) throw memberError

      return family
    } catch (error) {
      console.error('Error creating family:', error)
      throw new Error('Failed to create family')
    }
  }

  async updateFamily(
    familyId: string, 
    data: Partial<Pick<Family, 'name' | 'settings'>>
  ): Promise<Family> {
    try {
      const { data: family, error } = await this.supabase
        .from('families')
        .update(data)
        .eq('id', familyId)
        .select()
        .single()

      if (error) throw error
      return family
    } catch (error) {
      console.error('Error updating family:', error)
      throw new Error('Failed to update family')
    }
  }

  // Family Member operations
  async getFamilyMembers(familyId: string): Promise<(FamilyMember & { user_profile: UserProfile })[]> {
    try {
      const { data, error } = await this.supabase
        .from('family_members')
        .select(`
          *,
          user_profile:user_profiles (*)
        `)
        .eq('family_id', familyId)
        .order('joined_at', { ascending: true })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching family members:', error)
      throw new Error('Failed to fetch family members')
    }
  }

  async addFamilyMember(
    familyId: string,
    userId: string,
    role: UserRole = 'member'
  ): Promise<FamilyMember> {
    try {
      const { data: member, error } = await this.supabase
        .from('family_members')
        .insert({
          family_id: familyId,
          user_id: userId,
          role
        })
        .select()
        .single()

      if (error) throw error
      return member
    } catch (error) {
      console.error('Error adding family member:', error)
      throw new Error('Failed to add family member')
    }
  }

  async updateFamilyMemberRole(
    memberId: string,
    role: UserRole
  ): Promise<FamilyMember> {
    try {
      const { data: member, error } = await this.supabase
        .from('family_members')
        .update({ role })
        .eq('id', memberId)
        .select()
        .single()

      if (error) throw error
      return member
    } catch (error) {
      console.error('Error updating family member role:', error)
      throw new Error('Failed to update member role')
    }
  }

  async removeFamilyMember(memberId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('family_members')
        .delete()
        .eq('id', memberId)

      if (error) throw error
    } catch (error) {
      console.error('Error removing family member:', error)
      throw new Error('Failed to remove family member')
    }
  }

  // User Profile operations
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await this.supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      return data || null
    } catch (error) {
      console.error('Error fetching user profile:', error)
      throw new Error('Failed to fetch user profile')
    }
  }

  async createUserProfile(data: {
    id: string
    email: string
    full_name?: string
    avatar_url?: string
    preferences?: Record<string, any>
  }): Promise<UserProfile> {
    try {
      const { data: profile, error } = await this.supabase
        .from('user_profiles')
        .insert({
          preferences: {},
          ...data
        })
        .select()
        .single()

      if (error) throw error
      return profile
    } catch (error) {
      console.error('Error creating user profile:', error)
      throw new Error('Failed to create user profile')
    }
  }

  async updateUserProfile(
    userId: string,
    data: Partial<Pick<UserProfile, 'full_name' | 'avatar_url' | 'preferences'>>
  ): Promise<UserProfile> {
    try {
      const { data: profile, error } = await this.supabase
        .from('user_profiles')
        .update(data)
        .eq('id', userId)
        .select()
        .single()

      if (error) throw error
      return profile
    } catch (error) {
      console.error('Error updating user profile:', error)
      throw new Error('Failed to update user profile')
    }
  }

  // Utility methods
  async getCurrentUserFamilies(): Promise<Family[]> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) return []

      return await this.getFamiliesByUser(user.id)
    } catch (error) {
      console.error('Error fetching current user families:', error)
      return []
    }
  }

  async getCurrentUserProfile(): Promise<UserProfile | null> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) return null

      return await this.getUserProfile(user.id)
    } catch (error) {
      console.error('Error fetching current user profile:', error)
      return null
    }
  }

  async getUserFamilies(userId: string): Promise<Family[]> {
    return await this.getFamiliesByUser(userId)
  }

  async getUserFamilyRole(userId: string, familyId: string): Promise<UserRole | null> {
    try {
      const { data, error } = await this.supabase
        .from('family_members')
        .select('role')
        .eq('user_id', userId)
        .eq('family_id', familyId)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      return data?.role || null
    } catch (error) {
      console.error('Error getting user family role:', error)
      return null
    }
  }

  async canUserEditFamily(userId: string, familyId: string): Promise<boolean> {
    const role = await this.getUserFamilyRole(userId, familyId)
    return role === 'owner'
  }

  async searchUsersByEmail(email: string): Promise<UserProfile[]> {
    try {
      const { data, error } = await this.supabase
        .from('user_profiles')
        .select('*')
        .ilike('email', `%${email}%`)
        .limit(5)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error searching users:', error)
      throw new Error('Failed to search users')
    }
  }
}

// Export singleton instance
export const familyService = new FamilyService()