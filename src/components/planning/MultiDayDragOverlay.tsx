'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import { CalendarDaysIcon } from '@heroicons/react/24/outline'

interface MultiDayDragOverlayProps {
  selectedDates: Date[]
  templateTitle: string
  isVisible: boolean
}

export function MultiDayDragOverlay({ 
  selectedDates, 
  templateTitle, 
  isVisible 
}: MultiDayDragOverlayProps) {
  if (!isVisible || selectedDates.length === 0) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none"
      >
        <div className="bg-blue-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3">
          <CalendarDaysIcon className="h-5 w-5" />
          <div>
            <p className="font-semibold">{templateTitle}</p>
            <p className="text-sm opacity-90">
              Adding to {selectedDates.length} day{selectedDates.length > 1 ? 's' : ''}: {' '}
              {selectedDates.map(d => format(d, 'EEE')).join(', ')}
            </p>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}