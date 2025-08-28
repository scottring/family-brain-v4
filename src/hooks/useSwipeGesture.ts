'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

export interface SwipeDirection {
  direction: 'left' | 'right' | 'up' | 'down'
  distance: number
  velocity: number
  duration: number
}

export interface SwipeOptions {
  onSwipeLeft?: (gesture: SwipeDirection) => void
  onSwipeRight?: (gesture: SwipeDirection) => void
  onSwipeUp?: (gesture: SwipeDirection) => void
  onSwipeDown?: (gesture: SwipeDirection) => void
  onSwipe?: (gesture: SwipeDirection) => void
  threshold?: number // Minimum distance for swipe
  velocityThreshold?: number // Minimum velocity for swipe
  preventDefaultTouchmoveEvent?: boolean
  delta?: number // Sensitivity
}

interface TouchState {
  startX: number
  startY: number
  startTime: number
  currentX: number
  currentY: number
  isSwiping: boolean
}

export function useSwipeGesture(options: SwipeOptions = {}) {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    onSwipe,
    threshold = 50,
    velocityThreshold = 0.3,
    preventDefaultTouchmoveEvent = false,
    delta = 10
  } = options

  const [touchState, setTouchState] = useState<TouchState>({
    startX: 0,
    startY: 0,
    startTime: 0,
    currentX: 0,
    currentY: 0,
    isSwiping: false
  })

  const elementRef = useRef<HTMLElement | null>(null)

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0]
    setTouchState({
      startX: touch.clientX,
      startY: touch.clientY,
      startTime: Date.now(),
      currentX: touch.clientX,
      currentY: touch.clientY,
      isSwiping: false
    })
  }, [])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (preventDefaultTouchmoveEvent) {
      e.preventDefault()
    }

    const touch = e.touches[0]
    setTouchState(prev => ({
      ...prev,
      currentX: touch.clientX,
      currentY: touch.clientY,
      isSwiping: true
    }))
  }, [preventDefaultTouchmoveEvent])

  const handleTouchEnd = useCallback(() => {
    const deltaX = touchState.currentX - touchState.startX
    const deltaY = touchState.currentY - touchState.startY
    const duration = Date.now() - touchState.startTime
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
    const velocity = distance / duration

    // Check if swipe meets threshold requirements
    if (distance < threshold || velocity < velocityThreshold) {
      return
    }

    // Determine swipe direction
    const absDeltaX = Math.abs(deltaX)
    const absDeltaY = Math.abs(deltaY)

    let direction: SwipeDirection['direction']
    
    if (absDeltaX > absDeltaY) {
      // Horizontal swipe
      direction = deltaX > 0 ? 'right' : 'left'
    } else {
      // Vertical swipe
      direction = deltaY > 0 ? 'down' : 'up'
    }

    const gesture: SwipeDirection = {
      direction,
      distance,
      velocity,
      duration
    }

    // Call appropriate handlers
    switch (direction) {
      case 'left':
        onSwipeLeft?.(gesture)
        break
      case 'right':
        onSwipeRight?.(gesture)
        break
      case 'up':
        onSwipeUp?.(gesture)
        break
      case 'down':
        onSwipeDown?.(gesture)
        break
    }

    onSwipe?.(gesture)

    // Reset touch state
    setTouchState({
      startX: 0,
      startY: 0,
      startTime: 0,
      currentX: 0,
      currentY: 0,
      isSwiping: false
    })
  }, [touchState, threshold, velocityThreshold, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, onSwipe])

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    // Add touch event listeners
    element.addEventListener('touchstart', handleTouchStart, { passive: true })
    element.addEventListener('touchmove', handleTouchMove, { passive: !preventDefaultTouchmoveEvent })
    element.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchmove', handleTouchMove)  
      element.removeEventListener('touchend', handleTouchEnd)
    }
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, preventDefaultTouchmoveEvent])

  return {
    ref: elementRef,
    isSwiping: touchState.isSwiping,
    currentDelta: {
      x: touchState.currentX - touchState.startX,
      y: touchState.currentY - touchState.startY
    }
  }
}

// Hook for pull-to-refresh functionality
export function usePullToRefresh(onRefresh: () => Promise<void> | void, threshold = 60) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)

  const { ref, isSwiping, currentDelta } = useSwipeGesture({
    onSwipeDown: async (gesture) => {
      if (gesture.distance > threshold && !isRefreshing) {
        setIsRefreshing(true)
        try {
          await onRefresh()
        } finally {
          setIsRefreshing(false)
          setPullDistance(0)
        }
      }
    },
    threshold: 0 // We handle threshold ourselves
  })

  useEffect(() => {
    if (isSwiping && currentDelta.y > 0) {
      setPullDistance(Math.min(currentDelta.y, threshold + 20))
    } else if (!isSwiping) {
      setPullDistance(0)
    }
  }, [isSwiping, currentDelta.y, threshold])

  return {
    ref,
    isRefreshing,
    pullDistance,
    shouldRefresh: pullDistance >= threshold
  }
}