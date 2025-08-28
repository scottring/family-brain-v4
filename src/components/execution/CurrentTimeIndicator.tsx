'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Clock, Sunrise, Sun, Sunset, Moon } from 'lucide-react'

interface CurrentTimeIndicatorProps {
  className?: string
  showIcon?: boolean
  format?: '12h' | '24h'
}

export function CurrentTimeIndicator({ 
  className = '',
  showIcon = true,
  format = '12h'
}: CurrentTimeIndicatorProps) {
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const formatTime = (date: Date) => {
    if (format === '24h') {
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })
    }
    
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const getTimeIcon = () => {
    const hour = currentTime.getHours()
    
    if (hour >= 5 && hour < 8) return Sunrise
    if (hour >= 8 && hour < 18) return Sun
    if (hour >= 18 && hour < 21) return Sunset
    return Moon
  }

  const TimeIcon = getTimeIcon()
  const timeString = formatTime(currentTime)
  const dateString = currentTime.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  })

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`flex items-center space-x-2 ${className}`}
    >
      {showIcon && (
        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
          <TimeIcon className="h-4 w-4 text-primary" />
        </div>
      )}
      <div className="text-right">
        <div className="text-lg font-mono font-bold text-foreground">
          {timeString}
        </div>
        <div className="text-xs text-muted-foreground -mt-1">
          {dateString}
        </div>
      </div>
    </motion.div>
  )
}

// Compact version for mobile/smaller spaces
export function CompactCurrentTimeIndicator({ className = '' }: { className?: string }) {
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const timeString = currentTime.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`flex items-center space-x-2 ${className}`}
    >
      <Clock className="h-4 w-4 text-muted-foreground" />
      <span className="text-sm font-mono font-medium text-foreground">
        {timeString}
      </span>
    </motion.div>
  )
}