'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  XMarkIcon,
  ClockIcon,
  CheckCircleIcon,
  PlayIcon,
  PauseIcon,
  ForwardIcon
} from '@heroicons/react/24/outline'
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid'
import { useScheduleStore } from '@/lib/stores/useScheduleStore'
import { useAppStore } from '@/lib/stores/useAppStore'
import { scheduleService } from '@/lib/services/ScheduleService'
import { formatTimeRange } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface FocusModeProps {
  timeBlockId: string
  onExit: () => void
}

export function FocusMode({ timeBlockId, onExit }: FocusModeProps) {
  const { user } = useAppStore()
  const { currentSchedule, updateScheduleItem } = useScheduleStore()
  
  const [currentItemIndex, setCurrentItemIndex] = useState(0)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [startTime, setStartTime] = useState<Date | null>(null)

  const timeBlock = currentSchedule?.time_blocks?.find(block => block.id === timeBlockId)
  const items = timeBlock?.schedule_items ?? []
  const currentItem = items[currentItemIndex]

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout
    
    if (isTimerRunning && startTime) {
      interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime.getTime()) / 1000))
      }, 1000)
    }
    
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isTimerRunning, startTime])

  const handleStartTimer = () => {
    if (!isTimerRunning) {
      setStartTime(new Date())
      setIsTimerRunning(true)
    } else {
      setIsTimerRunning(false)
    }
  }

  const handleCompleteItem = async () => {
    if (!user || !currentItem) return
    
    try {
      const updatedItem = await scheduleService.completeScheduleItem(currentItem.id, user.id)
      updateScheduleItem(currentItem.id, updatedItem)
      
      // Move to next item or exit if this was the last one
      if (currentItemIndex < items.length - 1) {
        setCurrentItemIndex(currentItemIndex + 1)
        setElapsedTime(0)
        setStartTime(new Date())
      } else {
        onExit()
      }
    } catch (error) {
      console.error('Error completing item:', error)
    }
  }

  const handleSkipItem = () => {
    if (currentItemIndex < items.length - 1) {
      setCurrentItemIndex(currentItemIndex + 1)
      setElapsedTime(0)
      if (isTimerRunning) {
        setStartTime(new Date())
      }
    } else {
      onExit()
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  if (!timeBlock) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-gray-900 z-50 flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-700">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
            <ClockIcon className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white">Focus Mode</h1>
            <p className="text-gray-400">
              {formatTimeRange(timeBlock.start_time, timeBlock.end_time)}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <div className="text-2xl font-mono text-white">
              {formatTime(elapsedTime)}
            </div>
            <div className="text-sm text-gray-400">
              {currentItemIndex + 1} of {items.length}
            </div>
          </div>
          
          <button
            onClick={onExit}
            className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="px-6 py-4 border-b border-gray-700">
        <div className="w-full bg-gray-700 rounded-full h-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${((currentItemIndex + 1) / items.length) * 100}%` }}
            className="h-2 bg-blue-600 rounded-full transition-all duration-300"
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-2xl w-full text-center">
          <AnimatePresence mode="wait">
            {currentItem && (
              <motion.div
                key={currentItem.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                {/* Current Item */}
                <div className="space-y-4">
                  <div className={cn(
                    'w-16 h-16 rounded-full mx-auto flex items-center justify-center',
                    currentItem.completed_at ? 'bg-green-600' : 'bg-blue-600'
                  )}>
                    {currentItem.completed_at ? (
                      <CheckCircleIconSolid className="h-8 w-8 text-white" />
                    ) : (
                      <ClockIcon className="h-8 w-8 text-white" />
                    )}
                  </div>
                  
                  <h2 className="text-3xl font-bold text-white mb-2">
                    {currentItem.title}
                  </h2>
                  
                  {currentItem.description && (
                    <p className="text-lg text-gray-300">
                      {currentItem.description}
                    </p>
                  )}

                  {/* Template Steps */}
                  {currentItem.template?.template_steps && (
                    <div className="mt-8 bg-gray-800 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-white mb-4">Steps:</h3>
                      <div className="space-y-3 text-left">
                        {currentItem.template.template_steps.map((step, index) => (
                          <div key={step.id} className="flex items-start space-x-3">
                            <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <span className="text-xs font-medium text-gray-300">
                                {index + 1}
                              </span>
                            </div>
                            <div>
                              <p className="text-white font-medium">{step.title}</p>
                              {step.description && (
                                <p className="text-sm text-gray-400 mt-1">{step.description}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center space-x-4">
                  <button
                    onClick={handleStartTimer}
                    className={cn(
                      'px-6 py-3 rounded-lg font-medium transition-colors',
                      isTimerRunning
                        ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                        : 'bg-green-600 hover:bg-green-700 text-white'
                    )}
                  >
                    {isTimerRunning ? (
                      <>
                        <PauseIcon className="h-5 w-5 mr-2 inline" />
                        Pause
                      </>
                    ) : (
                      <>
                        <PlayIcon className="h-5 w-5 mr-2 inline" />
                        Start
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={handleCompleteItem}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                  >
                    <CheckCircleIcon className="h-5 w-5 mr-2 inline" />
                    Complete
                  </button>
                  
                  <button
                    onClick={handleSkipItem}
                    className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                  >
                    <ForwardIcon className="h-5 w-5 mr-2 inline" />
                    Skip
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {items.length === 0 && (
            <div className="text-center">
              <ClockIcon className="h-16 w-16 text-gray-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">No Items</h2>
              <p className="text-gray-400">This time block has no items to focus on.</p>
            </div>
          )}
        </div>
      </div>

      {/* Item List Sidebar */}
      {items.length > 1 && (
        <div className="w-80 bg-gray-800 border-l border-gray-700 p-6 fixed right-0 top-0 h-full overflow-y-auto">
          <h3 className="text-lg font-semibold text-white mb-4">All Items</h3>
          <div className="space-y-2">
            {items.map((item, index) => (
              <button
                key={item.id}
                onClick={() => setCurrentItemIndex(index)}
                className={cn(
                  'w-full text-left p-3 rounded-lg transition-colors',
                  index === currentItemIndex
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700',
                  item.completed_at && 'opacity-60'
                )}
              >
                <div className="flex items-center space-x-3">
                  {item.completed_at ? (
                    <CheckCircleIconSolid className="h-5 w-5 text-green-500" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-gray-500" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{item.title}</p>
                    {item.description && (
                      <p className="text-xs opacity-75 truncate">{item.description}</p>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  )
}