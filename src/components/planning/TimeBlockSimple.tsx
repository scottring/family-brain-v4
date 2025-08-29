'use client'

import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useDrag, useDrop } from 'react-dnd'
import { Bars3Icon } from '@heroicons/react/24/outline'
import { TimeBlockWithItems } from '@/lib/types/database'
import { timeToMinutes, calculateDuration, cn } from '@/lib/utils'
import { scheduleService } from '@/lib/services/ScheduleService'
import { useScheduleStore } from '@/lib/stores/useScheduleStore'
import { toast } from 'sonner'

interface TimeBlockProps {
  timeBlock: TimeBlockWithItems
  date: string
  isSelected?: boolean
  onClick?: () => void
}

export function TimeBlockSimple({ 
  timeBlock, 
  date, 
  isSelected = false,
  onClick 
}: TimeBlockProps) {
  const [isResizing, setIsResizing] = useState(false)
  const [resizeStartY, setResizeStartY] = useState(0)
  const [resizeStartHeight, setResizeStartHeight] = useState(0)
  const blockRef = useRef<HTMLDivElement>(null)
  const { updateTimeBlock, weekSchedules } = useScheduleStore()
  
  // Set up drag functionality with delay to prevent conflict with clicks
  const [{ isDragging }, drag, dragPreview] = useDrag({
    type: 'timeBlock',
    item: { timeBlock, date },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    }),
    options: {
      dropEffect: 'move',
      // Add delay to prevent accidental drags when clicking
      delay: 150
    }
  })
  
  // Set up drop functionality for receiving items
  const [{ isOver }, drop] = useDrop({
    accept: ['scheduleItem', 'template'],
    drop: async (draggedItem: any) => {
      if (draggedItem.template) {
        try {
          const schedule = weekSchedules[date]
          const currentBlock = schedule?.time_blocks.find(tb => tb.id === timeBlock.id)
          const nextOrder = (currentBlock?.schedule_items?.length || 0) + 1
          
          const newItem = await scheduleService.createScheduleItem(timeBlock.id, {
            title: draggedItem.template.title,
            description: draggedItem.template.description,
            item_type: 'template_ref',
            template_id: draggedItem.template.id,
            order_position: nextOrder
          })
          
          if (currentBlock) {
            updateTimeBlock(timeBlock.id, {
              schedule_items: [...(currentBlock.schedule_items || []), newItem]
            })
          }
          
          toast.success(`Added ${draggedItem.template.title}`)
        } catch (error) {
          console.error('Error adding template:', error)
          toast.error('Failed to add template')
        }
      } else if (draggedItem.scheduleItem && draggedItem.sourceTimeBlockId !== timeBlock.id) {
        try {
          const nextOrder = (timeBlock.schedule_items?.length || 0) + 1
          await scheduleService.moveScheduleItem(
            draggedItem.scheduleItem.id,
            timeBlock.id,
            nextOrder
          )
          
          const sourceSchedule = weekSchedules[date]
          const sourceBlock = sourceSchedule?.time_blocks.find(tb => tb.id === draggedItem.sourceTimeBlockId)
          const targetBlock = sourceSchedule?.time_blocks.find(tb => tb.id === timeBlock.id)
          
          if (sourceBlock && targetBlock) {
            updateTimeBlock(draggedItem.sourceTimeBlockId, {
              schedule_items: sourceBlock.schedule_items.filter(item => item.id !== draggedItem.scheduleItem.id)
            })
            
            updateTimeBlock(timeBlock.id, {
              schedule_items: [...(targetBlock.schedule_items || []), draggedItem.scheduleItem]
            })
          }
          
          toast.success('Item moved')
        } catch (error) {
          console.error('Error moving item:', error)
          toast.error('Failed to move item')
        }
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver()
    })
  })
  
  // Combine refs - make entire block draggable and droppable
  useEffect(() => {
    if (blockRef.current) {
      drop(blockRef.current)
      drag(blockRef.current)  // Make entire block draggable
      dragPreview(blockRef.current)
    }
  }, [drop, drag, dragPreview])
  
  // Handle resize
  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsResizing(true)
    setResizeStartY(e.clientY)
    setResizeStartHeight(blockRef.current?.offsetHeight || 0)
  }
  
  useEffect(() => {
    if (!isResizing) return
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!blockRef.current) return
      
      const deltaY = e.clientY - resizeStartY
      const newHeight = Math.max(32, resizeStartHeight + deltaY)
      
      const newDuration = Math.round((newHeight / 16) * 15)
      const startMinutes = timeToMinutes(timeBlock.start_time)
      const newEndMinutes = startMinutes + newDuration
      
      const newEndHours = Math.floor(newEndMinutes / 60)
      const newEndMins = newEndMinutes % 60
      const newEndTime = `${newEndHours.toString().padStart(2, '0')}:${newEndMins.toString().padStart(2, '0')}:00`
      
      blockRef.current.style.height = `${newHeight}px`
      blockRef.current.dataset.newEndTime = newEndTime
    }
    
    const handleMouseUp = async () => {
      setIsResizing(false)
      
      if (blockRef.current?.dataset.newEndTime) {
        const newEndTime = blockRef.current.dataset.newEndTime
        
        try {
          await scheduleService.updateTimeBlock(timeBlock.id, {
            end_time: newEndTime
          })
          
          updateTimeBlock(timeBlock.id, {
            end_time: newEndTime
          })
          
          toast.success('Resized')
        } catch (error) {
          console.error('Error resizing:', error)
          toast.error('Failed to resize')
          
          const duration = calculateDuration(timeBlock.start_time, timeBlock.end_time)
          const height = Math.max((duration / 15) * 16, 32)
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
  
  // Calculate position and height
  const topPosition = ((startMinutes - 5 * 60) / 15) * 16 // 5 AM start
  const height = Math.max((duration / 15) * 16, 32) // Min 32px height
  
  // Get display info
  const primaryTitle = timeBlock.schedule_items[0]?.title || 'Time Block'
  const itemCount = timeBlock.schedule_items.length
  const completedCount = timeBlock.schedule_items.filter(item => item.completed_at).length
  
  // Determine color based on completion or type
  const getBlockColor = () => {
    if (completedCount === itemCount && itemCount > 0) {
      return 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700'
    }
    if (isSelected) {
      return 'bg-blue-50 dark:bg-blue-900/30 border-blue-400 dark:border-blue-600 ring-2 ring-blue-400/50'
    }
    if (isOver) {
      return 'bg-blue-50 dark:bg-blue-900/20 border-blue-400 dark:border-blue-600'
    }
    return 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
  }
  
  return (
    <motion.div
      ref={blockRef}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ 
        opacity: isDragging ? 0.5 : 1, 
        scale: isDragging ? 0.98 : 1
      }}
      onClick={onClick}
      className={cn(
        "absolute left-1 right-1 rounded-lg border transition-all cursor-pointer group",
        getBlockColor()
      )}
      style={{
        top: `${topPosition}px`,
        height: `${height}px`,
        minHeight: '32px'
      }}
    >
      {/* Drag handle - visible grip icon */}
      <div className="absolute left-1 top-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <Bars3Icon className="h-4 w-4 text-gray-400 dark:text-gray-500" />
      </div>
      
      {/* Content */}
      <div className="h-full px-3 py-1.5 flex items-center">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {primaryTitle}
          </p>
          <div className="flex items-center gap-2">
            {itemCount > 1 && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {completedCount > 0 && `${completedCount}/`}{itemCount} items
              </p>
            )}
            {timeBlock.assigned_user && (
              <p className="text-xs text-blue-600 dark:text-blue-400 truncate">
                • {timeBlock.assigned_user.full_name || timeBlock.assigned_user.email?.split('@')[0]}
              </p>
            )}
          </div>
        </div>
        
        {/* Time - only show if there's room */}
        {height > 48 && (
          <div className="text-xs text-gray-400 dark:text-gray-500 ml-2">
            {timeBlock.start_time.slice(0, 5)}
          </div>
        )}
      </div>
      
      {/* Resize handle - bottom border on hover */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-1 opacity-0 group-hover:opacity-100 cursor-ns-resize hover:bg-blue-400/20"
        onMouseDown={handleResizeStart}
      />
    </motion.div>
  )
}