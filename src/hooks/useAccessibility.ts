'use client'

import { useEffect, useRef, useCallback } from 'react'

export interface AccessibilityOptions {
  focusManagement?: boolean
  announceChanges?: boolean
  keyboardNavigation?: boolean
  skipLinks?: boolean
}

// Hook for managing focus and announcements
export function useAccessibility(options: AccessibilityOptions = {}) {
  const {
    focusManagement = true,
    announceChanges = true,
    keyboardNavigation = true,
    skipLinks = true
  } = options

  const announcerRef = useRef<HTMLDivElement | null>(null)
  const focusHistoryRef = useRef<HTMLElement[]>([])

  // Create screen reader announcer
  useEffect(() => {
    if (!announceChanges) return

    const announcer = document.createElement('div')
    announcer.setAttribute('aria-live', 'polite')
    announcer.setAttribute('aria-atomic', 'true')
    announcer.className = 'sr-only'
    announcer.id = 'accessibility-announcer'
    
    document.body.appendChild(announcer)
    announcerRef.current = announcer

    return () => {
      if (announcer.parentNode) {
        announcer.parentNode.removeChild(announcer)
      }
    }
  }, [announceChanges])

  // Announce text to screen readers
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (!announcerRef.current || !announceChanges) return

    announcerRef.current.setAttribute('aria-live', priority)
    announcerRef.current.textContent = message
    
    // Clear after announcement to allow repeat messages
    setTimeout(() => {
      if (announcerRef.current) {
        announcerRef.current.textContent = ''
      }
    }, 1000)
  }, [announceChanges])

  // Focus management utilities
  const focusElement = useCallback((element: HTMLElement | null, options?: FocusOptions) => {
    if (!element || !focusManagement) return false
    
    try {
      // Store previous focus
      const activeElement = document.activeElement as HTMLElement
      if (activeElement && activeElement !== element) {
        focusHistoryRef.current.push(activeElement)
      }
      
      element.focus(options)
      return true
    } catch (error) {
      console.warn('Failed to focus element:', error)
      return false
    }
  }, [focusManagement])

  // Return focus to previous element
  const returnFocus = useCallback(() => {
    if (!focusManagement) return false
    
    const previousElement = focusHistoryRef.current.pop()
    if (previousElement && document.contains(previousElement)) {
      return focusElement(previousElement)
    }
    return false
  }, [focusManagement, focusElement])

  // Find first focusable element in container
  const findFirstFocusable = useCallback((container: HTMLElement): HTMLElement | null => {
    const focusableSelector = [
      'a[href]',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])'
    ].join(', ')

    return container.querySelector(focusableSelector)
  }, [])

  // Trap focus within container (for modals, etc.)
  const trapFocus = useCallback((container: HTMLElement) => {
    if (!keyboardNavigation) return () => {}

    const focusableElements = container.querySelectorAll([
      'a[href]',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])'
    ].join(', ')) as NodeListOf<HTMLElement>

    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return

      if (event.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          event.preventDefault()
          lastElement?.focus()
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          event.preventDefault()
          firstElement?.focus()
        }
      }
    }

    container.addEventListener('keydown', handleKeyDown)
    
    // Focus first element initially
    firstElement?.focus()

    return () => {
      container.removeEventListener('keydown', handleKeyDown)
    }
  }, [keyboardNavigation])

  // Add skip links
  useEffect(() => {
    if (!skipLinks) return

    const existingSkipLinks = document.getElementById('skip-links')
    if (existingSkipLinks) return

    const skipLinksContainer = document.createElement('div')
    skipLinksContainer.id = 'skip-links'
    skipLinksContainer.className = 'skip-links'
    
    const skipToContent = document.createElement('a')
    skipToContent.href = '#main-content'
    skipToContent.textContent = 'Skip to main content'
    skipToContent.className = 'skip-link'
    
    const skipToNav = document.createElement('a')
    skipToNav.href = '#main-navigation'
    skipToNav.textContent = 'Skip to navigation'
    skipToNav.className = 'skip-link'
    
    skipLinksContainer.appendChild(skipToContent)
    skipLinksContainer.appendChild(skipToNav)
    
    document.body.insertBefore(skipLinksContainer, document.body.firstChild)

    return () => {
      const links = document.getElementById('skip-links')
      if (links?.parentNode) {
        links.parentNode.removeChild(links)
      }
    }
  }, [skipLinks])

  return {
    announce,
    focusElement,
    returnFocus,
    findFirstFocusable,
    trapFocus
  }
}

// Hook for keyboard navigation within lists/grids
export function useKeyboardNavigation(
  containerRef: React.RefObject<HTMLElement>,
  options: {
    direction?: 'horizontal' | 'vertical' | 'grid'
    loop?: boolean
    autoFocus?: boolean
  } = {}
) {
  const { direction = 'vertical', loop = true, autoFocus = false } = options

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleKeyDown = (event: KeyboardEvent) => {
      const focusableElements = Array.from(
        container.querySelectorAll(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ) as HTMLElement[]

      if (focusableElements.length === 0) return

      const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement)
      if (currentIndex === -1) return

      let newIndex = currentIndex

      switch (event.key) {
        case 'ArrowDown':
          if (direction === 'vertical' || direction === 'grid') {
            event.preventDefault()
            newIndex = currentIndex + 1
          }
          break
        case 'ArrowUp':
          if (direction === 'vertical' || direction === 'grid') {
            event.preventDefault()
            newIndex = currentIndex - 1
          }
          break
        case 'ArrowRight':
          if (direction === 'horizontal' || direction === 'grid') {
            event.preventDefault()
            newIndex = currentIndex + 1
          }
          break
        case 'ArrowLeft':
          if (direction === 'horizontal' || direction === 'grid') {
            event.preventDefault()
            newIndex = currentIndex - 1
          }
          break
        case 'Home':
          event.preventDefault()
          newIndex = 0
          break
        case 'End':
          event.preventDefault()
          newIndex = focusableElements.length - 1
          break
        default:
          return
      }

      // Handle looping
      if (loop) {
        if (newIndex < 0) {
          newIndex = focusableElements.length - 1
        } else if (newIndex >= focusableElements.length) {
          newIndex = 0
        }
      } else {
        newIndex = Math.max(0, Math.min(newIndex, focusableElements.length - 1))
      }

      focusableElements[newIndex]?.focus()
    }

    container.addEventListener('keydown', handleKeyDown)

    // Auto-focus first element if requested
    if (autoFocus) {
      const firstFocusable = container.querySelector(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      ) as HTMLElement
      firstFocusable?.focus()
    }

    return () => {
      container.removeEventListener('keydown', handleKeyDown)
    }
  }, [direction, loop, autoFocus])
}

// Hook to manage reduced motion preferences
export function useReducedMotion() {
  const prefersReducedMotion = 
    typeof window !== 'undefined' 
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false

  return prefersReducedMotion
}

// Hook for color contrast and theme preferences
export function useAccessibilityPreferences() {
  const prefersReducedMotion = useReducedMotion()
  
  const prefersHighContrast = 
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-contrast: high)').matches
      : false

  const prefersColorScheme = 
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      : 'light'

  return {
    prefersReducedMotion,
    prefersHighContrast,
    prefersColorScheme
  }
}