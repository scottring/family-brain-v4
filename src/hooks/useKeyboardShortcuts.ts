'use client'

import { useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/lib/stores/useAppStore'

export interface KeyboardShortcut {
  key: string
  metaKey?: boolean
  ctrlKey?: boolean
  shiftKey?: boolean
  altKey?: boolean
  action: () => void
  description: string
  category: string
}

export function useKeyboardShortcuts() {
  const router = useRouter()
  const { setCurrentView, user } = useAppStore()
  const shortcutsRef = useRef<KeyboardShortcut[]>([])

  const shortcuts: KeyboardShortcut[] = [
    // Navigation
    {
      key: '1',
      metaKey: true,
      action: () => {
        setCurrentView('today')
        router.push('/today')
      },
      description: 'Go to Today view',
      category: 'Navigation'
    },
    {
      key: '2',
      metaKey: true,
      action: () => {
        setCurrentView('planning')
        router.push('/planning')
      },
      description: 'Go to Planning view',
      category: 'Navigation'
    },
    {
      key: '3',
      metaKey: true,
      action: () => {
        setCurrentView('sops')
        router.push('/sops')
      },
      description: 'Go to SOPs view',
      category: 'Navigation'
    },
    
    // Quick Actions
    {
      key: 'k',
      metaKey: true,
      action: () => {
        // TODO: Open command palette
        console.log('Command palette - coming soon!')
      },
      description: 'Open command palette',
      category: 'Quick Actions'
    },
    {
      key: 'n',
      metaKey: true,
      action: () => {
        // TODO: Quick add modal
        console.log('Quick add - coming soon!')
      },
      description: 'Quick add item',
      category: 'Quick Actions'
    },
    {
      key: 'f',
      metaKey: true,
      action: () => {
        // TODO: Open focus mode
        console.log('Focus mode - coming soon!')
      },
      description: 'Enter focus mode',
      category: 'Quick Actions'
    },
    
    // Utility
    {
      key: 'r',
      metaKey: true,
      shiftKey: true,
      action: () => {
        window.location.reload()
      },
      description: 'Reload page',
      category: 'Utility'
    },
    {
      key: '?',
      shiftKey: true,
      action: () => {
        // TODO: Open help modal
        console.log('Help modal - coming soon!')
      },
      description: 'Show keyboard shortcuts',
      category: 'Utility'
    }
  ]

  shortcutsRef.current = shortcuts

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Don't trigger shortcuts when typing in inputs
    if (
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement ||
      event.target instanceof HTMLSelectElement ||
      (event.target as HTMLElement)?.contentEditable === 'true'
    ) {
      return
    }

    const matchingShortcut = shortcutsRef.current.find(shortcut => {
      const keyMatch = shortcut.key.toLowerCase() === event.key.toLowerCase()
      const metaMatch = !!shortcut.metaKey === (event.metaKey || event.ctrlKey)
      const shiftMatch = !!shortcut.shiftKey === event.shiftKey
      const altMatch = !!shortcut.altKey === event.altKey
      const ctrlMatch = !!shortcut.ctrlKey === event.ctrlKey

      return keyMatch && metaMatch && shiftMatch && altMatch && ctrlMatch
    })

    if (matchingShortcut) {
      event.preventDefault()
      event.stopPropagation()
      matchingShortcut.action()
    }
  }, [])

  useEffect(() => {
    // Only enable shortcuts when user is logged in
    if (!user) return

    document.addEventListener('keydown', handleKeyDown, { capture: true })
    return () => {
      document.removeEventListener('keydown', handleKeyDown, { capture: true })
    }
  }, [handleKeyDown, user])

  return {
    shortcuts: shortcutsRef.current,
    categories: Array.from(new Set(shortcutsRef.current.map(s => s.category)))
  }
}