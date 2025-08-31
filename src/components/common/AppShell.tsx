'use client'

import { ReactNode, useEffect, useState, memo } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar,
  Clock,
  BookOpen,
  Settings,
  Menu,
  X,
  User,
  LogOut,
  ChevronRight,
  Home,
  CheckSquare
} from 'lucide-react'
import { useAppStore } from '@/lib/stores/useAppStore'
import { ArtifactPanel } from './ArtifactPanel'
import { ToastNotifications } from './ToastNotifications'
import { FamilyPresenceIndicator } from './FamilyPresenceIndicator'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { ThemeToggle } from './ThemeToggle'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import ErrorBoundary from './ErrorBoundary'
import { useAccessibility } from '@/hooks/useAccessibility'

interface AppShellProps {
  children: ReactNode
}

interface NavItem {
  id: string
  label: string
  href: string
  icon: any
  description: string
  badge?: string
}

const navItems: NavItem[] = [
  {
    id: 'today',
    label: 'Today',
    href: '/today',
    icon: Clock,
    description: 'Dashboard and overview',
    badge: 'Home'
  },
  {
    id: 'itinerary',
    label: 'Itinerary',
    href: '/itinerary',
    icon: CheckSquare,
    description: 'Execute your daily schedule',
    badge: 'Active'
  },
  {
    id: 'planning',
    label: 'Planning',
    href: '/planning',
    icon: Calendar,
    description: 'Plan your week with drag & drop'
  },
  {
    id: 'sops',
    label: 'SOPs',
    href: '/sops',
    icon: BookOpen,
    description: 'Quick access to procedures'
  },
  {
    id: 'settings',
    label: 'Settings',
    href: '/settings',
    icon: Settings,
    description: 'Customize your experience'
  }
]

const AppShell = memo(function AppShell({ children }: AppShellProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { currentView, setCurrentView, isMobile, setIsMobile, user } = useAppStore()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const supabase = createClient()
  
  // Initialize keyboard shortcuts
  useKeyboardShortcuts()
  
  // Initialize accessibility features
  const { announce } = useAccessibility()

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
    } else if (pathname.startsWith('/settings')) {
      // Settings page doesn't have a specific view, keep current view
    }
  }, [pathname, setCurrentView])

  const handleNavClick = (item: NavItem) => {
    setCurrentView(item.id as any)
    setMobileMenuOpen(false)
    router.push(item.href)
    announce(`Navigated to ${item.label}`)
  }

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      // Clear app state and redirect
      window.location.href = '/auth/login'
    } catch (error) {
      console.error('Error signing out:', error)
      toast.error('Failed to sign out')
    }
  }

  const isActiveRoute = (href: string) => {
    return pathname.startsWith(href)
  }

  if (!user) {
    // Show auth pages without shell
    return <>{children}</>
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        {/* Desktop Sidebar */}
        {!isMobile && (
          <aside 
            className="fixed inset-y-0 left-0 z-50 w-72 bg-card border-r border-border/50 shadow-sm"
            role="navigation"
            aria-label="Main navigation"
            id="main-navigation"
          >
            <div className="flex h-full flex-col">
              {/* Logo/Header */}
              <div className="flex h-20 items-center px-6 border-b border-border/50">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary/90 to-primary rounded-xl flex items-center justify-center shadow-sm">
                      <Calendar className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-card"></div>
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-foreground">Itineraries</h1>
                    <p className="text-xs text-muted-foreground">Family Planning</p>
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <nav className="flex-1 p-4 space-y-2">
                {navItems.map((item) => {
                  const Icon = item.icon
                  const isActive = isActiveRoute(item.href)
                  return (
                    <Tooltip key={item.id}>
                      <TooltipTrigger asChild>
                        <motion.div
                          whileHover={{ x: 2 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Button
                            variant={isActive ? "default" : "ghost"}
                            size="lg"
                            onClick={() => handleNavClick(item)}
                            className={cn(
                              "w-full justify-start h-auto py-3 px-4 group relative overflow-hidden",
                              isActive 
                                ? "bg-primary text-primary-foreground shadow-sm" 
                                : "hover:bg-accent/50 text-muted-foreground hover:text-accent-foreground"
                            )}
                          >
                            <div className="flex items-center w-full">
                              <Icon className={cn("h-5 w-5 mr-4 transition-colors", isActive ? "text-primary-foreground" : "")} />
                              <div className="text-left flex-1">
                                <div className="flex items-center">
                                  <span className="font-medium">{item.label}</span>
                                  {item.badge && isActive && (
                                    <Badge variant="secondary" className="ml-auto text-xs">
                                      {item.badge}
                                    </Badge>
                                  )}
                                </div>
                                <div className={cn(
                                  "text-xs mt-0.5 opacity-70",
                                  isActive ? "text-primary-foreground/80" : "text-muted-foreground"
                                )}>
                                  {item.description}
                                </div>
                              </div>
                              {!isActive && (
                                <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-30 transition-opacity ml-2" />
                              )}
                            </div>
                          </Button>
                        </motion.div>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="font-medium">
                        {item.description}
                      </TooltipContent>
                    </Tooltip>
                  )
                })}
              </nav>

              {/* Family Presence */}
              <div className="px-4 pb-2">
                <FamilyPresenceIndicator />
              </div>

              <Separator className="mx-4" />

              {/* User section */}
              <div className="p-4">
                <div className="flex items-center space-x-3 p-3 rounded-xl bg-accent/30 border border-border/30">
                  <Avatar className="h-10 w-10 ring-2 ring-border/50">
                    <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/30 text-primary font-semibold">
                      {user.full_name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {user.full_name || 'User'}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user.email}
                    </p>
                  </div>
                  <div className="flex items-center space-x-1">
                    <ThemeToggle size="sm" />
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 hover:bg-accent"
                          onClick={() => router.push('/settings')}
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Settings</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 hover:bg-destructive hover:text-destructive-foreground"
                          onClick={handleLogout}
                        >
                          <LogOut className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Sign Out</TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        )}

        {/* Mobile Header & Navigation */}
        {isMobile && (
          <>
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-b border-border/50">
              <div className="flex items-center justify-between h-16 px-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary/90 to-primary rounded-lg flex items-center justify-center">
                    <Calendar className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <span className="text-lg font-bold text-foreground">Itineraries</span>
                </div>
                
                {/* Mobile Family Presence */}
                <div className="flex items-center space-x-2">
                  <div className="hidden xs:block">
                    <FamilyPresenceIndicator />
                  </div>
                  <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-80 p-0">
                    <div className="flex h-full flex-col">
                      <div className="p-6 border-b border-border/50">
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-12 w-12 ring-2 ring-border/50">
                            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/30 text-primary font-semibold">
                              {user.full_name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-foreground">
                              {user.full_name || 'User'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </div>

                      <nav className="flex-1 p-4 space-y-2">
                        {navItems.map((item) => {
                          const Icon = item.icon
                          const isActive = isActiveRoute(item.href)
                          return (
                            <Button
                              key={item.id}
                              variant={isActive ? "default" : "ghost"}
                              size="lg"
                              onClick={() => handleNavClick(item)}
                              className={cn(
                                "w-full justify-start h-auto py-4 px-4",
                                isActive 
                                  ? "bg-primary text-primary-foreground" 
                                  : "text-muted-foreground hover:text-accent-foreground"
                              )}
                            >
                              <Icon className="h-5 w-5 mr-4" />
                              <div className="text-left">
                                <div className="font-medium">{item.label}</div>
                                <div className={cn(
                                  "text-xs mt-0.5",
                                  isActive ? "text-primary-foreground/80" : "text-muted-foreground"
                                )}>
                                  {item.description}
                                </div>
                              </div>
                            </Button>
                          )
                        })}
                        
                        <Separator className="my-2" />
                        
                        <Button
                          variant="ghost"
                          size="lg"
                          onClick={handleLogout}
                          className="w-full justify-start h-auto py-4 px-4 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                        >
                          <LogOut className="h-5 w-5 mr-4" />
                          <div className="text-left">
                            <div className="font-medium">Sign Out</div>
                            <div className="text-xs mt-0.5 opacity-80">
                              Log out of your account
                            </div>
                          </div>
                        </Button>
                      </nav>
                    </div>
                  </SheetContent>
                  </Sheet>
                </div>
              </div>
            </header>

            {/* Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border/50">
              <div className="grid grid-cols-4">
                {navItems.slice(0, 3).map((item) => {
                  const Icon = item.icon
                  const isActive = isActiveRoute(item.href)
                  return (
                    <Button
                      key={item.id}
                      variant="ghost"
                      onClick={() => handleNavClick(item)}
                      className={cn(
                        "flex flex-col items-center py-3 px-2 h-auto rounded-none border-0",
                        isActive
                          ? 'text-primary bg-primary/5'
                          : 'text-muted-foreground hover:text-foreground hover:bg-accent/30'
                      )}
                    >
                      <Icon className="h-5 w-5 mb-1" />
                      <span className="text-xs font-medium">{item.label}</span>
                      {item.badge && isActive && (
                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full"></div>
                      )}
                    </Button>
                  )
                })}
                
                {/* Settings button for mobile */}
                <Button
                  variant="ghost"
                  onClick={() => router.push('/settings')}
                  className={cn(
                    'flex flex-col items-center py-3 px-2 h-auto rounded-none border-0',
                    isActiveRoute('/settings')
                      ? 'text-primary bg-primary/5'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent/30'
                  )}
                >
                  <Settings className="h-5 w-5 mb-1" />
                  <span className="text-xs font-medium">Settings</span>
                </Button>
              </div>
            </nav>
          </>
        )}

        {/* Main Content */}
        <main 
          className={cn(
            "transition-all duration-300 min-h-screen bg-background",
            isMobile ? "pt-16 pb-20" : "pl-72"
          )}
          id="main-content"
          role="main"
          aria-label="Main content"
        >
          <ErrorBoundary>
            <div className="relative">
              {children}
            </div>
          </ErrorBoundary>
        </main>

        {/* Artifact Panel */}
        <ArtifactPanel />
        
        {/* Toast Notifications */}
        <ToastNotifications />
      </div>
    </TooltipProvider>
  )
})

export { AppShell }