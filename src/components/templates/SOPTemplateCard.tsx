'use client'

import { motion } from 'framer-motion'
import {
  PlayIcon,
  ListBulletIcon,
  DocumentTextIcon,
  StarIcon,
  ClockIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline'
import { TemplateWithSteps } from '@/lib/types/database'
import { cn } from '@/lib/utils'

interface SOPTemplateCardProps {
  template: TemplateWithSteps
  viewMode: 'grid' | 'list'
  onQuickExecution: (template: TemplateWithSteps) => void
}

export function SOPTemplateCard({ 
  template, 
  viewMode, 
  onQuickExecution 
}: SOPTemplateCardProps) {
  const hasSteps = template.template_steps.length > 0
  const IconComponent = hasSteps ? ListBulletIcon : DocumentTextIcon

  if (viewMode === 'list') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -2 }}
        className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 p-4 hover:shadow-md transition-all group"
      >
        <div className="flex items-center space-x-4">
          {/* Icon */}
          <div className={cn(
            'flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center',
            template.color ? `bg-${template.color}-100 dark:bg-${template.color}-900` : 'bg-blue-100 dark:bg-blue-900'
          )}>
            {template.icon ? (
              <span className="text-xl">{template.icon}</span>
            ) : (
              <IconComponent className={cn(
                'h-6 w-6',
                template.color ? `text-${template.color}-600 dark:text-${template.color}-400` : 'text-blue-600 dark:text-blue-400'
              )} />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                  {template.title}
                </h3>
                {template.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                    {template.description}
                  </p>
                )}
              </div>
              
              <button
                onClick={() => onQuickExecution(template)}
                className="ml-4 flex-shrink-0 inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 opacity-0 group-hover:opacity-100 transition-all"
              >
                <PlayIcon className="h-4 w-4 mr-2" />
                Execute
              </button>
            </div>
            
            {/* Metadata */}
            <div className="flex items-center space-x-4 mt-3 text-xs text-gray-500 dark:text-gray-400">
              {hasSteps && (
                <span className="flex items-center">
                  <ListBulletIcon className="h-3 w-3 mr-1" />
                  {template.template_steps.length} steps
                </span>
              )}
              
              <span className="flex items-center">
                <ClockIcon className="h-3 w-3 mr-1" />
                {template.is_system ? 'System' : 'Family'}
              </span>
              
              {!template.is_system && (
                <span className="flex items-center">
                  <UserGroupIcon className="h-3 w-3 mr-1" />
                  Custom
                </span>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 p-6 hover:shadow-lg transition-all group relative overflow-hidden"
    >
      {/* Background Pattern */}
      <div className="absolute top-0 right-0 w-16 h-16 opacity-5">
        <svg className="w-full h-full" fill="currentColor" viewBox="0 0 100 100">
          <path d="M0 0h100v100H0z" />
          <path d="M20 20h60v60H20z" fill="none" stroke="currentColor" strokeWidth="8" />
          <circle cx="50" cy="50" r="15" fill="none" stroke="currentColor" strokeWidth="4" />
        </svg>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className={cn(
          'w-12 h-12 rounded-lg flex items-center justify-center',
          template.color ? `bg-${template.color}-100 dark:bg-${template.color}-900` : 'bg-blue-100 dark:bg-blue-900'
        )}>
          {template.icon ? (
            <span className="text-xl">{template.icon}</span>
          ) : (
            <IconComponent className={cn(
              'h-6 w-6',
              template.color ? `text-${template.color}-600 dark:text-${template.color}-400` : 'text-blue-600 dark:text-blue-400'
            )} />
          )}
        </div>

        {template.is_system && (
          <div className="flex items-center">
            <StarIcon className="h-4 w-4 text-yellow-500" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
          {template.title}
        </h3>
        
        {template.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
            {template.description}
          </p>
        )}
      </div>

      {/* Steps Preview */}
      {hasSteps && (
        <div className="mb-4">
          <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
            {template.template_steps.length} Steps:
          </div>
          <div className="space-y-1">
            {template.template_steps.slice(0, 3).map((step, index) => (
              <div key={step.id} className="flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-400">
                <div className="w-4 h-4 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-xs font-medium">
                  {index + 1}
                </div>
                <span className="truncate">{step.title}</span>
              </div>
            ))}
            {template.template_steps.length > 3 && (
              <div className="text-xs text-gray-500 dark:text-gray-400 pl-6">
                +{template.template_steps.length - 3} more
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 text-xs text-gray-500 dark:text-gray-400">
          <span className="inline-flex items-center px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full">
            {template.category}
          </span>
          
          {hasSteps && (
            <span>{template.template_steps.length} steps</span>
          )}
        </div>

        <button
          onClick={() => onQuickExecution(template)}
          className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0"
        >
          <PlayIcon className="h-4 w-4 mr-2" />
          Execute
        </button>
      </div>

      {/* Hover Effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </motion.div>
  )
}