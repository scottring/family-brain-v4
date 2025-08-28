'use client'

import { useMemo, useState, useEffect } from 'react'
import { format } from 'date-fns'
import { ScheduleWithTimeBlocks } from '@/lib/types/database'
import { DayColumn } from './DayColumn'
import { TimeGutter } from './TimeGutter'
import { getWeekRange, getTimeSlots, getCurrentTimeSlot, timeToMinutes } from '@/lib/utils'

interface WeekCalendarProps {
  weekStart: Date
  schedules: Record<string, ScheduleWithTimeBlocks>
}

export function WeekCalendar({ weekStart, schedules }: WeekCalendarProps) {
  const { dates } = getWeekRange(weekStart)
  const timeSlots = useMemo(() => getTimeSlots(5, 23), []) // 5 AM to 11 PM
  const [currentTime, setCurrentTime] = useState(new Date())

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
                      schedule={schedules[dateStr]}
                      timeSlots={timeSlots}
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
    </div>
  )
}