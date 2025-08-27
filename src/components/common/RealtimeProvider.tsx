'use client'

import { ReactNode, useEffect, useRef } from 'react'
import { RealtimeChannel, RealtimePresenceState } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/lib/stores/useAppStore'
import { useScheduleStore } from '@/lib/stores/useScheduleStore'
import { useTemplateStore } from '@/lib/stores/useTemplateStore'
import { scheduleService } from '@/lib/services/ScheduleService'
import { templateService } from '@/lib/services/TemplateService'
import { toast } from './ToastNotifications'

interface RealtimeProviderProps {
  children: ReactNode
}

interface PresenceState {
  user_id: string
  user_name: string
  avatar_url?: string
  current_view: 'today' | 'planning' | 'sops'
  last_seen: string
}

export function RealtimeProvider({ children }: RealtimeProviderProps) {
  const { user, currentFamilyId, currentView } = useAppStore()
  const { 
    currentDate, 
    setCurrentSchedule, 
    updateScheduleItem,
    updateTimeBlock
  } = useScheduleStore()
  const { setTemplates } = useTemplateStore()
  
  const supabase = createClient()
  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    if (!user || !currentFamilyId) {
      // Clean up existing channel
      if (channelRef.current) {
        channelRef.current.unsubscribe()
        channelRef.current = null
      }
      return
    }

    // Create or update channel
    const channelName = `family:${currentFamilyId}`
    
    if (channelRef.current?.topic !== channelName) {
      // Clean up existing channel
      if (channelRef.current) {
        channelRef.current.unsubscribe()
      }

      // Create new channel
      const channel = supabase.channel(channelName, {
        config: { presence: { key: user.id } }
      })

      // Track presence
      channel.on('presence', { event: 'sync' }, () => {
        const newState = channel.presenceState<PresenceState>()
        console.log('Presence sync:', newState)
        // You could update a family members online status store here
      })

      channel.on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences)
      })

      channel.on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences)
      })

      // Listen to schedule changes
      channel.on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'schedule_items',
        filter: `time_block_id=in.(${getCurrentTimeBlockIds().join(',')})`
      }, (payload) => {
        console.log('Schedule item change:', payload)
        handleScheduleItemChange(payload)
      })

      channel.on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'time_blocks'
      }, (payload) => {
        console.log('Time block change:', payload)
        handleTimeBlockChange(payload)
      })

      channel.on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'template_instance_steps'
      }, (payload) => {
        console.log('Template instance step change:', payload)
        handleTemplateInstanceStepChange(payload)
      })

      // Listen to template changes
      channel.on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'templates',
        filter: `family_id=eq.${currentFamilyId}`
      }, (payload) => {
        console.log('Template change:', payload)
        handleTemplateChange(payload)
      })

      // Subscribe and track presence
      channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: user.id,
            user_name: user.full_name || user.email,
            avatar_url: user.avatar_url,
            current_view: currentView,
            last_seen: new Date().toISOString()
          })
        }
      })

      channelRef.current = channel
    }

    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe()
        channelRef.current = null
      }
    }
  }, [user, currentFamilyId, supabase])

  // Update presence when view changes
  useEffect(() => {
    if (channelRef.current && user) {
      channelRef.current.track({
        user_id: user.id,
        user_name: user.full_name || user.email,
        avatar_url: user.avatar_url,
        current_view: currentView,
        last_seen: new Date().toISOString()
      })
    }
  }, [currentView, user])

  const getCurrentTimeBlockIds = () => {
    // Get current time block IDs for filtering real-time updates
    // This would come from the current schedule
    return []
  }

  const handleScheduleItemChange = async (payload: any) => {
    const { eventType, new: newRecord, old: oldRecord } = payload

    try {
      switch (eventType) {
        case 'UPDATE':
          if (newRecord && oldRecord) {
            updateScheduleItem(newRecord.id, newRecord)
            
            // Show notification if someone else completed/uncompleted an item
            if (newRecord.completed_by !== user?.id && 
                newRecord.completed_at !== oldRecord.completed_at) {
              
              if (newRecord.completed_at && !oldRecord.completed_at) {
                // Item was completed
                toast.familyMemberAction(
                  'Family member',
                  'completed',
                  newRecord.title
                )
              } else if (!newRecord.completed_at && oldRecord.completed_at) {
                // Item was uncompleted
                toast.familyMemberAction(
                  'Family member',
                  'uncompleted',
                  newRecord.title
                )
              }
            }
          }
          break
        
        case 'INSERT':
          toast.info('New Item Added', 'A family member added a new item to today\'s schedule')
          // Fall through to reload
        case 'DELETE':
          // Reload the entire schedule for structural changes
          if (currentFamilyId && currentDate) {
            const updatedSchedule = await scheduleService.getScheduleByDate(currentFamilyId, currentDate)
            if (updatedSchedule) {
              setCurrentSchedule(updatedSchedule)
            }
          }
          break
      }
    } catch (error) {
      console.error('Error handling schedule item change:', error)
    }
  }

  const handleTimeBlockChange = async (payload: any) => {
    const { eventType, new: newRecord } = payload

    try {
      switch (eventType) {
        case 'UPDATE':
          if (newRecord) {
            updateTimeBlock(newRecord.id, newRecord)
          }
          break
        
        case 'INSERT':
        case 'DELETE':
          // Reload the entire schedule for structural changes
          if (currentFamilyId && currentDate) {
            const updatedSchedule = await scheduleService.getScheduleByDate(currentFamilyId, currentDate)
            if (updatedSchedule) {
              setCurrentSchedule(updatedSchedule)
            }
          }
          break
      }
    } catch (error) {
      console.error('Error handling time block change:', error)
    }
  }

  const handleTemplateInstanceStepChange = async (payload: any) => {
    // Handle template instance step completion updates
    // This could trigger updates in the artifact panel or execution view
    console.log('Template instance step updated:', payload)
    
    // For now, just log. In a full implementation, you'd update the relevant UI
  }

  const handleTemplateChange = async (payload: any) => {
    try {
      // Reload templates when they change
      if (currentFamilyId) {
        const updatedTemplates = await templateService.getTemplatesByFamily(currentFamilyId)
        setTemplates(updatedTemplates)
      }
    } catch (error) {
      console.error('Error handling template change:', error)
    }
  }

  return <>{children}</>
}