'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDrag, useDrop } from 'react-dnd'
import { 
  Bars3Icon,
  PencilIcon,
  TrashIcon,
  ClockIcon,
  CheckCircleIcon,
  ListBulletIcon,
  PlusIcon,
  ArrowsUpDownIcon,
  ClipboardDocumentCheckIcon,
  UserGroupIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { TimeBlockWithItems, ScheduleItemWithTemplate } from '@/lib/types/database'
import { ScheduleItemCard } from './ScheduleItemCard'
import { formatTimeRange, timeToMinutes, calculateDuration, cn } from '@/lib/utils'
import { scheduleService } from '@/lib/services/ScheduleService'
import { useScheduleStore } from '@/lib/stores/useScheduleStore'
import { useAppStore } from '@/lib/stores/useAppStore'
import { toast } from 'sonner'
import { UndoNotification } from '@/components/common/UndoNotification'

interface TimeBlockProps {
  timeBlock: TimeBlockWithItems
  date: string
}

// Drop zone component for adding new items to time block
function DropZoneForNewItems({ timeBlockId, date }: { timeBlockId: string; date: string }) {
  const { updateTimeBlock, weekSchedules } = useScheduleStore()
  const { selectedMemberView } = useAppStore()
  
  const [{ isOver }, drop] = useDrop({
    accept: 'template',
    drop: async (item: { template: any }) => {
      try {
        // Find the current time block to get order position
        const schedule = weekSchedules[date]
        const timeBlock = schedule?.time_blocks.find(tb => tb.id === timeBlockId)
        const nextOrder = (timeBlock?.schedule_items?.length || 0) + 1
        
        // Add member assignment metadata based on current view
        const metadata: any = {}
        if (selectedMemberView !== 'all') {
          metadata.assigned_members = [selectedMemberView]
        }
        
        // Create the schedule item
        const newItem = await scheduleService.createScheduleItem(timeBlockId, {
          title: item.template.title,
          description: item.template.description,
          item_type: 'template_ref',
          template_id: item.template.id,
          order_position: nextOrder,
          metadata
        })
        
        // Update local state
        if (timeBlock) {
          // Type assertion needed due to template_instance type mismatch
          const updatedItems = [...(timeBlock.schedule_items || [])] as ScheduleItemWithTemplate[]
          updatedItems.push(newItem as any)
          updateTimeBlock(timeBlockId, {
            schedule_items: updatedItems
          })
        }
        
        toast.success(`Added ${item.template.title} to time block`)
      } catch (error) {
        console.error('Error adding template to time block:', error)
        toast.error('Failed to add template')
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver()
    })
  })

  return (
    <div
      ref={drop as unknown as React.Ref<HTMLDivElement>}
      className={cn(
        "mt-3 px-3 py-2 border-2 border-dashed rounded-lg transition-all",
        isOver
          ? "border-blue-400 bg-blue-50 dark:bg-blue-900/20"
          : "border-gray-300 dark:border-gray-600"
      )}
    >
      <p className="text-sm text-center text-gray-500 dark:text-gray-400">
        {isOver ? "Drop to add" : "Drop template here"}
      </p>
    </div>
  )
}

// Drop zone for nested SOPs/templates
function DropZoneForNestedItems({ 
  parentItemId, 
  parentTitle, 
  timeBlockId,
  date 
}: { 
  parentItemId: string; 
  parentTitle: string;
  timeBlockId: string;
  date: string;
}) {
  const { updateTimeBlock, weekSchedules } = useScheduleStore()
  
  const [{ isOver }, drop] = useDrop({
    accept: 'template',
    drop: async (item: { template: any }) => {
      try {
        // Find the parent item's position
        const schedule = weekSchedules[date]
        const timeBlock = schedule?.time_blocks.find(tb => tb.id === timeBlockId)
        const parentIndex = timeBlock?.schedule_items?.findIndex(si => si.id === parentItemId) ?? -1
        
        // Insert after parent item
        const newOrder = parentIndex + 1.5 // Will be between parent and next item
        
        // Create the nested schedule item
        const newItem = await scheduleService.createScheduleItem(timeBlockId, {
          title: item.template.title,
          description: item.template.description,
          item_type: 'template_ref',
          template_id: item.template.id,
          order_position: newOrder,
          metadata: {
            parent_item_id: parentItemId,
            is_nested: true
          }
        })
        
        // Update local state
        if (timeBlock) {
          const updatedItems = [...(timeBlock.schedule_items || []), newItem as any]
            .sort((a, b) => a.order_position - b.order_position) as ScheduleItemWithTemplate[]
          
          updateTimeBlock(timeBlockId, {
            schedule_items: updatedItems
          })
        }
        
        toast.success(`Added ${item.template.title} as subtask`)
      } catch (error) {
        console.error('Error adding nested template:', error)
        toast.error('Failed to add subtask')
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver()
    })
  })

  return (
    <div
      ref={drop as unknown as React.Ref<HTMLDivElement>}
      className={cn(
        "mt-2 ml-6 p-2 border border-dashed rounded text-xs transition-all",
        isOver
          ? "border-blue-400 bg-blue-50 dark:bg-blue-900/20"
          : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50"
      )}
    >
      <ListBulletIcon className="h-3 w-3 inline mr-1 text-gray-400" />
      <span className="text-gray-500 dark:text-gray-400">
        {isOver ? "Drop SOP here" : "Drop SOPs/subtasks"}
      </span>
    </div>
  )
}

export function TimeBlock({ timeBlock, date }: TimeBlockProps) {
  const [showHoverCard, setShowHoverCard] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [resizeStartY, setResizeStartY] = useState(0)
  const [resizeStartHeight, setResizeStartHeight] = useState(0)
  const [deletedBlock, setDeletedBlock] = useState<TimeBlockWithItems | null>(null)
  const [showUndoNotification, setShowUndoNotification] = useState(false)
  const blockRef = useRef<HTMLDivElement>(null)
  const { updateTimeBlock, weekSchedules, removeTimeBlock } = useScheduleStore()
  const { user } = useAppStore()
  
  // Set up drag functionality for moving the entire time block
  const [{ isDraggingBlock }, drag, dragPreview] = useDrag({
    type: 'timeBlock',
    item: { timeBlock, date },
    collect: (monitor) => ({
      isDraggingBlock: monitor.isDragging()
    })
  })
  
  // Set up drop functionality for receiving items and moving time blocks
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: ['scheduleItem', 'template', 'timeBlock'],
    drop: async (draggedItem: any) => {
      if (draggedItem.template) {
        // Template dropping is handled by DropZoneForNewItems
        return
      } else if (draggedItem.scheduleItem && draggedItem.sourceTimeBlockId !== timeBlock.id) {
        // Moving an existing item between time blocks
        try {
          const nextOrder = (timeBlock.schedule_items?.length || 0) + 1
          await scheduleService.moveScheduleItem(
            draggedItem.scheduleItem.id,
            timeBlock.id,
            nextOrder
          )
          
          // Update local state - remove from source and add to target
          const sourceSchedule = weekSchedules[date]
          const sourceBlock = sourceSchedule?.time_blocks.find(tb => tb.id === draggedItem.sourceTimeBlockId)
          const targetBlock = sourceSchedule?.time_blocks.find(tb => tb.id === timeBlock.id)
          
          if (sourceBlock && targetBlock) {
            // Remove from source
            updateTimeBlock(draggedItem.sourceTimeBlockId, {
              schedule_items: sourceBlock.schedule_items.filter(item => item.id !== draggedItem.scheduleItem.id) as ScheduleItemWithTemplate[]
            })
            
            // Add to target
            updateTimeBlock(timeBlock.id, {
              schedule_items: [...(targetBlock.schedule_items || []), draggedItem.scheduleItem] as ScheduleItemWithTemplate[]
            })
          }
          
          toast.success('Item moved successfully')
        } catch (error) {
          console.error('Error moving item:', error)
          toast.error('Failed to move item')
        }
      } else if (draggedItem.timeBlock && draggedItem.timeBlock.id !== timeBlock.id) {
        // Swapping time blocks - could implement time swap logic here
        console.log('Time block swap not yet implemented')
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop()
    })
  })
  
  // Combine drag and drop refs
  useEffect(() => {
    if (blockRef.current) {
      drop(blockRef.current)
      dragPreview(blockRef.current)
    }
  }, [drop, dragPreview])
  
  // Handle delete time block
  const handleDeleteBlock = async () => {
    try {
      // Store the block for undo BEFORE deleting
      setDeletedBlock(timeBlock)
      
      // Delete from database first
      await scheduleService.deleteTimeBlock(timeBlock.id)
      
      // Remove from local state after successful deletion
      removeTimeBlock(date, timeBlock.id)
      
      // Show undo notification after successful deletion
      setShowUndoNotification(true)
      
      toast.success('Time block deleted')
    } catch (error) {
      console.error('Error deleting time block:', error)
      toast.error('Failed to delete time block')
      // Don't need to restore since we didn't remove from local state yet
    }
  }
  
  // Handle undo delete
  const handleUndoDelete = async () => {
    if (!deletedBlock) return
    
    try {
      // Recreate the time block
      const restoredBlock = await scheduleService.createTimeBlock(
        deletedBlock.schedule_id, 
        deletedBlock.start_time,
        deletedBlock.end_time
      )
      
      // Restore items if any
      if (deletedBlock.schedule_items && deletedBlock.schedule_items.length > 0) {
        for (const item of deletedBlock.schedule_items) {
          await scheduleService.createScheduleItem(restoredBlock.id, {
            title: item.title,
            description: item.description || undefined,
            item_type: item.item_type,
            template_id: item.template_id || undefined,
            order_position: item.order_position,
            metadata: item.metadata
          })
        }
      }
      
      // Update local state with restored items
      updateTimeBlock(restoredBlock.id, {
        ...restoredBlock,
        schedule_items: deletedBlock.schedule_items || []
      } as TimeBlockWithItems)
      
      setShowUndoNotification(false)
      setDeletedBlock(null)
      toast.success('Time block restored')
    } catch (error) {
      console.error('Error restoring time block:', error)
      toast.error('Failed to restore time block')
    }
  }
  
  // Handle resize
  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
    setResizeStartY(e.clientY)
    setResizeStartHeight(blockRef.current?.offsetHeight || 0)
  }
  
  useEffect(() => {
    if (!isResizing) return
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!blockRef.current) return
      
      const deltaY = e.clientY - resizeStartY
      const newHeight = Math.max(40, resizeStartHeight + deltaY) // Min 40px
      
      // Calculate new end time based on height
      const newDuration = Math.round((newHeight / 16) * 15) // Convert pixels to minutes
      const startMinutes = timeToMinutes(timeBlock.start_time)
      const newEndMinutes = startMinutes + newDuration
      
      const newEndHours = Math.floor(newEndMinutes / 60)
      const newEndMins = newEndMinutes % 60
      const newEndTime = `${newEndHours.toString().padStart(2, '0')}:${newEndMins.toString().padStart(2, '0')}:00`
      
      // Update visual height immediately for smooth feedback
      blockRef.current.style.height = `${newHeight}px`
      
      // Store the new end time for when mouse is released
      blockRef.current.dataset.newEndTime = newEndTime
    }
    
    const handleMouseUp = async () => {
      setIsResizing(false)
      
      if (blockRef.current?.dataset.newEndTime) {
        const newEndTime = blockRef.current.dataset.newEndTime
        
        try {
          // Update in database
          await scheduleService.updateTimeBlock(timeBlock.id, {
            end_time: newEndTime
          })
          
          // Update local state
          updateTimeBlock(timeBlock.id, {
            end_time: newEndTime
          })
          
          toast.success('Time block resized')
        } catch (error) {
          console.error('Error resizing time block:', error)
          toast.error('Failed to resize time block')
          
          // Reset visual height on error
          const duration = calculateDuration(timeBlock.start_time, timeBlock.end_time)
          const height = Math.max((duration / 15) * 16, 40)
          blockRef.current.style.height = `${height}px`
        }
        
        delete blockRef.current.dataset.newEndTime
      }
    }
    
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing, resizeStartY, resizeStartHeight, timeBlock, updateTimeBlock])
  
  const startMinutes = timeToMinutes(timeBlock.start_time)
  const duration = calculateDuration(timeBlock.start_time, timeBlock.end_time)
  
  // Calculate position and height based on time
  const topPosition = ((startMinutes - 5 * 60) / 15) * 16 // 5 AM start, 16px per 15min slot
  const height = Math.max((duration / 15) * 16, 40) // Minimum 40px height for readability
  
  const completedItems = timeBlock.schedule_items.filter(item => item.completed_at)
  const totalItems = timeBlock.schedule_items.length
  const completionRate = totalItems > 0 ? (completedItems.length / totalItems) * 100 : 0
  
  // Check if this is a checklist/template
  const hasChecklist = timeBlock.schedule_items.some(item => item.template_instance)
  const checklistItem = timeBlock.schedule_items.find(item => item.template_instance)
  const checklistSteps = checklistItem?.template_instance?.template_instance_steps || []
  const completedSteps = checklistSteps.filter(step => step.completed_at)
  
  // Get primary title (first item or time range)
  const primaryTitle = timeBlock.schedule_items[0]?.title || `Time Block`
  const hasMultipleItems = timeBlock.schedule_items.length > 1
  const additionalItemsCount = timeBlock.schedule_items.length - 1
  
  // Check for multiple assignees
  const assignedUsers = timeBlock.schedule_items
    .map(item => item.assigned_to)
    .filter((id, index, self) => id && self.indexOf(id) === index)
  const hasMultipleAssignees = assignedUsers.length > 1
  
  return (
    <>
      <motion.div
        ref={blockRef}
        initial={{ opacity: 0, y: 10 }}
        animate={{ 
          opacity: isDraggingBlock ? 0.5 : 1, 
          y: 0,
          scale: isDraggingBlock ? 0.95 : 1
        }}
        onMouseEnter={() => setShowHoverCard(true)}
        onMouseLeave={() => setShowHoverCard(false)}
        className={cn(
          "absolute left-1 right-1 rounded-lg shadow-sm border group transition-all",
          "hover:shadow-lg hover:z-10",
          hasChecklist 
            ? "bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-300 dark:border-blue-700"
            : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700",
          isOver && canDrop && "ring-2 ring-blue-400 dark:ring-blue-500"
        )}
        style={{
          top: `${topPosition}px`,
          height: `${height}px`,
          minHeight: '48px'
        }}
      >
        {/* Drag Handle */}
        <div 
          ref={drag}
          className="absolute left-0 top-0 bottom-0 w-6 bg-gray-100 dark:bg-gray-700 opacity-0 group-hover:opacity-100 transition-opacity cursor-move flex items-center justify-center"
        >
          <Bars3Icon className="h-4 w-4 text-gray-500" />
        </div>

        {/* Delete Button */}
        <button
          onClick={handleDeleteBlock}
          className="absolute top-2 right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center shadow-sm hover:shadow-md"
          title="Delete time block"
        >
          <XMarkIcon className="h-4 w-4" />
        </button>

        {/* Main Content */}
        <div className="h-full px-8 py-2 flex flex-col justify-center">
          <div className="flex items-start gap-2">
            {/* Icon */}
            {hasChecklist && (
              <ClipboardDocumentCheckIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            )}
            
            <div className="flex-1 min-w-0">
              {/* Title - Full display, no truncation */}
              <h3 className={cn(
                "font-bold text-gray-900 dark:text-white",
                height > 60 ? "text-base" : "text-sm"
              )}>
                {primaryTitle}
              </h3>
              
              {/* Checklist Progress or Item Count */}
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {hasChecklist && checklistSteps.length > 0 ? (
                  <div className="flex items-center gap-1">
                    <CheckCircleIcon className="h-3 w-3 text-green-500" />
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      {completedSteps.length}/{checklistSteps.length} steps
                    </span>
                  </div>
                ) : hasMultipleItems && (
                  <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                    +{additionalItemsCount} items
                  </span>
                )}
                
                {/* Multiple assignees indicator */}
                {hasMultipleAssignees && (
                  <div className="flex items-center gap-1">
                    <UserGroupIcon className="h-3 w-3 text-gray-500" />
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {assignedUsers.length} people
                    </span>
                  </div>
                )}
                
                {/* Nested checklists indicator */}
                {hasMultipleItems && hasChecklist && (
                  <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                    Has sub-checklists
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Resize Handle */}
        <div 
          className="absolute bottom-0 left-0 right-0 h-2 bg-gray-200 dark:bg-gray-700 opacity-0 group-hover:opacity-100 transition-opacity cursor-ns-resize flex items-center justify-center"
          onMouseDown={handleResizeStart}
        >
          <ArrowsUpDownIcon className="h-3 w-3 text-gray-500" />
        </div>
      </motion.div>

      {/* Hover Card Popup */}
      <AnimatePresence>
        {showHoverCard && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className="absolute z-50 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4 min-w-[300px]"
            style={{
              top: `${topPosition}px`,
              left: '50%',
              transform: 'translateX(-50%)'
            }}
          >
            {/* Header with Actions */}
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {primaryTitle}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
                  <ClockIcon className="h-4 w-4" />
                  {formatTimeRange(timeBlock.start_time, timeBlock.end_time)}
                </p>
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => {
                    // TODO: Open edit modal for time block
                    toast.info('Edit time block coming soon')
                  }}
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <PencilIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                </button>
                <button 
                  onClick={async () => {
                    if (!window.confirm('Delete this time block and all its items?')) return
                    
                    try {
                      await scheduleService.deleteTimeBlock(timeBlock.id)
                      
                      // Update local state
                      const schedule = weekSchedules[date]
                      if (schedule) {
                        const updatedTimeBlocks = schedule.time_blocks.filter(tb => tb.id !== timeBlock.id)
                        updateTimeBlock(date, { time_blocks: updatedTimeBlocks } as any)
                      }
                      
                      toast.success('Time block deleted')
                      setShowHoverCard(false)
                    } catch (error) {
                      console.error('Error deleting time block:', error)
                      toast.error('Failed to delete time block')
                    }
                  }}
                  className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                >
                  <TrashIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                </button>
              </div>
            </div>

            {/* Items List */}
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {timeBlock.schedule_items.length === 0 ? (
                <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
                  No items yet. Drag templates here to add.
                </div>
              ) : (
                timeBlock.schedule_items.map((item) => (
                  <div key={item.id} className="group/item flex items-start gap-2 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <CheckCircleIcon 
                      className={cn(
                        "h-4 w-4 mt-0.5",
                        item.completed_at 
                          ? "text-green-500" 
                          : "text-gray-400"
                      )}
                    />
                    <div className="flex-1">
                      <p className={cn(
                        "text-sm font-medium",
                        item.completed_at && "line-through text-gray-500"
                      )}>
                        {item.title}
                      </p>
                      {item.description && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {item.description}
                        </p>
                      )}
                      
                      {/* Drop zone for nested SOPs/templates */}
                      {item.item_type === 'template_ref' && (
                        <DropZoneForNestedItems 
                          parentItemId={item.id}
                          parentTitle={item.title}
                          timeBlockId={timeBlock.id}
                          date={date}
                        />
                      )}
                    </div>
                    
                    {/* Item actions */}
                    <div className="opacity-0 group-hover/item:opacity-100 flex gap-1">
                      <button 
                        onClick={() => {
                          // TODO: Open edit modal for item
                          toast.info('Edit item coming soon')
                        }}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                      >
                        <PencilIcon className="h-3 w-3 text-gray-500" />
                      </button>
                      <button 
                        onClick={async () => {
                          if (!window.confirm(`Delete "${item.title}"?`)) return
                          
                          try {
                            await scheduleService.deleteScheduleItem(item.id)
                            
                            // Update local state
                            updateTimeBlock(timeBlock.id, {
                              schedule_items: timeBlock.schedule_items.filter(si => si.id !== item.id)
                            })
                            
                            toast.success('Item deleted')
                          } catch (error) {
                            console.error('Error deleting item:', error)
                            toast.error('Failed to delete item')
                          }
                        }}
                        className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                      >
                        <TrashIcon className="h-3 w-3 text-gray-500" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Main Drop Zone for adding items */}
            <DropZoneForNewItems timeBlockId={timeBlock.id} date={date} />
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Undo Notification */}
      {showUndoNotification && deletedBlock && (
        <UndoNotification
          message={`Deleted "${deletedBlock.title || 'Time Block'}"`}
          onUndo={handleUndoDelete}
          onDismiss={() => {
            setShowUndoNotification(false)
            setDeletedBlock(null)
          }}
          duration={10}
        />
      )}
    </>
  )
}