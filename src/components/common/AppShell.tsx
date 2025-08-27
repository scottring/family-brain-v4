'use client'

import { ReactNode, useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CalendarDaysIcon,
  ClockIcon,
  BookOpenIcon,
  UserGroupIcon,
  Cog6ToothIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import {
  CalendarDaysIcon as CalendarDaysIconSolid,
  ClockIcon as ClockIconSolid,
  BookOpenIcon as BookOpenIconSolid
} from '@heroicons/react/24/solid'
import { useAppStore } from '@/lib/stores/useAppStore'
import { ArtifactPanel } from './ArtifactPanel'
import { ToastNotifications } from './ToastNotifications'
import { cn } from '@/lib/utils'

interface AppShellProps {
  children: ReactNode
}

interface NavItem {
  id: string
  label: string
  href: string
  icon: any
  iconSolid: any
  description: string
}

const navItems: NavItem[] = [
  {
    id: 'today',
    label: 'Today',
    href: '/today',
    icon: ClockIcon,
    iconSolid: ClockIconSolid,
    description: 'Execute your current schedule'
  },
  {
    id: 'planning',
    label: 'Planning',
    href: '/planning',
    icon: CalendarDaysIcon,
    iconSolid: CalendarDaysIconSolid,
    description: 'Plan your week with drag & drop'
  },
  {
    id: 'sops',
    label: 'SOPs',
    href: '/sops',
    icon: BookOpenIcon,
    iconSolid: BookOpenIconSolid,
    description: 'Quick access to procedures'
  }
]

export function AppShell({ children }: AppShellProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { currentView, setCurrentView, isMobile, setIsMobile, user } = useAppStore()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Detect mobile vs desktop
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [setIsMobile])

  // Update current view based on pathname
  useEffect(() => {
    if (pathname.startsWith('/today')) {
      setCurrentView('today')
    } else if (pathname.startsWith('/planning')) {
      setCurrentView('planning')
    } else if (pathname.startsWith('/sops')) {
      setCurrentView('sops')
    }
  }, [pathname, setCurrentView])

  const handleNavClick = (item: NavItem) => {
    setCurrentView(item.id as any)
    setMobileMenuOpen(false)
    router.push(item.href)
  }

  const isActiveRoute = (href: string) => {
    return pathname.startsWith(href)
  }

  if (!user) {
    // Show auth pages without shell
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-lg">
          <div className="flex h-full flex-col">
            {/* Logo/Header */}
            <div className="flex h-16 items-center px-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <CalendarDaysIconSolid className="h-8 w-8 text-blue-600" />
                <span className="ml-3 text-xl font-semibold text-gray-900 dark:text-white">
                  Itineraries
                </span>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-6 space-y-2">
              {navItems.map((item) => {
                const Icon = isActiveRoute(item.href) ? item.iconSolid : item.icon
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item)}
                    className={cn(
                      'w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                      isActiveRoute(item.href)
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white'
                    )}
                  >
                    <Icon className="h-5 w-5 mr-3" />
                    <div className="text-left">
                      <div>{item.label}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {item.description}
                      </div>
                    </div>
                  </button>
                )
              })}
            </nav>

            {/* User section */}
            <div className="border-t border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
                    <span className="text-white font-medium">
                      {user.full_name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {user.full_name || 'User'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {user.email}
                  </p>
                </div>
                <Link
                  href="/settings"
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Cog6ToothIcon className="h-5 w-5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Header */}
      {isMobile && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between h-16 px-4">
            <div className="flex items-center">
              <CalendarDaysIconSolid className="h-6 w-6 text-blue-600" />
              <span className="ml-2 text-lg font-semibold text-gray-900 dark:text-white">
                Itineraries
              </span>
            </div>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              {mobileMenuOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      )}

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobile && mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="absolute right-0 top-0 h-full w-72 bg-white dark:bg-gray-800 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex h-full flex-col">
                <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">
                    Menu
                  </span>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <nav className="flex-1 px-4 py-6 space-y-2">
                  {navItems.map((item) => {
                    const Icon = isActiveRoute(item.href) ? item.iconSolid : item.icon
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleNavClick(item)}
                        className={cn(
                          'w-full flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors',
                          isActiveRoute(item.href)
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white'
                        )}
                      >
                        <Icon className="h-6 w-6 mr-3" />
                        <div className="text-left">
                          <div>{item.label}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {item.description}
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </nav>

                <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
                        <span className="text-white font-medium">
                          {user.full_name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {user.full_name || 'User'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {user.email}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className={cn(
        'transition-all duration-300',
        isMobile ? 'pt-16' : 'pl-64'
      )}>
        <main className="min-h-screen">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-3">
            {navItems.map((item) => {
              const Icon = isActiveRoute(item.href) ? item.iconSolid : item.icon
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item)}
                  className={cn(
                    'flex flex-col items-center py-2 px-3 text-xs',
                    isActiveRoute(item.href)
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                  )}
                >
                  <Icon className="h-6 w-6 mb-1" />
                  <span className="font-medium">{item.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Artifact Panel */}
      <ArtifactPanel />
      
      {/* Toast Notifications */}
      <ToastNotifications />
    </div>
  )
}