'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { ItineraryService, DailyItinerary, ItineraryTemplateSlot } from '@/lib/services/ItineraryService'
import { createClient } from '@/lib/supabase/client'
import { TaskService } from '@/lib/services/TaskService'
import { TemplateService } from '@/lib/services/TemplateService'
import { FamilyService } from '@/lib/services/FamilyService'
import { UserService } from '@/lib/services/UserService'

// Initialize services
const supabase = createClient()
const userService = new UserService(supabase)
const familyService = new FamilyService(supabase, userService)
const taskService = new TaskService(supabase, familyService)
const templateService = new TemplateService(supabase, familyService)
const itineraryService = new ItineraryService(supabase, taskService, templateService)

export interface DailyItineraryData extends DailyItinerary {
  itinerary_template_slots: (ItineraryTemplateSlot & {
    task_template_assignments: any
  })[]
}

export interface TemplateSlotUpdate {
  id: string
  scheduled_start_time?: string
  scheduled_end_time?: string
  order_index?: number
  status?: 'scheduled' | 'in_progress' | 'completed' | 'skipped' | 'postponed'
}

export interface FamilyMemberItinerary {
  user_id: string
  name: string
  date: string
  slots: Array<{
    id: string
    template_name: string
    scheduled_start_time: string | null
    scheduled_end_time: string | null
    status: string
  }>
}

export function useDailyItinerary(date: string) {
  const queryClient = useQueryClient()
  const [familyItineraries, setFamilyItineraries] = useState<FamilyMemberItinerary[]>([])
  
  const queryKey = ['daily-itinerary', date]
  const familyQueryKey = ['family-itineraries', date]

  // Fetch daily itinerary for the given date
  const {
    data: itinerary,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey,
    queryFn: async () => {
      const result = await itineraryService.getDailyItinerary(date)
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to fetch daily itinerary')
      }
      return result.data as DailyItineraryData | null
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  // Fetch family itineraries for coordination
  const {
    data: familyItinerariesData,
    isLoading: isFamilyLoading
  } = useQuery({
    queryKey: familyQueryKey,
    queryFn: async () => {
      // This would be implemented when FamilyService is enhanced
      // For now, return empty array
      return [] as FamilyMemberItinerary[]
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  })

  // Create or update itinerary
  const updateItinerary = useMutation({
    mutationFn: async (updates: Partial<DailyItinerary>) => {
      const result = await itineraryService.createOrUpdateItinerary(date, updates)
      if (!result.success) {
        throw new Error(result.error.message || 'Failed to update itinerary')
      }
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })

  // Schedule template to itinerary
  const scheduleTemplate = useMutation({
    mutationFn: async ({
      templateId,
      startTime,
      endTime,
      orderIndex
    }: {
      templateId: string
      startTime: string
      endTime: string
      orderIndex: number
    }) => {
      // This would be implemented in ItineraryService
      // For now, just update the itinerary
      console.log('Scheduling template:', { templateId, startTime, endTime, orderIndex })
      return { success: true }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })

  // Reschedule existing slot
  const rescheduleSlot = useMutation({
    mutationFn: async ({
      slotId,
      newStartTime,
      newEndTime
    }: {
      slotId: string
      newStartTime: string
      newEndTime: string
    }) => {
      // This would be implemented in ItineraryService
      console.log('Rescheduling slot:', { slotId, newStartTime, newEndTime })
      return { success: true }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })

  // Complete template execution
  const completeTemplate = useMutation({
    mutationFn: async (slotId: string) => {
      // This would be implemented in ItineraryService
      console.log('Completing template:', slotId)
      return { success: true }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
      queryClient.invalidateQueries({ queryKey: familyQueryKey })
    },
  })

  // Real-time subscriptions for family coordination
  useEffect(() => {
    const channel = supabase
      .channel(`itinerary-updates-${date}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'daily_itineraries',
          filter: `date=eq.${date}`
        },
        (payload) => {
          console.log('Itinerary updated:', payload)
          queryClient.invalidateQueries({ queryKey })
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'itinerary_template_slots',
        },
        (payload) => {
          console.log('Template slot updated:', payload)
          queryClient.invalidateQueries({ queryKey })
          queryClient.invalidateQueries({ queryKey: familyQueryKey })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [date, queryClient, queryKey, familyQueryKey])

  // Update family itineraries state when data changes
  useEffect(() => {
    if (familyItinerariesData) {
      setFamilyItineraries(familyItinerariesData)
    }
  }, [familyItinerariesData])

  // Calculate progress metrics (simplified for now)
  const progressMetrics = {
    totalSlots: 0,
    completedSlots: 0,
    inProgressSlots: 0,
    scheduledSlots: 0,
    skippedSlots: 0,
    get completionPercentage() {
      return this.totalSlots > 0 
        ? Math.round((this.completedSlots / this.totalSlots) * 100)
        : 0
    }
  }

  // Get slots sorted by order_index and time (empty for now)
  const sortedSlots = [] as any[]

  // Get current active slot (in progress or next to start)
  const getCurrentSlot = () => {
    const inProgress = sortedSlots.find(slot => slot.status === 'in_progress')
    if (inProgress) return inProgress

    const now = new Date()
    const currentTime = now.toTimeString().slice(0, 8) // HH:MM:SS format
    
    return sortedSlots.find(slot => {
      if (!slot.scheduled_start_time) return false
      return slot.scheduled_start_time <= currentTime && slot.status === 'scheduled'
    }) || sortedSlots.find(slot => slot.status === 'scheduled')
  }

  // Check if itinerary exists for the date
  const hasItinerary = !!itinerary

  // Get time blocks for visual timeline
  const getTimeBlocks = () => {
    const blocks: Array<{
      startTime: string
      endTime: string
      slot: ItineraryTemplateSlot & { task_template_assignments: any }
      duration: number
    }> = []

    sortedSlots.forEach(slot => {
      if (slot.scheduled_start_time && slot.scheduled_end_time) {
        const start = new Date(`2000-01-01T${slot.scheduled_start_time}`)
        const end = new Date(`2000-01-01T${slot.scheduled_end_time}`)
        const duration = (end.getTime() - start.getTime()) / (1000 * 60) // minutes

        blocks.push({
          startTime: slot.scheduled_start_time,
          endTime: slot.scheduled_end_time,
          slot,
          duration
        })
      }
    })

    return blocks.sort((a, b) => a.startTime.localeCompare(b.startTime))
  }

  return {
    // Data
    itinerary,
    sortedSlots,
    hasItinerary,
    familyItineraries,
    
    // Loading states
    isLoading,
    isUpdating: updateItinerary.isPending,
    isFamilyLoading,
    isScheduling: scheduleTemplate.isPending,
    isRescheduling: rescheduleSlot.isPending,
    isCompleting: completeTemplate.isPending,
    
    // Error states
    error,
    updateError: updateItinerary.error,
    scheduleError: scheduleTemplate.error,
    rescheduleError: rescheduleSlot.error,
    completeError: completeTemplate.error,
    
    // Actions
    updateItinerary: updateItinerary.mutate,
    scheduleTemplate: scheduleTemplate.mutate,
    rescheduleSlot: rescheduleSlot.mutate,
    completeTemplate: completeTemplate.mutate,
    refetch,
    
    // Computed values
    progressMetrics,
    currentSlot: getCurrentSlot(),
    timeBlocks: getTimeBlocks(),
    
    // Utilities
    getCurrentSlot,
    getTimeBlocks,
  }
}