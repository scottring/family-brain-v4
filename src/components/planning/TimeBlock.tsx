'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  ClockIcon, 
  EllipsisHorizontalIcon,
  CheckIcon,
  UserIcon
} from '@heroicons/react/24/outline'
import { TimeBlockWithItems } from '@/lib/types/database'
import { ScheduleItemCard } from './ScheduleItemCard'
import { formatTimeRange, timeToMinutes, calculateDuration } from '@/lib/utils'

interface TimeBlockProps {
  timeBlock: TimeBlockWithItems
  date: string
}

export function TimeBlock({ timeBlock, date }: TimeBlockProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  
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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="absolute left-2 right-2 bg-white dark:bg-gray-700 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 overflow-hidden group hover:shadow-md transition-shadow"
      style={{
        top: `${topPosition}px`,
        height: `${height}px`,
        minHeight: '32px'
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-2 border-b border-gray-100 dark:border-gray-600">
        <div className="flex items-center space-x-2 flex-1 min-w-0">
          <ClockIcon className="h-4 w-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
          <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
            {formatTimeRange(timeBlock.start_time, timeBlock.end_time)}
          </span>
          {totalItems > 0 && (
            <div className="flex items-center space-x-1 ml-2">
              <div className="flex -space-x-1">
                {completedItems.length > 0 && (
                  <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                    <CheckIcon className="h-2.5 w-2.5 text-white" />
                  </div>
                )}
                {timeBlock.schedule_items.some(item => item.completed_by) && (
                  <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                    <UserIcon className="h-2.5 w-2.5 text-white" />
                  </div>
                )}
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {completedItems.length}/{totalItems}
              </span>
            </div>
          )}
        </div>
        
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
        >
          <EllipsisHorizontalIcon className="h-4 w-4 text-gray-400" />
        </button>
      </div>

      {/* Progress Bar */}
      {totalItems > 0 && (
        <div className="h-1 bg-gray-100 dark:bg-gray-600">
          <div
            className="h-full bg-green-500 transition-all duration-300"
            style={{ width: `${completionRate}%` }}
          />
        </div>
      )}

      {/* Items */}
      <div className="p-2 space-y-1 overflow-hidden">
        {timeBlock.schedule_items.map((item, index) => (
          <ScheduleItemCard
            key={item.id}
            item={item}
            timeBlockId={timeBlock.id}
            isExpanded={isExpanded}
            isCompact={!isExpanded && timeBlock.schedule_items.length > 2 && index >= 2}
          />
        ))}
        
        {!isExpanded && timeBlock.schedule_items.length > 2 && (
          <button
            onClick={() => setIsExpanded(true)}
            className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
          >
            +{timeBlock.schedule_items.length - 2} more
          </button>
        )}
      </div>
    </motion.div>
  )
}