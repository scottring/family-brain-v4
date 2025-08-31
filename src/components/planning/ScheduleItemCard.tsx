'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useDrag } from 'react-dnd'
import {
  CheckCircleIcon,
  DocumentTextIcon,
  ListBulletIcon,
  UserIcon,
  XMarkIcon,
  PencilIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid'
import { ScheduleItemWithTemplate } from '@/lib/types/database'
import { useAppStore } from '@/lib/stores/useAppStore'
import { useScheduleStore } from '@/lib/stores/useScheduleStore'
import { useFamilyPresenceStore } from '@/lib/stores/useFamilyPresenceStore'
import { scheduleService } from '@/lib/services/ScheduleService'
import { optimisticToggleScheduleItem } from '@/lib/services/OptimisticUpdateService'
import { cn } from '@/lib/utils'

interface ScheduleItemCardProps {
  item: ScheduleItemWithTemplate
  timeBlockId: string
  isExpanded: boolean
  isCompact: boolean
  isGridView?: boolean
}

export function ScheduleItemCard({ 
  item, 
  timeBlockId, 
  isExpanded, 
  isCompact,
  isGridView = false 
}: ScheduleItemCardProps) {
  const { user } = useAppStore()
  const { updateScheduleItem, setArtifactPanelItemId, selectedItemId, setSelectedItemId } = useScheduleStore()
  const { getEditingUsers, startEditing, stopEditing } = useFamilyPresenceStore()
  const [isToggling, setIsToggling] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const dragRef = useRef<HTMLDivElement>(null)

  // Set up drag functionality
  const [{ isDragging }, drag] = useDrag({
    type: 'scheduleItem',
    item: {
      scheduleItem: item,
      sourceTimeBlockId: timeBlockId
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    }),
    canDrag: isGridView // Only allow dragging in grid view
  })

  // Connect drag ref
  useEffect(() => {
    if (isGridView && dragRef.current) {
      drag(dragRef.current)
    }
  }, [drag, isGridView])
  
  const editingUsers = getEditingUsers(item.id)
  const isBeingEdited = editingUsers.length > 0
  const isEditedByOthers = editingUsers.some(editor => editor.user_id !== user?.id)
  const isSelected = selectedItemId === item.id

  const isCompleted = !!item.completed_at
  const hasSteps = (item.template?.template_steps?.length ?? 0) > 0

  const handleToggleComplete = async () => {
    if (!user || isToggling) return
    
    setIsToggling(true)
    
    // Create optimistic update data
    const optimisticItem = {
      ...item,
      completed_at: isCompleted ? null : new Date().toISOString(),
      completed_by: isCompleted ? null : user.id
    }
    
    // Apply optimistic update immediately
    updateScheduleItem(item.id, optimisticItem)
    
    try {
      // Perform the actual update with rollback capability
      await optimisticToggleScheduleItem(
        item.id,
        item, // original data for rollback
        optimisticItem,
        // The actual API call
        isCompleted 
          ? scheduleService.uncompleteScheduleItem(item.id)
          : scheduleService.completeScheduleItem(item.id, user.id),
        // Rollback handler
        (rollbackData) => {
          updateScheduleItem(item.id, rollbackData)
        }
      )
    } catch (error) {
      console.error('Error toggling item completion:', error)
      // Error handling is done by optimistic update service
    } finally {
      setIsToggling(false)
    }
  }
  
  const handleItemClick = () => {
    if (!user) return
    
    if (isSelected) {
      setSelectedItemId(null)
      stopEditing(user.id, item.id)
    } else {
      setSelectedItemId(item.id)
      startEditing(user.id, 'schedule_item', item.id, item.title)
    }
  }
  
  // Clean up editing state when component unmounts or selection changes
  useEffect(() => {
    return () => {
      if (user && isSelected) {
        stopEditing(user.id, item.id)
      }
    }
  }, [isSelected, user?.id, item.id])

  const handleOpenArtifactPanel = () => {
    if (hasSteps) {
      setArtifactPanelItemId(item.id)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${item.title}"?`)) return
    
    try {
      await scheduleService.deleteScheduleItem(item.id)
      // Item will be removed on next data refresh
      // TODO: Add removeScheduleItem to store for immediate removal
    } catch (error) {
      console.error('Error deleting item:', error)
      alert('Failed to delete item. Please try again.')
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

  // Simplified grid view for time slots
  if (isGridView) {
    return (
      <motion.div
        ref={dragRef}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ 
          opacity: isDragging ? 0.5 : 1, 
          scale: isDragging ? 0.95 : 1 
        }}
        whileHover={{ scale: isDragging ? 0.95 : 1.02 }}
        className={cn(
          "group relative px-2 py-1.5 rounded-md cursor-move transition-all",
          "hover:shadow-sm",
          isDragging && "opacity-50",
          isCompleted
            ? "bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-800"
            : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-600"
        )}
        onClick={!isDragging ? handleItemClick : undefined}
      >
        <div className="flex items-center gap-2">
          {/* Checkbox */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleToggleComplete()
            }}
            className="flex-shrink-0"
          >
            {isCompleted ? (
              <CheckCircleIconSolid className="h-4 w-4 text-green-600 dark:text-green-400" />
            ) : (
              <CheckCircleIcon className="h-4 w-4 text-gray-400 hover:text-green-600" />
            )}
          </button>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className={cn(
              "text-sm font-medium truncate",
              isCompleted
                ? "text-green-700 dark:text-green-300 line-through"
                : "text-gray-900 dark:text-white"
            )}>
              {item.title}
            </p>
          </div>

          {/* Actions on hover */}
          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
            {hasSteps && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleOpenArtifactPanel()
                }}
                className="p-0.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                title="View steps"
              >
                <ListBulletIcon className="h-3.5 w-3.5 text-gray-500" />
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleDelete()
              }}
              className="p-0.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
              title="Delete"
            >
              <XMarkIcon className="h-3.5 w-3.5 text-gray-500 hover:text-red-600" />
            </button>
          </div>
        </div>
      </motion.div>
    )
  }

  if (isCompact) {
    return (
      <div className="flex items-center space-x-1 opacity-60">
        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
        <span className="text-xs text-gray-600 dark:text-gray-300 truncate">
          {item.title}
        </span>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleItemClick}
      className={cn(
        'group flex items-center space-x-2 p-2 rounded-md border transition-all cursor-pointer relative',
        isCompleted
          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
          : isSelected
          ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-600 ring-1 ring-blue-200 dark:ring-blue-800'
          : isEditedByOthers
          ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-300 dark:border-orange-600 ring-1 ring-orange-200 dark:ring-orange-800'
          : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
      )}
    >
      {/* Editing indicator pulse effect */}
      {isEditedByOthers && (
        <motion.div
          className="absolute inset-0 rounded-md bg-orange-200 dark:bg-orange-800"
          animate={{ opacity: [0.3, 0.1, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
      {/* Completion Toggle */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          handleToggleComplete()
        }}
        disabled={isToggling}
        className="flex-shrink-0 p-0.5 rounded-full hover:bg-white dark:hover:bg-gray-700 transition-colors z-10"
      >
        {isCompleted ? (
          <CheckCircleIconSolid className="h-4 w-4 text-green-600 dark:text-green-400" />
        ) : (
          <CheckCircleIcon className="h-4 w-4 text-gray-400 hover:text-green-600 dark:hover:text-green-400" />
        )}
      </button>

      {/* Item Content */}
      <div className="flex-1 min-w-0 flex items-center space-x-2">
        <ItemIcon className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
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
            <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">
              {item.description}
            </p>
          )}
        </div>
      </div>

      {/* Actions and Status */}
      <div className="flex items-center space-x-1 z-10">
        {/* Editing status indicators */}
        {isSelected && (
          <div className="flex items-center space-x-1 px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/50 rounded text-xs font-medium text-blue-700 dark:text-blue-300">
            <PencilIcon className="h-3 w-3" />
            <span>Editing</span>
          </div>
        )}
        
        {isEditedByOthers && (
          <div className="flex items-center space-x-1 px-1.5 py-0.5 bg-orange-100 dark:bg-orange-900/50 rounded text-xs font-medium text-orange-700 dark:text-orange-300">
            <ExclamationTriangleIcon className="h-3 w-3" />
            <span title={`Being edited by: ${editingUsers.map(u => u.user_name).join(', ')}`}>
              {editingUsers.length} editing
            </span>
          </div>
        )}
        
        <div className={cn(
          'flex items-center space-x-1 transition-opacity',
          isHovered || isSelected ? 'opacity-100' : 'opacity-0'
        )}>
          {hasSteps && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleOpenArtifactPanel()
              }}
              className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded transition-colors"
              title="Open procedure"
            >
              <ListBulletIcon className="h-3.5 w-3.5" />
            </button>
          )}
          
          {item.completed_by && (
            <div className="flex items-center space-x-1">
              <UserIcon className="h-3 w-3 text-gray-500 dark:text-gray-400" />
              <span className="text-xs text-gray-600 dark:text-gray-300">
                {item.completed_by.substring(0, 8)}
              </span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}