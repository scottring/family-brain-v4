import { createClient } from '@/lib/supabase/server'
import { Database, Tables, TablesInsert, TablesUpdate } from '@/lib/types/database'
import { User } from '@supabase/supabase-js'

export type SupabaseClient = ReturnType<typeof createClient>

/**
 * Base service class providing common patterns for all services
 * Includes error handling, authentication, and common database operations
 */
export abstract class BaseService {
  protected supabase: SupabaseClient
  protected user: User | null = null

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase
  }

  /**
   * Set the current user for this service instance
   */
  async setUser(user: User | null) {
    this.user = user
  }

  /**
   * Get the current authenticated user
   */
  protected async getCurrentUser(): Promise<User> {
    if (this.user) {
      return this.user
    }

    const { data: { user }, error } = await this.supabase.auth.getUser()
    
    if (error || !user) {
      throw new ServiceError('Authentication required', 'UNAUTHENTICATED')
    }

    this.user = user
    return user
  }

  /**
   * Protected method to require authentication
   */
  protected async requireAuth(): Promise<string> {
    const user = await this.getCurrentUser()
    return user.id
  }

  /**
   * Handle service errors with consistent error formatting
   */
  protected handleError(error: unknown, context: string): never {
    if (error instanceof ServiceError) {
      throw error
    }

    if (error instanceof Error) {
      throw new ServiceError(
        `${context}: ${error.message}`,
        'INTERNAL_ERROR',
        error
      )
    }

    throw new ServiceError(
      `${context}: Unknown error occurred`,
      'INTERNAL_ERROR'
    )
  }

  /**
   * Validate required fields for operations
   */
  protected validateRequired<T>(
    data: Partial<T>,
    fields: (keyof T)[],
    operation: string
  ): void {
    const missing = fields.filter(field => {
      const value = data[field]
      return value === undefined || value === null || value === ''
    })

    if (missing.length > 0) {
      throw new ServiceError(
        `${operation}: Missing required fields: ${missing.join(', ')}`,
        'VALIDATION_ERROR'
      )
    }
  }

  /**
   * Generic method to check if user can access a resource
   */
  protected async canAccess<T extends Record<string, any>>(
    tableName: keyof Database['public']['Tables'],
    id: string,
    userId?: string
  ): Promise<boolean> {
    const currentUserId = userId || (await this.getCurrentUser()).id

    const { data, error } = await this.supabase
      .from(tableName as any)
      .select('user_id, family_id, is_shared, sharing_level')
      .eq('id', id)
      .single()

    if (error || !data) {
      return false
    }

    // Owner can always access
    if (data.user_id === currentUserId) {
      return true
    }

    // If not shared, only owner can access
    if (!data.is_shared || !data.family_id) {
      return false
    }

    // Check if user is in the same family
    const { data: familyMember } = await this.supabase
      .from('family_members')
      .select('id')
      .eq('family_id', data.family_id)
      .eq('user_id', currentUserId)
      .single()

    return !!familyMember
  }
}

/**
 * Custom service error class
 */
export class ServiceError extends Error {
  public readonly code: string
  public readonly originalError?: Error

  constructor(
    message: string,
    code: string = 'UNKNOWN_ERROR',
    originalError?: Error
  ) {
    super(message)
    this.name = 'ServiceError'
    this.code = code
    this.originalError = originalError

    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ServiceError)
    }
  }

  /**
   * Convert error to JSON for API responses
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      stack: this.stack,
    }
  }
}

/**
 * Result wrapper for service operations
 */
export type ServiceResult<T> = {
  success: true
  data: T
} | {
  success: false
  error: ServiceError
}

/**
 * Helper to create successful results
 */
export function createSuccessResult<T>(data: T): ServiceResult<T> {
  return { success: true, data }
}

/**
 * Helper to create error results
 */
export function createErrorResult<T>(error: ServiceError): ServiceResult<T> {
  return { success: false, error }
}

/**
 * Wrap async operations in result types
 */
export async function withResult<T>(
  operation: () => Promise<T>
): Promise<ServiceResult<T>> {
  try {
    const data = await operation()
    return createSuccessResult(data)
  } catch (error) {
    if (error instanceof ServiceError) {
      return createErrorResult(error)
    }
    return createErrorResult(
      new ServiceError(
        error instanceof Error ? error.message : 'Unknown error',
        'INTERNAL_ERROR'
      )
    )
  }
}