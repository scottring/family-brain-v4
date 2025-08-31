'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, isToday, subMonths, addMonths } from 'date-fns'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { TemplateCompletion } from '@/lib/services/TrackingService'
import { trackingService } from '@/lib/services/TrackingService'

interface CompletionCalendarProps {
  templateId: string
  memberId?: string
  compact?: boolean
  showControls?: boolean
}

export function CompletionCalendar({ 
  templateId, 
  memberId, 
  compact = false,
  showControls = true 
}: CompletionCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [completions, setCompletions] = useState<TemplateCompletion[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCompletions()
  }, [templateId, memberId, currentMonth])

  const fetchCompletions = async () => {
    setLoading(true)
    const start = startOfMonth(currentMonth)
    const end = endOfMonth(currentMonth)
    const data = await trackingService.getTemplateCompletions(
      templateId,
      start,
      end,
      memberId
    )
    setCompletions(data)
    setLoading(false)
  }

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  })

  // Add empty cells for alignment
  const startDay = days[0].getDay()
  const emptyCells = Array.from({ length: startDay }, (_, i) => `empty-${i}`)

  const getCompletionForDate = (date: Date) => {
    return completions.find(c => 
      isSameDay(new Date(c.date), date)
    )
  }

  const handlePreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1))
  }

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1))
  }

  const handleToday = () => {
    setCurrentMonth(new Date())
  }

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-64 bg-muted rounded-lg"></div>
      </div>
    )
  }

  const completedCount = completions.filter(c => c.completed).length
  const totalDays = days.length
  const completionRate = Math.round((completedCount / totalDays) * 100)

  return (
    <div className="space-y-4">
      {/* Header */}
      {showControls && (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePreviousMonth}
              className="h-8 w-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h3 className="font-medium text-sm">
              {format(currentMonth, 'MMMM yyyy')}
            </h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNextMonth}
              className="h-8 w-8"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            {!isSameMonth(currentMonth, new Date()) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleToday}
                className="h-8 px-2 text-xs"
              >
                Today
              </Button>
            )}
          </div>
          <div className="text-sm text-muted-foreground">
            {completedCount}/{totalDays} days ({completionRate}%)
          </div>
        </div>
      )}

      {/* Calendar Grid */}
      <div className={cn(
        "grid grid-cols-7 gap-1",
        compact ? "text-xs" : "text-sm"
      )}>
        {/* Day headers */}
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
          <div
            key={`header-${index}`}
            className="text-center font-medium text-muted-foreground p-1"
          >
            {day}
          </div>
        ))}

        {/* Empty cells for alignment */}
        {emptyCells.map(key => (
          <div key={key} />
        ))}

        {/* Calendar days */}
        {days.map((day, index) => {
          const completion = getCompletionForDate(day)
          const isCompleted = completion?.completed || false
          const isTodayDate = isToday(day)
          const isFuture = day > new Date()

          return (
            <motion.div
              key={day.toISOString()}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.01 }}
              className={cn(
                "relative aspect-square flex items-center justify-center rounded-lg transition-all duration-200",
                isTodayDate && "ring-2 ring-primary ring-offset-1",
                isCompleted && "bg-green-100 dark:bg-green-900/30",
                !isCompleted && !isFuture && "bg-muted/30",
                isFuture && "opacity-30"
              )}
            >
              <span className={cn(
                "font-medium",
                isCompleted && "text-green-700 dark:text-green-300",
                isTodayDate && "font-bold"
              )}>
                {format(day, 'd')}
              </span>
              {isCompleted && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", duration: 0.5 }}
                  className="absolute inset-0 flex items-center justify-center pointer-events-none"
                >
                  <CheckCircle2 className={cn(
                    "text-green-600 dark:text-green-400",
                    compact ? "h-3 w-3" : "h-4 w-4"
                  )} />
                </motion.div>
              )}
            </motion.div>
          )
        })}
      </div>

      {/* Legend */}
      {!compact && (
        <div className="flex items-center justify-center space-x-4 text-xs text-muted-foreground">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-green-100 dark:bg-green-900/30 rounded"></div>
            <span>Completed</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-muted/30 rounded"></div>
            <span>Not completed</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 ring-2 ring-primary rounded"></div>
            <span>Today</span>
          </div>
        </div>
      )}
    </div>
  )
}