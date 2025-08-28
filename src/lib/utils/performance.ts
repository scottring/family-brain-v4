'use client'

// Performance monitoring and optimization utilities

interface PerformanceMetrics {
  loadTime: number
  renderTime: number
  interactionTime: number
  memoryUsage?: number
  connectionType?: string
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = []
  private observers: PerformanceObserver[] = []

  constructor() {
    this.initializeObservers()
  }

  private initializeObservers() {
    if (typeof window === 'undefined') return

    // Observe navigation timing
    if ('PerformanceObserver' in window) {
      const navObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming
            this.recordMetric({
              loadTime: navEntry.loadEventEnd - navEntry.loadEventStart,
              renderTime: navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart,
              interactionTime: navEntry.domInteractive - navEntry.domLoading
            })
          }
        })
      })

      try {
        navObserver.observe({ entryTypes: ['navigation'] })
        this.observers.push(navObserver)
      } catch (e) {
        console.warn('Navigation timing observer not supported')
      }

      // Observe largest contentful paint
      const lcpObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          console.log('LCP:', entry.startTime)
        })
      })

      try {
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })
        this.observers.push(lcpObserver)
      } catch (e) {
        console.warn('LCP observer not supported')
      }

      // Observe cumulative layout shift
      const clsObserver = new PerformanceObserver((list) => {
        let clsValue = 0
        list.getEntries().forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value
          }
        })
        console.log('CLS:', clsValue)
      })

      try {
        clsObserver.observe({ entryTypes: ['layout-shift'] })
        this.observers.push(clsObserver)
      } catch (e) {
        console.warn('CLS observer not supported')
      }
    }

    // Monitor memory usage
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory
        if (memory) {
          console.log('Memory usage:', {
            used: Math.round(memory.usedJSHeapSize / 1024 / 1024),
            total: Math.round(memory.totalJSHeapSize / 1024 / 1024),
            limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024)
          })
        }
      }, 30000) // Check every 30 seconds
    }
  }

  recordMetric(metric: Partial<PerformanceMetrics>) {
    const fullMetric: PerformanceMetrics = {
      loadTime: 0,
      renderTime: 0,
      interactionTime: 0,
      ...metric,
      memoryUsage: this.getMemoryUsage(),
      connectionType: this.getConnectionType()
    }

    this.metrics.push(fullMetric)
    
    // Keep only last 100 metrics
    if (this.metrics.length > 100) {
      this.metrics.shift()
    }
  }

  private getMemoryUsage(): number | undefined {
    if (typeof window !== 'undefined' && 'memory' in performance) {
      const memory = (performance as any).memory
      return memory ? Math.round(memory.usedJSHeapSize / 1024 / 1024) : undefined
    }
    return undefined
  }

  private getConnectionType(): string | undefined {
    if (typeof window !== 'undefined' && 'connection' in navigator) {
      const connection = (navigator as any).connection
      return connection ? connection.effectiveType : undefined
    }
    return undefined
  }

  getAverageMetrics(): PerformanceMetrics | null {
    if (this.metrics.length === 0) return null

    const averages = this.metrics.reduce((acc, metric) => ({
      loadTime: acc.loadTime + metric.loadTime,
      renderTime: acc.renderTime + metric.renderTime,
      interactionTime: acc.interactionTime + metric.interactionTime,
      memoryUsage: (acc.memoryUsage || 0) + (metric.memoryUsage || 0),
      connectionType: metric.connectionType || acc.connectionType
    }), {
      loadTime: 0,
      renderTime: 0,
      interactionTime: 0,
      memoryUsage: 0,
      connectionType: undefined as string | undefined
    })

    return {
      loadTime: averages.loadTime / this.metrics.length,
      renderTime: averages.renderTime / this.metrics.length,
      interactionTime: averages.interactionTime / this.metrics.length,
      memoryUsage: averages.memoryUsage / this.metrics.length,
      connectionType: averages.connectionType
    }
  }

  cleanup() {
    this.observers.forEach(observer => observer.disconnect())
    this.observers = []
  }
}

// Debounce utility for performance
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// Throttle utility for performance
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

// Lazy loading utility
export function lazyLoad<T>(
  importFn: () => Promise<T>,
  fallback?: () => T
): () => Promise<T> {
  let cached: T | null = null
  let loading: Promise<T> | null = null

  return async () => {
    if (cached) return cached

    if (loading) return loading

    loading = importFn().catch((error) => {
      loading = null
      console.error('Lazy load failed:', error)
      if (fallback) return fallback()
      throw error
    }).then((result) => {
      cached = result
      loading = null
      return result
    })

    return loading
  }
}

// Image preloader
export function preloadImages(urls: string[]): Promise<void[]> {
  const promises = urls.map((url) => {
    return new Promise<void>((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve()
      img.onerror = () => reject(new Error(`Failed to load image: ${url}`))
      img.src = url
    })
  })

  return Promise.all(promises)
}

// Resource hints
export function addResourceHints(resources: Array<{url: string, type: 'preload' | 'prefetch' | 'dns-prefetch', as?: string}>) {
  if (typeof document === 'undefined') return

  resources.forEach(({ url, type, as }) => {
    const link = document.createElement('link')
    link.rel = type
    link.href = url
    if (as) link.as = as
    document.head.appendChild(link)
  })
}

// Web Vitals tracking
export function trackWebVitals() {
  if (typeof window === 'undefined') return

  // Track FCP (First Contentful Paint)
  new PerformanceObserver((list) => {
    list.getEntries().forEach((entry) => {
      console.log('FCP:', entry.startTime)
    })
  }).observe({ entryTypes: ['paint'] })

  // Track FID (First Input Delay)
  new PerformanceObserver((list) => {
    list.getEntries().forEach((entry: any) => {
      console.log('FID:', entry.processingStart - entry.startTime)
    })
  }).observe({ entryTypes: ['first-input'] })
}

// Create singleton instance
export const performanceMonitor = new PerformanceMonitor()

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    performanceMonitor.cleanup()
  })
}