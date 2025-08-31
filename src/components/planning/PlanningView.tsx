'use client'

import { useEffect, useState } from 'react'
import { format, addWeeks, subWeeks } from 'date-fns'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon } from '@heroicons/react/24/outline'
import { WeekCalendar } from './WeekCalendar'
import { TemplateSidebar } from './TemplateSidebar'
import { QuickAddModal } from './QuickAddModal'
import { PlanningInitializer } from './PlanningInitializer'
import { useAppStore } from '@/lib/stores/useAppStore'
import { useScheduleStore } from '@/lib/stores/useScheduleStore'
import { useTemplateStore } from '@/lib/stores/useTemplateStore'
import { scheduleService } from '@/lib/services/ScheduleService'
import { templateService } from '@/lib/services/TemplateService'
import { getWeekRange, formatDisplayDate } from '@/lib/utils'
import { MemberSelector } from '@/components/common/MemberSelector'

export function PlanningView() {
  const { currentFamilyId, isMobile } = useAppStore()
  const { 
    currentDate, 
    setCurrentDate, 
    weekSchedules, 
    setWeekSchedule,
    setIsDropZoneActive
  } = useScheduleStore()
  const { 
    templates, 
    setTemplates,
    getFilteredTemplates
  } = useTemplateStore()
  
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const { start } = getWeekRange(new Date(currentDate))
    return start
  })
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Load templates on mount
  useEffect(() => {
    const loadTemplates = async () => {
      if (!currentFamilyId) return
      
      try {
        const familyTemplates = await templateService.getTemplatesByFamily(currentFamilyId)
        setTemplates(familyTemplates)
      } catch (error) {
        console.error('Error loading templates:', error)
      }
    }

    loadTemplates()
  }, [currentFamilyId, setTemplates])

  // Load week schedules when week changes
  useEffect(() => {
    const loadWeekSchedules = async () => {
      if (!currentFamilyId) return
      
      try {
        setIsLoading(true)
        const { dates } = getWeekRange(currentWeekStart)
        
        // Load schedules for all days in the week
        const schedulePromises = dates.map(async (date) => {
          const dateStr = format(date, 'yyyy-MM-dd')
          const schedule = await scheduleService.getOrCreateScheduleForDate(currentFamilyId, dateStr)
          return { date: dateStr, schedule }
        })
        
        const scheduleResults = await Promise.all(schedulePromises)
        scheduleResults.forEach(({ date, schedule }) => {
          setWeekSchedule(date, schedule)
        })
      } catch (error) {
        console.error('Error loading week schedules:', error)
      } finally {
        setIsLoading(false)
      }
    }

    // Call the function to load schedules
    void loadWeekSchedules()
  }, [currentFamilyId, currentWeekStart, setWeekSchedule])

  const handlePreviousWeek = () => {
    setCurrentWeekStart(subWeeks(currentWeekStart, 1))
  }

  const handleNextWeek = () => {
    setCurrentWeekStart(addWeeks(currentWeekStart, 1))
  }

  const handleToday = () => {
    const today = new Date()
    const { start } = getWeekRange(today)
    setCurrentWeekStart(start)
    setCurrentDate(format(today, 'yyyy-MM-dd'))
  }

  const { start: weekStart, end: weekEnd } = getWeekRange(currentWeekStart)

  if (!currentFamilyId) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Setting up your family workspace...
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            This will only take a moment
          </p>
        </div>
      </div>
    )
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <PlanningInitializer />
      <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <button
                  onClick={handlePreviousWeek}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <ChevronLeftIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={handleNextWeek}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <ChevronRightIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={handleToday}
                  className="px-3 py-1 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"
                >
                  Today
                </button>
              </div>
              
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Week Planning
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {formatDisplayDate(weekStart)} - {formatDisplayDate(weekEnd)}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <MemberSelector />
              <button
                onClick={() => setIsQuickAddOpen(true)}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Quick Add
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex">
          {!isMobile && (
            <TemplateSidebar />
          )}
          
          <div className="flex-1 p-6">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <WeekCalendar
                weekStart={currentWeekStart}
                schedules={weekSchedules}
              />
            )}
          </div>
        </div>

        {/* Mobile Template Sidebar - Bottom Sheet */}
        {isMobile && (
          <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
            <TemplateSidebar />
          </div>
        )}

        {/* Quick Add Modal */}
        <QuickAddModal
          isOpen={isQuickAddOpen}
          onClose={() => setIsQuickAddOpen(false)}
        />
      </div>
    </DndProvider>
  )
}