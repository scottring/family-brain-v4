'use client'

import { memo, ReactNode, useState } from 'react'
import { motion, PanInfo } from 'framer-motion'
import { Trash2, Check, Edit, MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface SwipeAction {
  icon: React.ComponentType<{ className?: string }>
  label: string
  action: () => void
  color: 'red' | 'green' | 'blue' | 'gray'
  position: 'left' | 'right'
}

interface SwipeableCardProps {
  children: ReactNode
  actions?: SwipeAction[]
  onSwipe?: (direction: 'left' | 'right', action?: SwipeAction) => void
  disabled?: boolean
  className?: string
  swipeThreshold?: number
}

const SwipeableCard = memo(function SwipeableCard({
  children,
  actions = [],
  onSwipe,
  disabled = false,
  className,
  swipeThreshold = 100
}: SwipeableCardProps) {
  const [dragX, setDragX] = useState(0)
  const [isRevealing, setIsRevealing] = useState(false)
  const [revealedSide, setRevealedSide] = useState<'left' | 'right' | null>(null)

  const leftActions = actions.filter(action => action.position === 'left')
  const rightActions = actions.filter(action => action.position === 'right')

  const getColorClasses = (color: SwipeAction['color']) => {
    switch (color) {
      case 'red':
        return 'bg-destructive text-destructive-foreground'
      case 'green':
        return 'bg-green-500 text-white'
      case 'blue':
        return 'bg-blue-500 text-white'
      case 'gray':
        return 'bg-muted text-muted-foreground'
      default:
        return 'bg-muted text-muted-foreground'
    }
  }

  const handleDragEnd = (event: any, info: PanInfo) => {
    if (disabled) return

    const swipeDistance = info.offset.x
    const swipeVelocity = info.velocity.x

    // Determine if it's a significant swipe
    if (Math.abs(swipeDistance) > swipeThreshold || Math.abs(swipeVelocity) > 500) {
      const direction = swipeDistance > 0 ? 'right' : 'left'
      
      // Find the action to trigger
      const relevantActions = direction === 'right' ? leftActions : rightActions
      if (relevantActions.length > 0) {
        const action = relevantActions[0] // Take the first action
        onSwipe?.(direction, action)
        action.action()
      } else {
        onSwipe?.(direction)
      }
      
      // Reset position
      setDragX(0)
      setIsRevealing(false)
      setRevealedSide(null)
    } else if (Math.abs(swipeDistance) > 40) {
      // Reveal actions but don't trigger
      const direction = swipeDistance > 0 ? 'right' : 'left'
      setIsRevealing(true)
      setRevealedSide(direction)
      setDragX(direction === 'right' ? 80 : -80)
    } else {
      // Snap back to center
      setDragX(0)
      setIsRevealing(false)
      setRevealedSide(null)
    }
  }

  const handleDrag = (event: any, info: PanInfo) => {
    if (disabled) return
    setDragX(info.offset.x)
  }

  const handleActionClick = (action: SwipeAction) => {
    action.action()
    // Reset after action
    setDragX(0)
    setIsRevealing(false)
    setRevealedSide(null)
  }

  const resetPosition = () => {
    setDragX(0)
    setIsRevealing(false)
    setRevealedSide(null)
  }

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {/* Left Actions */}
      {leftActions.length > 0 && (
        <motion.div
          className="absolute left-0 top-0 bottom-0 flex items-center"
          animate={{
            opacity: revealedSide === 'right' ? 1 : 0,
            x: revealedSide === 'right' ? 0 : -40
          }}
          transition={{ duration: 0.2 }}
        >
          {leftActions.map((action, index) => {
            const Icon = action.icon
            return (
              <Button
                key={index}
                size="icon"
                variant="ghost"
                className={cn('h-full w-16 rounded-none', getColorClasses(action.color))}
                onClick={() => handleActionClick(action)}
                aria-label={action.label}
              >
                <Icon className="h-5 w-5" />
              </Button>
            )
          })}
        </motion.div>
      )}

      {/* Right Actions */}
      {rightActions.length > 0 && (
        <motion.div
          className="absolute right-0 top-0 bottom-0 flex items-center"
          animate={{
            opacity: revealedSide === 'left' ? 1 : 0,
            x: revealedSide === 'left' ? 0 : 40
          }}
          transition={{ duration: 0.2 }}
        >
          {rightActions.map((action, index) => {
            const Icon = action.icon
            return (
              <Button
                key={index}
                size="icon"
                variant="ghost"
                className={cn('h-full w-16 rounded-none', getColorClasses(action.color))}
                onClick={() => handleActionClick(action)}
                aria-label={action.label}
              >
                <Icon className="h-5 w-5" />
              </Button>
            )
          })}
        </motion.div>
      )}

      {/* Main Card Content */}
      <motion.div
        className="relative bg-background z-10"
        drag={disabled ? false : 'x'}
        dragConstraints={{ left: -120, right: 120 }}
        dragElastic={0.1}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        animate={{
          x: dragX
        }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 30
        }}
        onClick={isRevealing ? resetPosition : undefined}
        style={{
          cursor: disabled ? 'default' : 'grab'
        }}
        whileTap={{
          cursor: disabled ? 'default' : 'grabbing'
        }}
      >
        {children}
      </motion.div>
    </div>
  )
})

// Pre-configured swipeable cards for common use cases
const SwipeableTaskCard = memo(function SwipeableTaskCard({
  children,
  onComplete,
  onDelete,
  onEdit,
  className
}: {
  children: ReactNode
  onComplete?: () => void
  onDelete?: () => void
  onEdit?: () => void
  className?: string
}) {
  const actions: SwipeAction[] = []
  
  if (onComplete) {
    actions.push({
      icon: Check,
      label: 'Complete',
      action: onComplete,
      color: 'green',
      position: 'left'
    })
  }
  
  if (onEdit) {
    actions.push({
      icon: Edit,
      label: 'Edit',
      action: onEdit,
      color: 'blue',
      position: 'right'
    })
  }
  
  if (onDelete) {
    actions.push({
      icon: Trash2,
      label: 'Delete',
      action: onDelete,
      color: 'red',
      position: 'right'
    })
  }

  return (
    <SwipeableCard actions={actions} className={className}>
      {children}
    </SwipeableCard>
  )
})

export { SwipeableCard, SwipeableTaskCard }