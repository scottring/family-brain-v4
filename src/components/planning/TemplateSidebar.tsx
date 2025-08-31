'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useDrag } from 'react-dnd'
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  PlusIcon,
  BookOpenIcon,
  ListBulletIcon,
  DocumentTextIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline'
import { TemplateWithSteps, TemplateCategory } from '@/lib/types/database'
import { useTemplateStore } from '@/lib/stores/useTemplateStore'
import { useAppStore } from '@/lib/stores/useAppStore'
import { CreateTemplateModal } from './CreateTemplateModal'
import { EditTemplateModal } from '@/components/templates/EditTemplateModal'
import { templateService } from '@/lib/services/TemplateService'
import { cn } from '@/lib/utils'

const categoryLabels: Record<TemplateCategory, string> = {
  morning: 'Morning',
  evening: 'Evening',
  household: 'Household',
  childcare: 'Childcare',
  shopping: 'Shopping',
  work: 'Work',
  personal: 'Personal',
  health: 'Health',
  travel: 'Travel',
  custom: 'Custom'
}

const categoryIcons: Record<TemplateCategory, any> = {
  morning: '🌅',
  evening: '🌙',
  household: '🏠',
  childcare: '👶',
  shopping: '🛒',
  work: '💼',
  personal: '👤',
  health: '🏥',
  travel: '✈️',
  custom: '⭐'
}

export function TemplateSidebar() {
  const { isMobile } = useAppStore()
  const {
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    showSystemTemplates,
    setShowSystemTemplates,
    showFamilyTemplates,
    setShowFamilyTemplates,
    getFilteredTemplates,
    templatesByCategory
  } = useTemplateStore()
  
  const [showFilters, setShowFilters] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  
  const filteredTemplates = getFilteredTemplates()
  const categories = Object.keys(templatesByCategory) as TemplateCategory[]

  return (
    <div className={cn(
      'bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700',
      isMobile ? 'h-48' : 'w-80 h-full'
    )}>
      <div className="p-4 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Templates
          </h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <FunnelIcon className="h-4 w-4" />
            </button>
            <button 
              onClick={() => setIsCreateModalOpen(true)}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              title="Create new template"
            >
              <PlusIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Filters */}
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-3"
          >
            {/* Category Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as TemplateCategory | 'all')}
                className="w-full text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>
                    {categoryIcons[category]} {categoryLabels[category]}
                  </option>
                ))}
              </select>
            </div>

            {/* Type Filters */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                Type
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={showSystemTemplates}
                    onChange={(e) => setShowSystemTemplates(e.target.checked)}
                    className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">System Templates</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={showFamilyTemplates}
                    onChange={(e) => setShowFamilyTemplates(e.target.checked)}
                    className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Family Templates</span>
                </label>
              </div>
            </div>
          </motion.div>
        )}

        {/* Template List */}
        <div className="flex-1 overflow-y-auto space-y-2">
          {filteredTemplates.length === 0 ? (
            <div className="text-center py-8">
              <BookOpenIcon className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No templates found
              </p>
            </div>
          ) : (
            filteredTemplates.map(template => (
              <DraggableTemplate
                key={template.id}
                template={template}
              />
            ))
          )}
        </div>
      </div>

      {/* Create Template Modal */}
      <CreateTemplateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  )
}

interface DraggableTemplateProps {
  template: TemplateWithSteps
}

function DraggableTemplate({ template }: DraggableTemplateProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const { templates, setTemplates } = useTemplateStore()
  
  const [{ isDragging }, drag] = useDrag({
    type: 'template',
    item: { template },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    })
  })

  const hasSteps = template.template_steps?.length > 0
  const IconComponent = hasSteps ? ListBulletIcon : DocumentTextIcon

  const handleDelete = async () => {
    const confirmMessage = template.is_system 
      ? `Delete system template "${template.title}"? This action cannot be undone.`
      : `Delete template "${template.title}"?`
    
    if (!window.confirm(confirmMessage)) return
    
    try {
      await templateService.deleteTemplate(template.id)
      // Remove from local state
      const updatedTemplates = templates.filter(t => t.id !== template.id)
      setTemplates(updatedTemplates)
    } catch (error) {
      console.error('Error deleting template:', error)
      alert('Failed to delete template. Please try again.')
    }
  }

  return (
    <>
      <motion.div
        ref={drag}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: isDragging ? 0.5 : 1, y: 0 }}
        className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 cursor-move hover:shadow-md transition-all group"
      >
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              {template.icon ? (
                <span className="text-lg">{template.icon}</span>
              ) : (
                <IconComponent className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              )}
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {template.title}
                </h4>
                {template.description && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                    {template.description}
                  </p>
                )}
              </div>
              
              {/* Action buttons */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsEditModalOpen(true)
                  }}
                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                  title="Edit template"
                >
                  <PencilIcon className="h-3.5 w-3.5 text-gray-600 dark:text-gray-400" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDelete()
                  }}
                  className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                  title="Delete template"
                >
                  <TrashIcon className="h-3.5 w-3.5 text-gray-600 dark:text-gray-400 hover:text-red-600" />
                </button>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 mt-2">
              <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-full">
                {categoryIcons[template.category]} {categoryLabels[template.category]}
              </span>
              
              {hasSteps && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {template.template_steps?.length || 0} steps
                </span>
              )}
              
              {template.is_system && (
                <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                  System
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
    
    {/* Edit Template Modal */}
    <EditTemplateModal
      template={template}
      isOpen={isEditModalOpen}
      onClose={() => setIsEditModalOpen(false)}
      mode="permanent"
    />
    </>
  )
}