'use client'

import { motion } from 'framer-motion'
import { 
  ClockIcon, 
  ChevronDownIcon, 
  ChevronRightIcon,
  CheckCircleIcon,
  PlayCircleIcon
} from '@heroicons/react/24/outline'
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid'
import { TimeBlockWithItems } from '@/lib/types/database'
import { ExecutionScheduleItem } from './ExecutionScheduleItem'
import { useScheduleStore } from '@/lib/stores/useScheduleStore'
import { formatTimeRange, getTimeStatus } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface ExecutionTimeBlockProps {
  timeBlock: TimeBlockWithItems
  date: string
  isActive: boolean
  index: number
}

export function ExecutionTimeBlock({ 
  timeBlock, 
  date, 
  isActive,
  index 
}: ExecutionTimeBlockProps) {
  const { expandedItems, toggleExpandedItem, setArtifactPanelItemId } = useScheduleStore()
  
  const isExpanded = expandedItems.has(timeBlock.id)
  const timeStatus = getTimeStatus(date, timeBlock.start_time, timeBlock.end_time)
  
  const completedItems = timeBlock.schedule_items.filter(item => item.completed_at)
  const totalItems = timeBlock.schedule_items.length
  const completionRate = totalItems > 0 ? (completedItems.length / totalItems) * 100 : 0
  const isFullyCompleted = totalItems > 0 && completedItems.length === totalItems
  
  const getStatusStyles = () => {
    switch (timeStatus) {
      case 'current':
        return 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
      case 'past':
        return isFullyCompleted 
          ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
          : 'border-gray-300 bg-gray-50 dark:bg-gray-800'
      default:
        return 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700'
    }
  }

  const handleToggleExpanded = () => {
    toggleExpandedItem(timeBlock.id)
  }

  const handleOpenInFocus = () => {
    // This would open the time block in focus mode
    console.log('Open in focus mode:', timeBlock.id)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={cn(
        'rounded-lg border-2 overflow-hidden transition-all duration-200',
        getStatusStyles(),
        isActive && 'ring-2 ring-blue-500 ring-offset-2 ring-offset-gray-50 dark:ring-offset-gray-900'
      )}
    >
      {/* Header */}
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <div className={cn(
              'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center',
              timeStatus === 'current' && 'bg-blue-100 dark:bg-blue-900',
              timeStatus === 'past' && isFullyCompleted && 'bg-green-100 dark:bg-green-900',
              timeStatus === 'past' && !isFullyCompleted && 'bg-gray-100 dark:bg-gray-800',
              timeStatus === 'future' && 'bg-gray-100 dark:bg-gray-800'
            )}>
              {timeStatus === 'current' ? (
                <PlayCircleIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              ) : isFullyCompleted ? (
                <CheckCircleIconSolid className="h-5 w-5 text-green-600 dark:text-green-400" />
              ) : (
                <ClockIcon className="h-5 w-5 text-gray-500" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <span className={cn(
                  'text-lg font-semibold',
                  timeStatus === 'current' && 'text-blue-900 dark:text-blue-100',
                  timeStatus === 'past' && 'text-gray-700 dark:text-gray-300',
                  timeStatus === 'future' && 'text-gray-900 dark:text-white'
                )}>
                  {formatTimeRange(timeBlock.start_time, timeBlock.end_time)}
                </span>
                {isActive && (
                  <span className="px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
                    Current
                  </span>
                )}
              </div>
              
              {totalItems > 0 && (
                <div className="flex items-center space-x-2 mt-1">
                  <div className="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-1.5 max-w-32">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${completionRate}%` }}
                      className="h-1.5 bg-green-500 rounded-full transition-all duration-300"
                    />
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {completedItems.length}/{totalItems}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {timeStatus === 'current' && (
              <button
                onClick={handleOpenInFocus}
                className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-lg transition-colors"
                title="Open in focus mode"
              >
                <PlayCircleIcon className="h-5 w-5" />
              </button>
            )}
            
            {totalItems > 0 && (
              <button
                onClick={handleToggleExpanded}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                {isExpanded ? (
                  <ChevronDownIcon className="h-5 w-5" />
                ) : (
                  <ChevronRightIcon className="h-5 w-5" />
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Items */}
      {totalItems > 0 && (
        <motion.div
          initial={false}
          animate={{
            height: isExpanded ? 'auto' : 0,
            opacity: isExpanded ? 1 : 0
          }}
          transition={{
            duration: 0.2,
            ease: 'easeInOut'
          }}
          className="overflow-hidden"
        >
          <div className="border-t border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50">
            <div className="p-4 space-y-3">
              {timeBlock.schedule_items.map((item, itemIndex) => (
                <ExecutionScheduleItem
                  key={item.id}
                  item={item}
                  timeBlockId={timeBlock.id}
                  index={itemIndex}
                />
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Empty State */}
      {totalItems === 0 && (
        <div className="border-t border-gray-200 dark:border-gray-600 p-4 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No items scheduled for this time block
          </p>
        </div>
      )}
    </motion.div>
  )
}