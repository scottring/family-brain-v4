'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { redirect, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Clock,
  Calendar,
  CheckCircle2,
  Target,
  Users,
  Play,
  BookOpen,
  ArrowRight,
  Sun,
  Moon,
  Zap,
  Timer,
  TrendingUp,
  Star,
  Focus
} from 'lucide-react'
import { AppShell } from '@/components/common/AppShell'
import { TodayViewSkeleton } from '@/components/common/LoadingSkeletons'
import { MemberSelector } from '@/components/common/MemberSelector'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { ExecutionTimeBlock } from './ExecutionTimeBlock'
import { CurrentTimeIndicator } from './CurrentTimeIndicator'
import { FocusMode } from './FocusMode'
import { TrackingDashboard } from '@/components/tracking/TrackingDashboard'
import { useAppStore } from '@/lib/stores/useAppStore'
import { ScheduleWithDetails, ScheduleItem, TimeBlockWithItems } from '@/lib/types/database'

const currentTime = new Date()
const greeting = currentTime.getHours() < 12 ? 'Good morning' : 
                 currentTime.getHours() < 18 ? 'Good afternoon' : 'Good evening'
const GreetingIconComponent = currentTime.getHours() < 18 ? Sun : Moon

interface TodayData {
  schedule: ScheduleWithDetails | null
  currentActivity: ScheduleItem | null
  upcomingActivities: ScheduleItem[]
  stats?: {
    totalItems: number
    completedItems: number
    completionRate: number
    totalTimeBlocks: number
    scheduledMinutes: number
  }
}

const upcomingFeatures = [
  {
    icon: Target,
    title: 'Current Focus',
    description: 'Your current time block highlighted and ready to execute',
    color: 'from-blue-500 to-blue-600'
  },
  {
    icon: CheckCircle2,
    title: 'Progress Tracking',
    description: 'Check off completed tasks with satisfying animations',
    color: 'from-green-500 to-green-600'
  },
  {
    icon: Users,
    title: 'Family Sync',
    description: 'See your spouse\'s progress in real-time collaboration',
    color: 'from-purple-500 to-purple-600'
  }
]

const quickActions = [
  {
    title: 'Plan Your Week',
    description: 'Drag templates onto your weekly schedule to create time-blocked days.',
    icon: Calendar,
    href: '/planning',
    color: 'from-blue-500 to-blue-600',
    actionText: 'Start Planning'
  },
  {
    title: 'Quick Reference',
    description: 'Access any template or checklist instantly, even without scheduling.',
    icon: BookOpen,
    href: '/sops',
    color: 'from-green-500 to-green-600',
    actionText: 'Browse SOPs'
  }
]

export function TodayView() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [todayData, setTodayData] = useState<TodayData | null>(null)
  const [dataLoaded, setDataLoaded] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [focusMode, setFocusMode] = useState<{
    isOpen: boolean
    timeBlock: TimeBlockWithItems | null
  }>({ isOpen: false, timeBlock: null })
  const router = useRouter()
  const supabase = createClient()
  const { 
    user: appUser, 
    currentFamilyId,
    selectedMemberView,
    currentFamilyMembers 
  } = useAppStore()

  const fetchTodayData = async () => {
    if (!currentFamilyId) return
    
    try {
      setRefreshing(true)
      const response = await fetch('/api/today?includeStats=true', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('Today data received:', {
          hasSchedule: !!data.schedule,
          scheduleId: data.schedule?.id,
          timeBlocksCount: data.schedule?.time_blocks?.length || 0,
          timeBlocks: data.schedule?.time_blocks,
          fullData: data
        })
        setTodayData(data)
        setDataLoaded(true)
      } else {
        console.error('Failed to fetch today data:', response.statusText)
        // Set empty data instead of null to avoid landing page
        setTodayData({
          schedule: null,
          currentActivity: null,
          upcomingActivities: [],
          stats: undefined
        })
        setDataLoaded(true)
      }
    } catch (error) {
      console.error('Error fetching today data:', error)
      // Set empty data on error
      setTodayData({
        schedule: null,
        currentActivity: null,
        upcomingActivities: [],
        stats: undefined
      })
      setDataLoaded(true)
    } finally {
      setRefreshing(false)
    }
  }

  const handleOpenFocusMode = (timeBlock: TimeBlockWithItems) => {
    setFocusMode({ isOpen: true, timeBlock })
  }

  const handleCloseFocusMode = () => {
    setFocusMode({ isOpen: false, timeBlock: null })
  }

  // Filter schedule items based on selected member view
  const filterItemsForMember = (items: ScheduleItem[]): ScheduleItem[] => {
    if (selectedMemberView === 'all') return items
    
    return items.filter(item => {
      const assignedMembers = item.metadata?.assigned_members
      
      // If no assignment, it's available to all
      if (!assignedMembers || assignedMembers.length === 0) return true
      
      // Check if member is in assigned list
      return assignedMembers.includes(selectedMemberView)
    })
  }

  // Get filtered time blocks with filtered items
  const getFilteredTimeBlocks = (): TimeBlockWithItems[] => {
    if (!todayData?.schedule?.time_blocks) return []
    
    if (selectedMemberView === 'all') {
      return todayData.schedule.time_blocks
    }
    
    // Filter items within each time block
    return todayData.schedule.time_blocks.map(timeBlock => ({
      ...timeBlock,
      schedule_items: filterItemsForMember(timeBlock.schedule_items || [])
    })).filter(tb => tb.schedule_items && tb.schedule_items.length > 0)
  }

  // Calculate stats for selected member
  const getMemberStats = () => {
    const filteredBlocks = getFilteredTimeBlocks()
    const allItems = filteredBlocks.flatMap(tb => tb.schedule_items || [])
    const completedItems = allItems.filter(item => item.completed_at)
    
    return {
      totalItems: allItems.length,
      completedItems: completedItems.length,
      completionRate: allItems.length > 0 
        ? Math.round((completedItems.length / allItems.length) * 100)
        : 0
    }
  }

  // Get member name for display
  const getSelectedMemberName = () => {
    if (selectedMemberView === 'all') return 'Everyone'
    
    const member = currentFamilyMembers.find(m => m.user_id === selectedMemberView)
    return member?.user?.full_name || 'Unknown'
  }

  useEffect(() => {
    const getUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error || !user) {
        router.push('/auth/login')
        return
      }
      setUser(user)
      setLoading(false)
    }
    getUser()
  }, [router])

  useEffect(() => {
    if (currentFamilyId) {
      fetchTodayData()
    } else if (appUser && !currentFamilyId) {
      // If user exists but has no family, set empty data
      setTodayData({
        schedule: null,
        currentActivity: null,
        upcomingActivities: [],
        stats: undefined
      })
      setDataLoaded(true)
    }
  }, [currentFamilyId, appUser])

  // Auto-refresh every minute to update current time indicators
  useEffect(() => {
    if (!todayData) return
    
    const interval = setInterval(() => {
      fetchTodayData()
    }, 60000) // Refresh every minute
    
    return () => clearInterval(interval)
  }, [todayData])

  if (loading) {
    return (
      <AppShell>
        <TodayViewSkeleton />
      </AppShell>
    )
  }

  if (!user) {
    return null
  }

  const GreetingIcon = GreetingIconComponent

  // Show welcome screen only if data is loaded AND there are no time blocks
  if (dataLoaded && (!todayData?.schedule?.time_blocks || todayData.schedule.time_blocks.length === 0)) {
    return (
    <AppShell>
      <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-background">
        {/* Hero Section with Greeting */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-pattern opacity-5" />
          <div className="relative px-6 py-12">
            <div className="max-w-7xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-center mb-12"
              >
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary/20 to-primary/30 rounded-2xl mb-6">
                  <Clock className="h-10 w-10 text-primary" />
                </div>
                <div className="flex items-center justify-center space-x-2 mb-4">
                  <GreetingIcon className="h-6 w-6 text-primary" />
                  <h1 className="text-4xl sm:text-5xl font-bold text-foreground">
                    {greeting}, {user.full_name?.split(' ')[0] || 'there'}!
                  </h1>
                </div>
                <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                  Your daily execution center will show your time-blocked schedule here. 
                  Start by planning your week to see today's focused workflow.
                </p>
                <div className="flex items-center justify-center mt-8">
                  <Badge variant="secondary" className="text-sm px-4 py-2">
                    <Zap className="w-3 h-3 mr-1" />
                    Ready to Execute
                  </Badge>
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="px-6 pb-12">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="grid lg:grid-cols-2 gap-8 mb-16"
            >
              {quickActions.map((action, index) => {
                const Icon = action.icon
                return (
                  <Card key={index} className="border-border/50 shadow-lg group hover:shadow-xl transition-all duration-300">
                    <CardHeader className="pb-4">
                      <div className="flex items-center space-x-3">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center flex-shrink-0`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <CardTitle className="group-hover:text-primary transition-colors">
                            {action.title}
                          </CardTitle>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <CardDescription className="text-base mb-6">
                        {action.description}
                      </CardDescription>
                      <Button asChild className="w-full group-hover:shadow-md transition-all">
                        <Link href={action.href}>
                          <Play className="w-4 h-4 mr-2" />
                          {action.actionText}
                          <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
            </motion.div>

            {/* Future Features Preview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Card className="border-border/50 shadow-lg">
                <CardHeader className="text-center pb-6">
                  <CardTitle className="text-2xl font-bold">
                    Coming to Your Daily View
                  </CardTitle>
                  <CardDescription className="text-lg">
                    Advanced execution features that will transform your daily workflow
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-3 gap-6">
                    {upcomingFeatures.map((feature, index) => {
                      const Icon = feature.icon
                      return (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, delay: 0.5 + index * 0.1 }}
                          className="text-center p-6 rounded-xl bg-gradient-to-br from-accent/20 to-accent/5 border border-border/30 group hover:border-primary/30 transition-all"
                        >
                          <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center`}>
                            <Icon className="w-8 h-8 text-white" />
                          </div>
                          <h3 className="font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                            {feature.title}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {feature.description}
                          </p>
                        </motion.div>
                      )
                    })}
                  </div>
                  
                  <Separator className="my-8" />
                  
                  <div className="text-center">
                    <p className="text-muted-foreground mb-6 text-lg">
                      Start building your perfect daily routine today. Every great execution begins with a solid plan.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <Button asChild size="lg" className="shadow-lg">
                        <Link href="/planning">
                          <Calendar className="w-4 h-4 mr-2" />
                          Create Your First Plan
                        </Link>
                      </Button>
                      <Button variant="outline" size="lg" className="shadow-lg">
                        <BookOpen className="w-4 h-4 mr-2" />
                        Explore Templates
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </AppShell>
    )
  }

  // Main execution view with schedule data
  // Handle case where todayData might still be null
  if (!todayData) {
    return (
      <AppShell>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading your schedule...</p>
          </div>
        </div>
      </AppShell>
    )
  }
  
  const filteredTimeBlocks = getFilteredTimeBlocks()
  const memberStats = getMemberStats()
  const memberName = getSelectedMemberName()
  const { currentActivity } = todayData
  
  console.log('Rendering main view with:', {
    hasData: !!todayData,
    hasSchedule: !!todayData?.schedule,
    timeBlockCount: todayData?.schedule?.time_blocks?.length || 0,
    filteredBlockCount: filteredTimeBlocks.length
  })
  
  return (
    <AppShell>
      <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-background">
        {/* Header with current time and progress */}
        <div className="sticky top-16 z-40 bg-background/80 backdrop-blur-md border-b border-border/50">
          <div className="px-6 py-4">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <GreetingIcon className="h-5 w-5 text-primary" />
                    <h1 className="text-2xl font-bold text-foreground">
                      {greeting}, {user.full_name?.split(' ')[0] || 'there'}!
                    </h1>
                  </div>
                  <CurrentTimeIndicator />
                </div>

                {/* Member Selector */}
                <MemberSelector className="mx-4" />
                
                {memberStats && (
                  <div className="hidden md:flex items-center space-x-6">
                    <div className="flex items-center space-x-2">
                      <Target className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {memberStats.completedItems}/{memberStats.totalItems} completed
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {memberStats.completionRate}% done
                      </span>
                    </div>
                  </div>
                )}
                
                <Button
                  onClick={fetchTodayData}
                  disabled={refreshing}
                  variant="ghost"
                  size="sm"
                >
                  <Clock className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                  {refreshing ? 'Updating...' : 'Refresh'}
                </Button>
              </div>
              
              {memberStats && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">
                      {selectedMemberView === 'all' ? 'Overall Progress' : `${memberName}'s Progress`}
                    </span>
                    <span className="text-sm font-medium">
                      {memberStats.completionRate}%
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <motion.div
                      key={selectedMemberView} // Re-animate on member change
                      initial={{ width: 0 }}
                      animate={{ width: `${memberStats.completionRate}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                      className="h-2 bg-gradient-to-r from-primary to-primary/80 rounded-full"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Current Activity Spotlight */}
        <AnimatePresence>
          {currentActivity && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="px-6 py-8"
            >
              <div className="max-w-6xl mx-auto">
                <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                          <Focus className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-primary mb-1">Current Focus</p>
                          <h3 className="text-xl font-bold text-foreground">{currentActivity.title}</h3>
                          {currentActivity.description && (
                            <p className="text-muted-foreground mt-1">{currentActivity.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="secondary" className="mb-2">
                          <Star className="h-3 w-3 mr-1" />
                          Active Now
                        </Badge>
                        <div className="text-sm text-muted-foreground">
                          <Timer className="h-4 w-4 inline mr-1" />
                          In progress
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content Grid */}
        <div className="px-6 pb-12">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Time Blocks - Main Column */}
              <div className="lg:col-span-2 space-y-4">
              {filteredTimeBlocks && filteredTimeBlocks.map((timeBlock, index) => {
                const now = new Date()
                const currentTime = now.toTimeString().split(' ')[0].slice(0, 5)
                const isActive = currentTime >= timeBlock.start_time && currentTime <= timeBlock.end_time
                
                return (
                  <ExecutionTimeBlock
                    key={timeBlock.id}
                    timeBlock={timeBlock as TimeBlockWithItems}
                    date={todayData?.schedule?.date || new Date().toISOString().split('T')[0]}
                    isActive={isActive}
                    index={index}
                    onOpenFocus={() => handleOpenFocusMode(timeBlock as TimeBlockWithItems)}
                  />
                )
              })}
              
              {/* Empty State for No Time Blocks */}
              {(!todayData || !todayData.schedule || !todayData.schedule?.time_blocks || todayData.schedule.time_blocks?.length === 0) && (
                <Card className="border-dashed border-2 border-muted">
                  <CardContent className="p-12 text-center">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      No time blocks scheduled
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      Add some time blocks to your schedule to start executing your day.
                    </p>
                    <Button asChild>
                      <Link href="/planning">
                        <Calendar className="h-4 w-4 mr-2" />
                        Plan Your Day
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              )}
              </div>
              
              {/* Tracking Dashboard - Sidebar */}
              <div className="lg:col-span-1">
                <div className="sticky top-24">
                  <TrackingDashboard />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Focus Mode */}
      {focusMode.timeBlock && (
        <FocusMode
          timeBlock={focusMode.timeBlock}
          onClose={handleCloseFocusMode}
          isOpen={focusMode.isOpen}
        />
      )}
    </AppShell>
  )
}