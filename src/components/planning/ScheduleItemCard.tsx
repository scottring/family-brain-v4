'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  CheckCircleIcon,
  DocumentTextIcon,
  ListBulletIcon,
  UserIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid'
import { ScheduleItemWithTemplate } from '@/lib/types/database'
import { useAppStore } from '@/lib/stores/useAppStore'
import { useScheduleStore } from '@/lib/stores/useScheduleStore'
import { scheduleService } from '@/lib/services/ScheduleService'
import { cn } from '@/lib/utils'

interface ScheduleItemCardProps {
  item: ScheduleItemWithTemplate
  timeBlockId: string
  isExpanded: boolean
  isCompact: boolean
}

export function ScheduleItemCard({ 
  item, 
  timeBlockId, 
  isExpanded, 
  isCompact 
}: ScheduleItemCardProps) {
  const { user } = useAppStore()
  const { updateScheduleItem, setArtifactPanelItemId } = useScheduleStore()
  const [isToggling, setIsToggling] = useState(false)

  const isCompleted = !!item.completed_at
  const hasSteps = item.template?.template_steps?.length > 0

  const handleToggleComplete = async () => {
    if (!user || isToggling) return
    
    setIsToggling(true)
    try {
      let updatedItem
      if (isCompleted) {
        updatedItem = await scheduleService.uncompleteScheduleItem(item.id)
      } else {
        updatedItem = await scheduleService.completeScheduleItem(item.id, user.id)
      }
      
      updateScheduleItem(item.id, updatedItem)
    } catch (error) {
      console.error('Error toggling item completion:', error)
    } finally {
      setIsToggling(false)
    }
  }

  const handleOpenArtifactPanel = () => {
    if (hasSteps) {
      setArtifactPanelItemId(item.id)
    }
  }

  const getItemIcon = () => {
    switch (item.item_type) {
      case 'template_ref':
        return hasSteps ? ListBulletIcon : DocumentTextIcon
      case 'procedure':
        return ListBulletIcon
      default:
        return DocumentTextIcon
    }
  }

  const ItemIcon = getItemIcon()

  if (isCompact) {
    return (
      <div className="flex items-center space-x-1 opacity-60">
        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
        <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
          {item.title}
        </span>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        'flex items-center space-x-2 p-2 rounded-md border transition-all',
        isCompleted
          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
          : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
      )}
    >
      {/* Completion Toggle */}
      <button
        onClick={handleToggleComplete}
        disabled={isToggling}
        className="flex-shrink-0 p-0.5 rounded-full hover:bg-white dark:hover:bg-gray-700 transition-colors"
      >
        {isCompleted ? (
          <CheckCircleIconSolid className="h-4 w-4 text-green-600 dark:text-green-400" />
        ) : (
          <CheckCircleIcon className="h-4 w-4 text-gray-400 hover:text-green-600 dark:hover:text-green-400" />
        )}
      </button>

      {/* Item Content */}
      <div className="flex-1 min-w-0 flex items-center space-x-2">
        <ItemIcon className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
        <div className="min-w-0 flex-1">
          <p className={cn(
            'text-sm truncate',
            isCompleted
              ? 'text-green-800 dark:text-green-200 line-through'
              : 'text-gray-900 dark:text-white'
          )}>
            {item.title}
          </p>
          {isExpanded && item.description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {item.description}
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {hasSteps && (
          <button
            onClick={handleOpenArtifactPanel}
            className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded transition-colors"
            title="Open procedure"
          >
            <ListBulletIcon className="h-3.5 w-3.5" />
          </button>
        )}
        
        {item.completed_by && (
          <div className="flex items-center space-x-1">
            <UserIcon className="h-3 w-3 text-gray-400" />
            <span className="text-xs text-gray-500">
              {item.completed_by.substring(0, 8)}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  )
}