'use client'

import { memo, ReactNode } from 'react'
import { motion } from 'framer-motion'
import { 
  Calendar, 
  Clock, 
  BookOpen, 
  Plus, 
  Search, 
  Zap, 
  Target,
  Users,
  FileText,
  CheckCircle2,
  Settings
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
    variant?: 'default' | 'outline' | 'ghost'
  }
  secondaryAction?: {
    label: string
    onClick: () => void
  }
  className?: string
  illustration?: 'calendar' | 'clock' | 'search' | 'settings' | 'generic'
}

const EmptyState = memo(function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  className,
  illustration = 'generic'
}: EmptyStateProps) {
  const getIllustration = () => {
    const baseClasses = "h-16 w-16 text-muted-foreground/50 mb-6"
    
    switch (illustration) {
      case 'calendar':
        return <Calendar className={baseClasses} />
      case 'clock':
        return <Clock className={baseClasses} />
      case 'search':
        return <Search className={baseClasses} />
      case 'settings':
        return <Settings className={baseClasses} />
      default:
        return icon || <FileText className={baseClasses} />
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn('flex items-center justify-center p-8', className)}
    >
      <Card className="max-w-md w-full border-dashed">
        <CardContent className="p-8 text-center">
          <div className="flex justify-center mb-4">
            {getIllustration()}
          </div>
          
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {title}
          </h3>
          
          <p className="text-muted-foreground mb-6 leading-relaxed">
            {description}
          </p>
          
          <div className="space-y-3">
            {action && (
              <Button 
                onClick={action.onClick}
                variant={action.variant || 'default'}
                size="lg"
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                {action.label}
              </Button>
            )}
            
            {secondaryAction && (
              <Button
                onClick={secondaryAction.onClick}
                variant="ghost"
                size="sm"
                className="w-full"
              >
                {secondaryAction.label}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
})

// Specific empty state components for different scenarios
const NoScheduleEmptyState = memo(function NoScheduleEmptyState({
  onCreateSchedule
}: {
  onCreateSchedule: () => void
}) {
  return (
    <EmptyState
      illustration="calendar"
      title="No schedule for today"
      description="You haven't planned anything for today yet. Start by creating your first time-blocked schedule to stay organized and focused."
      action={{
        label: 'Plan Your Day',
        onClick: onCreateSchedule
      }}
      secondaryAction={{
        label: 'View Planning Guide',
        onClick: () => console.log('Open planning guide')
      }}
    />
  )
})

const NoTimeBlocksEmptyState = memo(function NoTimeBlocksEmptyState({
  onAddTimeBlock
}: {
  onAddTimeBlock: () => void
}) {
  return (
    <EmptyState
      illustration="clock"
      title="No time blocks scheduled"
      description="Break your day into focused time blocks to maximize productivity. Each block can contain multiple tasks and activities."
      action={{
        label: 'Add Time Block',
        onClick: onAddTimeBlock
      }}
    />
  )
})

const NoSOPsEmptyState = memo(function NoSOPsEmptyState({
  onCreateSOP
}: {
  onCreateSOP: () => void
}) {
  return (
    <EmptyState
      icon={<BookOpen className="h-16 w-16 text-muted-foreground/50" />}
      title="No procedures yet"
      description="Create standard operating procedures (SOPs) to document your processes and make them repeatable for your whole family."
      action={{
        label: 'Create First SOP',
        onClick: onCreateSOP
      }}
      secondaryAction={{
        label: 'Browse Templates',
        onClick: () => console.log('Browse SOP templates')
      }}
    />
  )
})

const SearchEmptyState = memo(function SearchEmptyState({
  searchQuery,
  onClearSearch
}: {
  searchQuery?: string
  onClearSearch: () => void
}) {
  return (
    <EmptyState
      illustration="search"
      title={searchQuery ? `No results for "${searchQuery}"` : 'No results found'}
      description="Try adjusting your search terms or browse all available items instead."
      action={{
        label: 'Clear Search',
        onClick: onClearSearch,
        variant: 'outline'
      }}
    />
  )
})

const NoTasksEmptyState = memo(function NoTasksEmptyState({
  onAddTask
}: {
  onAddTask: () => void
}) {
  return (
    <EmptyState
      icon={<CheckCircle2 className="h-16 w-16 text-muted-foreground/50" />}
      title="No tasks to complete"
      description="All caught up! You've completed all your scheduled tasks for this time block."
      action={{
        label: 'Add Task',
        onClick: onAddTask,
        variant: 'outline'
      }}
    />
  )
})

const FamilyEmptyState = memo(function FamilyEmptyState({
  onInviteFamily
}: {
  onInviteFamily: () => void
}) {
  return (
    <EmptyState
      icon={<Users className="h-16 w-16 text-muted-foreground/50" />}
      title="Flying solo"
      description="Invite your family members to collaborate on schedules, share SOPs, and stay synchronized throughout the day."
      action={{
        label: 'Invite Family',
        onClick: onInviteFamily
      }}
    />
  )
})

const WelcomeEmptyState = memo(function WelcomeEmptyState({
  onGetStarted
}: {
  onGetStarted: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
      className="flex items-center justify-center min-h-[60vh] p-8"
    >
      <Card className="max-w-lg w-full border-primary/20 shadow-lg">
        <CardContent className="p-12 text-center">
          <motion.div
            animate={{
              rotate: [0, 5, -5, 0],
              scale: [1, 1.05, 1]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 3
            }}
            className="flex justify-center mb-8"
          >
            <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center shadow-lg">
              <Zap className="h-10 w-10 text-white" />
            </div>
          </motion.div>
          
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Welcome to Family Brain
          </h2>
          
          <p className="text-muted-foreground mb-8 text-lg leading-relaxed">
            Your smart daily companion for time-blocked schedules and collaborative family planning. Let's get you started!
          </p>
          
          <div className="space-y-4">
            <Button 
              onClick={onGetStarted}
              size="lg"
              className="w-full shadow-lg"
            >
              <Target className="h-5 w-5 mr-2" />
              Get Started
            </Button>
            
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                <span>Plan</span>
              </div>
              <div className="w-1 h-1 bg-muted-foreground rounded-full" />
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                <span>Execute</span>
              </div>
              <div className="w-1 h-1 bg-muted-foreground rounded-full" />
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-1" />
                <span>Collaborate</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
})

export {
  EmptyState,
  NoScheduleEmptyState,
  NoTimeBlocksEmptyState,
  NoSOPsEmptyState,
  SearchEmptyState,
  NoTasksEmptyState,
  FamilyEmptyState,
  WelcomeEmptyState
}