'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircleIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  XMarkIcon,
  UserIcon
} from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'

interface Toast {
  id: string
  type: 'success' | 'info' | 'warning' | 'error'
  title: string
  message?: string
  duration?: number
  actions?: Array<{
    label: string
    onClick: () => void
    variant?: 'primary' | 'secondary'
  }>
}

interface ToastStore {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
}

// Simple toast store (in a real app, you might use Zustand)
let toastStore: ToastStore = {
  toasts: [],
  addToast: () => {},
  removeToast: () => {}
}

const subscribers = new Set<() => void>()

const notifySubscribers = () => {
  subscribers.forEach(callback => callback())
}

export const toast = {
  success: (title: string, message?: string, options?: Partial<Toast>) => {
    toastStore.addToast({ type: 'success', title, message, duration: 5000, ...options })
  },
  info: (title: string, message?: string, options?: Partial<Toast>) => {
    toastStore.addToast({ type: 'info', title, message, duration: 5000, ...options })
  },
  warning: (title: string, message?: string, options?: Partial<Toast>) => {
    toastStore.addToast({ type: 'warning', title, message, duration: 7000, ...options })
  },
  error: (title: string, message?: string, options?: Partial<Toast>) => {
    toastStore.addToast({ type: 'error', title, message, duration: 10000, ...options })
  },
  familyMemberAction: (memberName: string, action: string, itemTitle: string) => {
    toast.info(
      'Family Update',
      `${memberName} ${action} "${itemTitle}"`,
      {
        duration: 4000,
        actions: [
          {
            label: 'View',
            onClick: () => {
              // Navigate to relevant view
              console.log('Navigate to item')
            }
          }
        ]
      }
    )
  }
}

export function ToastNotifications() {
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    // Initialize toast store
    toastStore = {
      toasts: [],
      addToast: (toastData) => {
        const newToast: Toast = {
          id: Math.random().toString(36).substring(2),
          duration: 5000,
          ...toastData
        }
        toastStore.toasts.push(newToast)
        setToasts([...toastStore.toasts])
        
        // Auto remove after duration
        if (newToast.duration && newToast.duration > 0) {
          setTimeout(() => {
            toastStore.removeToast(newToast.id)
          }, newToast.duration)
        }
      },
      removeToast: (id) => {
        toastStore.toasts = toastStore.toasts.filter(t => t.id !== id)
        setToasts([...toastStore.toasts])
        notifySubscribers()
      }
    }

    const handleUpdate = () => {
      setToasts([...toastStore.toasts])
    }

    subscribers.add(handleUpdate)
    
    return () => {
      subscribers.delete(handleUpdate)
    }
  }, [])

  const getToastIcon = (type: Toast['type']) => {
    switch (type) {
      case 'success':
        return CheckCircleIcon
      case 'info':
        return InformationCircleIcon
      case 'warning':
        return ExclamationTriangleIcon
      case 'error':
        return XCircleIcon
    }
  }

  const getToastColors = (type: Toast['type']) => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-50 dark:bg-green-900/50',
          border: 'border-green-200 dark:border-green-800',
          icon: 'text-green-600 dark:text-green-400',
          title: 'text-green-800 dark:text-green-200',
          message: 'text-green-700 dark:text-green-300'
        }
      case 'info':
        return {
          bg: 'bg-blue-50 dark:bg-blue-900/50',
          border: 'border-blue-200 dark:border-blue-800',
          icon: 'text-blue-600 dark:text-blue-400',
          title: 'text-blue-800 dark:text-blue-200',
          message: 'text-blue-700 dark:text-blue-300'
        }
      case 'warning':
        return {
          bg: 'bg-yellow-50 dark:bg-yellow-900/50',
          border: 'border-yellow-200 dark:border-yellow-800',
          icon: 'text-yellow-600 dark:text-yellow-400',
          title: 'text-yellow-800 dark:text-yellow-200',
          message: 'text-yellow-700 dark:text-yellow-300'
        }
      case 'error':
        return {
          bg: 'bg-red-50 dark:bg-red-900/50',
          border: 'border-red-200 dark:border-red-800',
          icon: 'text-red-600 dark:text-red-400',
          title: 'text-red-800 dark:text-red-200',
          message: 'text-red-700 dark:text-red-300'
        }
    }
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 w-80 max-w-sm">
      <AnimatePresence>
        {toasts.map((toast) => {
          const Icon = getToastIcon(toast.type)
          const colors = getToastColors(toast.type)
          
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 300, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 300, scale: 0.8 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className={cn(
                'rounded-lg border shadow-lg p-4',
                colors.bg,
                colors.border
              )}
            >
              <div className="flex items-start">
                <Icon className={cn('h-5 w-5 mt-0.5 mr-3 flex-shrink-0', colors.icon)} />
                
                <div className="flex-1 min-w-0">
                  <h4 className={cn('text-sm font-semibold mb-1', colors.title)}>
                    {toast.title}
                  </h4>
                  
                  {toast.message && (
                    <p className={cn('text-sm mb-2', colors.message)}>
                      {toast.message}
                    </p>
                  )}
                  
                  {toast.actions && toast.actions.length > 0 && (
                    <div className="flex items-center space-x-2 mt-3">
                      {toast.actions.map((action, index) => (
                        <button
                          key={index}
                          onClick={action.onClick}
                          className={cn(
                            'px-3 py-1 text-xs font-medium rounded-md transition-colors',
                            action.variant === 'primary'
                              ? 'bg-blue-600 text-white hover:bg-blue-700'
                              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                          )}
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                <button
                  onClick={() => toastStore.removeToast(toast.id)}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-md transition-colors ml-2"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}

// Hook to use toasts in components
export function useToast() {
  const [, forceUpdate] = useState({})
  
  useEffect(() => {
    const handleUpdate = () => forceUpdate({})
    subscribers.add(handleUpdate)
    return () => subscribers.delete(handleUpdate)
  }, [])
  
  return {
    toasts: toastStore.toasts,
    toast
  }
}