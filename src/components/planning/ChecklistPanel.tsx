'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  XMarkIcon,
  CheckCircleIcon,
  ClipboardDocumentCheckIcon,
  ChevronRightIcon,
  DocumentTextIcon,
  CheckIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'
import { TimeBlockWithItems } from '@/lib/types/database'
import { formatDisplayDate } from '@/lib/utils'
import { templateService } from '@/lib/services/TemplateService'
import { useScheduleStore } from '@/lib/stores/useScheduleStore'
import { useAppStore } from '@/lib/stores/useAppStore'
import { toast } from 'sonner'

interface ChecklistPanelProps {
  timeBlock: TimeBlockWithItems | null
  date: string
  onClose: () => void
  isOpen: boolean
}

export function ChecklistPanel({ 
  timeBlock, 
  date, 
  onClose, 
  isOpen 
}: ChecklistPanelProps) {
  const { updateTimeBlock } = useScheduleStore()
  const { user } = useAppStore()
  const [notes, setNotes] = useState<Record<string, string>>({})
  
  if (!timeBlock) return null
  
  // Find the schedule item with a template instance
  const itemWithChecklist = timeBlock.schedule_items.find(item => item.template_instance)
  if (!itemWithChecklist?.template_instance) return null
  
  const templateInstance = itemWithChecklist.template_instance
  const steps = templateInstance.template_instance_steps || []
  const completedSteps = steps.filter(step => step.completed_at)
  const totalSteps = steps.length
  const completionRate = totalSteps > 0 ? (completedSteps.length / totalSteps) * 100 : 0
  
  const handleToggleStep = async (instanceStepId: string, currentlyCompleted: boolean) => {
    if (!user) return
    
    try {
      if (currentlyCompleted) {
        await templateService.uncompleteTemplateInstanceStep(instanceStepId)
      } else {
        await templateService.completeTemplateInstanceStep(
          instanceStepId, 
          user.id,
          notes[instanceStepId]
        )
      }
      
      // Update local state
      updateTimeBlock(timeBlock.id, {
        schedule_items: timeBlock.schedule_items.map(si => {
          if (si.id === itemWithChecklist.id && si.template_instance) {
            return {
              ...si,
              template_instance: {
                ...si.template_instance,
                template_instance_steps: si.template_instance.template_instance_steps.map(step =>
                  step.id === instanceStepId
                    ? { 
                        ...step, 
                        completed_at: currentlyCompleted ? null : new Date().toISOString(),
                        completed_by: currentlyCompleted ? null : user.id,
                        notes: currentlyCompleted ? null : notes[instanceStepId] || null
                      }
                    : step
                )
              }
            }
          }
          return si
        })
      })
      
      toast.success(currentlyCompleted ? 'Step unchecked' : 'Step completed!')
    } catch (error) {
      console.error('Error toggling step:', error)
      toast.error('Failed to update step')
    }
  }
  
  const handleMarkAllComplete = async () => {
    if (!user) return
    
    try {
      // Complete all uncompleted steps
      const promises = steps
        .filter(step => !step.completed_at)
        .map(step => templateService.completeTemplateInstanceStep(step.id, user.id))
      
      await Promise.all(promises)
      
      // Update local state
      updateTimeBlock(timeBlock.id, {
        schedule_items: timeBlock.schedule_items.map(si => {
          if (si.id === itemWithChecklist.id && si.template_instance) {
            return {
              ...si,
              template_instance: {
                ...si.template_instance,
                template_instance_steps: si.template_instance.template_instance_steps.map(step => ({
                  ...step,
                  completed_at: new Date().toISOString(),
                  completed_by: user.id
                }))
              }
            }
          }
          return si
        })
      })
      
      toast.success('All items completed!')
    } catch (error) {
      console.error('Error completing all steps:', error)
      toast.error('Failed to complete all steps')
    }
  }
  
  const handleResetAll = async () => {
    if (!window.confirm('Reset all checklist items to unchecked?')) return
    
    try {
      // Uncomplete all completed steps
      const promises = steps
        .filter(step => step.completed_at)
        .map(step => templateService.uncompleteTemplateInstanceStep(step.id))
      
      await Promise.all(promises)
      
      // Update local state
      updateTimeBlock(timeBlock.id, {
        schedule_items: timeBlock.schedule_items.map(si => {
          if (si.id === itemWithChecklist.id && si.template_instance) {
            return {
              ...si,
              template_instance: {
                ...si.template_instance,
                template_instance_steps: si.template_instance.template_instance_steps.map(step => ({
                  ...step,
                  completed_at: null,
                  completed_by: null,
                  notes: null
                }))
              }
            }
          }
          return si
        })
      })
      
      setNotes({})
      toast.success('Checklist reset')
    } catch (error) {
      console.error('Error resetting steps:', error)
      toast.error('Failed to reset checklist')
    }
  }
  
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 20 }}
          className="fixed right-0 top-0 h-full w-96 bg-white dark:bg-gray-800 shadow-xl border-l border-gray-200 dark:border-gray-700 z-50 flex flex-col"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <ClipboardDocumentCheckIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Checklist
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-1 hover:bg-white/50 dark:hover:bg-gray-700/50 rounded-lg transition-colors"
              >
                <XMarkIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            
            {/* Template Title */}
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              {itemWithChecklist.title}
            </h3>
            
            {/* Date */}
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {formatDisplayDate(new Date(date))}
            </p>
          </div>
          
          {/* Progress Bar */}
          <div className="px-6 py-3 bg-gray-50 dark:bg-gray-900/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Progress
              </span>
              <span className="text-sm font-bold text-gray-900 dark:text-white">
                {completedSteps.length} of {totalSteps} complete
              </span>
            </div>
            <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500"
                initial={{ width: 0 }}
                animate={{ width: `${completionRate}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
          
          {/* Checklist Items */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {steps.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <DocumentTextIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No checklist items</p>
              </div>
            ) : (
              <div className="space-y-3">
                {steps.map((step, index) => (
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`p-3 rounded-lg border transition-all ${
                      step.completed_at 
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => handleToggleStep(step.id, !!step.completed_at)}
                        className="mt-0.5 flex-shrink-0"
                      >
                        <CheckCircleIcon 
                          className={`h-5 w-5 transition-all ${
                            step.completed_at 
                              ? 'text-green-500 fill-green-500' 
                              : 'text-gray-400 hover:text-blue-500'
                          }`}
                        />
                      </button>
                      
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${
                          step.completed_at 
                            ? 'line-through text-gray-500' 
                            : 'text-gray-900 dark:text-white'
                        }`}>
                          {step.template_step?.title || `Step ${index + 1}`}
                        </p>
                        
                        {step.template_step?.description && (
                          <p className={`text-xs mt-1 ${
                            step.completed_at
                              ? 'text-gray-400'
                              : 'text-gray-600 dark:text-gray-400'
                          }`}>
                            {step.template_step.description}
                          </p>
                        )}
                        
                        {/* Notes field (only show when not completed) */}
                        {!step.completed_at && (
                          <input
                            type="text"
                            placeholder="Add note (optional)"
                            value={notes[step.id] || ''}
                            onChange={(e) => setNotes({ ...notes, [step.id]: e.target.value })}
                            className="mt-2 w-full px-2 py-1 text-xs bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        )}
                        
                        {/* Show saved note if completed */}
                        {step.completed_at && step.notes && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic">
                            Note: {step.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
          
          {/* Footer Actions */}
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            <div className="flex gap-2">
              <button
                onClick={handleMarkAllComplete}
                disabled={completedSteps.length === totalSteps}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 disabled:from-gray-400 disabled:to-gray-500 rounded-lg transition-all disabled:cursor-not-allowed"
              >
                <CheckIcon className="h-4 w-4" />
                Complete All
              </button>
              <button
                onClick={handleResetAll}
                disabled={completedSteps.length === 0}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg transition-all disabled:cursor-not-allowed"
              >
                <ArrowPathIcon className="h-4 w-4" />
                Reset All
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}