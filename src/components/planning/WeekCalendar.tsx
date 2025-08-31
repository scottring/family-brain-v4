'use client'

import { useMemo, useState, useEffect } from 'react'
import { format } from 'date-fns'
import { ScheduleWithTimeBlocks, TimeBlockWithItems, ScheduleItem } from '@/lib/types/database'
import { DayColumn } from './DayColumn'
import { TimeGutter } from './TimeGutter'
import { TimeBlockDetailPanel } from './TimeBlockDetailPanel'
import { ChecklistPanel } from './ChecklistPanel'
import { getWeekRange, getTimeSlots, getCurrentTimeSlot, timeToMinutes } from '@/lib/utils'
import { useAppStore } from '@/lib/stores/useAppStore'

interface WeekCalendarProps {
  weekStart: Date
  schedules: Record<string, ScheduleWithTimeBlocks>
}

export function WeekCalendar({ weekStart, schedules }: WeekCalendarProps) {
  const { dates } = getWeekRange(weekStart)
  const timeSlots = useMemo(() => getTimeSlots(5, 23), []) // 5 AM to 11 PM
  const [currentTime, setCurrentTime] = useState(new Date())
  const [selectedTimeBlockId, setSelectedTimeBlockId] = useState<string | null>(null)
  const [selectedTimeBlock, setSelectedTimeBlock] = useState<TimeBlockWithItems | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [panelType, setPanelType] = useState<'detail' | 'checklist'>('detail')
  const { selectedMemberView } = useAppStore()

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)

    return () => clearInterval(interval)
  }, [])

  // Calculate current time indicator position
  const getCurrentTimePosition = () => {
    const now = new Date()
    const currentHour = now.getHours()
    const currentMinute = now.getMinutes()
    
    // Only show during day hours (5 AM to 11 PM)
    if (currentHour < 5 || currentHour >= 23) return null
    
    const currentTimeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`
    const currentMinutes = timeToMinutes(currentTimeString)
    const startMinutes = 5 * 60 // 5 AM
    
    // Calculate position (16px per 15-minute slot)
    const position = ((currentMinutes - startMinutes) / 15) * 16
    
    return position + 64 // Add header height
  }

  const currentTimePosition = getCurrentTimePosition()
  
  // Filter schedule items based on selected member view
  const filterItemsForMember = (items: ScheduleItem[]): ScheduleItem[] => {
    if (selectedMemberView === 'all') return items
    
    return items.filter(item => {
      const assignedMembers = item.metadata?.assigned_members
      
      // If no assignment, it's available to all
      if (!assignedMembers || assignedMembers.length === 0) return true
      
      // Check if member is in assigned list
      return assignedMembers.includes(selectedMemberView)
    })
  }

  // Get filtered schedules with member-specific items
  const getFilteredSchedules = (): Record<string, ScheduleWithTimeBlocks> => {
    if (selectedMemberView === 'all') return schedules
    
    const filteredSchedules: Record<string, ScheduleWithTimeBlocks> = {}
    
    Object.entries(schedules).forEach(([date, schedule]) => {
      filteredSchedules[date] = {
        ...schedule,
        time_blocks: schedule.time_blocks.map(timeBlock => ({
          ...timeBlock,
          schedule_items: filterItemsForMember(timeBlock.schedule_items || [])
        }))
      }
    })
    
    return filteredSchedules
  }

  const filteredSchedules = getFilteredSchedules()
  
  // Handle time block selection
  const handleTimeBlockClick = (timeBlockId: string, date: string) => {
    setSelectedTimeBlockId(timeBlockId)
    setSelectedDate(date)
    
    // Find the time block in filtered schedules
    const schedule = filteredSchedules[date]
    if (schedule) {
      const timeBlock = schedule.time_blocks.find(tb => tb.id === timeBlockId)
      setSelectedTimeBlock(timeBlock || null)
      
      // Determine which panel to show based on whether it has a checklist
      const hasChecklist = timeBlock?.schedule_items.some(item => item.template_instance)
      setPanelType(hasChecklist ? 'checklist' : 'detail')
    }
  }
  
  const handleClosePanel = () => {
    setSelectedTimeBlockId(null)
    setSelectedTimeBlock(null)
    setSelectedDate('')
    setPanelType('detail')
  }

  return (
    <div className="h-full bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="flex h-full">
        {/* Time Gutter */}
        <div className="w-20 flex-shrink-0 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700">
          <div className="h-16 border-b border-gray-200 dark:border-gray-700" />
          <TimeGutter timeSlots={timeSlots} />
        </div>

        {/* Week Grid */}
        <div className="flex-1 overflow-auto relative">
          <div className="flex">
            {/* Day Headers */}
            <div className="flex w-full">
              {dates.map((date) => {
                const dateStr = format(date, 'yyyy-MM-dd')
                const isToday = format(new Date(), 'yyyy-MM-dd') === dateStr
                
                return (
                  <div
                    key={dateStr}
                    className="flex-1 min-w-0 border-r border-gray-200 dark:border-gray-700 last:border-r-0 relative"
                  >
                    {/* Day Header */}
                    <div className="h-16 flex flex-col items-center justify-center border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                      <div className="text-xs font-medium text-gray-600 dark:text-gray-300 uppercase">
                        {format(date, 'EEE')}
                      </div>
                      <div
                        className={`text-lg font-semibold ${
                          isToday
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-gray-900 dark:text-white'
                        }`}
                      >
                        {format(date, 'd')}
                      </div>
                      {isToday && (
                        <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full mt-1" />
                      )}
                    </div>

                    {/* Day Column */}
                    <DayColumn
                      date={dateStr}
                      schedule={filteredSchedules[dateStr]}
                      timeSlots={timeSlots}
                      selectedTimeBlockId={selectedTimeBlockId}
                      onTimeBlockClick={(timeBlockId) => handleTimeBlockClick(timeBlockId, dateStr)}
                    />

                    {/* Current Time Indicator - only show for today */}
                    {isToday && currentTimePosition && (
                      <div
                        className="absolute left-0 right-0 z-20 pointer-events-none flex items-center"
                        style={{ top: `${currentTimePosition}px` }}
                      >
                        <div className="bg-red-500 text-white px-2 py-1 rounded-l text-xs font-medium shadow-lg">
                          NOW
                        </div>
                        <div className="flex-1 h-0.5 bg-red-500 relative">
                          <div
                            className="absolute right-0 top-1/2 transform -translate-y-1/2 w-0 h-0"
                            style={{
                              borderLeft: '6px solid rgb(239, 68, 68)',
                              borderTop: '3px solid transparent',
                              borderBottom: '3px solid transparent'
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
      
      {/* Time Block Detail Panel or Checklist Panel */}
      {panelType === 'checklist' ? (
        <ChecklistPanel
          timeBlock={selectedTimeBlock}
          date={selectedDate}
          onClose={handleClosePanel}
          isOpen={!!selectedTimeBlock}
        />
      ) : (
        <TimeBlockDetailPanel
          timeBlock={selectedTimeBlock}
          date={selectedDate}
          onClose={handleClosePanel}
          isOpen={!!selectedTimeBlock}
        />
      )}
    </div>
  )
}