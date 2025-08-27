'use client'

import { Fragment, useEffect } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  XMarkIcon,
  CheckCircleIcon,
  ClockIcon,
  ListBulletIcon,
  DocumentTextIcon,
  PlayIcon,
  CheckIcon
} from '@heroicons/react/24/outline'
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid'
import { TemplateWithSteps } from '@/lib/types/database'
import { useTemplateStore } from '@/lib/stores/useTemplateStore'
import { cn } from '@/lib/utils'

interface QuickExecutionModalProps {
  template: TemplateWithSteps | null
  isOpen: boolean
  onClose: () => void
}

export function QuickExecutionModal({ 
  template, 
  isOpen, 
  onClose 
}: QuickExecutionModalProps) {
  const { 
    quickExecutionSteps, 
    toggleQuickExecutionStep, 
    resetQuickExecutionSteps 
  } = useTemplateStore()

  // Reset steps when template changes
  useEffect(() => {
    if (template) {
      resetQuickExecutionSteps()
    }
  }, [template, resetQuickExecutionSteps])

  if (!template) return null

  const hasSteps = template.template_steps.length > 0
  const IconComponent = hasSteps ? ListBulletIcon : DocumentTextIcon
  
  const completedSteps = Object.values(quickExecutionSteps).filter(Boolean).length
  const totalSteps = template.template_steps.length
  const completionRate = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0
  const isFullyCompleted = totalSteps > 0 && completedSteps === totalSteps

  const handleStepToggle = (stepId: string) => {
    toggleQuickExecutionStep(stepId)
  }

  const handleClose = () => {
    resetQuickExecutionSteps()
    onClose()
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-4">
                    <div className={cn(
                      'w-12 h-12 rounded-lg flex items-center justify-center',
                      template.color ? `bg-${template.color}-100 dark:bg-${template.color}-900` : 'bg-blue-100 dark:bg-blue-900'
                    )}>
                      {template.icon ? (
                        <span className="text-xl">{template.icon}</span>
                      ) : (
                        <IconComponent className={cn(
                          'h-6 w-6',
                          template.color ? `text-${template.color}-600 dark:text-${template.color}-400` : 'text-blue-600 dark:text-blue-400'
                        )} />
                      )}
                    </div>
                    
                    <div className="text-left">
                      <Dialog.Title className="text-xl font-semibold text-gray-900 dark:text-white">
                        {template.title}
                      </Dialog.Title>
                      {template.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {template.description}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <button
                    onClick={handleClose}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                {/* Progress */}
                {hasSteps && (
                  <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Progress
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {completedSteps}/{totalSteps} ({Math.round(completionRate)}%)
                      </span>
                    </div>
                    
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${completionRate}%` }}
                        className={cn(
                          'h-2 rounded-full transition-all duration-300',
                          isFullyCompleted ? 'bg-green-500' : 'bg-blue-500'
                        )}
                      />
                    </div>

                    {isFullyCompleted && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex items-center justify-center mt-3 p-2 bg-green-100 dark:bg-green-900/50 rounded-lg"
                      >
                        <CheckCircleIconSolid className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
                        <span className="text-sm font-medium text-green-800 dark:text-green-200">
                          All steps completed! 🎉
                        </span>
                      </motion.div>
                    )}
                  </div>
                )}

                {/* Content */}
                <div className="max-h-96 overflow-y-auto">
                  {!hasSteps ? (
                    <div className="p-8 text-center">
                      <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        Simple Template
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        This template doesn't have specific steps. Use it as a general reference.
                      </p>
                    </div>
                  ) : (
                    <div className="p-6">
                      <div className="space-y-4">
                        <AnimatePresence>
                          {template.template_steps.map((step, index) => {
                            const isCompleted = quickExecutionSteps[step.id] || false
                            
                            return (
                              <motion.div
                                key={step.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className={cn(
                                  'rounded-lg border-2 transition-all duration-200 cursor-pointer',
                                  isCompleted
                                    ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
                                    : 'border-gray-200 bg-white dark:border-gray-600 dark:bg-gray-700 hover:border-blue-300 dark:hover:border-blue-600'
                                )}
                                onClick={() => handleStepToggle(step.id)}
                              >
                                <div className="p-4">
                                  <div className="flex items-start space-x-3">
                                    {/* Step Number / Checkbox */}
                                    <div className="flex-shrink-0 mt-0.5">
                                      {isCompleted ? (
                                        <motion.div
                                          initial={{ scale: 0 }}
                                          animate={{ scale: 1 }}
                                          className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center"
                                        >
                                          <CheckIcon className="h-4 w-4 text-white" />
                                        </motion.div>
                                      ) : (
                                        <div className="w-6 h-6 rounded-full border-2 border-gray-300 dark:border-gray-500 flex items-center justify-center text-sm font-medium text-gray-500 dark:text-gray-400">
                                          {index + 1}
                                        </div>
                                      )}
                                    </div>

                                    {/* Step Content */}
                                    <div className="flex-1 min-w-0">
                                      <h4 className={cn(
                                        'text-sm font-medium mb-1',
                                        isCompleted
                                          ? 'text-green-800 dark:text-green-200 line-through'
                                          : 'text-gray-900 dark:text-white'
                                      )}>
                                        {step.title}
                                      </h4>
                                      
                                      {step.description && (
                                        <p className={cn(
                                          'text-sm mb-2',
                                          isCompleted
                                            ? 'text-green-700 dark:text-green-300'
                                            : 'text-gray-600 dark:text-gray-400'
                                        )}>
                                          {step.description}
                                        </p>
                                      )}

                                      {/* Step Type Badge */}
                                      <div className="flex items-center space-x-2">
                                        <span className={cn(
                                          'inline-flex items-center px-2 py-1 text-xs font-medium rounded-full',
                                          isCompleted
                                            ? 'bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200'
                                            : 'bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                                        )}>
                                          {step.step_type}
                                        </span>

                                        {step.metadata?.url && (
                                          <a
                                            href={step.metadata.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                                            onClick={(e) => e.stopPropagation()}
                                          >
                                            View Resource
                                          </a>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            )
                          })}
                        </AnimatePresence>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                  <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                    <span className="inline-flex items-center">
                      <ClockIcon className="h-4 w-4 mr-1" />
                      {template.is_system ? 'System Template' : 'Family Template'}
                    </span>
                    
                    {hasSteps && (
                      <span className="inline-flex items-center">
                        <ListBulletIcon className="h-4 w-4 mr-1" />
                        {template.template_steps.length} Steps
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-3">
                    <button
                      onClick={resetQuickExecutionSteps}
                      className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 rounded-lg transition-colors"
                    >
                      Reset
                    </button>
                    
                    <button
                      onClick={handleClose}
                      className={cn(
                        'px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors',
                        isFullyCompleted
                          ? 'bg-green-600 hover:bg-green-700'
                          : 'bg-blue-600 hover:bg-blue-700'
                      )}
                    >
                      {isFullyCompleted ? (
                        <>
                          <CheckIcon className="h-4 w-4 mr-2 inline" />
                          Done
                        </>
                      ) : (
                        'Close'
                      )}
                    </button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}