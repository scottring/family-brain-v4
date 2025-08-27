import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { 
  UserProfile, 
  Family, 
  FamilyMemberWithProfile 
} from '@/lib/types/database'

interface AppState {
  // User data
  user: UserProfile | null
  families: Family[]
  currentFamilyId: string | null
  currentFamilyMembers: FamilyMemberWithProfile[]
  
  // UI state
  currentView: 'today' | 'planning' | 'sops'
  isMobile: boolean
  isLoading: boolean
  
  // Settings
  preferences: {
    theme: 'light' | 'dark' | 'system'
    language: string
    timezone: string
    notifications: boolean
  }
  
  // Actions
  setUser: (user: UserProfile | null) => void
  setFamilies: (families: Family[]) => void
  setCurrentFamilyId: (familyId: string | null) => void
  setCurrentFamilyMembers: (members: FamilyMemberWithProfile[]) => void
  setCurrentView: (view: 'today' | 'planning' | 'sops') => void
  setIsMobile: (isMobile: boolean) => void
  setIsLoading: (isLoading: boolean) => void
  updatePreferences: (preferences: Partial<AppState['preferences']>) => void
  reset: () => void
}

const initialState = {
  user: null,
  families: [],
  currentFamilyId: null,
  currentFamilyMembers: [],
  currentView: 'today' as const,
  isMobile: false,
  isLoading: false,
  preferences: {
    theme: 'system' as const,
    language: 'en',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    notifications: true
  }
}

export const useAppStore = create<AppState>()(
  devtools(
    (set, get) => ({
      ...initialState,
      
      setUser: (user) => set({ user }, false, 'setUser'),
      
      setFamilies: (families) => set({ families }, false, 'setFamilies'),
      
      setCurrentFamilyId: (familyId) => set({ currentFamilyId: familyId }, false, 'setCurrentFamilyId'),
      
      setCurrentFamilyMembers: (members) => set({ currentFamilyMembers: members }, false, 'setCurrentFamilyMembers'),
      
      setCurrentView: (view) => set({ currentView: view }, false, 'setCurrentView'),
      
      setIsMobile: (isMobile) => set({ isMobile }, false, 'setIsMobile'),
      
      setIsLoading: (isLoading) => set({ isLoading }, false, 'setIsLoading'),
      
      updatePreferences: (newPreferences) => set(
        state => ({
          preferences: { ...state.preferences, ...newPreferences }
        }),
        false,
        'updatePreferences'
      ),
      
      reset: () => set(initialState, false, 'reset')
    }),
    {
      name: 'app-store'
    }
  )
)