'use client'

import { useMemo } from 'react'
import { format } from 'date-fns'
import { ScheduleWithTimeBlocks } from '@/lib/types/database'
import { DayColumn } from './DayColumn'
import { TimeGutter } from './TimeGutter'
import { getWeekRange, getTimeSlots } from '@/lib/utils'

interface WeekCalendarProps {
  weekStart: Date
  schedules: Record<string, ScheduleWithTimeBlocks>
}

export function WeekCalendar({ weekStart, schedules }: WeekCalendarProps) {
  const { dates } = getWeekRange(weekStart)
  const timeSlots = useMemo(() => getTimeSlots(5, 23), []) // 5 AM to 11 PM

  return (
    <div className="h-full bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="flex h-full">
        {/* Time Gutter */}
        <div className="w-20 flex-shrink-0 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700">
          <div className="h-16 border-b border-gray-200 dark:border-gray-700" />
          <TimeGutter timeSlots={timeSlots} />
        </div>

        {/* Week Grid */}
        <div className="flex-1 overflow-auto">
          <div className="flex">
            {/* Day Headers */}
            <div className="flex w-full">
              {dates.map((date) => {
                const dateStr = format(date, 'yyyy-MM-dd')
                const isToday = format(new Date(), 'yyyy-MM-dd') === dateStr
                
                return (
                  <div
                    key={dateStr}
                    className="flex-1 min-w-0 border-r border-gray-200 dark:border-gray-700 last:border-r-0"
                  >
                    {/* Day Header */}
                    <div className="h-16 flex flex-col items-center justify-center border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                      <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
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