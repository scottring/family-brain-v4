'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface UndoNotificationProps {
  message: string
  onUndo: () => void
  onDismiss: () => void
  duration?: number // in seconds
}

export function UndoNotification({ 
  message, 
  onUndo, 
  onDismiss, 
  duration = 10 
}: UndoNotificationProps) {
  const [timeLeft, setTimeLeft] = useState(duration)

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          onDismiss()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [onDismiss])

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.9 }}
        className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50"
      >
        <div className="bg-background border rounded-lg shadow-lg p-4 flex items-center gap-3 min-w-[300px]">
          <div className="flex-1">
            <p className="text-sm font-medium">{message}</p>
            <p className="text-xs text-muted-foreground">
              Undoing in {timeLeft} seconds...
            </p>
          </div>
          
          <Button
            size="sm"
            variant="ghost"
            onClick={onUndo}
            className="flex items-center gap-1"
          >
            <RotateCcw className="h-4 w-4" />
            Undo
          </Button>
          
          <Button
            size="icon"
            variant="ghost"
            onClick={onDismiss}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
          
          {/* Progress bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted rounded-b-lg overflow-hidden">
            <motion.div
              className="h-full bg-primary"
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: duration, ease: 'linear' }}
            />
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}