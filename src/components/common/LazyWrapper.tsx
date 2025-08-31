'use client'

import { Suspense, lazy, ComponentType, ReactNode, memo, useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import ErrorBoundary from './ErrorBoundary'

interface LazyWrapperProps {
  children: ReactNode
  fallback?: ReactNode
  error?: ReactNode
}

const DefaultFallback = memo(function DefaultFallback() {
  return (
    <div className="flex items-center justify-center p-8">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className="flex items-center space-x-2"
      >
        <Loader2 className="h-6 w-6 text-primary" />
      </motion.div>
      <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
    </div>
  )
})

const LazyWrapper = memo(function LazyWrapper({ 
  children, 
  fallback = <DefaultFallback />,
  error 
}: LazyWrapperProps) {
  return (
    <ErrorBoundary fallback={error}>
      <Suspense fallback={fallback}>
        {children}
      </Suspense>
    </ErrorBoundary>
  )
})

// Higher-order component for lazy loading
export function withLazyLoading<P extends object>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  fallback?: ReactNode,
  errorFallback?: ReactNode
) {
  const LazyComponent = lazy(importFn)
  
  const WrappedComponent = (props: P) => (
    <LazyWrapper fallback={fallback} error={errorFallback}>
      <LazyComponent {...props} />
    </LazyWrapper>
  )
  
  // Set display name for debugging
  // WrappedComponent.displayName = `withLazyLoading(Component)`
  
  return WrappedComponent
}

// Intersection Observer based lazy loading for components
export function useLazyInView() {
  const [ref, setRef] = useState<HTMLElement | null>(null)
  const [isInView, setIsInView] = useState(false)

  useEffect(() => {
    if (!ref) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isInView) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      {
        rootMargin: '100px' // Start loading 100px before element comes into view
      }
    )

    observer.observe(ref)

    return () => observer.disconnect()
  }, [ref, isInView])

  return [setRef, isInView] as const
}

interface LazyOnInViewProps {
  children: ReactNode
  fallback?: ReactNode
  className?: string
}

export const LazyOnInView = memo(function LazyOnInView({ 
  children, 
  fallback = <DefaultFallback />,
  className = ''
}: LazyOnInViewProps) {
  const [setRef, isInView] = useLazyInView()

  return (
    <div ref={setRef} className={className}>
      {isInView ? children : fallback}
    </div>
  )
})

export { LazyWrapper }