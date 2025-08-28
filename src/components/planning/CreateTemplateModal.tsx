'use client'

import { Fragment, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import { useAppStore } from '@/lib/stores/useAppStore'
import { useTemplateStore } from '@/lib/stores/useTemplateStore'
import { templateService } from '@/lib/services/TemplateService'
import { TemplateCategory, StepType } from '@/lib/types/database'

interface CreateTemplateModalProps {
  isOpen: boolean
  onClose: () => void
}

interface TemplateStepData {
  id: string
  title: string
  description: string
  step_type: StepType
}

const categoryLabels: Record<TemplateCategory, string> = {
  morning: 'Morning',
  evening: 'Evening',
  household: 'Household',
  childcare: 'Childcare',
  shopping: 'Shopping',
  work: 'Work',
  personal: 'Personal',
  health: 'Health',
  travel: 'Travel',
  custom: 'Custom'
}

const stepTypeLabels: Record<StepType, string> = {
  action: 'Action',
  check: 'Check',
  note: 'Note',
  timer: 'Timer'
}

export function CreateTemplateModal({ isOpen, onClose }: CreateTemplateModalProps) {
  const { currentFamilyId, user } = useAppStore()
  const { addTemplate } = useTemplateStore()
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'custom' as TemplateCategory,
    icon: '',
    color: '#3B82F6'
  })
  
  const [steps, setSteps] = useState<TemplateStepData[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentFamilyId || !user || isSubmitting) return

    setIsSubmitting(true)
    try {
      // Create the template
      const template = await templateService.createTemplate({
        family_id: currentFamilyId,
        title: formData.title,
        description: formData.description || undefined,
        category: formData.category,
        icon: formData.icon || undefined,
        color: formData.color,
        created_by: user.id
      })

      // Create template steps if any
      const stepPromises = steps.map((step, index) => 
        templateService.createTemplateStep(template.id, {
          title: step.title,
          description: step.description || undefined,
          step_type: step.step_type,
          order_position: index
        })
      )

      if (stepPromises.length > 0) {
        await Promise.all(stepPromises)
      }

      // Get the complete template with steps
      const completeTemplate = await templateService.getTemplate(template.id)
      if (completeTemplate) {
        addTemplate(completeTemplate)
      }

      // Reset form and close
      resetForm()
      onClose()
    } catch (error) {
      console.error('Error creating template:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: 'custom',
      icon: '',
      color: '#3B82F6'
    })
    setSteps([])
  }

  const addStep = () => {
    const newStep: TemplateStepData = {
      id: `temp-${Date.now()}`,
      title: '',
      description: '',
      step_type: 'action'
    }
    setSteps([...steps, newStep])
  }

  const updateStep = (stepId: string, updates: Partial<TemplateStepData>) => {
    setSteps(steps.map(step => 
      step.id === stepId ? { ...step, ...updates } : step
    ))
  }

  const removeStep = (stepId: string) => {
    setSteps(steps.filter(step => step.id !== stepId))
  }

  const moveStep = (stepId: string, direction: 'up' | 'down') => {
    const currentIndex = steps.findIndex(step => step.id === stepId)
    if (currentIndex === -1) return
    
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    if (newIndex < 0 || newIndex >= steps.length) return
    
    const newSteps = [...steps]
    const [movedStep] = newSteps.splice(currentIndex, 1)
    newSteps.splice(newIndex, 0, movedStep)
    setSteps(newSteps)
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
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
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900 dark:text-white"
                  >
                    Create New Template
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Title *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Enter template title"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Description
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Optional description"
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Category
                        </label>
                        <select
                          value={formData.category}
                          onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as TemplateCategory }))}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          {Object.entries(categoryLabels).map(([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Icon (Emoji)
                        </label>
                        <input
                          type="text"
                          value={formData.icon}
                          onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                          placeholder="e.g. 📝"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Steps Section */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                        Steps (Optional)
                      </h4>
                      <button
                        type="button"
                        onClick={addStep}
                        className="inline-flex items-center px-3 py-1 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30"
                      >
                        <PlusIcon className="h-4 w-4 mr-1" />
                        Add Step
                      </button>
                    </div>

                    {steps.length === 0 ? (
                      <div className="text-center py-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          No steps added yet. Add steps to create a procedure template.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {steps.map((step, index) => (
                          <div
                            key={step.id}
                            className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700"
                          >
                            <div className="flex items-start space-x-3">
                              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-xs font-medium text-blue-600 dark:text-blue-400 mt-1">
                                {index + 1}
                              </div>
                              
                              <div className="flex-1 space-y-3">
                                <input
                                  type="text"
                                  placeholder="Step title"
                                  value={step.title}
                                  onChange={(e) => updateStep(step.id, { title: e.target.value })}
                                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                
                                <textarea
                                  placeholder="Step description (optional)"
                                  value={step.description}
                                  onChange={(e) => updateStep(step.id, { description: e.target.value })}
                                  rows={2}
                                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                
                                <select
                                  value={step.step_type}
                                  onChange={(e) => updateStep(step.id, { step_type: e.target.value as StepType })}
                                  className="w-32 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                  {Object.entries(stepTypeLabels).map(([value, label]) => (
                                    <option key={value} value={value}>
                                      {label}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div className="flex flex-col space-y-1">
                                <button
                                  type="button"
                                  onClick={() => moveStep(step.id, 'up')}
                                  disabled={index === 0}
                                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  ↑
                                </button>
                                <button
                                  type="button"
                                  onClick={() => moveStep(step.id, 'down')}
                                  disabled={index === steps.length - 1}
                                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  ↓
                                </button>
                                <button
                                  type="button"
                                  onClick={() => removeStep(step.id)}
                                  className="p-1 text-red-400 hover:text-red-600 dark:hover:text-red-300"
                                >
                                  <TrashIcon className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-600">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || !formData.title.trim()}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? 'Creating...' : 'Create Template'}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}