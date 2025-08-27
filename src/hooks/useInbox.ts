'use client'

import { useState, useEffect } from 'react'

// Types (duplicated here for the hook, but should be shared)
export type InboxItemType = 'text' | 'voice' | 'image'
export type InboxItemStatus = 'unprocessed' | 'in_review' | 'ready_to_convert' | 'processed'
export type ConversionType = 'goal' | 'project' | 'task' | 'note'

export interface InboxItem {
  id: string
  content: string
  type: InboxItemType
  context: 'personal' | 'work' | 'family'
  priority: 'low' | 'medium' | 'high' | 'critical'
  status: InboxItemStatus
  created_at: string
  updated_at?: string
  metadata?: {
    duration?: number // For voice items
    size?: number // For image items
    url?: string // For image items
  }
  tags?: string[]
  ai_suggestions?: {
    type: ConversionType
    confidence: number
    related_items: string[]
  }
}

// Mock data - This would be replaced with actual service calls
const mockInboxItems: InboxItem[] = [
  {
    id: '1',
    content: 'Call dentist to schedule cleaning appointment next week',
    type: 'text',
    context: 'personal',
    priority: 'medium',
    status: 'unprocessed',
    created_at: '2025-01-20T10:30:00Z',
    ai_suggestions: {
      type: 'task',
      confidence: 0.95,
      related_items: []
    }
  },
  {
    id: '2',
    content: 'Review Q4 budget numbers and prepare presentation for board meeting',
    type: 'text',
    context: 'work',
    priority: 'high',
    status: 'in_review',
    created_at: '2025-01-20T09:15:00Z',
    ai_suggestions: {
      type: 'project',
      confidence: 0.88,
      related_items: []
    }
  },
  {
    id: '3',
    content: 'Plan family vacation for summer 2025 - research destinations and book flights',
    type: 'text',
    context: 'family',
    priority: 'low',
    status: 'ready_to_convert',
    created_at: '2025-01-19T16:45:00Z',
    ai_suggestions: {
      type: 'goal',
      confidence: 0.92,
      related_items: []
    }
  },
  {
    id: '4',
    content: 'Voice note about new product ideas discussed in team meeting',
    type: 'voice',
    context: 'work',
    priority: 'medium',
    status: 'unprocessed',
    created_at: '2025-01-20T14:22:00Z',
    metadata: { duration: 180 },
    ai_suggestions: {
      type: 'note',
      confidence: 0.72,
      related_items: []
    }
  },
  {
    id: '5',
    content: 'Screenshot of error message from production system',
    type: 'image',
    context: 'work',
    priority: 'critical',
    status: 'unprocessed',
    created_at: '2025-01-20T11:30:00Z',
    metadata: { size: 245760, url: '/placeholder-screenshot.png' },
    ai_suggestions: {
      type: 'task',
      confidence: 0.89,
      related_items: []
    }
  },
  {
    id: '6',
    content: 'Successfully completed quarterly review implementation',
    type: 'text',
    context: 'work',
    priority: 'low',
    status: 'processed',
    created_at: '2025-01-19T15:20:00Z',
    updated_at: '2025-01-20T08:15:00Z'
  }
]

export interface UseInboxResult {
  items: InboxItem[]
  isLoading: boolean
  error: string | null
  updateItemStatus: (itemId: string, status: InboxItemStatus) => void
  deleteItem: (itemId: string) => void
  archiveItem: (itemId: string) => void
  refresh: () => void
}

/**
 * Hook for managing inbox items
 * This uses mock data for now, but can be easily replaced with actual service calls
 */
export function useInbox(): UseInboxResult {
  const [items, setItems] = useState<InboxItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadItems = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // TODO: Replace with actual service call
      // const services = getServiceContainer()
      // const result = await services.inboxService.getItems()
      // if (result.success) {
      //   setItems(result.data)
      // } else {
      //   setError(result.error?.message || 'Failed to load inbox items')
      // }
      
      setItems(mockInboxItems)
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const updateItemStatus = (itemId: string, status: InboxItemStatus) => {
    setItems(prev => prev.map(item => 
      item.id === itemId 
        ? { ...item, status, updated_at: new Date().toISOString() }
        : item
    ))
    
    // TODO: Sync with server
    // const services = getServiceContainer()
    // services.inboxService.updateItem(itemId, { status })
  }

  const deleteItem = (itemId: string) => {
    setItems(prev => prev.filter(item => item.id !== itemId))
    
    // TODO: Sync with server
    // const services = getServiceContainer()
    // services.inboxService.deleteItem(itemId)
  }

  const archiveItem = (itemId: string) => {
    deleteItem(itemId) // For now, archive is the same as delete
    
    // TODO: Implement proper archiving
    // const services = getServiceContainer()
    // services.inboxService.archiveItem(itemId)
  }

  const refresh = () => {
    loadItems()
  }

  useEffect(() => {
    loadItems()
  }, [])

  return {
    items,
    isLoading,
    error,
    updateItemStatus,
    deleteItem,
    archiveItem,
    refresh
  }
}