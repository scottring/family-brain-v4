'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  XMarkIcon,
  CheckCircleIcon,
  ClockIcon,
  LinkIcon,
  PhoneIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ChevronRightIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline'
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid'
import { ScheduleItemWithTemplate, TemplateInstanceWithSteps } from '@/lib/types/database'
import { useScheduleStore } from '@/lib/stores/useScheduleStore'
import { useAppStore } from '@/lib/stores/useAppStore'
import { templateService } from '@/lib/services/TemplateService'
import { cn } from '@/lib/utils'

export function ArtifactPanel() {
  const { user } = useAppStore()
  const { 
    currentSchedule, 
    artifactPanelItemId, 
    setArtifactPanelItemId,
    updateScheduleItem
  } = useScheduleStore()
  
  const [templateInstance, setTemplateInstance] = useState<TemplateInstanceWithSteps | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set())

  const scheduleItem = currentSchedule?.time_blocks
    ?.flatMap(block => block.schedule_items)
    ?.find(item => item.id === artifactPanelItemId)

  // Load template instance when panel opens
  useEffect(() => {
    const loadTemplateInstance = async () => {
      if (!scheduleItem?.template_instance || !artifactPanelItemId) {
        setTemplateInstance(null)
        return
      }

      setIsLoading(true)
      try {
        // In a real app, you'd have a service method to get template instance by ID
        // For now, we'll use the template instance from the schedule item
        if (scheduleItem.template_instance) {
          setTemplateInstance(scheduleItem.template_instance as TemplateInstanceWithSteps)
        }
      } catch (error) {
        console.error('Error loading template instance:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadTemplateInstance()
  }, [artifactPanelItemId, scheduleItem])

  const handleClose = () => {
    setArtifactPanelItemId(null)
    setTemplateInstance(null)
    setExpandedSteps(new Set())
  }

  const handleStepToggle = async (instanceStepId: string) => {
    if (!user || !templateInstance) return

    try {
      const instanceStep = templateInstance.template_instance_steps.find(s => s.id === instanceStepId)
      if (!instanceStep) return

      if (instanceStep.completed_at) {
        await templateService.uncompleteTemplateInstanceStep(instanceStepId)
      } else {
        await templateService.completeTemplateInstanceStep(instanceStepId, user.id)
      }

      // Update local state
      setTemplateInstance(prev => {
        if (!prev) return null
        return {
          ...prev,
          template_instance_steps: prev.template_instance_steps.map(step =>
            step.id === instanceStepId
              ? {
                  ...step,
                  completed_at: instanceStep.completed_at ? null : new Date().toISOString(),
                  completed_by: instanceStep.completed_at ? null : user.id
                }
              : step
          )
        }
      })
    } catch (error) {
      console.error('Error toggling step:', error)
    }
  }

  const toggleStepExpanded = (stepId: string) => {
    const newExpanded = new Set(expandedSteps)
    if (newExpanded.has(stepId)) {
      newExpanded.delete(stepId)
    } else {
      newExpanded.add(stepId)
    }
    setExpandedSteps(newExpanded)
  }

  const getStepIcon = (stepType: string) => {
    switch (stepType) {
      case 'task':
        return CheckCircleIcon
      case 'note':
        return InformationCircleIcon
      case 'decision':
        return ExclamationTriangleIcon
      case 'resource':
        return LinkIcon
      case 'reference':
        return DocumentTextIcon
      default:
        return CheckCircleIcon
    }
  }

  const renderStepMetadata = (metadata: Record<string, any>) => {
    if (!metadata || Object.keys(metadata).length === 0) return null

    return (
      <div className="mt-3 space-y-2">
        {metadata.url && (
          <a
            href={metadata.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            <LinkIcon className="h-4 w-4 mr-2" />
            View Resource
          </a>
        )}
        
        {metadata.phone && (
          <a
            href={`tel:${metadata.phone}`}
            className="inline-flex items-center text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            <PhoneIcon className="h-4 w-4 mr-2" />
            {metadata.phone}
          </a>
        )}
        
        {metadata.notes && (
          <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded-lg p-3">
            <strong className="block mb-1">Notes:</strong>
            {metadata.notes}
          </div>
        )}
        
        {metadata.warning && (
          <div className="text-sm text-yellow-800 dark:text-yellow-200 bg-yellow-100 dark:bg-yellow-900/50 rounded-lg p-3 flex items-start">
            <ExclamationTriangleIcon className="h-4 w-4 mt-0.5 mr-2 flex-shrink-0" />
            <div>
              <strong className="block mb-1">Warning:</strong>
              {metadata.warning}
            </div>
          </div>
        )}
      </div>
    )
  }

  const isOpen = !!artifactPanelItemId && !!scheduleItem

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed right-0 top-0 h-full w-96 bg-white dark:bg-gray-800 shadow-2xl border-l border-gray-200 dark:border-gray-700 z-40 overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                {scheduleItem.title}
              </h2>
              {scheduleItem.template_instance && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Template
                </p>
              )}
            </div>
            
            <button
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : !templateInstance ? (
              <div className="p-6 text-center">
                <DocumentTextIcon className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No Procedure Found
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  This item doesn't have an associated procedure.
                </p>
              </div>
            ) : (
              <div className="p-6">
                {/* Template Info */}
                <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                      {templateInstance.template?.icon ? (
                        <span className="text-lg">{templateInstance.template.icon}</span>
                      ) : (
                        <DocumentTextIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {templateInstance.template?.title || 'Template'}
                      </h3>
                      {templateInstance.template?.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {templateInstance.template?.description}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {/* Progress */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Progress</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {templateInstance.template_instance_steps.filter(s => s.completed_at).length} / {templateInstance.template_instance_steps.length}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{
                          width: `${(templateInstance.template_instance_steps.filter(s => s.completed_at).length / templateInstance.template_instance_steps.length) * 100}%`
                        }}
                        className="h-2 bg-green-500 rounded-full transition-all duration-300"
                      />
                    </div>
                  </div>
                </div>

                {/* Steps */}
                <div className="space-y-3">
                  {templateInstance.template_instance_steps.map((instanceStep, index) => {
                    const step = instanceStep.template_step
                    const isCompleted = !!instanceStep.completed_at
                    const isExpanded = expandedSteps.has(step.id)
                    const StepIcon = getStepIcon(step.step_type)
                    const hasAdditionalContent = step.description || Object.keys(step.metadata || {}).length > 0

                    return (
                      <motion.div
                        key={instanceStep.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={cn(
                          'rounded-lg border-2 transition-all duration-200',
                          isCompleted
                            ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
                            : 'border-gray-200 bg-white dark:border-gray-600 dark:bg-gray-700'
                        )}
                      >
                        <div className="p-4">
                          <div className="flex items-start space-x-3">
                            {/* Step Toggle */}
                            <button
                              onClick={() => handleStepToggle(instanceStep.id)}
                              className="flex-shrink-0 mt-0.5 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                            >
                              {isCompleted ? (
                                <CheckCircleIconSolid className="h-6 w-6 text-green-600 dark:text-green-400" />
                              ) : (
                                <StepIcon className="h-6 w-6 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400" />
                              )}
                            </button>

                            {/* Step Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                  <h4 className={cn(
                                    'text-sm font-medium mb-1',
                                    isCompleted
                                      ? 'text-green-800 dark:text-green-200 line-through'
                                      : 'text-gray-900 dark:text-white'
                                  )}>
                                    {step.title}
                                  </h4>
                                  
                                  <div className="flex items-center space-x-2 mb-2">
                                    <span className={cn(
                                      'inline-flex items-center px-2 py-1 text-xs font-medium rounded-full',
                                      isCompleted
                                        ? 'bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200'
                                        : 'bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                                    )}>
                                      {step.step_type}
                                    </span>
                                    
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                      Step {index + 1}
                                    </span>
                                  </div>

                                  {/* Completion Info */}
                                  {isCompleted && instanceStep.completed_by && (
                                    <div className="text-xs text-green-700 dark:text-green-300 mb-2">
                                      Completed by {instanceStep.completed_by.substring(0, 8)} at {new Date(instanceStep.completed_at!).toLocaleTimeString()}
                                    </div>
                                  )}
                                </div>

                                {hasAdditionalContent && (
                                  <button
                                    onClick={() => toggleStepExpanded(step.id)}
                                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded transition-colors"
                                  >
                                    {isExpanded ? (
                                      <ChevronDownIcon className="h-4 w-4" />
                                    ) : (
                                      <ChevronRightIcon className="h-4 w-4" />
                                    )}
                                  </button>
                                )}
                              </div>

                              {/* Expanded Content */}
                              <AnimatePresence>
                                {isExpanded && hasAdditionalContent && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="overflow-hidden"
                                  >
                                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                                      {step.description && (
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                          {step.description}
                                        </p>
                                      )}
                                      
                                      {renderStepMetadata(step.metadata)}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}