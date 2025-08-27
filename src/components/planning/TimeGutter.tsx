'use client'

import { formatDisplayTime } from '@/lib/utils'

interface TimeGutterProps {
  timeSlots: string[]
}

export function TimeGutter({ timeSlots }: TimeGutterProps) {
  // Show only hour markers (skip 15-minute increments for cleaner look)
  const hourSlots = timeSlots.filter(slot => slot.endsWith(':00:00'))

  return (
    <div className="relative">
      {hourSlots.map((timeSlot, index) => (
        <div
          key={timeSlot}
          className="h-16 flex items-start justify-end pr-2 pt-1"
        >
          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
            {formatDisplayTime(timeSlot)}
          </span>
        </div>
      ))}
    </div>
  )
}