import { createClient } from '@/lib/supabase/server'
import { User } from '@supabase/supabase-js'
import { AuthService } from './AuthService'
import { UserService } from './UserService'
import { FamilyService } from './FamilyService'
import { TaskService } from './TaskService'
import { TemplateService } from './TemplateService'
import { ItineraryService } from './ItineraryService'

export type SupabaseClient = ReturnType<typeof createClient>

/**
 * Service container for dependency injection
 * Provides a clean way to access all services with proper dependencies
 */
export class ServiceContainer {
  private supabase: SupabaseClient
  private user: User | null = null
  
  // Service instances
  private _authService?: AuthService
  private _userService?: UserService
  private _familyService?: FamilyService
  private _taskService?: TaskService
  private _templateService?: TemplateService
  private _itineraryService?: ItineraryService

  constructor(supabase?: SupabaseClient) {
    this.supabase = supabase || createClient()
  }

  /**
   * Set the current user for all services
   */
  async setUser(user: User | null) {
    this.user = user
    
    // Update user for all initialized services
    if (this._authService) await this._authService.setUser(user)
    if (this._userService) await this._userService.setUser(user)
    if (this._familyService) await this._familyService.setUser(user)
    if (this._taskService) await this._taskService.setUser(user)
    if (this._templateService) await this._templateService.setUser(user)
    if (this._itineraryService) await this._itineraryService.setUser(user)
  }

  /**
   * Get AuthService instance
   */
  get authService(): AuthService {
    if (!this._authService) {
      this._authService = new AuthService(this.supabase)
      if (this.user) {
        this._authService.setUser(this.user)
      }
    }
    return this._authService
  }

  /**
   * Get UserService instance
   */
  get userService(): UserService {
    if (!this._userService) {
      this._userService = new UserService(this.supabase)
      if (this.user) {
        this._userService.setUser(this.user)
      }
    }
    return this._userService
  }

  /**
   * Get FamilyService instance
   */
  get familyService(): FamilyService {
    if (!this._familyService) {
      this._familyService = new FamilyService(this.supabase, this.userService)
      if (this.user) {
        this._familyService.setUser(this.user)
      }
    }
    return this._familyService
  }

  /**
   * Get TaskService instance
   */
  get taskService(): TaskService {
    if (!this._taskService) {
      this._taskService = new TaskService(this.supabase, this.familyService)
      if (this.user) {
        this._taskService.setUser(this.user)
      }
    }
    return this._taskService
  }

  /**
   * Get TemplateService instance
   */
  get templateService(): TemplateService {
    if (!this._templateService) {
      this._templateService = new TemplateService(this.supabase, this.familyService)
      if (this.user) {
        this._templateService.setUser(this.user)
      }
    }
    return this._templateService
  }

  /**
   * Get ItineraryService instance
   */
  get itineraryService(): ItineraryService {
    if (!this._itineraryService) {
      this._itineraryService = new ItineraryService(
        this.supabase, 
        this.taskService, 
        this.templateService
      )
      if (this.user) {
        this._itineraryService.setUser(this.user)
      }
    }
    return this._itineraryService
  }

  /**
   * Initialize all services with current user
   */
  async initialize(user?: User | null) {
    if (user !== undefined) {
      await this.setUser(user)
    }
    
    // Lazy initialization - services will be created when first accessed
    return this
  }

  /**
   * Clean up all services (useful for testing)
   */
  cleanup() {
    this._authService = undefined
    this._userService = undefined
    this._familyService = undefined
    this._taskService = undefined
    this._templateService = undefined
    this._itineraryService = undefined
    this.user = null
  }
}

/**
 * Global service container instance
 * Can be used throughout the application
 */
let globalServiceContainer: ServiceContainer | null = null

/**
 * Get or create the global service container
 */
export function getServiceContainer(supabase?: SupabaseClient): ServiceContainer {
  if (!globalServiceContainer) {
    globalServiceContainer = new ServiceContainer(supabase)
  }
  return globalServiceContainer
}

/**
 * Create a new service container (useful for testing or isolated operations)
 */
export function createServiceContainer(supabase?: SupabaseClient): ServiceContainer {
  return new ServiceContainer(supabase)
}