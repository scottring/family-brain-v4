'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircleIcon,
  DocumentTextIcon,
  ListBulletIcon,
  UserIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ArrowTopRightOnSquareIcon,
  EyeIcon,
  PencilIcon
} from '@heroicons/react/24/outline'
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid'
import { ScheduleItemWithTemplate } from '@/lib/types/database'
import { useAppStore } from '@/lib/stores/useAppStore'
import { useScheduleStore } from '@/lib/stores/useScheduleStore'
import { useFamilyPresenceStore } from '@/lib/stores/useFamilyPresenceStore'
import { scheduleService } from '@/lib/services/ScheduleService'
import { templateService } from '@/lib/services/TemplateService'
import { optimisticToggleScheduleItem } from '@/lib/services/OptimisticUpdateService'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

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
  const { user, currentFamilyMembers } = useAppStore()
  const { setArtifactPanelItemId } = useScheduleStore()
  const { getEditingUsers, currentActivities, getOnlineMembers } = useFamilyPresenceStore()
  
  const [isToggling, setIsToggling] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [isCreatingInstance, setIsCreatingInstance] = useState(false)
  const [localItem, setLocalItem] = useState(item)
  
  const isCompleted = !!localItem.completed_at
  const hasSteps = localItem.template?.template_steps?.length > 0
  const hasInstance = !!localItem.template_instance
  const editingUsers = getEditingUsers(localItem.id)
  const isBeingEdited = editingUsers.length > 0
  const isEditedByOthers = editingUsers.some(editor => editor.user_id !== user?.id)
  
  // Find if any family member is currently working on this item
  const getSpouseActivity = () => {
    const spouseMembers = currentFamilyMembers.filter(member => member.user_id !== user?.id)
    return spouseMembers.map(member => {
      const activity = currentActivities[member.user_id]
      const isEditing = editingUsers.find(editor => editor.user_id === member.user_id)
      return {
        member,
        activity,
        isEditing
      }
    }).filter(info => info.activity || info.isEditing)
  }
  
  const spouseActivity = getSpouseActivity()
  
  // Update local state when prop changes
  useEffect(() => {
    setLocalItem(item)
  }, [item])
  
  // Auto-create template instance if item has template but no instance
  useEffect(() => {
    if (localItem.template_id && !localItem.template_instance && !isCreatingInstance) {
      handleCreateInstance()
    }
  }, [localItem.template_id, localItem.template_instance])

  const handleToggleComplete = async () => {
    if (!user || isToggling) return
    
    setIsToggling(true)
    
    // Create optimistic update data
    const optimisticItem = {
      ...localItem,
      completed_at: isCompleted ? null : new Date().toISOString(),
      completed_by: isCompleted ? null : user.id
    }
    
    // Apply optimistic update immediately
    setLocalItem(optimisticItem)
    
    try {
      // Perform the actual update with rollback capability
      await optimisticToggleScheduleItem(
        localItem.id,
        localItem, // original data for rollback
        optimisticItem,
        // The actual API call
        isCompleted 
          ? scheduleService.uncompleteScheduleItem(localItem.id)
          : scheduleService.completeScheduleItem(localItem.id, user.id),
        // Rollback handler
        (rollbackData) => {
          setLocalItem(rollbackData)
        }
      )
    } catch (error) {
      console.error('Error toggling item completion:', error)
      // Error handling is done by optimistic update service
    } finally {
      setIsToggling(false)
    }
  }

  const handleOpenArtifactPanel = () => {
    if (hasSteps) {
      setArtifactPanelItemId(localItem.id)
    }
  }
  
  const handleToggleStep = async (instanceStepId: string, currentlyCompleted: boolean) => {
    if (!user || isToggling) return
    
    setIsToggling(true)
    
    try {
      if (currentlyCompleted) {
        await templateService.uncompleteTemplateInstanceStep(instanceStepId)
      } else {
        await templateService.completeTemplateInstanceStep(
          instanceStepId, 
          user.id
        )
      }
      
      // Update local state
      setLocalItem({
        ...localItem,
        template_instance: localItem.template_instance ? {
          ...localItem.template_instance,
          template_instance_steps: localItem.template_instance.template_instance_steps?.map(step =>
            step.id === instanceStepId
              ? { 
                  ...step, 
                  completed_at: currentlyCompleted ? null : new Date().toISOString(),
                  completed_by: currentlyCompleted ? null : user.id
                }
              : step
          )
        } : undefined
      })
      
      toast.success(currentlyCompleted ? 'Step unchecked' : 'Step completed!')
    } catch (error) {
      console.error('Error toggling step:', error)
      toast.error('Failed to update step')
    } finally {
      setIsToggling(false)
    }
  }
  
  const handleCreateInstance = async () => {
    if (!user || !localItem.template_id || isCreatingInstance) return
    
    setIsCreatingInstance(true)
    
    try {
      const instance = await templateService.createTemplateInstance(
        localItem.template_id,
        localItem.id
      )
      
      // Update local state with the new instance
      setLocalItem({
        ...localItem,
        template_instance: instance
      })
      
      // Expand the item to show the checklist
      setIsExpanded(true)
      
      toast.success('Checklist created! You can now track your progress.')
    } catch (error) {
      console.error('Error creating template instance:', error)
      toast.error('Failed to create checklist')
    } finally {
      setIsCreatingInstance(false)
    }
  }

  const getItemIcon = () => {
    switch (localItem.item_type) {
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
        'rounded-lg border transition-all duration-200 relative',
        isCompleted
          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
          : isEditedByOthers
          ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-300 dark:border-orange-600 ring-1 ring-orange-200 dark:ring-orange-800'
          : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
      )}
    >
      {/* Editing indicator pulse effect */}
      {isEditedByOthers && (
        <motion.div
          className="absolute inset-0 rounded-lg bg-orange-200 dark:bg-orange-800"
          animate={{ opacity: [0.2, 0.05, 0.2] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
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
                    {localItem.title}
                  </h4>
                  {localItem.template && (
                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 rounded-full flex-shrink-0">
                      Template
                    </span>
                  )}
                </div>

                {localItem.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {localItem.description}
                  </p>
                )}

                {/* Family Activity Indicators */}
                {spouseActivity.length > 0 && (
                  <div className="mb-2 space-y-1">
                    {spouseActivity.map((info, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center space-x-2 text-xs"
                      >
                        {info.isEditing ? (
                          <>
                            <div className="flex items-center space-x-1 px-2 py-1 bg-orange-100 dark:bg-orange-900/50 rounded-full">
                              <PencilIcon className="h-3 w-3 text-orange-600 dark:text-orange-400" />
                              <span className="font-medium text-orange-700 dark:text-orange-300">
                                {info.member.user_profile.full_name || 'Family member'} is editing this
                              </span>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex items-center space-x-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/50 rounded-full">
                              <EyeIcon className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                              <span className="text-blue-700 dark:text-blue-300">
                                {info.member.user_profile.full_name || 'Family member'}: {info.activity}
                              </span>
                            </div>
                          </>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* Completion Info */}
                {localItem.completed_at && localItem.completed_by && (
                  <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                    <UserIcon className="h-3 w-3" />
                    <span>Completed by {localItem.completed_by.substring(0, 8)}</span>
                    <span>•</span>
                    <span>{new Date(localItem.completed_at).toLocaleTimeString()}</span>
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
                    <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                  </button>
                )}
                
                {(localItem.description || hasSteps) && (
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
                    {/* Template Steps - Interactive Checklist */}
                    {hasSteps && !hasInstance && localItem.template?.template_steps && (
                      <div className="mb-3">
                        <h5 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Procedure Steps (not started):
                        </h5>
                        <div className="space-y-1">
                          {localItem.template.template_steps.slice(0, 3).map((step, stepIndex) => (
                            <div key={step.id} className="flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-400">
                              <span className="w-4 h-4 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-xs font-medium">
                                {stepIndex + 1}
                              </span>
                              <span className="truncate">{step.title}</span>
                            </div>
                          ))}
                          {localItem.template.template_steps.length > 3 && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 pl-6">
                              +{localItem.template.template_steps.length - 3} more steps
                            </div>
                          )}
                          <button
                            onClick={handleCreateInstance}
                            className="mt-2 px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                          >
                            Start Checklist
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Instance Progress - Interactive Checklist */}
                    {hasInstance && localItem.template_instance && (
                      <div>
                        <h5 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center justify-between">
                          <span>Checklist Progress:</span>
                          <span className="text-xs font-normal">
                            {localItem.template_instance.template_instance_steps?.filter(s => s.completed_at).length || 0}
                            /{localItem.template_instance.template_instance_steps?.length || 0} completed
                          </span>
                        </h5>
                        <div className="space-y-2">
                          {localItem.template_instance.template_instance_steps?.map((instanceStep) => (
                            <button
                              key={instanceStep.id}
                              onClick={() => handleToggleStep(instanceStep.id, !!instanceStep.completed_at)}
                              className="flex items-center space-x-2 text-xs w-full text-left hover:bg-gray-50 dark:hover:bg-gray-700 p-1 rounded transition-colors"
                              disabled={isToggling}
                            >
                              {instanceStep.completed_at ? (
                                <CheckCircleIconSolid className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                              ) : (
                                <CheckCircleIcon className="h-4 w-4 text-gray-400 dark:text-gray-500 hover:text-green-600 dark:hover:text-green-400 flex-shrink-0" />
                              )}
                              <span className={cn(
                                'flex-1',
                                instanceStep.completed_at 
                                  ? 'text-green-700 dark:text-green-300 line-through'
                                  : 'text-gray-600 dark:text-gray-400'
                              )}>
                                {instanceStep.template_step.title}
                              </span>
                              {instanceStep.completed_at && (
                                <span className="text-xs text-gray-500">
                                  ✓ {new Date(instanceStep.completed_at).toLocaleTimeString()}
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="mt-3">
                          <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                            <motion.div
                              className="bg-green-600 h-full"
                              initial={{ width: 0 }}
                              animate={{ 
                                width: `${(localItem.template_instance.template_instance_steps?.filter(s => s.completed_at).length || 0) / (localItem.template_instance.template_instance_steps?.length || 1) * 100}%` 
                              }}
                              transition={{ duration: 0.3 }}
                            />
                          </div>
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