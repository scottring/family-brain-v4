'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { 
  TrendingUp, 
  Calendar, 
  Trophy,
  CheckCircle2,
  Target,
  Sparkles
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { TrackingGoalCard } from './TrackingGoalCard'
import { CompletionCalendar } from './CompletionCalendar'
import { StreakBadge } from './StreakBadge'
import { TrackingGoal } from '@/lib/services/TrackingService'
import { trackingService } from '@/lib/services/TrackingService'
import { useAppStore } from '@/lib/stores/useAppStore'

interface QuickStat {
  label: string
  value: string | number
  icon: any
  color: string
}

export function TrackingDashboard() {
  const { currentFamilyId, selectedMemberView } = useAppStore()
  const [goals, setGoals] = useState<TrackingGoal[]>([])
  const [todayStats, setTodayStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedGoal, setSelectedGoal] = useState<TrackingGoal | null>(null)

  useEffect(() => {
    if (currentFamilyId) {
      fetchTrackingData()
    }
  }, [currentFamilyId, selectedMemberView])

  const fetchTrackingData = async () => {
    if (!currentFamilyId) return
    
    setLoading(true)
    try {
      // Fetch goals based on member view
      const goalsData = selectedMemberView === 'all'
        ? await trackingService.getActiveGoals(currentFamilyId)
        : await trackingService.getMemberGoals(currentFamilyId, selectedMemberView)
      
      setGoals(goalsData)
      if (goalsData.length > 0 && !selectedGoal) {
        setSelectedGoal(goalsData[0])
      }

      // Fetch today's completions
      const memberId = selectedMemberView === 'all' ? undefined : selectedMemberView
      const stats = await trackingService.getTodayCompletions(currentFamilyId, memberId)
      setTodayStats(stats)
    } catch (error) {
      console.error('Error fetching tracking data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleGoalComplete = () => {
    // Refresh data when a goal is completed
    fetchTrackingData()
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Progress Tracking</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (goals.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Progress Tracking</CardTitle>
          <CardDescription>
            Track your family's progress on important goals and habits
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-2">No tracking goals set up yet</p>
            <p className="text-sm text-muted-foreground">
              Mark templates as trackable to start monitoring progress
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const quickStats: QuickStat[] = [
    {
      label: "Today's Progress",
      value: `${todayStats?.completed || 0}/${todayStats?.total || 0}`,
      icon: CheckCircle2,
      color: 'text-green-600'
    },
    {
      label: 'Active Goals',
      value: goals.length,
      icon: Target,
      color: 'text-blue-600'
    },
    {
      label: 'Completion Rate',
      value: todayStats?.total > 0 
        ? `${Math.round((todayStats.completed / todayStats.total) * 100)}%`
        : '0%',
      icon: TrendingUp,
      color: 'text-purple-600'
    }
  ]

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <Sparkles className="h-5 w-5 text-yellow-500" />
              <span>Progress Tracking</span>
            </CardTitle>
            <CardDescription>
              Monitor your family's goals and celebrate achievements
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4">
          {quickStats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="text-center"
            >
              <div className="flex flex-col items-center space-y-1">
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Active Goals */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground">Active Goals</h3>
          {goals.slice(0, 2).map((goal) => (
            <TrackingGoalCard
              key={goal.id}
              goal={goal}
              compact
              onComplete={handleGoalComplete}
            />
          ))}
        </div>

        {/* Detailed View Tabs */}
        {selectedGoal && (
          <Tabs defaultValue="progress" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="progress">Goal Details</TabsTrigger>
              <TabsTrigger value="calendar">Calendar View</TabsTrigger>
            </TabsList>
            
            <TabsContent value="progress" className="space-y-4">
              <TrackingGoalCard
                goal={selectedGoal}
                onComplete={handleGoalComplete}
              />
            </TabsContent>
            
            <TabsContent value="calendar">
              <CompletionCalendar
                templateId={selectedGoal.template_id}
                memberId={selectedGoal.member_id || undefined}
              />
            </TabsContent>
          </Tabs>
        )}

        {/* Today's Templates */}
        {todayStats?.templates && todayStats.templates.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">Today's Tracked Items</h3>
            <div className="space-y-2">
              {todayStats.templates.map((template: any) => (
                <div
                  key={template.id}
                  className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-xl">{template.emoji || '📋'}</span>
                    <span className="text-sm font-medium">{template.title}</span>
                  </div>
                  {template.completed ? (
                    <Badge variant="default" className="bg-green-600">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Complete
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Pending</Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function Badge({ children, variant, className }: any) {
  return (
    <span className={cn(
      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
      variant === 'default' && "bg-primary text-primary-foreground",
      variant === 'secondary' && "bg-secondary text-secondary-foreground",
      className
    )}>
      {children}
    </span>
  )
}

import { cn } from '@/lib/utils'