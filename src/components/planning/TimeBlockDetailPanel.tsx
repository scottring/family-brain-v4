'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  XMarkIcon,
  ClockIcon,
  CheckCircleIcon,
  PlusIcon,
  TrashIcon,
  PencilIcon,
  UserIcon,
  CalendarIcon,
  ChevronRightIcon,
  DocumentTextIcon,
  LinkIcon
} from '@heroicons/react/24/outline'
import { TimeBlockWithItems } from '@/lib/types/database'
import { formatTimeRange, formatDisplayDate } from '@/lib/utils'
import { scheduleService } from '@/lib/services/ScheduleService'
import { templateService } from '@/lib/services/TemplateService'
import { familyService } from '@/lib/services/FamilyService'
import { useScheduleStore } from '@/lib/stores/useScheduleStore'
import { useAppStore } from '@/lib/stores/useAppStore'
import { toast } from 'sonner'

interface TimeBlockDetailPanelProps {
  timeBlock: TimeBlockWithItems | null
  date: string
  onClose: () => void
  isOpen: boolean
}

export function TimeBlockDetailPanel({ 
  timeBlock, 
  date, 
  onClose, 
  isOpen 
}: TimeBlockDetailPanelProps) {
  const { updateTimeBlock, weekSchedules } = useScheduleStore()
  const { user, currentFamilyId } = useAppStore()
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [familyMembers, setFamilyMembers] = useState<any[]>([])
  
  // Fetch family members on mount
  useEffect(() => {
    if (currentFamilyId && isOpen) {
      familyService.getFamilyMembers(currentFamilyId).then(members => {
        setFamilyMembers(members)
      }).catch(error => {
        console.error('Error fetching family members:', error)
      })
    }
  }, [currentFamilyId, isOpen])
  
  if (!timeBlock) return null
  
  const completedItems = timeBlock.schedule_items.filter(item => item.completed_at)
  const totalItems = timeBlock.schedule_items.length
  const completionRate = totalItems > 0 ? (completedItems.length / totalItems) * 100 : 0
  
  const handleSaveTitle = async () => {
    if (!editTitle.trim() || !timeBlock.schedule_items[0]) return
    
    try {
      // Update the first schedule item's title
      await scheduleService.updateScheduleItem(timeBlock.schedule_items[0].id, {
        title: editTitle.trim()
      })
      
      // Update local state
      updateTimeBlock(timeBlock.id, {
        schedule_items: timeBlock.schedule_items.map((item, index) => 
          index === 0 ? { ...item, title: editTitle.trim() } : item
        )
      })
      
      toast.success('Title updated')
      setIsEditingTitle(false)
    } catch (error) {
      console.error('Error updating title:', error)
      toast.error('Failed to update title')
    }
  }
  
  const handleDeleteTimeBlock = async () => {
    if (!window.confirm('Delete this time block and all its items?')) return
    
    try {
      await scheduleService.deleteTimeBlock(timeBlock.id)
      
      const schedule = weekSchedules[date]
      if (schedule) {
        const updatedTimeBlocks = schedule.time_blocks.filter(tb => tb.id !== timeBlock.id)
        updateTimeBlock(date, { time_blocks: updatedTimeBlocks } as any)
      }
      
      toast.success('Time block deleted')
      onClose()
    } catch (error) {
      console.error('Error deleting time block:', error)
      toast.error('Failed to delete time block')
    }
  }
  
  const handleDeleteItem = async (itemId: string, itemTitle: string) => {
    if (!window.confirm(`Delete "${itemTitle}"?`)) return
    
    try {
      await scheduleService.deleteScheduleItem(itemId)
      
      updateTimeBlock(timeBlock.id, {
        schedule_items: timeBlock.schedule_items.filter(si => si.id !== itemId)
      })
      
      toast.success('Item deleted')
    } catch (error) {
      console.error('Error deleting item:', error)
      toast.error('Failed to delete item')
    }
  }
  
  const handleToggleComplete = async (item: any) => {
    try {
      if (item.completed_at) {
        await scheduleService.uncompleteScheduleItem(item.id)
        updateTimeBlock(timeBlock.id, {
          schedule_items: timeBlock.schedule_items.map(si => 
            si.id === item.id ? { ...si, completed_at: null, completed_by: null } : si
          )
        })
      } else {
        if (!user) return
        await scheduleService.completeScheduleItem(item.id, user.id)
        updateTimeBlock(timeBlock.id, {
          schedule_items: timeBlock.schedule_items.map(si => 
            si.id === item.id 
              ? { ...si, completed_at: new Date().toISOString(), completed_by: user.id } 
              : si
          )
        })
      }
    } catch (error) {
      console.error('Error toggling completion:', error)
      toast.error('Failed to update item')
    }
  }
  
  const handleToggleStepComplete = async (instanceStepId: string, completed: boolean) => {
    if (!user) return
    
    try {
      if (completed) {
        await templateService.uncompleteTemplateInstanceStep(instanceStepId)
      } else {
        await templateService.completeTemplateInstanceStep(instanceStepId, user.id)
      }
      
      // Update local state - find the item with this template instance
      const itemWithTemplate = timeBlock.schedule_items.find(si => 
        si.template_instance?.template_instance_steps?.some(step => step.id === instanceStepId)
      )
      
      if (itemWithTemplate && itemWithTemplate.template_instance) {
        updateTimeBlock(timeBlock.id, {
          schedule_items: timeBlock.schedule_items.map(si => {
            if (si.id === itemWithTemplate.id && si.template_instance) {
              return {
                ...si,
                template_instance: {
                  ...si.template_instance,
                  template_instance_steps: si.template_instance.template_instance_steps.map(step =>
                    step.id === instanceStepId
                      ? { 
                          ...step, 
                          completed_at: completed ? null : new Date().toISOString(),
                          completed_by: completed ? null : user.id
                        }
                      : step
                  )
                }
              }
            }
            return si
          })
        })
      }
      
      toast.success(completed ? 'Step uncompleted' : 'Step completed')
    } catch (error) {
      console.error('Error toggling step completion:', error)
      toast.error('Failed to update step')
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
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Event Details
              </h2>
              <button
                onClick={onClose}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <XMarkIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
          </div>
          
          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {/* Title Section */}
            <div className="px-6 py-4">
              {isEditingTitle ? (
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onBlur={handleSaveTitle}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSaveTitle()
                    } else if (e.key === 'Escape') {
                      setEditTitle(timeBlock.schedule_items[0]?.title || 'Time Block')
                      setIsEditingTitle(false)
                    }
                  }}
                  className="text-xl font-bold w-full bg-transparent border-b-2 border-blue-500 outline-none"
                  autoFocus
                />
              ) : (
                <h1 
                  onClick={() => {
                    setEditTitle(timeBlock.schedule_items[0]?.title || 'Time Block')
                    setIsEditingTitle(true)
                  }}
                  className="text-xl font-bold text-gray-900 dark:text-white cursor-text hover:bg-gray-50 dark:hover:bg-gray-700/50 px-2 py-1 -mx-2 rounded"
                >
                  {timeBlock.schedule_items[0]?.title || 'Time Block'}
                </h1>
              )}
            </div>
            
            {/* Time Info */}
            <div className="px-6 py-3 space-y-3">
              <div className="flex items-center gap-3">
                <ClockIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="time"
                    value={timeBlock.start_time.slice(0, 5)}
                    onChange={async (e) => {
                      const newTime = e.target.value + ':00'
                      try {
                        await scheduleService.updateTimeBlock(timeBlock.id, {
                          start_time: newTime
                        })
                        updateTimeBlock(timeBlock.id, { start_time: newTime })
                        toast.success('Start time updated')
                      } catch (error) {
                        console.error('Error updating start time:', error)
                        toast.error('Failed to update start time')
                      }
                    }}
                    className="px-2 py-1 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded"
                  />
                  <span className="text-sm text-gray-500">to</span>
                  <input
                    type="time"
                    value={timeBlock.end_time.slice(0, 5)}
                    onChange={async (e) => {
                      const newTime = e.target.value + ':00'
                      try {
                        await scheduleService.updateTimeBlock(timeBlock.id, {
                          end_time: newTime
                        })
                        updateTimeBlock(timeBlock.id, { end_time: newTime })
                        toast.success('End time updated')
                      } catch (error) {
                        console.error('Error updating end time:', error)
                        toast.error('Failed to update end time')
                      }
                    }}
                    className="px-2 py-1 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded"
                  />
                </div>
              </div>
              
              <div className="flex items-center text-gray-600 dark:text-gray-400">
                <CalendarIcon className="h-5 w-5 mr-3" />
                <span className="text-sm">
                  {formatDisplayDate(new Date(date))}
                </span>
              </div>
              
              {/* Family member assignment */}
              <div className="flex items-center gap-3">
                <UserIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                <select
                  value={timeBlock.assigned_to || ''}
                  onChange={async (e) => {
                    const assignedTo = e.target.value || null
                    try {
                      await scheduleService.updateTimeBlock(timeBlock.id, {
                        assigned_to: assignedTo
                      })
                      updateTimeBlock(timeBlock.id, { 
                        assigned_to: assignedTo,
                        assigned_user: assignedTo 
                          ? familyMembers.find(m => m.user_profile?.id === assignedTo)?.user_profile 
                          : null
                      })
                      toast.success(assignedTo ? 'Assigned to family member' : 'Assignment removed')
                    } catch (error) {
                      console.error('Error updating assignment:', error)
                      toast.error('Failed to update assignment')
                    }
                  }}
                  className="flex-1 px-2 py-1 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded"
                >
                  <option value="">Unassigned</option>
                  {familyMembers.map((member) => (
                    <option key={member.user_profile?.id} value={member.user_profile?.id}>
                      {member.user_profile?.full_name || member.user_profile?.email}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Progress */}
            {totalItems > 0 && (
              <div className="px-6 py-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Progress</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {completedItems.length}/{totalItems} completed
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500 transition-all"
                    style={{ width: `${completionRate}%` }}
                  />
                </div>
              </div>
            )}
            
            {/* Items List */}
            <div className="px-6 py-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                  Tasks & Items
                </h3>
                <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                  Add item
                </button>
              </div>
              
              <div className="space-y-2">
                {timeBlock.schedule_items.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <DocumentTextIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No items yet</p>
                    <p className="text-xs mt-1">Drag templates here to add</p>
                  </div>
                ) : (
                  timeBlock.schedule_items.map((item) => (
                    <div key={item.id} className="mb-4">
                      {/* Main Item */}
                      <div className="group flex items-start gap-2 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <button
                          onClick={() => handleToggleComplete(item)}
                          className="mt-0.5"
                        >
                          <CheckCircleIcon 
                            className={`h-5 w-5 ${
                              item.completed_at 
                                ? 'text-green-500 fill-green-500' 
                                : 'text-gray-400 hover:text-gray-600'
                            }`}
                          />
                        </button>
                        
                        <div className="flex-1">
                          <p className={`text-sm font-medium ${
                            item.completed_at 
                              ? 'line-through text-gray-500' 
                              : 'text-gray-900 dark:text-white'
                          }`}>
                            {item.title}
                          </p>
                          {item.description && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                              {item.description}
                            </p>
                          )}
                        </div>
                        
                        <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                          <button 
                            onClick={() => toast.info('Edit coming soon')}
                            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                          >
                            <PencilIcon className="h-3 w-3 text-gray-500" />
                          </button>
                          <button 
                            onClick={() => handleDeleteItem(item.id, item.title)}
                            className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                          >
                            <TrashIcon className="h-3 w-3 text-gray-500" />
                          </button>
                        </div>
                      </div>
                      
                      {/* Template Steps Checklist */}
                      {item.template_instance?.template_instance_steps && 
                       item.template_instance.template_instance_steps.length > 0 && (
                        <div className="ml-7 mt-2 space-y-1 border-l-2 border-gray-200 dark:border-gray-700 pl-3">
                          {item.template_instance.template_instance_steps.map((step) => (
                            <div 
                              key={step.id}
                              className="flex items-start gap-2 py-1"
                            >
                              <button
                                onClick={() => handleToggleStepComplete(step.id, !!step.completed_at)}
                                className="mt-0.5"
                              >
                                <CheckCircleIcon 
                                  className={`h-4 w-4 ${
                                    step.completed_at 
                                      ? 'text-green-500 fill-green-500' 
                                      : 'text-gray-400 hover:text-gray-600'
                                  }`}
                                />
                              </button>
                              
                              <div className="flex-1">
                                <p className={`text-xs ${
                                  step.completed_at 
                                    ? 'line-through text-gray-400' 
                                    : 'text-gray-600 dark:text-gray-300'
                                }`}>
                                  {step.template_step?.title || 'Step'}
                                </p>
                                {step.template_step?.description && (
                                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                                    {step.template_step.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
            
            {/* Notes Section */}
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                Notes
              </h3>
              <textarea
                placeholder="Add notes..."
                className="w-full p-2 text-sm bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 resize-none"
                rows={3}
              />
            </div>
          </div>
          
          {/* Footer Actions */}
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex gap-2">
              <button
                onClick={handleDeleteTimeBlock}
                className="flex-1 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                Delete Block
              </button>
              <button
                onClick={onClose}
                className="flex-1 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}