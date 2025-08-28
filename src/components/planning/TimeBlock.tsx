'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useDrop } from 'react-dnd'
import { 
  ClockIcon, 
  EllipsisHorizontalIcon,
  CheckIcon,
  UserIcon
} from '@heroicons/react/24/outline'
import { TimeBlockWithItems } from '@/lib/types/database'
import { ScheduleItemCard } from './ScheduleItemCard'
import { formatTimeRange, timeToMinutes, calculateDuration, cn } from '@/lib/utils'

interface TimeBlockProps {
  timeBlock: TimeBlockWithItems
  date: string
}

export function TimeBlock({ timeBlock, date }: TimeBlockProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  // Set up drop functionality for moving items to this time block
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: 'scheduleItem',
    drop: async (draggedItem: { scheduleItem: any; sourceTimeBlockId: string }) => {
      if (draggedItem.sourceTimeBlockId !== timeBlock.id) {
        // TODO: Move item to this time block
        console.log('Moving item to time block:', {
          item: draggedItem.scheduleItem,
          from: draggedItem.sourceTimeBlockId,
          to: timeBlock.id
        })
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop()
    })
  })
  
  const startMinutes = timeToMinutes(timeBlock.start_time)
  const duration = calculateDuration(timeBlock.start_time, timeBlock.end_time)
  
  // Calculate position and height based on time
  const topPosition = ((startMinutes - 5 * 60) / 15) * 16 // 5 AM start, 16px per 15min slot
  const height = Math.max((duration / 15) * 16, 32) // Minimum 32px height
  
  const completedItems = timeBlock.schedule_items.filter(item => item.completed_at)
  const totalItems = timeBlock.schedule_items.length
  const completionRate = totalItems > 0 ? (completedItems.length / totalItems) * 100 : 0
  
  return (
    <motion.div
      ref={drop}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "absolute left-1 right-1 bg-white dark:bg-gray-800 rounded-md shadow-sm border overflow-hidden group hover:shadow-md transition-all",
        isOver && canDrop
          ? "border-blue-400 dark:border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800 bg-blue-50 dark:bg-blue-900/20"
          : "border-gray-200 dark:border-gray-700"
      )}
      style={{
        top: `${topPosition}px`,
        height: `${height}px`,
        minHeight: '40px'
      }}
    >
      {/* Simplified Header - Only show time */}
      <div className="px-2 py-1 bg-gradient-to-r from-blue-50 to-transparent dark:from-blue-900/20 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <ClockIcon className="h-3 w-3 text-blue-600 dark:text-blue-400" />
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">
            {formatTimeRange(timeBlock.start_time, timeBlock.end_time)}
          </span>
          {totalItems > 0 && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              ({completedItems.length}/{totalItems})
            </span>
          )}
        </div>
        
        {/* Progress indicator dots */}
        {totalItems > 0 && (
          <div className="flex gap-0.5">
            {Array.from({ length: Math.min(totalItems, 3) }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  i < completedItems.length
                    ? "bg-green-500"
                    : "bg-gray-300 dark:bg-gray-600"
                )}
              />
            ))}
          </div>
        )}
      </div>

      {/* Items - Improved layout */}
      <div className="px-2 py-1 flex flex-col gap-1 overflow-y-auto">
        {timeBlock.schedule_items.map((item, index) => (
          <ScheduleItemCard
            key={item.id}
            item={item}
            timeBlockId={timeBlock.id}
            isExpanded={false}
            isCompact={false}
            isGridView={true}
          />
        ))}
      </div>
    </motion.div>
  )
}