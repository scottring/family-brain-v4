'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { 
  UserIcon,
  EyeIcon,
  CalendarIcon,
  BookOpenIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip'
import { useFamilyPresenceStore } from '@/lib/stores/useFamilyPresenceStore'
import { useAppStore } from '@/lib/stores/useAppStore'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'

export function FamilyPresenceIndicator() {
  const { user } = useAppStore()
  const { getOnlineMembers, currentActivities } = useFamilyPresenceStore()
  
  const onlineMembers = getOnlineMembers().filter(presence => presence.user_id !== user?.id)
  
  if (onlineMembers.length === 0) {
    return null
  }
  
  const getViewIcon = (view: string) => {
    switch (view) {
      case 'today':
        return ClockIcon
      case 'planning':
        return CalendarIcon
      case 'sops':
        return BookOpenIcon
      default:
        return EyeIcon
    }
  }
  
  const getViewLabel = (view: string) => {
    switch (view) {
      case 'today':
        return 'Today'
      case 'planning':
        return 'Planning'
      case 'sops':
        return 'Templates'
      default:
        return 'Unknown'
    }
  }

  return (
    <TooltipProvider>
      <div className="flex items-center space-x-2">
        <AnimatePresence>
          {onlineMembers.map((presence) => {
            const ViewIcon = getViewIcon(presence.current_view)
            const activity = currentActivities[presence.user_id] || presence.current_activity
            
            return (
              <Tooltip key={presence.user_id}>
                <TooltipTrigger asChild>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex items-center space-x-2 px-3 py-1.5 bg-white dark:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-600 shadow-sm"
                  >
                    {/* Avatar with online indicator */}
                    <div className="relative">
                      <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        {presence.avatar_url ? (
                          <img 
                            src={presence.avatar_url} 
                            alt={presence.user_name}
                            className="w-6 h-6 rounded-full object-cover"
                          />
                        ) : (
                          <UserIcon className="h-3 w-3 text-white" />
                        )}
                      </div>
                      
                      {/* Online indicator */}
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border border-white dark:border-gray-800"
                      />
                    </div>
                    
                    {/* Name and status */}
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center space-x-1">
                        <span className="text-xs font-medium text-gray-900 dark:text-white truncate max-w-20">
                          {presence.user_name.split(' ')[0]}
                        </span>
                        <ViewIcon className="h-3 w-3 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                      </div>
                      
                      {/* Current activity or editing indicator */}
                      {presence.is_editing ? (
                        <motion.div
                          animate={{ opacity: [1, 0.5, 1] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                          className="flex items-center space-x-1"
                        >
                          <div className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
                          <span className="text-xs text-orange-600 dark:text-orange-400 truncate max-w-24">
                            Editing
                          </span>
                        </motion.div>
                      ) : activity ? (
                        <div className="flex items-center space-x-1">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                          <span className="text-xs text-blue-600 dark:text-blue-400 truncate max-w-24">
                            {activity}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {getViewLabel(presence.current_view)}
                        </span>
                      )}
                    </div>
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="text-sm">
                    <div className="font-medium">{presence.user_name}</div>
                    <div className="text-gray-500 dark:text-gray-400">
                      {presence.is_editing ? (
                        <>Editing: {presence.is_editing.item_title || 'item'}</>
                      ) : activity ? (
                        <>{activity}</>
                      ) : (
                        <>Viewing {getViewLabel(presence.current_view)}</>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      Last seen: {formatDistanceToNow(new Date(presence.last_seen), { addSuffix: true })}
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            )
          })}
        </AnimatePresence>
        
        {/* Family status summary */}
        {onlineMembers.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="hidden sm:flex items-center space-x-1 px-2 py-1 bg-green-50 dark:bg-green-900/20 rounded-full"
          >
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs font-medium text-green-700 dark:text-green-300">
              {onlineMembers.length} online
            </span>
          </motion.div>
        )}
      </div>
    </TooltipProvider>
  )
}