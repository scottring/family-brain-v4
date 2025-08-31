'use client'

import { motion } from 'framer-motion'
import { Flame, Trophy, Star, Zap } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface StreakBadgeProps {
  count: number
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  animate?: boolean
}

export function StreakBadge({ 
  count, 
  size = 'md', 
  showLabel = true,
  animate = true 
}: StreakBadgeProps) {
  if (count <= 0) return null

  const getMilestone = () => {
    if (count >= 100) return { icon: Trophy, color: 'text-yellow-500', label: 'Century!' }
    if (count >= 30) return { icon: Star, color: 'text-purple-500', label: 'Monthly!' }
    if (count >= 7) return { icon: Zap, color: 'text-blue-500', label: 'Weekly!' }
    return { icon: Flame, color: 'text-orange-500', label: 'Streak' }
  }

  const { icon: Icon, color, label } = getMilestone()

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2'
  }

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  }

  return (
    <motion.div
      initial={animate ? { scale: 0 } : undefined}
      animate={animate ? { scale: 1 } : undefined}
      transition={{ type: "spring", duration: 0.5 }}
    >
      <Badge 
        variant="secondary" 
        className={cn(
          "flex items-center space-x-1.5 font-medium",
          sizeClasses[size]
        )}
      >
        <motion.div
          animate={animate ? {
            scale: [1, 1.2, 1],
            rotate: [0, 10, -10, 0]
          } : undefined}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatDelay: 3
          }}
        >
          <Icon className={cn(iconSizes[size], color)} />
        </motion.div>
        <span className="font-bold">{count}</span>
        {showLabel && (
          <span className="text-muted-foreground">
            day{count !== 1 ? 's' : ''} {label}
          </span>
        )}
      </Badge>
    </motion.div>
  )
}