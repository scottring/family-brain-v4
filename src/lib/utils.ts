import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { startOfWeek, endOfWeek, eachDayOfInterval, format } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Date utilities
export function getWeekRange(date: Date) {
  const start = startOfWeek(date, { weekStartsOn: 0 }) // Sunday
  const end = endOfWeek(date, { weekStartsOn: 0 }) // Saturday
  const dates = eachDayOfInterval({ start, end })
  
  return { start, end, dates }
}

export function formatDisplayDate(date: Date): string {
  return format(date, 'MMM d')
}

// Time utilities
export function timeToMinutes(timeString: string): number {
  const [hours, minutes] = timeString.split(':').map(Number)
  return hours * 60 + minutes
}

export function minutesToTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`
}

export function getTimeSlots(startHour: number = 5, endHour: number = 23): string[] {
  const slots = []
  const increment = 15 // 15-minute increments
  
  for (let hour = startHour; hour <= endHour; hour++) {
    for (let minute = 0; minute < 60; minute += increment) {
      // Don't add slot if it would go past end hour
      if (hour === endHour && minute > 0) break
      
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`
      slots.push(timeString)
    }
  }
  
  return slots
}

export function getCurrentTimeSlot(): string {
  const now = new Date()
  const hours = now.getHours()
  const minutes = now.getMinutes()
  
  // Round down to nearest 15-minute increment
  const roundedMinutes = Math.floor(minutes / 15) * 15
  
  return `${hours.toString().padStart(2, '0')}:${roundedMinutes.toString().padStart(2, '0')}:00`
}

export function isCurrentTimeSlot(timeSlot: string): boolean {
  return getCurrentTimeSlot() === timeSlot
}

export function formatDisplayTime(timeString: string): string {
  const [hours, minutes] = timeString.split(':').map(Number)
  const date = new Date()
  date.setHours(hours, minutes, 0, 0)
  
  return format(date, 'h a')
}

export function formatTimeRange(startTime: string, endTime: string): string {
  return `${formatDisplayTime(startTime)} - ${formatDisplayTime(endTime)}`
}

export function calculateDuration(startTime: string, endTime: string): number {
  // Returns duration in minutes
  return timeToMinutes(endTime) - timeToMinutes(startTime)
}

// Time status utilities for execution view
export function getTimeStatus(date: string, startTime: string, endTime: string): 'past' | 'current' | 'future' {
  const now = new Date()
  const today = now.toISOString().split('T')[0]
  const currentTime = now.toTimeString().split(' ')[0].slice(0, 5) // HH:MM format
  
  // If not today, check if date is in past or future
  if (date !== today) {
    return new Date(date) < now ? 'past' : 'future'
  }
  
  // If today, check against time
  const currentMinutes = timeToMinutes(currentTime)
  const startMinutes = timeToMinutes(startTime)
  const endMinutes = timeToMinutes(endTime)
  
  if (currentMinutes < startMinutes) return 'future'
  if (currentMinutes >= startMinutes && currentMinutes <= endMinutes) return 'current'
  return 'past'
}

export function getTimeRemaining(endTime: string): { minutes: number, seconds: number } {
  const now = new Date()
  const currentMinutes = timeToMinutes(now.toTimeString().split(' ')[0].slice(0, 5))
  const endMinutes = timeToMinutes(endTime)
  
  const remaining = Math.max(0, endMinutes - currentMinutes)
  const currentSeconds = now.getSeconds()
  
  return {
    minutes: remaining,
    seconds: remaining > 0 ? (60 - currentSeconds) : 0
  }
}

export function isWithinTimeRange(currentTime: string, startTime: string, endTime: string): boolean {
  const current = timeToMinutes(currentTime)
  const start = timeToMinutes(startTime)
  const end = timeToMinutes(endTime)
  
  return current >= start && current <= end
}
