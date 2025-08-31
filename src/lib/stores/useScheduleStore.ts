import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import {
  ScheduleWithTimeBlocks,
  TimeBlockWithItems,
  ScheduleItemWithTemplate,
  TemplateInstanceWithSteps
} from '@/lib/types/database'

interface ScheduleState {
  // Current schedule data
  currentDate: string // YYYY-MM-DD
  currentSchedule: ScheduleWithTimeBlocks | null
  weekSchedules: Record<string, ScheduleWithTimeBlocks> // date -> schedule
  
  // View state
  selectedTimeBlockId: string | null
  selectedItemId: string | null
  currentTimeBlockId: string | null // For "now" highlighting
  
  // Planning view state
  draggedTemplate: any | null
  isDropZoneActive: boolean
  
  // Execution state
  expandedItems: Set<string>
  artifactPanelItemId: string | null
  
  // Actions
  setCurrentDate: (date: string) => void
  setCurrentSchedule: (schedule: ScheduleWithTimeBlocks | null) => void
  setWeekSchedule: (date: string, schedule: ScheduleWithTimeBlocks) => void
  setSelectedTimeBlockId: (id: string | null) => void
  setSelectedItemId: (id: string | null) => void
  setCurrentTimeBlockId: (id: string | null) => void
  setDraggedTemplate: (template: any | null) => void
  setIsDropZoneActive: (active: boolean) => void
  toggleExpandedItem: (itemId: string) => void
  setArtifactPanelItemId: (itemId: string | null) => void
  updateScheduleItem: (itemId: string, updates: Partial<ScheduleItemWithTemplate>) => void
  updateTimeBlock: (blockId: string, updates: Partial<TimeBlockWithItems>) => void
  removeTimeBlock: (date: string, blockId: string) => void
  reset: () => void
}

const initialState = {
  currentDate: new Date().toISOString().split('T')[0],
  currentSchedule: null,
  weekSchedules: {},
  selectedTimeBlockId: null,
  selectedItemId: null,
  currentTimeBlockId: null,
  draggedTemplate: null,
  isDropZoneActive: false,
  expandedItems: new Set<string>(),
  artifactPanelItemId: null
}

export const useScheduleStore = create<ScheduleState>()(
  devtools(
    (set, get) => ({
      ...initialState,
      
      setCurrentDate: (date) => set({ currentDate: date }, false, 'setCurrentDate'),
      
      setCurrentSchedule: (schedule) => set({ currentSchedule: schedule }, false, 'setCurrentSchedule'),
      
      setWeekSchedule: (date, schedule) => set(
        state => ({
          weekSchedules: { ...state.weekSchedules, [date]: schedule }
        }),
        false,
        'setWeekSchedule'
      ),
      
      setSelectedTimeBlockId: (id) => set({ selectedTimeBlockId: id }, false, 'setSelectedTimeBlockId'),
      
      setSelectedItemId: (id) => set({ selectedItemId: id }, false, 'setSelectedItemId'),
      
      setCurrentTimeBlockId: (id) => set({ currentTimeBlockId: id }, false, 'setCurrentTimeBlockId'),
      
      setDraggedTemplate: (template) => set({ draggedTemplate: template }, false, 'setDraggedTemplate'),
      
      setIsDropZoneActive: (active) => set({ isDropZoneActive: active }, false, 'setIsDropZoneActive'),
      
      toggleExpandedItem: (itemId) => set(
        state => {
          const newExpanded = new Set(state.expandedItems)
          if (newExpanded.has(itemId)) {
            newExpanded.delete(itemId)
          } else {
            newExpanded.add(itemId)
          }
          return { expandedItems: newExpanded }
        },
        false,
        'toggleExpandedItem'
      ),
      
      setArtifactPanelItemId: (itemId) => set({ artifactPanelItemId: itemId }, false, 'setArtifactPanelItemId'),
      
      updateScheduleItem: (itemId, updates) => set(
        state => {
          if (!state.currentSchedule) return state
          
          const updatedSchedule = {
            ...state.currentSchedule,
            time_blocks: state.currentSchedule.time_blocks.map(block => ({
              ...block,
              schedule_items: block.schedule_items.map(item =>
                item.id === itemId ? { ...item, ...updates } : item
              )
            }))
          }
          
          return {
            currentSchedule: updatedSchedule,
            weekSchedules: {
              ...state.weekSchedules,
              [state.currentDate]: updatedSchedule
            }
          }
        },
        false,
        'updateScheduleItem'
      ),
      
      updateTimeBlock: (blockId, updates) => set(
        state => {
          if (!state.currentSchedule) return state
          
          const updatedSchedule = {
            ...state.currentSchedule,
            time_blocks: state.currentSchedule.time_blocks.map(block =>
              block.id === blockId ? { ...block, ...updates } : block
            )
          }
          
          return {
            currentSchedule: updatedSchedule,
            weekSchedules: {
              ...state.weekSchedules,
              [state.currentDate]: updatedSchedule
            }
          }
        },
        false,
        'updateTimeBlock'
      ),
      
      removeTimeBlock: (date: string, blockId: string) => set(
        (state) => {
          const schedule = state.weekSchedules[date]
          if (!schedule) return state
          
          // Create a completely new array of time blocks without the deleted one
          const updatedTimeBlocks = schedule.time_blocks.filter(tb => tb.id !== blockId)
          
          // Create a new schedule object
          const updatedSchedule = {
            ...schedule,
            time_blocks: updatedTimeBlocks
          }
          
          // Create new weekSchedules object to ensure React detects the change
          const newWeekSchedules = { ...state.weekSchedules }
          newWeekSchedules[date] = updatedSchedule
          
          return {
            ...state,
            currentSchedule: state.currentDate === date ? updatedSchedule : state.currentSchedule,
            weekSchedules: newWeekSchedules
          }
        },
        false,
        'removeTimeBlock'
      ),
      
      reset: () => set(initialState, false, 'reset')
    }),
    {
      name: 'schedule-store'
    }
  )
)