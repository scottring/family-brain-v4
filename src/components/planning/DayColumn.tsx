'use client'

import { useState } from 'react'
import { useDrop } from 'react-dnd'
import { PlusIcon } from '@heroicons/react/24/outline'
import { ScheduleWithTimeBlocks, TemplateWithSteps } from '@/lib/types/database'
import { TimeBlock } from './TimeBlock'
import { TimeSlotDropZone } from './TimeSlotDropZone'
import { useScheduleStore } from '@/lib/stores/useScheduleStore'
import { useAppStore } from '@/lib/stores/useAppStore'
import { scheduleService } from '@/lib/services/ScheduleService'
import { templateService } from '@/lib/services/TemplateService'
import { timeToMinutes, minutesToTime } from '@/lib/utils'

interface DayColumnProps {
  date: string
  schedule: ScheduleWithTimeBlocks | null
  timeSlots: string[]
}

interface DropResult {
  timeSlot: string
  date: string
}

export function DayColumn({ date, schedule, timeSlots }: DayColumnProps) {
  const { currentFamilyId } = useAppStore()
  const { setWeekSchedule } = useScheduleStore()
  const [isDragOver, setIsDragOver] = useState(false)

  const [{ isOver, canDrop }, drop] = useDrop({
    accept: 'template',
    drop: (item: { template: TemplateWithSteps }, monitor): DropResult | undefined => {
      const targetElement = monitor.getDropResult<DropResult>()
      if (targetElement) {
        return targetElement
      }
      
      // Default drop behavior - add to first available slot
      return {
        timeSlot: timeSlots[0],
        date
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop()
    }),
    hover: (item, monitor) => {
      setIsDragOver(monitor.isOver())
    },
  })

  const createTimeBlockFromTemplate = async (
    template: TemplateWithSteps,
    startTimeSlot: string
  ) => {
    if (!currentFamilyId || !schedule) {
      console.warn('Cannot create time block: missing familyId or schedule', { currentFamilyId, schedule })
      return
    }

    console.log('Creating time block from template:', { template, startTimeSlot, date, schedule: schedule.id })

    try {
      // Calculate end time (assume 1 hour duration by default)
      const startMinutes = timeToMinutes(startTimeSlot)
      const endMinutes = startMinutes + 60
      const endTime = minutesToTime(endMinutes)

      console.log('Time calculation:', { startTimeSlot, startMinutes, endTime })

      // Create time block
      const timeBlock = await scheduleService.createTimeBlock(
        schedule.id,
        startTimeSlot,
        endTime
      )

      console.log('Created time block:', timeBlock)

      // Create schedule item from template
      const scheduleItem = await scheduleService.createScheduleItem(timeBlock.id, {
        title: template.title,
        description: template.description,
        item_type: 'template_ref',
        template_id: template.id,
        order_position: 0,
        metadata: {}
      })

      console.log('Created schedule item:', scheduleItem)

      // Create template instance if it's a procedure template
      if (template.template_steps.length > 0) {
        const templateInstance = await templateService.createTemplateInstance(
          template.id,
          scheduleItem.id
        )
        console.log('Created template instance:', templateInstance)
      }

      // Reload the schedule
      const updatedSchedule = await scheduleService.getScheduleForDate(currentFamilyId, date)
      if (updatedSchedule) {
        setWeekSchedule(date, updatedSchedule)
        console.log('Updated schedule:', updatedSchedule)
      }
    } catch (error) {
      console.error('Error creating time block from template:', error)
    }
  }

  const handleQuickAdd = async (timeSlot: string) => {
    if (!currentFamilyId || !schedule) {
      console.warn('Cannot create quick item: missing familyId or schedule', { currentFamilyId, schedule })
      return
    }

    console.log('Creating quick add item:', { timeSlot, date, schedule: schedule.id })

    try {
      const startMinutes = timeToMinutes(timeSlot)
      const endMinutes = startMinutes + 30 // 30 minute default
      const endTime = minutesToTime(endMinutes)

      console.log('Quick add time calculation:', { timeSlot, startMinutes, endTime })

      const timeBlock = await scheduleService.createTimeBlock(
        schedule.id,
        timeSlot,
        endTime
      )

      console.log('Created quick add time block:', timeBlock)

      const scheduleItem = await scheduleService.createScheduleItem(timeBlock.id, {
        title: 'New Item',
        item_type: 'simple',
        order_position: 0
      })

      console.log('Created quick add schedule item:', scheduleItem)

      // Reload the schedule
      const updatedSchedule = await scheduleService.getScheduleForDate(currentFamilyId, date)
      if (updatedSchedule) {
        setWeekSchedule(date, updatedSchedule)
        console.log('Updated schedule after quick add:', updatedSchedule)
      }
    } catch (error) {
      console.error('Error creating quick item:', error)
    }
  }

  return (
    <div
      ref={drop}
      className={`relative min-h-full ${
        isOver && canDrop ? 'bg-blue-50 dark:bg-blue-900/10' : ''
      }`}
    >
      {/* Time Grid Background */}
      <div className="absolute inset-0">
        {timeSlots.map((timeSlot, index) => (
          <TimeSlotDropZone
            key={timeSlot}
            timeSlot={timeSlot}
            date={date}
            isHour={timeSlot.endsWith(':00:00')}
            onDrop={(template) => createTimeBlockFromTemplate(template, timeSlot)}
            onQuickAdd={() => handleQuickAdd(timeSlot)}
          />
        ))}
      </div>

      {/* Time Blocks */}
      <div className="relative z-10">
        {schedule?.time_blocks?.map((timeBlock) => (
          <TimeBlock
            key={timeBlock.id}
            timeBlock={timeBlock}
            date={date}
          />
        ))}
      </div>

      {/* Empty State */}
      {!schedule?.time_blocks?.length && (
        <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
          <div className="text-center">
            <div className="text-gray-400 dark:text-gray-500 mb-2">
              <PlusIcon className="h-8 w-8 mx-auto" />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Drag templates here or click to add
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

