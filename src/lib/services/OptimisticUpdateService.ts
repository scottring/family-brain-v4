import { createClient } from '@/lib/supabase/client'
import { toast } from '@/components/common/ToastNotifications'

interface OptimisticUpdate<T> {
  id: string
  type: 'schedule_item' | 'time_block' | 'template'
  itemId: string
  operation: 'create' | 'update' | 'delete'
  originalData: T | null
  optimisticData: T
  timestamp: number
  promise: Promise<T>
}

class OptimisticUpdateService {
  private updates = new Map<string, OptimisticUpdate<any>>()
  private rollbackHandlers = new Map<string, (data: any) => void>()

  /**
   * Perform an optimistic update that can be rolled back if it fails
   */
  async performUpdate<T>(
    type: OptimisticUpdate<T>['type'],
    itemId: string,
    operation: OptimisticUpdate<T>['operation'],
    optimisticData: T,
    updatePromise: Promise<T>,
    rollbackHandler: (data: T) => void,
    originalData: T | null = null
  ): Promise<T> {
    const updateId = `${type}_${itemId}_${operation}_${Date.now()}`
    
    // Store the update info
    const update: OptimisticUpdate<T> = {
      id: updateId,
      type,
      itemId,
      operation,
      originalData,
      optimisticData,
      timestamp: Date.now(),
      promise: updatePromise
    }
    
    this.updates.set(updateId, update)
    this.rollbackHandlers.set(updateId, rollbackHandler)
    
    try {
      // Return the result of the actual update
      const result = await updatePromise
      
      // Clean up successful update
      this.updates.delete(updateId)
      this.rollbackHandlers.delete(updateId)
      
      return result
    } catch (error) {
      console.error(`Optimistic update failed for ${type} ${itemId}:`, error)
      
      // Rollback the optimistic change
      await this.rollbackUpdate(updateId, error as Error)
      
      throw error
    }
  }

  /**
   * Rollback a failed optimistic update
   */
  private async rollbackUpdate(updateId: string, error: Error): Promise<void> {
    const update = this.updates.get(updateId)
    const rollbackHandler = this.rollbackHandlers.get(updateId)
    
    if (!update || !rollbackHandler) {
      console.warn(`No rollback handler found for update ${updateId}`)
      return
    }
    
    try {
      // Restore original state
      if (update.originalData) {
        rollbackHandler(update.originalData)
      } else if (update.operation === 'create') {
        // For creates that failed, we need to remove the optimistic item
        // This is handled by the rollback handler
        rollbackHandler(null)
      }
      
      // Show user-friendly error message
      const errorMessage = this.getErrorMessage(update.type, update.operation, error)
      toast.error('Update Failed', errorMessage)
      
    } catch (rollbackError) {
      console.error(`Failed to rollback update ${updateId}:`, rollbackError)
      toast.error('Sync Error', 'Failed to sync with server. Please refresh the page.')
    } finally {
      // Clean up
      this.updates.delete(updateId)
      this.rollbackHandlers.delete(updateId)
    }
  }

  /**
   * Get a user-friendly error message for different types of failures
   */
  private getErrorMessage(type: string, operation: string, error: Error): string {
    const operationText = {
      create: 'add',
      update: 'update', 
      delete: 'remove'
    }[operation] || operation

    const typeText = {
      schedule_item: 'schedule item',
      time_block: 'time block',
      template: 'template'
    }[type] || type

    // Check for specific error types
    if (error.message.includes('Network')) {
      return `Could not ${operationText} ${typeText} due to network issues. Please check your connection.`
    }
    
    if (error.message.includes('permission') || error.message.includes('unauthorized')) {
      return `You don't have permission to ${operationText} this ${typeText}.`
    }
    
    if (error.message.includes('not found')) {
      return `The ${typeText} was not found. It may have been deleted by another user.`
    }
    
    return `Failed to ${operationText} ${typeText}. Please try again.`
  }

  /**
   * Check if there are any pending updates for a specific item
   */
  hasPendingUpdates(type: string, itemId: string): boolean {
    return Array.from(this.updates.values()).some(
      update => update.type === type && update.itemId === itemId
    )
  }

  /**
   * Get all pending updates for debugging
   */
  getPendingUpdates(): OptimisticUpdate<any>[] {
    return Array.from(this.updates.values())
  }

  /**
   * Force rollback all pending updates (useful for component unmount)
   */
  async rollbackAll(): Promise<void> {
    const updateIds = Array.from(this.updates.keys())
    
    for (const updateId of updateIds) {
      await this.rollbackUpdate(updateId, new Error('Component unmounted'))
    }
  }

  /**
   * Clean up old failed updates (older than 5 minutes)
   */
  cleanup(): void {
    const now = Date.now()
    const maxAge = 5 * 60 * 1000 // 5 minutes
    
    for (const [updateId, update] of this.updates.entries()) {
      if (now - update.timestamp > maxAge) {
        this.updates.delete(updateId)
        this.rollbackHandlers.delete(updateId)
      }
    }
  }
}

// Export singleton instance
export const optimisticUpdateService = new OptimisticUpdateService()

// Helper functions for common use cases

/**
 * Optimistically update a schedule item completion status
 */
export async function optimisticToggleScheduleItem(
  itemId: string,
  currentItem: any,
  newCompletionState: any,
  updatePromise: Promise<any>,
  updateHandler: (item: any) => void
): Promise<any> {
  return optimisticUpdateService.performUpdate(
    'schedule_item',
    itemId,
    'update',
    newCompletionState,
    updatePromise,
    updateHandler,
    currentItem
  )
}

/**
 * Optimistically add a new schedule item
 */
export async function optimisticAddScheduleItem(
  tempId: string,
  optimisticItem: any,
  createPromise: Promise<any>,
  addHandler: (item: any) => void,
  removeHandler: () => void
): Promise<any> {
  return optimisticUpdateService.performUpdate(
    'schedule_item',
    tempId,
    'create',
    optimisticItem,
    createPromise,
    (data) => {
      if (data) {
        addHandler(data)
      } else {
        removeHandler()
      }
    },
    null
  )
}

/**
 * Optimistically update a time block
 */
export async function optimisticUpdateTimeBlock(
  blockId: string,
  currentBlock: any,
  newBlockData: any,
  updatePromise: Promise<any>,
  updateHandler: (block: any) => void
): Promise<any> {
  return optimisticUpdateService.performUpdate(
    'time_block',
    blockId,
    'update',
    newBlockData,
    updatePromise,
    updateHandler,
    currentBlock
  )
}