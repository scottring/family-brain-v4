import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { FamilyMemberWithProfile } from '@/lib/types/database'

export interface FamilyMemberPresence {
  user_id: string
  user_name: string
  avatar_url?: string
  current_view: 'today' | 'planning' | 'sops'
  current_activity?: string
  last_seen: string
  is_online: boolean
  is_editing?: {
    type: 'schedule_item' | 'time_block' | 'template'
    item_id: string
    item_title?: string
    started_at: string
  }
}

interface FamilyPresenceState {
  // Presence data
  familyMembers: FamilyMemberWithProfile[]
  presenceMap: Record<string, FamilyMemberPresence>
  
  // Conflict detection
  editingConflicts: Record<string, FamilyMemberPresence[]> // item_id -> users editing
  
  // Activities
  currentActivities: Record<string, string> // user_id -> activity description
  
  // Actions
  setFamilyMembers: (members: FamilyMemberWithProfile[]) => void
  updateMemberPresence: (userId: string, presence: Partial<FamilyMemberPresence>) => void
  setMemberOffline: (userId: string) => void
  startEditing: (userId: string, itemType: 'schedule_item' | 'time_block' | 'template', itemId: string, itemTitle?: string) => void
  stopEditing: (userId: string, itemId: string) => void
  updateCurrentActivity: (userId: string, activity?: string) => void
  getOnlineMembers: () => FamilyMemberPresence[]
  getEditingUsers: (itemId: string) => FamilyMemberPresence[]
  isItemBeingEdited: (itemId: string) => boolean
  reset: () => void
}

const initialState = {
  familyMembers: [],
  presenceMap: {},
  editingConflicts: {},
  currentActivities: {}
}

export const useFamilyPresenceStore = create<FamilyPresenceState>()(
  devtools(
    (set, get) => ({
      ...initialState,
      
      setFamilyMembers: (members) => set({ familyMembers: members }, false, 'setFamilyMembers'),
      
      updateMemberPresence: (userId, presence) => set(
        state => {
          const existingPresence = state.presenceMap[userId]
          const updatedPresence = {
            ...existingPresence,
            ...presence,
            user_id: userId,
            is_online: true,
            last_seen: new Date().toISOString()
          }
          
          return {
            presenceMap: {
              ...state.presenceMap,
              [userId]: updatedPresence
            }
          }
        },
        false,
        'updateMemberPresence'
      ),
      
      setMemberOffline: (userId) => set(
        state => {
          const existingPresence = state.presenceMap[userId]
          if (!existingPresence) return state
          
          const updatedPresence = {
            ...existingPresence,
            is_online: false,
            last_seen: new Date().toISOString()
          }
          
          // Clear any editing conflicts for this user
          const newEditingConflicts = { ...state.editingConflicts }
          Object.keys(newEditingConflicts).forEach(itemId => {
            newEditingConflicts[itemId] = newEditingConflicts[itemId].filter(
              user => user.user_id !== userId
            )
            if (newEditingConflicts[itemId].length === 0) {
              delete newEditingConflicts[itemId]
            }
          })
          
          return {
            presenceMap: {
              ...state.presenceMap,
              [userId]: updatedPresence
            },
            editingConflicts: newEditingConflicts,
            currentActivities: {
              ...state.currentActivities,
              [userId]: undefined
            }
          }
        },
        false,
        'setMemberOffline'
      ),
      
      startEditing: (userId, itemType, itemId, itemTitle) => set(
        state => {
          const presence = state.presenceMap[userId]
          if (!presence) return state
          
          const updatedPresence = {
            ...presence,
            is_editing: {
              type: itemType,
              item_id: itemId,
              item_title: itemTitle,
              started_at: new Date().toISOString()
            }
          }
          
          // Add to editing conflicts
          const currentEditors = state.editingConflicts[itemId] || []
          const newEditors = currentEditors.filter(editor => editor.user_id !== userId)
          newEditors.push(updatedPresence)
          
          return {
            presenceMap: {
              ...state.presenceMap,
              [userId]: updatedPresence
            },
            editingConflicts: {
              ...state.editingConflicts,
              [itemId]: newEditors
            }
          }
        },
        false,
        'startEditing'
      ),
      
      stopEditing: (userId, itemId) => set(
        state => {
          const presence = state.presenceMap[userId]
          if (!presence || !presence.is_editing) return state
          
          const updatedPresence = {
            ...presence,
            is_editing: undefined
          }
          
          // Remove from editing conflicts
          const currentEditors = state.editingConflicts[itemId] || []
          const newEditors = currentEditors.filter(editor => editor.user_id !== userId)
          const newEditingConflicts = { ...state.editingConflicts }
          
          if (newEditors.length === 0) {
            delete newEditingConflicts[itemId]
          } else {
            newEditingConflicts[itemId] = newEditors
          }
          
          return {
            presenceMap: {
              ...state.presenceMap,
              [userId]: updatedPresence
            },
            editingConflicts: newEditingConflicts
          }
        },
        false,
        'stopEditing'
      ),
      
      updateCurrentActivity: (userId, activity) => set(
        state => ({
          currentActivities: {
            ...state.currentActivities,
            [userId]: activity
          }
        }),
        false,
        'updateCurrentActivity'
      ),
      
      getOnlineMembers: () => {
        const state = get()
        return Object.values(state.presenceMap).filter(presence => presence.is_online)
      },
      
      getEditingUsers: (itemId) => {
        const state = get()
        return state.editingConflicts[itemId] || []
      },
      
      isItemBeingEdited: (itemId) => {
        const state = get()
        const editors = state.editingConflicts[itemId] || []
        return editors.length > 0
      },
      
      reset: () => set(initialState, false, 'reset')
    }),
    {
      name: 'family-presence-store'
    }
  )
)