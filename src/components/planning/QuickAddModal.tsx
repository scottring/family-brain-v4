'use client'

import { Fragment, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon, CalendarDaysIcon, ClockIcon } from '@heroicons/react/24/outline'
import { format } from 'date-fns'
import { useAppStore } from '@/lib/stores/useAppStore'
import { useScheduleStore } from '@/lib/stores/useScheduleStore'
import { scheduleService } from '@/lib/services/ScheduleService'
import { getTimeSlots } from '@/lib/utils'

interface QuickAddModalProps {
  isOpen: boolean
  onClose: () => void
}

export function QuickAddModal({ isOpen, onClose }: QuickAddModalProps) {
  const { currentFamilyId } = useAppStore()
  const { currentDate, setWeekSchedule } = useScheduleStore()
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: currentDate,
    startTime: '09:00:00',
    endTime: '10:00:00'
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const timeSlots = getTimeSlots(5, 23)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentFamilyId || isSubmitting) return

    setIsSubmitting(true)
    try {
      // Get or create schedule for the date
      const schedule = await scheduleService.getOrCreateScheduleForDate(
        currentFamilyId,
        formData.date
      )

      // Create time block
      const timeBlock = await scheduleService.createTimeBlock(
        schedule.id,
        formData.startTime,
        formData.endTime
      )

      // Create schedule item
      await scheduleService.createScheduleItem(timeBlock.id, {
        title: formData.title,
        description: formData.description || undefined,
        item_type: 'simple',
        order_position: 0
      })

      // Reload the schedule
      const updatedSchedule = await scheduleService.getScheduleByDate(
        currentFamilyId,
        formData.date
      )
      if (updatedSchedule) {
        setWeekSchedule(formData.date, updatedSchedule)
      }

      // Reset form and close modal
      setFormData({
        title: '',
        description: '',
        date: currentDate,
        startTime: '09:00:00',
        endTime: '10:00:00'
      })
      onClose()
    } catch (error) {
      console.error('Error creating quick item:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleStartTimeChange = (startTime: string) => {
    setFormData(prev => {
      // Auto-adjust end time to be 1 hour after start time
      const startIndex = timeSlots.indexOf(startTime)
      const endIndex = Math.min(startIndex + 4, timeSlots.length - 1) // +4 = +1 hour
      const endTime = timeSlots[endIndex]
      
      return {
        ...prev,
        startTime,
        endTime
      }
    })
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
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900 dark:text-white"
                  >
                    Quick Add Item
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Enter item title"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Description */}
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

                  {/* Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <CalendarDaysIcon className="inline h-4 w-4 mr-1" />
                      Date
                    </label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Time Range */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <ClockIcon className="inline h-4 w-4 mr-1" />
                        Start Time
                      </label>
                      <select
                        value={formData.startTime}
                        onChange={(e) => handleStartTimeChange(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {timeSlots.slice(0, -4).map(time => (
                          <option key={time} value={time}>
                            {format(new Date(`2000-01-01T${time}`), 'h:mm a')}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        End Time
                      </label>
                      <select
                        value={formData.endTime}
                        onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {timeSlots.filter(time => time > formData.startTime).map(time => (
                          <option key={time} value={time}>
                            {format(new Date(`2000-01-01T${time}`), 'h:mm a')}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end space-x-3 pt-4">
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
                      {isSubmitting ? 'Creating...' : 'Create Item'}
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