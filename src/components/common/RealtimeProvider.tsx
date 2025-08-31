'use client'

import { ReactNode, useEffect, useRef } from 'react'
import { RealtimeChannel, RealtimePresenceState } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/lib/stores/useAppStore'
import { useScheduleStore } from '@/lib/stores/useScheduleStore'
import { useTemplateStore } from '@/lib/stores/useTemplateStore'
import { useFamilyPresenceStore, FamilyMemberPresence } from '@/lib/stores/useFamilyPresenceStore'
import { scheduleService } from '@/lib/services/ScheduleService'
import { templateService } from '@/lib/services/TemplateService'
import { familyService } from '@/lib/services/FamilyService'
import { toast } from './ToastNotifications'

interface RealtimeProviderProps {
  children: ReactNode
}

interface PresencePayload {
  user_id: string
  user_name: string
  avatar_url?: string
  current_view: 'today' | 'planning' | 'sops'
  current_activity?: string
  last_seen: string
  is_editing?: {
    type: 'schedule_item' | 'time_block' | 'template'
    item_id: string
    item_title?: string
    started_at: string
  }
}

export function RealtimeProvider({ children }: RealtimeProviderProps) {
  const { user, currentFamilyId, currentView, currentFamilyMembers, setCurrentFamilyMembers } = useAppStore()
  const { 
    currentDate, 
    setCurrentSchedule, 
    updateScheduleItem,
    updateTimeBlock,
    selectedItemId,
    selectedTimeBlockId
  } = useScheduleStore()
  const { setTemplates } = useTemplateStore()
  const { 
    setFamilyMembers,
    updateMemberPresence,
    setMemberOffline,
    startEditing,
    stopEditing,
    updateCurrentActivity,
    getEditingUsers
  } = useFamilyPresenceStore()
  
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

    // Load family members first
    const loadFamilyMembers = async () => {
      try {
        const members = await familyService.getFamilyMembers(currentFamilyId)
        setFamilyMembers(members)
        setCurrentFamilyMembers(members)
      } catch (error) {
        console.error('Failed to load family members:', error)
      }
    }
    loadFamilyMembers()

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
        const newState = channel.presenceState<PresencePayload>()
        console.log('Presence sync:', newState)
        
        // Update presence for all users
        Object.entries(newState).forEach(([userId, presences]) => {
          if (presences.length > 0) {
            const presence = presences[0] as unknown as PresencePayload
            updateMemberPresence(userId, {
              ...presence,
              is_online: true
            })
          }
        })
      })

      channel.on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences)
        const presence = newPresences[0] as unknown as PresencePayload
        if (presence) {
          updateMemberPresence(key, {
            ...presence,
            is_online: true
          })
          
          if (presence.user_id !== user.id) {
            toast.info('Family Member Online', `${presence.user_name} joined the session`)
          }
        }
      })

      channel.on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences)
        const presence = leftPresences[0] as unknown as PresencePayload
        if (presence) {
          setMemberOffline(key)
          
          if (presence.user_id !== user.id) {
            toast.info('Family Member Offline', `${presence.user_name} left the session`)
          }
        }
      })

      // Listen to schedule changes - remove the filter to catch all changes
      channel.on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'schedule_items'
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
          await trackCurrentPresence(channel)
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

  // Update presence when view changes or editing state changes
  useEffect(() => {
    if (channelRef.current && user) {
      trackCurrentPresence(channelRef.current)
    }
  }, [currentView, user, selectedItemId, selectedTimeBlockId])

  const trackCurrentPresence = async (channel: RealtimeChannel) => {
    if (!user) return
    
    // Determine current activity
    let currentActivity = ''
    let editingInfo = undefined
    
    if (currentView === 'today') {
      currentActivity = 'Executing daily schedule'
    } else if (currentView === 'planning') {
      currentActivity = 'Planning schedule'
      
      // Check if currently editing something
      if (selectedItemId) {
        editingInfo = {
          type: 'schedule_item' as const,
          item_id: selectedItemId,
          started_at: new Date().toISOString()
        }
      } else if (selectedTimeBlockId) {
        editingInfo = {
          type: 'time_block' as const,
          item_id: selectedTimeBlockId,
          started_at: new Date().toISOString()
        }
      }
    } else if (currentView === 'sops') {
      currentActivity = 'Browsing templates'
    }
    
    await channel.track({
      user_id: user.id,
      user_name: user.full_name || user.email,
      avatar_url: user.avatar_url,
      current_view: currentView,
      current_activity: currentActivity,
      last_seen: new Date().toISOString(),
      is_editing: editingInfo
    })
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
              
              // Find the family member who made the change
              const member = currentFamilyMembers.find(m => m.user_id === newRecord.completed_by)
              const memberName = member?.user_profile?.full_name || 'Family member'
              
              if (newRecord.completed_at && !oldRecord.completed_at) {
                // Item was completed
                toast.familyMemberAction(
                  memberName,
                  'completed',
                  newRecord.title
                )
                
                // Update activity
                updateCurrentActivity(newRecord.completed_by, `Completed: ${newRecord.title}`)
              } else if (!newRecord.completed_at && oldRecord.completed_at) {
                // Item was uncompleted
                toast.familyMemberAction(
                  memberName,
                  'uncompleted',
                  newRecord.title
                )
              }
            }
          }
          break
        
        case 'INSERT':
          // Find who added the item
          const addedByMember = currentFamilyMembers.find(m => m.user_id === newRecord?.created_by)
          const adderName = addedByMember?.user_profile?.full_name || 'A family member'
          
          if (newRecord?.created_by !== user?.id) {
            toast.info('New Item Added', `${adderName} added "${newRecord?.title}" to the schedule`)
            updateCurrentActivity(newRecord?.created_by, `Added: ${newRecord?.title}`)
          }
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