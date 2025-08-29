'use client'

import { useRef } from 'react'
import { useDrop } from 'react-dnd'
import { PlusIcon } from '@heroicons/react/24/outline'
import { TemplateWithSteps, TimeBlockWithItems } from '@/lib/types/database'

interface TimeSlotDropZoneProps {
  timeSlot: string
  date: string
  isHour: boolean
  onDrop: (template: TemplateWithSteps) => void
  onDropTimeBlock?: (timeBlock: TimeBlockWithItems, fromDate: string) => void
  onQuickAdd: () => void
}

export function TimeSlotDropZone({ 
  timeSlot, 
  date, 
  isHour, 
  onDrop,
  onDropTimeBlock,
  onQuickAdd 
}: TimeSlotDropZoneProps) {
  const ref = useRef<HTMLDivElement>(null)
  
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: ['template', 'timeBlock'],
    drop: (item: any) => {
      if (item.template) {
        console.log('Template dropped on time slot:', { timeSlot, date, template: item.template })
        onDrop(item.template)
      } else if (item.timeBlock && onDropTimeBlock) {
        console.log('TimeBlock dropped on time slot:', { timeSlot, date, timeBlock: item.timeBlock })
        onDropTimeBlock(item.timeBlock, item.date)
      }
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
      canDrop: !!monitor.canDrop(),
    }),
  })

  drop(ref)

  return (
    <div
      ref={ref}
      className={`
        group relative h-4 border-b cursor-pointer
        ${isHour ? 'border-gray-300 dark:border-gray-500' : 'border-gray-200 dark:border-gray-600'}
        ${isOver && canDrop ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
        hover:bg-gray-50 dark:hover:bg-gray-800/50
      `}
      onDoubleClick={(e) => {
        e.stopPropagation()
        console.log('Time slot double-clicked:', { timeSlot, date })
        onQuickAdd()
      }}
    >
      {/* Plus button - shows on hover */}
      <button
        className={`
          absolute right-2 top-1/2 -translate-y-1/2
          opacity-0 group-hover:opacity-100 transition-opacity
          p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700
          ${isOver && canDrop ? 'opacity-100' : ''}
        `}
        onClick={(e) => {
          e.stopPropagation()
          console.log('Plus button clicked:', { timeSlot, date })
          onQuickAdd()
        }}
        title="Click to add new item"
      >
        <PlusIcon className="h-3 w-3 text-gray-400 dark:text-gray-500" />
      </button>
      
      {/* Hint text - shows on hover when not dragging */}
      {!isOver && (
        <div className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-50 transition-opacity pointer-events-none">
          <span className="text-xs text-gray-400 dark:text-gray-500 italic">Double-click to add</span>
        </div>
      )}
      
      {/* Drop indicator */}
      {isOver && canDrop && (
        <>
          <div className="absolute inset-x-0 top-0 h-0.5 bg-blue-500 animate-pulse" />
          <div className="absolute inset-0 bg-blue-500/10 pointer-events-none" />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-xs text-blue-600 dark:text-blue-400 font-medium pointer-events-none">
            Drop here
          </div>
        </>
      )}
    </div>
  )
}