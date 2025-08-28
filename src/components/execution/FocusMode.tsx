'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Play,
  Pause,
  SkipForward,
  CheckCircle2,
  Timer,
  Target,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Star,
  Clock
} from 'lucide-react'
import { TimeBlockWithItems, ScheduleItemWithTemplate } from '@/lib/types/database'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { formatTimeRange, getTimeRemaining } from '@/lib/utils'
import { CurrentTimeIndicator } from './CurrentTimeIndicator'

interface FocusModeProps {
  timeBlock: TimeBlockWithItems
  onClose: () => void
  onNext?: () => void
  onPrevious?: () => void
  isOpen: boolean
}

type FocusState = 'idle' | 'working' | 'break' | 'completed'

export function FocusMode({ 
  timeBlock, 
  onClose, 
  onNext, 
  onPrevious, 
  isOpen 
}: FocusModeProps) {
  const [focusState, setFocusState] = useState<FocusState>('idle')
  const [currentItemIndex, setCurrentItemIndex] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState(getTimeRemaining(timeBlock.end_time))
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [sessionStarted, setSessionStarted] = useState(false)

  const items = timeBlock.schedule_items.filter(item => !item.completed_at)
  const currentItem = items[currentItemIndex]
  const completedItems = timeBlock.schedule_items.filter(item => item.completed_at)
  const totalItems = timeBlock.schedule_items.length
  const completionRate = totalItems > 0 ? (completedItems.length / totalItems) * 100 : 0

  // Update time remaining every second
  useEffect(() => {
    if (!isOpen) return

    const interval = setInterval(() => {
      setTimeRemaining(getTimeRemaining(timeBlock.end_time))
    }, 1000)

    return () => clearInterval(interval)
  }, [isOpen, timeBlock.end_time])

  // Handle keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        handleToggleSession()
      } else if (e.key === 'ArrowRight' && onNext) {
        onNext()
      } else if (e.key === 'ArrowLeft' && onPrevious) {
        onPrevious()
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [isOpen, onClose, onNext, onPrevious])

  const handleToggleSession = () => {
    if (focusState === 'idle') {
      setFocusState('working')
      setSessionStarted(true)
    } else if (focusState === 'working') {
      setFocusState('break')
    } else if (focusState === 'break') {
      setFocusState('working')
    }
  }

  const handleNextItem = () => {
    if (currentItemIndex < items.length - 1) {
      setCurrentItemIndex(currentItemIndex + 1)
    }
  }

  const handlePreviousItem = () => {
    if (currentItemIndex > 0) {
      setCurrentItemIndex(currentItemIndex - 1)
    }
  }

  const getStateMessage = () => {
    switch (focusState) {
      case 'working':
        return 'Focus time - work on your current task'
      case 'break':
        return 'Break time - rest and recharge'
      case 'completed':
        return 'Time block completed! Well done.'
      default:
        return 'Ready to start your focused work session?'
    }
  }

  const getStateColor = () => {
    switch (focusState) {
      case 'working':
        return 'text-green-600 dark:text-green-400'
      case 'break':
        return 'text-blue-600 dark:text-blue-400'
      case 'completed':
        return 'text-purple-600 dark:text-purple-400'
      default:
        return 'text-foreground'
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm"
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
              >
                <X className="h-4 w-4 mr-2" />
                Exit Focus
              </Button>
              
              <Separator orientation="vertical" className="h-6" />
              
              <div className="flex items-center space-x-2">
                <Badge variant="secondary">
                  {formatTimeRange(timeBlock.start_time, timeBlock.end_time)}
                </Badge>
                <span className="text-sm text-muted-foreground">•</span>
                <span className="text-sm text-muted-foreground">
                  {totalItems} items
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <CurrentTimeIndicator />
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                >
                  {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsFullscreen(!isFullscreen)}
                >
                  {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>

          {/* Main Focus Area */}
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="max-w-4xl w-full">
              {/* Time Remaining */}
              <div className="text-center mb-8">
                <motion.div
                  key={`${timeRemaining.minutes}-${timeRemaining.seconds}`}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-6xl font-mono font-bold text-foreground mb-4"
                >
                  {String(timeRemaining.minutes).padStart(2, '0')}:
                  {String(timeRemaining.seconds).padStart(2, '0')}
                </motion.div>
                <p className={cn('text-lg', getStateColor())}>
                  {getStateMessage()}
                </p>
              </div>

              {/* Current Task */}
              {currentItem && (
                <Card className="mb-8">
                  <CardContent className="p-8">
                    <div className="text-center mb-6">
                      <Badge variant="secondary" className="mb-4">
                        Task {currentItemIndex + 1} of {items.length}
                      </Badge>
                      <h2 className="text-2xl font-bold text-foreground mb-2">
                        {currentItem.title}
                      </h2>
                      {currentItem.description && (
                        <p className="text-muted-foreground">
                          {currentItem.description}
                        </p>
                      )}
                    </div>

                    {/* Task Navigation */}
                    <div className="flex items-center justify-center space-x-4 mb-6">
                      <Button
                        variant="outline"
                        onClick={handlePreviousItem}
                        disabled={currentItemIndex === 0}
                      >
                        <ChevronLeft className="h-4 w-4 mr-2" />
                        Previous
                      </Button>
                      
                      <Button
                        size="lg"
                        onClick={handleToggleSession}
                        className={cn(
                          'px-8',
                          focusState === 'working' && 'bg-green-600 hover:bg-green-700',
                          focusState === 'break' && 'bg-blue-600 hover:bg-blue-700'
                        )}
                      >
                        {focusState === 'idle' && (
                          <>
                            <Play className="h-5 w-5 mr-2" />
                            Start Focus Session
                          </>
                        )}
                        {focusState === 'working' && (
                          <>
                            <Pause className="h-5 w-5 mr-2" />
                            Take a Break
                          </>
                        )}
                        {focusState === 'break' && (
                          <>
                            <Play className="h-5 w-5 mr-2" />
                            Resume Work
                          </>
                        )}
                      </Button>
                      
                      <Button
                        variant="outline"
                        onClick={handleNextItem}
                        disabled={currentItemIndex >= items.length - 1}
                      >
                        Next
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>

                    {/* Progress */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Overall Progress</span>
                        <span className="font-medium">{Math.round(completionRate)}%</span>
                      </div>
                      <Progress value={completionRate} className="h-3" />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* All Items Overview */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                    <Target className="h-5 w-5 mr-2" />
                    All Tasks ({completedItems.length}/{totalItems} completed)
                  </h3>
                  
                  <div className="grid gap-3 max-h-60 overflow-y-auto">
                    {timeBlock.schedule_items.map((item, index) => (
                      <div
                        key={item.id}
                        className={cn(
                          'flex items-center space-x-3 p-3 rounded-lg border transition-all',
                          item.completed_at
                            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                            : index === currentItemIndex
                            ? 'bg-primary/5 border-primary/20'
                            : 'bg-muted/50 border-border'
                        )}
                      >
                        <div
                          className={cn(
                            'w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium',
                            item.completed_at
                              ? 'bg-green-500 text-white'
                              : index === currentItemIndex
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-muted-foreground'
                          )}
                        >
                          {item.completed_at ? (
                            <CheckCircle2 className="h-4 w-4" />
                          ) : (
                            index + 1
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            'text-sm font-medium',
                            item.completed_at && 'line-through text-muted-foreground'
                          )}>
                            {item.title}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-border p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Timer className="h-4 w-4" />
                  <span>
                    {timeRemaining.minutes > 0 
                      ? `${timeRemaining.minutes}m remaining` 
                      : 'Time block ending soon'
                    }
                  </span>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {onPrevious && (
                  <Button variant="outline" size="sm" onClick={onPrevious}>
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous Block
                  </Button>
                )}
                {onNext && (
                  <Button variant="outline" size="sm" onClick={onNext}>
                    Next Block
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}