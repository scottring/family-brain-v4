import { create } from 'zustand'
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
  isInitializing: boolean
  
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
  setIsInitializing: (isInitializing: boolean) => void
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
  isInitializing: false,
  preferences: {
    theme: 'system' as const,
    language: 'en',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    notifications: true
  }
}

export const useAppStore = create<AppState>()((set) => ({
  ...initialState,
  
  setUser: (user) => set({ user }),
  
  setFamilies: (families) => set({ families }),
  
  setCurrentFamilyId: (familyId) => set({ currentFamilyId: familyId }),
  
  setCurrentFamilyMembers: (members) => set({ currentFamilyMembers: members }),
  
  setCurrentView: (view) => set({ currentView: view }),
  
  setIsMobile: (isMobile) => set({ isMobile }),
  
  setIsLoading: (isLoading) => set({ isLoading }),

  setIsInitializing: (isInitializing) => set({ isInitializing }),
  
  updatePreferences: (newPreferences) => set(
    state => ({
      preferences: { ...state.preferences, ...newPreferences }
    })
  ),
  
  reset: () => set(initialState)
}))