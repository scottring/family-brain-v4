import { BaseService, ServiceError, ServiceResult, withResult } from './base/BaseService'
import { Tables, TablesInsert, TablesUpdate } from '@/lib/types/database'
import { User } from '@supabase/supabase-js'

export interface SignUpData {
  email: string
  password: string
  fullName?: string
}

export interface SignInData {
  email: string
  password: string
}

export interface UserProfile extends Tables<'user_profiles'> {}

/**
 * Authentication service handling user registration, login, and profile management
 */
export class AuthService extends BaseService {
  
  /**
   * Sign up a new user with email and password
   */
  async signUp(signUpData: SignUpData): Promise<ServiceResult<{ user: User; profile: UserProfile }>> {
    return withResult(async () => {
      this.validateRequired(signUpData, ['email', 'password'], 'SignUp')

      // Create auth user
      const { data: authData, error: authError } = await this.supabase.auth.signUp({
        email: signUpData.email,
        password: signUpData.password,
        options: {
          data: {
            full_name: signUpData.fullName,
          }
        }
      })

      if (authError || !authData.user) {
        throw new ServiceError(`Sign up failed: ${authError?.message}`, 'AUTH_ERROR')
      }

      // Create user profile
      const profileData: TablesInsert<'user_profiles'> = {
        id: authData.user.id,
        email: signUpData.email,
        full_name: signUpData.fullName || null,
        preferences: {}
      }

      const { data: profile, error: profileError } = await this.supabase
        .from('user_profiles')
        .insert(profileData)
        .select()
        .single()

      if (profileError) {
        // Clean up auth user if profile creation fails
        await this.supabase.auth.admin.deleteUser(authData.user.id)
        throw new ServiceError(
          `Profile creation failed: ${profileError.message}`,
          'PROFILE_CREATION_ERROR'
        )
      }

      return { user: authData.user, profile }
    })
  }

  /**
   * Sign in with email and password
   */
  async signIn(signInData: SignInData): Promise<ServiceResult<{ user: User; profile: UserProfile }>> {
    return withResult(async () => {
      this.validateRequired(signInData, ['email', 'password'], 'SignIn')

      const { data: authData, error: authError } = await this.supabase.auth.signInWithPassword({
        email: signInData.email,
        password: signInData.password
      })

      if (authError || !authData.user) {
        throw new ServiceError(`Sign in failed: ${authError?.message}`, 'AUTH_ERROR')
      }

      // Get user profile
      const { data: profile, error: profileError } = await this.supabase
        .from('user_profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single()

      if (profileError) {
        throw new ServiceError(
          `Profile fetch failed: ${profileError.message}`,
          'PROFILE_FETCH_ERROR'
        )
      }

      await this.setUser(authData.user)

      return { user: authData.user, profile }
    })
  }

  /**
   * Sign out the current user
   */
  async signOut(): Promise<ServiceResult<void>> {
    return withResult(async () => {
      const { error } = await this.supabase.auth.signOut()
      
      if (error) {
        throw new ServiceError(`Sign out failed: ${error.message}`, 'AUTH_ERROR')
      }

      await this.setUser(null)
    })
  }

  /**
   * Get current session
   */
  async getSession(): Promise<ServiceResult<{ user: User; profile: UserProfile } | null>> {
    return withResult(async () => {
      const { data: { session }, error } = await this.supabase.auth.getSession()

      if (error) {
        throw new ServiceError(`Session fetch failed: ${error.message}`, 'AUTH_ERROR')
      }

      if (!session || !session.user) {
        return null
      }

      // Get user profile
      const { data: profile, error: profileError } = await this.supabase
        .from('user_profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (profileError) {
        throw new ServiceError(
          `Profile fetch failed: ${profileError.message}`,
          'PROFILE_FETCH_ERROR'
        )
      }

      return { user: session.user, profile }
    })
  }

  /**
   * Update user profile
   */
  async updateProfile(updates: Partial<TablesUpdate<'user_profiles'>>): Promise<ServiceResult<UserProfile>> {
    return withResult(async () => {
      const userId = await this.requireAuth()

      const { data: profile, error } = await this.supabase
        .from('user_profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single()

      if (error) {
        throw new ServiceError(
          `Profile update failed: ${error.message}`,
          'PROFILE_UPDATE_ERROR'
        )
      }

      return profile
    })
  }

  /**
   * Reset password
   */
  async resetPassword(email: string): Promise<ServiceResult<void>> {
    return withResult(async () => {
      if (!email) {
        throw new ServiceError('Email is required for password reset', 'VALIDATION_ERROR')
      }

      const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      })

      if (error) {
        throw new ServiceError(
          `Password reset failed: ${error.message}`,
          'PASSWORD_RESET_ERROR'
        )
      }
    })
  }

  /**
   * Update password
   */
  async updatePassword(newPassword: string): Promise<ServiceResult<void>> {
    return withResult(async () => {
      await this.requireAuth()

      if (!newPassword || newPassword.length < 6) {
        throw new ServiceError(
          'Password must be at least 6 characters long',
          'VALIDATION_ERROR'
        )
      }

      const { error } = await this.supabase.auth.updateUser({
        password: newPassword
      })

      if (error) {
        throw new ServiceError(
          `Password update failed: ${error.message}`,
          'PASSWORD_UPDATE_ERROR'
        )
      }
    })
  }

  /**
   * Check if email is available
   */
  async isEmailAvailable(email: string): Promise<ServiceResult<boolean>> {
    return withResult(async () => {
      if (!email) {
        throw new ServiceError('Email is required', 'VALIDATION_ERROR')
      }

      const { data, error } = await this.supabase
        .from('user_profiles')
        .select('id')
        .eq('email', email)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        throw new ServiceError(
          `Email availability check failed: ${error.message}`,
          'EMAIL_CHECK_ERROR'
        )
      }

      return !data // true if email is available (no user found)
    })
  }
}