'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Calendar,
  CheckCircle2,
  Clock,
  Timer,
  TrendingUp,
  Star,
  Focus,
  CalendarDays,
  RefreshCw,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { format, addDays, subDays } from 'date-fns'
import { MemberSelector } from '@/components/common/MemberSelector'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { ExecutionTimeBlock } from '@/components/execution/ExecutionTimeBlock'
import { CurrentTimeIndicator } from '@/components/execution/CurrentTimeIndicator'
import { FocusMode } from '@/components/execution/FocusMode'
import { useAppStore } from '@/lib/stores/useAppStore'
import { ScheduleWithDetails, ScheduleItem, TimeBlockWithItems } from '@/lib/types/database'

interface ItineraryData {
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

export function ItineraryView() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [itineraryData, setItineraryData] = useState<ItineraryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [focusMode, setFocusMode] = useState<{
    isOpen: boolean
    timeBlock: TimeBlockWithItems | null
  }>({ isOpen: false, timeBlock: null })
  
  const { 
    user: appUser, 
    currentFamilyId,
    selectedMemberView,
    currentFamilyMembers 
  } = useAppStore()

  const fetchItineraryData = async (date: Date) => {
    if (!currentFamilyId) return
    
    try {
      setRefreshing(true)
      const dateStr = format(date, 'yyyy-MM-dd')
      
      // Fetch schedule for specific date
      const response = await fetch(`/api/schedules?date=${dateStr}&includeStats=true`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('Itinerary data received for', dateStr, ':', {
          hasSchedule: !!data.schedule,
          scheduleId: data.schedule?.id,
          timeBlocksCount: data.schedule?.time_blocks?.length || 0,
          timeBlocks: data.schedule?.time_blocks,
          fullData: data
        })
        
        // Log details about each time block
        if (data.schedule?.time_blocks) {
          data.schedule.time_blocks.forEach((tb: any, i: number) => {
            console.log(`Time block ${i}: ${tb.start_time}-${tb.end_time}, items: ${tb.schedule_items?.length || 0}`)
            if (tb.schedule_items?.length > 0) {
              console.log('Items:', tb.schedule_items.map((item: any) => ({ 
                title: item.title, 
                type: item.item_type,
                has_template: !!item.template 
              })))
            }
          })
        }
        
        // Process the data to match ItineraryData structure
        const processedData: ItineraryData = {
          schedule: data.schedule || null,
          currentActivity: null, // We'll calculate this based on current time
          upcomingActivities: [],
          stats: data.stats
        }
        
        // Calculate current activity if it's today
        if (dateStr === format(new Date(), 'yyyy-MM-dd') && data.schedule?.time_blocks) {
          const now = new Date()
          const currentTime = format(now, 'HH:mm')
          
          for (const block of data.schedule.time_blocks) {
            if (currentTime >= block.start_time && currentTime <= block.end_time) {
              processedData.currentActivity = block.schedule_items?.[0] || null
              break
            }
          }
        }
        
        setItineraryData(processedData)
      } else {
        console.error('Failed to fetch itinerary data:', response.statusText)
        setItineraryData({
          schedule: null,
          currentActivity: null,
          upcomingActivities: [],
          stats: undefined
        })
      }
    } catch (error) {
      console.error('Error fetching itinerary data:', error)
      setItineraryData({
        schedule: null,
        currentActivity: null,
        upcomingActivities: [],
        stats: undefined
      })
    } finally {
      setRefreshing(false)
      setLoading(false)
    }
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
    if (!itineraryData?.schedule?.time_blocks) return []
    
    if (selectedMemberView === 'all') {
      return itineraryData.schedule.time_blocks
    }
    
    // Filter items within each time block
    return itineraryData.schedule.time_blocks.map(timeBlock => ({
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
    return member?.user_profile?.full_name || 'Unknown'
  }

  const handleOpenFocusMode = (timeBlock: TimeBlockWithItems) => {
    setFocusMode({ isOpen: true, timeBlock })
  }

  const handleCloseFocusMode = () => {
    setFocusMode({ isOpen: false, timeBlock: null })
  }

  const handlePreviousDay = () => {
    setSelectedDate(prev => subDays(prev, 1))
  }

  const handleNextDay = () => {
    setSelectedDate(prev => addDays(prev, 1))
  }

  const handleToday = () => {
    setSelectedDate(new Date())
  }

  useEffect(() => {
    if (currentFamilyId) {
      fetchItineraryData(selectedDate)
    }
  }, [currentFamilyId, selectedDate])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading itinerary...</p>
        </div>
      </div>
    )
  }

  const filteredTimeBlocks = getFilteredTimeBlocks()
  const memberStats = getMemberStats()
  const memberName = getSelectedMemberName()
  const isToday = format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-background">
      {/* Header with Date Navigation */}
      <div className="bg-card border-b">
        <div className="px-6 py-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <h1 className="text-2xl font-bold text-foreground">Daily Itinerary</h1>
                {isToday && (
                  <Badge variant="default" className="animate-pulse">
                    Today
                  </Badge>
                )}
              </div>
              <MemberSelector />
            </div>
            
            {/* Date Navigation */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handlePreviousDay}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <div className="px-4 py-2 bg-background rounded-lg border">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">
                      {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                    </span>
                  </div>
                </div>
                
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleNextDay}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                
                {!isToday && (
                  <Button
                    variant="outline"
                    onClick={handleToday}
                    className="ml-2"
                  >
                    Today
                  </Button>
                )}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchItineraryData(selectedDate)}
                disabled={refreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      {memberStats.totalItems > 0 && (
        <div className="bg-card/50 border-b">
          <div className="px-6 py-3">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      <span className="font-medium">{memberStats.completedItems}</span>
                      <span className="text-muted-foreground"> / {memberStats.totalItems} completed</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      <span className="font-medium">{memberStats.completionRate}%</span>
                      <span className="text-muted-foreground"> progress</span>
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Viewing: {memberName}
                  </span>
                </div>
              </div>
              <Progress value={memberStats.completionRate} className="mt-2 h-2" />
            </div>
          </div>
        </div>
      )}

      {/* Current Activity Spotlight (only for today) */}
      {isToday && itineraryData?.currentActivity && (
        <AnimatePresence>
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
                        <h3 className="text-xl font-bold text-foreground">{itineraryData.currentActivity.title}</h3>
                        {itineraryData.currentActivity.description && (
                          <p className="text-muted-foreground mt-1">{itineraryData.currentActivity.description}</p>
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
        </AnimatePresence>
      )}

      {/* Time Blocks */}
      <div className="px-6 pb-12">
        <div className="max-w-6xl mx-auto">
          {filteredTimeBlocks.length > 0 ? (
            <div className="space-y-4">
              {isToday && <CurrentTimeIndicator />}
              {filteredTimeBlocks.map((timeBlock, index) => {
                const now = new Date()
                const currentTime = format(now, 'HH:mm')
                const isActive = isToday && currentTime >= timeBlock.start_time && currentTime <= timeBlock.end_time
                
                return (
                  <ExecutionTimeBlock
                    key={timeBlock.id}
                    timeBlock={timeBlock as TimeBlockWithItems}
                    date={itineraryData?.schedule?.date || format(selectedDate, 'yyyy-MM-dd')}
                    isActive={isActive}
                    index={index}
                    onOpenFocus={() => handleOpenFocusMode(timeBlock as TimeBlockWithItems)}
                  />
                )
              })}
            </div>
          ) : (
            <Card className="border-dashed border-2 border-muted">
              <CardContent className="p-12 text-center">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No schedule for {format(selectedDate, 'EEEE, MMMM d')}
                </h3>
                <p className="text-muted-foreground mb-6">
                  {isToday 
                    ? "You haven't scheduled anything for today yet."
                    : `No activities scheduled for this day.`}
                </p>
                <Button 
                  variant="default"
                  onClick={() => window.location.href = '/planning'}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Go to Planning
                </Button>
              </CardContent>
            </Card>
          )}
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
    </div>
  )
}