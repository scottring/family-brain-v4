'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Trophy, 
  Flame, 
  TrendingUp,
  Gift,
  CheckCircle2,
  Circle,
  Star
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { TrackingGoal, GoalProgress } from '@/lib/services/TrackingService'
import { trackingService } from '@/lib/services/TrackingService'

interface TrackingGoalCardProps {
  goal: TrackingGoal
  compact?: boolean
  onComplete?: () => void
}

export function TrackingGoalCard({ goal, compact = false, onComplete }: TrackingGoalCardProps) {
  const [progress, setProgress] = useState<GoalProgress | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProgress()
  }, [goal.id])

  const fetchProgress = async () => {
    setLoading(true)
    const data = await trackingService.getGoalProgress(goal.id)
    setProgress(data)
    setLoading(false)
    
    if (data?.is_complete && onComplete) {
      onComplete()
    }
  }

  if (loading || !progress) {
    return (
      <Card className="animate-pulse">
        <CardContent className="p-6">
          <div className="h-20 bg-muted rounded"></div>
        </CardContent>
      </Card>
    )
  }

  const emoji = goal.template?.tracking_emoji || '📊'
  const title = goal.member 
    ? `${goal.member.full_name}'s ${goal.template?.title}`
    : goal.template?.title || 'Goal'

  if (compact) {
    return (
      <div className="flex items-center justify-between p-4 bg-card rounded-lg border">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{emoji}</span>
          <div>
            <p className="font-medium text-sm">{title}</p>
            <div className="flex items-center space-x-2 mt-1">
              {progress.current_streak > 0 && (
                <Badge variant="secondary" className="text-xs">
                  <Flame className="h-3 w-3 mr-1 text-orange-500" />
                  {progress.current_streak} day streak
                </Badge>
              )}
              <span className="text-xs text-muted-foreground">
                {progress.current_count}/{progress.target_count} days
              </span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold">{progress.percentage}%</div>
          {progress.is_complete && (
            <Badge variant="default" className="mt-1">
              <Trophy className="h-3 w-3 mr-1" />
              Complete!
            </Badge>
          )}
        </div>
      </div>
    )
  }

  return (
    <Card className={cn(
      "transition-all duration-300",
      progress.is_complete && "ring-2 ring-green-500 ring-offset-2"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="text-3xl">{emoji}</div>
            <div>
              <CardTitle className="text-lg">{title}</CardTitle>
              {goal.goal_type === 'count_in_period' && (
                <p className="text-sm text-muted-foreground mt-1">
                  {progress.current_count} of {progress.target_count} days in {progress.period_days} day period
                </p>
              )}
            </div>
          </div>
          {progress.current_streak > 0 && (
            <Badge variant="secondary" className="flex items-center space-x-1">
              <Flame className="h-4 w-4 text-orange-500" />
              <span>{progress.current_streak} day{progress.current_streak !== 1 ? 's' : ''}</span>
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{progress.percentage}%</span>
          </div>
          <Progress value={progress.percentage} className="h-3" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{progress.current_count} completed</span>
            <span>{progress.target_count - progress.current_count} remaining</span>
          </div>
        </div>

        {/* Reward Section */}
        {goal.reward_description && (
          <div className={cn(
            "p-3 rounded-lg border-2 transition-all duration-300",
            progress.is_complete 
              ? "bg-green-50 dark:bg-green-900/20 border-green-500" 
              : "bg-muted/50 border-dashed border-muted-foreground/30"
          )}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-xl">{goal.reward_emoji || '🎁'}</span>
                <div>
                  <p className="text-sm font-medium">
                    {progress.is_complete ? 'Reward Earned!' : 'Reward'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {goal.reward_description}
                  </p>
                </div>
              </div>
              {progress.is_complete && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", duration: 0.5 }}
                >
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </motion.div>
              )}
            </div>
            {!progress.is_complete && progress.target_count - progress.current_count <= 3 && (
              <p className="text-xs text-orange-600 dark:text-orange-400 mt-2 font-medium">
                Only {progress.target_count - progress.current_count} more to earn your reward!
              </p>
            )}
          </div>
        )}

        {/* Visual Progress Dots */}
        {progress.target_count <= 14 && (
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: progress.target_count }).map((_, index) => (
              <motion.div
                key={index}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                {index < progress.current_count ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground/30" />
                )}
              </motion.div>
            ))}
          </div>
        )}

        {/* Completion Celebration */}
        {progress.is_complete && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg"
          >
            <div className="flex items-center justify-center space-x-2 text-green-600 dark:text-green-400">
              <Star className="h-5 w-5" />
              <span className="font-medium">Goal Complete!</span>
              <Star className="h-5 w-5" />
            </div>
            {goal.reward_description && (
              <p className="text-sm text-muted-foreground mt-1">
                Time to claim your reward!
              </p>
            )}
          </motion.div>
        )}
      </CardContent>
    </Card>
  )
}