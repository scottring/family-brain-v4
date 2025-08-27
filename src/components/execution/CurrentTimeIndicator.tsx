'use client'

import { forwardRef, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import { TimeBlockWithItems } from '@/lib/types/database'
import { timeToMinutes } from '@/lib/utils'

interface CurrentTimeIndicatorProps {
  timeBlocks: TimeBlockWithItems[]
}

export const CurrentTimeIndicator = forwardRef<HTMLDivElement, CurrentTimeIndicatorProps>(
  ({ timeBlocks }, ref) => {
    const [currentTime, setCurrentTime] = useState(new Date())

    useEffect(() => {
      const interval = setInterval(() => {
        setCurrentTime(new Date())
      }, 60000) // Update every minute

      return () => clearInterval(interval)
    }, [])

    const currentMinutes = timeToMinutes(format(currentTime, 'HH:mm:ss'))
    const startOfDay = 5 * 60 // 5 AM
    const endOfDay = 23 * 60 // 11 PM

    // Don't show indicator outside of day bounds
    if (currentMinutes < startOfDay || currentMinutes > endOfDay) {
      return null
    }

    // Calculate position
    // Each time block in the list has spacing, so we need to calculate based on actual positions
    let topPosition = 0
    let shouldShow = false

    if (timeBlocks.length > 0) {
      // Find if current time falls within any time block
      for (let i = 0; i < timeBlocks.length; i++) {
        const timeBlock = timeBlocks[i]
        const blockStart = timeToMinutes(timeBlock.start_time)
        const blockEnd = timeToMinutes(timeBlock.end_time)

        if (currentMinutes >= blockStart && currentMinutes <= blockEnd) {
          // Time is within this block
          const blockHeight = 120 // Approximate height per block including spacing
          const progressInBlock = (currentMinutes - blockStart) / (blockEnd - blockStart)
          topPosition = (i * blockHeight) + (progressInBlock * 100) + 160 // 160px for header
          shouldShow = true
          break
        } else if (i < timeBlocks.length - 1) {
          const nextBlock = timeBlocks[i + 1]
          const nextBlockStart = timeToMinutes(nextBlock.start_time)
          
          if (currentMinutes > blockEnd && currentMinutes < nextBlockStart) {
            // Time is between this block and the next
            const blockHeight = 120
            topPosition = ((i + 1) * blockHeight) + 160
            shouldShow = true
            break
          }
        }
      }

      // If current time is before first block
      if (!shouldShow && currentMinutes < timeToMinutes(timeBlocks[0].start_time)) {
        topPosition = 160
        shouldShow = true
      }
      // If current time is after last block
      else if (!shouldShow && currentMinutes > timeToMinutes(timeBlocks[timeBlocks.length - 1].end_time)) {
        const blockHeight = 120
        topPosition = (timeBlocks.length * blockHeight) + 160
        shouldShow = true
      }
    } else {
      // No time blocks, show at top
      topPosition = 160
      shouldShow = true
    }

    if (!shouldShow) return null

    return (
      <div
        ref={ref}
        className="absolute left-0 right-0 z-30 pointer-events-none"
        style={{ top: `${topPosition}px` }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center"
        >
          {/* Current Time Badge */}
          <div className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg">
            <span className="block">NOW</span>
            <span className="block text-xs opacity-90">
              {format(currentTime, 'h:mm a')}
            </span>
          </div>
          
          {/* Line */}
          <div className="flex-1 h-0.5 bg-red-500 relative">
            <motion.div
              className="absolute right-0 top-1/2 transform -translate-y-1/2 w-0 h-0"
              style={{
                borderLeft: '8px solid rgb(239, 68, 68)',
                borderTop: '4px solid transparent',
                borderBottom: '4px solid transparent'
              }}
              animate={{
                x: [0, 4, 0]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
            />
          </div>
        </motion.div>
      </div>
    )
  }
)