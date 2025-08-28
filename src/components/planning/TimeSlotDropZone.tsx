'use client'

import { useRef } from 'react'
import { useDrop } from 'react-dnd'
import { PlusIcon } from '@heroicons/react/24/outline'
import { TemplateWithSteps } from '@/lib/types/database'

interface TimeSlotDropZoneProps {
  timeSlot: string
  date: string
  isHour: boolean
  onDrop: (template: TemplateWithSteps) => void
  onQuickAdd: () => void
}

export function TimeSlotDropZone({ 
  timeSlot, 
  date, 
  isHour, 
  onDrop, 
  onQuickAdd 
}: TimeSlotDropZoneProps) {
  const ref = useRef<HTMLDivElement>(null)
  
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: 'template',
    drop: (item: { template: TemplateWithSteps }) => {
      console.log('Template dropped on time slot:', { timeSlot, date, template: item.template })
      onDrop(item.template)
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
      onClick={(e) => {
        e.stopPropagation()
        console.log('Time slot clicked:', { timeSlot, date })
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
      >
        <PlusIcon className="h-3 w-3 text-gray-400 dark:text-gray-500" />
      </button>
      
      {/* Drop indicator */}
      {isOver && canDrop && (
        <div className="absolute inset-x-0 top-0 h-0.5 bg-blue-500 animate-pulse" />
      )}
    </div>
  )
}