'use client'

import { useState, useEffect, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Clock, 
  ChevronDown, 
  ChevronRight,
  CheckCircle2,
  Play,
  Timer,
  Target,
  Zap,
  Focus,
  Maximize2
} from 'lucide-react'
import { TimeBlockWithItems } from '@/lib/types/database'
import { ExecutionScheduleItem } from './ExecutionScheduleItem'
import { useScheduleStore } from '@/lib/stores/useScheduleStore'
import { formatTimeRange, getTimeStatus, getTimeRemaining, calculateDuration } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

interface ExecutionTimeBlockProps {
  timeBlock: TimeBlockWithItems
  date: string
  isActive: boolean
  index: number
  onOpenFocus?: () => void
}

const ExecutionTimeBlock = memo(function ExecutionTimeBlock({ 
  timeBlock, 
  date, 
  isActive,
  index,
  onOpenFocus
}: ExecutionTimeBlockProps) {
  const { expandedItems, toggleExpandedItem, setArtifactPanelItemId } = useScheduleStore()
  const [timeRemaining, setTimeRemaining] = useState(getTimeRemaining(timeBlock.end_time))
  
  // Start expanded by default for blocks with items
  const [localExpanded, setLocalExpanded] = useState(timeBlock.schedule_items.length > 0)
  const isExpanded = expandedItems.has(timeBlock.id) ? expandedItems.has(timeBlock.id) : localExpanded
  const timeStatus = getTimeStatus(date, timeBlock.start_time, timeBlock.end_time)
  
  const completedItems = timeBlock.schedule_items.filter(item => item.completed_at)
  const totalItems = timeBlock.schedule_items.length
  const completionRate = totalItems > 0 ? (completedItems.length / totalItems) * 100 : 0
  const isFullyCompleted = totalItems > 0 && completedItems.length === totalItems
  const duration = calculateDuration(timeBlock.start_time, timeBlock.end_time)
  
  // Debug logging
  console.log(`ExecutionTimeBlock: ${timeBlock.start_time}-${timeBlock.end_time}`, {
    id: timeBlock.id,
    totalItems,
    items: timeBlock.schedule_items.map(item => ({
      id: item.id,
      title: item.title,
      template_id: item.template_id,
      template: item.template
    }))
  })
  
  // Update time remaining every second for current time blocks
  useEffect(() => {
    if (timeStatus !== 'current') return
    
    const interval = setInterval(() => {
      setTimeRemaining(getTimeRemaining(timeBlock.end_time))
    }, 1000)
    
    return () => clearInterval(interval)
  }, [timeStatus, timeBlock.end_time])
  
  const getStatusStyles = () => {
    switch (timeStatus) {
      case 'current':
        return {
          border: 'border-primary shadow-lg shadow-primary/20',
          background: 'bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5',
          glow: 'ring-2 ring-primary/30 ring-offset-2 ring-offset-background'
        }
      case 'past':
        return isFullyCompleted 
          ? {
              border: 'border-green-500',
              background: 'bg-green-50 dark:bg-green-900/20',
              glow: ''
            }
          : {
              border: 'border-muted-foreground/20',
              background: 'bg-muted/30',
              glow: ''
            }
      default:
        return {
          border: 'border-border',
          background: 'bg-card',
          glow: ''
        }
    }
  }

  const handleToggleExpanded = () => {
    toggleExpandedItem(timeBlock.id)
  }

  const handleOpenInFocus = () => {
    onOpenFocus?.()
  }
  
  const styles = getStatusStyles()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={cn(
        'rounded-xl border-2 overflow-hidden transition-all duration-300 hover:shadow-md',
        styles.border,
        styles.background,
        isActive && styles.glow,
        timeStatus === 'current' && 'transform hover:scale-[1.02]'
      )}
    >
      {/* Header */}
      <div className={cn('p-6', timeStatus === 'current' && 'pb-4')}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-4 flex-1 min-w-0">
            <div className={cn(
              'flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300',
              timeStatus === 'current' && 'bg-primary/20 ring-2 ring-primary/30 shadow-lg',
              timeStatus === 'past' && isFullyCompleted && 'bg-green-100 dark:bg-green-900',
              timeStatus === 'past' && !isFullyCompleted && 'bg-muted',
              timeStatus === 'future' && 'bg-muted'
            )}>
              {timeStatus === 'current' ? (
                <Play className="h-6 w-6 text-primary animate-pulse" />
              ) : isFullyCompleted ? (
                <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
              ) : (
                <Clock className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-3 mb-2">
                <span className={cn(
                  'text-xl font-bold',
                  timeStatus === 'current' && 'text-primary',
                  timeStatus === 'past' && 'text-muted-foreground',
                  timeStatus === 'future' && 'text-foreground'
                )}>
                  {formatTimeRange(timeBlock.start_time, timeBlock.end_time)}
                </span>
                
                <div className="flex items-center space-x-2">
                  {timeStatus === 'current' && (
                    <Badge variant="default" className="bg-primary/10 text-primary border-primary/20 animate-pulse">
                      <Zap className="h-3 w-3 mr-1" />
                      Active Now
                    </Badge>
                  )}
                  
                  <Badge variant="outline" className="text-xs">
                    {duration}min
                  </Badge>
                </div>
              </div>
              
              {/* Progress Bar */}
              {totalItems > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {completedItems.length} of {totalItems} completed
                    </span>
                    <span className="font-medium">
                      {Math.round(completionRate)}%
                    </span>
                  </div>
                  <Progress 
                    value={completionRate} 
                    className="h-2"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end space-y-2">
            <div className="flex items-center space-x-2">
              {timeStatus === 'current' && onOpenFocus && (
                <Button
                  onClick={handleOpenInFocus}
                  size="sm"
                  className="bg-primary/10 hover:bg-primary/20 text-primary border-primary/20"
                  variant="outline"
                >
                  <Focus className="h-4 w-4 mr-2" />
                  Focus Mode
                </Button>
              )}
              
              {totalItems > 0 && (
                <Button
                  onClick={handleToggleExpanded}
                  variant="ghost"
                  size="sm"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                  {totalItems} items
                </Button>
              )}
            </div>
            
            {/* Time remaining for current block */}
            {timeStatus === 'current' && timeRemaining.minutes > 0 && (
              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                <Timer className="h-3 w-3" />
                <span>
                  {timeRemaining.minutes}m {timeRemaining.seconds}s remaining
                </span>
              </div>
            )}
          </div>
        </div>
        
        {/* Current block enhancement */}
        {timeStatus === 'current' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="border-t border-primary/20 pt-4 bg-primary/5 -mx-6 px-6 pb-2"
          >
            <div className="flex items-center justify-center space-x-4">
              <div className="flex items-center space-x-2 text-primary">
                <Target className="h-4 w-4" />
                <span className="text-sm font-medium">
                  Focus on this time block
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Items */}
      <AnimatePresence>
        {totalItems > 0 && isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{
              duration: 0.3,
              ease: 'easeInOut'
            }}
            className="overflow-hidden"
          >
            <div className="border-t border-border bg-muted/30">
              <div className="p-6 space-y-4">
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
      </AnimatePresence>

      {/* Empty State */}
      {totalItems === 0 && (
        <div className="border-t border-border p-6 text-center">
          <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            No items scheduled for this time block
          </p>
        </div>
      )}
    </motion.div>
  )
})

export { ExecutionTimeBlock }