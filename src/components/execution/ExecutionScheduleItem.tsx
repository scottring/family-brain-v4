'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircleIcon,
  DocumentTextIcon,
  ListBulletIcon,
  UserIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ExternalLinkIcon
} from '@heroicons/react/24/outline'
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid'
import { ScheduleItemWithTemplate } from '@/lib/types/database'
import { useAppStore } from '@/lib/stores/useAppStore'
import { useScheduleStore } from '@/lib/stores/useScheduleStore'
import { scheduleService } from '@/lib/services/ScheduleService'
import { cn } from '@/lib/utils'

interface ExecutionScheduleItemProps {
  item: ScheduleItemWithTemplate
  timeBlockId: string
  index: number
}

export function ExecutionScheduleItem({ 
  item, 
  timeBlockId, 
  index 
}: ExecutionScheduleItemProps) {
  const { user } = useAppStore()
  const { updateScheduleItem, setArtifactPanelItemId } = useScheduleStore()
  
  const [isToggling, setIsToggling] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  
  const isCompleted = !!item.completed_at
  const hasSteps = item.template?.template_steps?.length > 0
  const hasInstance = !!item.template_instance

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

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className={cn(
        'rounded-lg border transition-all duration-200',
        isCompleted
          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
          : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
      )}
    >
      <div className="p-4">
        <div className="flex items-start space-x-3">
          {/* Completion Toggle */}
          <button
            onClick={handleToggleComplete}
            disabled={isToggling}
            className="flex-shrink-0 mt-0.5 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
          >
            {isCompleted ? (
              <CheckCircleIconSolid className="h-6 w-6 text-green-600 dark:text-green-400" />
            ) : (
              <CheckCircleIcon className="h-6 w-6 text-gray-400 hover:text-green-600 dark:hover:text-green-400" />
            )}
          </button>

          {/* Item Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <ItemIcon className="h-4 w-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                  <h4 className={cn(
                    'text-sm font-medium truncate',
                    isCompleted
                      ? 'text-green-800 dark:text-green-200 line-through'
                      : 'text-gray-900 dark:text-white'
                  )}>
                    {item.title}
                  </h4>
                  {item.template && (
                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 rounded-full flex-shrink-0">
                      Template
                    </span>
                  )}
                </div>

                {item.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {item.description}
                  </p>
                )}

                {/* Completion Info */}
                {item.completed_at && item.completed_by && (
                  <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                    <UserIcon className="h-3 w-3" />
                    <span>Completed by {item.completed_by.substring(0, 8)}</span>
                    <span>•</span>
                    <span>{new Date(item.completed_at).toLocaleTimeString()}</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-1 ml-2">
                {hasSteps && (
                  <button
                    onClick={handleOpenArtifactPanel}
                    className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    title="Open procedure steps"
                  >
                    <ExternalLinkIcon className="h-4 w-4" />
                  </button>
                )}
                
                {(item.description || hasSteps) && (
                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  >
                    {isExpanded ? (
                      <ChevronDownIcon className="h-4 w-4" />
                    ) : (
                      <ChevronRightIcon className="h-4 w-4" />
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Expanded Content */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                    {/* Template Steps Preview */}
                    {hasSteps && (
                      <div className="mb-3">
                        <h5 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Procedure Steps:
                        </h5>
                        <div className="space-y-1">
                          {item.template?.template_steps?.slice(0, 3).map((step, stepIndex) => (
                            <div key={step.id} className="flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-400">
                              <span className="w-4 h-4 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-xs font-medium">
                                {stepIndex + 1}
                              </span>
                              <span className="truncate">{step.title}</span>
                            </div>
                          ))}
                          {(item.template?.template_steps?.length ?? 0) > 3 && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 pl-6">
                              +{(item.template?.template_steps?.length ?? 0) - 3} more steps
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Instance Progress */}
                    {hasInstance && item.template_instance && (
                      <div>
                        <h5 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Progress:
                        </h5>
                        <div className="space-y-1">
                          {item.template_instance.template_instance_steps?.map((instanceStep) => (
                            <div key={instanceStep.id} className="flex items-center space-x-2 text-xs">
                              {instanceStep.completed_at ? (
                                <CheckCircleIconSolid className="h-3 w-3 text-green-600 dark:text-green-400" />
                              ) : (
                                <CheckCircleIcon className="h-3 w-3 text-gray-400" />
                              )}
                              <span className={cn(
                                instanceStep.completed_at 
                                  ? 'text-green-700 dark:text-green-300 line-through'
                                  : 'text-gray-600 dark:text-gray-400'
                              )}>
                                {instanceStep.template_step.title}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  )
}