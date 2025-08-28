'use client'

import { memo } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
}

const Skeleton = memo(function Skeleton({ className }: SkeletonProps) {
  return (
    <motion.div
      animate={{
        opacity: [0.5, 1, 0.5],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut'
      }}
      className={cn('bg-muted rounded', className)}
    />
  )
})

const TimeBlockSkeleton = memo(function TimeBlockSkeleton() {
  return (
    <div className="rounded-xl border-2 border-border bg-card overflow-hidden">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-4 flex-1">
            <Skeleton className="w-12 h-12 rounded-xl" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-6 w-32" />
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-12" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
            </div>
          </div>
          <div className="flex flex-col space-y-2">
            <Skeleton className="h-8 w-20 rounded-md" />
            <Skeleton className="h-8 w-16 rounded-md" />
          </div>
        </div>
      </div>
    </div>
  )
})

const ScheduleItemSkeleton = memo(function ScheduleItemSkeleton() {
  return (
    <div className="flex items-center space-x-3 p-4 bg-background rounded-lg border border-border">
      <Skeleton className="w-5 h-5 rounded" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <Skeleton className="h-6 w-12 rounded" />
    </div>
  )
})

const TemplateSkeleton = memo(function TemplateSkeleton() {
  return (
    <div className="p-4 bg-card rounded-lg border border-border space-y-3">
      <div className="flex items-center space-x-3">
        <Skeleton className="w-10 h-10 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    </div>
  )
})

const PlanningGridSkeleton = memo(function PlanningGridSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-10 w-32 rounded-md" />
      </div>
      
      {/* Calendar Grid */}
      <div className="grid grid-cols-8 gap-4">
        {/* Time column */}
        <div className="space-y-4">
          {Array.from({ length: 12 }, (_, i) => (
            <Skeleton key={i} className="h-6 w-16" />
          ))}
        </div>
        
        {/* Day columns */}
        {Array.from({ length: 7 }, (_, dayIndex) => (
          <div key={dayIndex} className="space-y-4">
            <Skeleton className="h-8 w-full rounded-lg" />
            {Array.from({ length: 12 }, (_, timeIndex) => (
              <div key={timeIndex} className="h-16">
                {Math.random() > 0.7 && (
                  <Skeleton className="h-full w-full rounded-md" />
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
})

const TodayViewSkeleton = memo(function TodayViewSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-background">
      {/* Header */}
      <div className="sticky top-16 z-40 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="px-6 py-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-6 w-24 rounded-full" />
              </div>
              <div className="flex items-center space-x-6">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-20 rounded-md" />
              </div>
            </div>
            <div className="mt-4">
              <Skeleton className="h-2 w-full rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Time Blocks */}
      <div className="px-6 py-8">
        <div className="max-w-6xl mx-auto space-y-4">
          {Array.from({ length: 4 }, (_, i) => (
            <TimeBlockSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  )
})

const SOPViewSkeleton = memo(function SOPViewSkeleton() {
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-36" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-10 w-32 rounded-md" />
      </div>

      {/* Search */}
      <Skeleton className="h-10 w-full rounded-md" />

      {/* Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <TemplateSkeleton key={i} />
        ))}
      </div>
    </div>
  )
})

export {
  Skeleton,
  TimeBlockSkeleton,
  ScheduleItemSkeleton,
  TemplateSkeleton,
  PlanningGridSkeleton,
  TodayViewSkeleton,
  SOPViewSkeleton
}