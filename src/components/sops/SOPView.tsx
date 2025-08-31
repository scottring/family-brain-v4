'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookOpenIcon,
  ClipboardDocumentListIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  CheckCircleIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  PlayIcon,
  PrinterIcon,
  ShareIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline'
import { TemplateWithSteps, TemplateCategory } from '@/lib/types/database'
import { useTemplateStore } from '@/lib/stores/useTemplateStore'
import { useAppStore } from '@/lib/stores/useAppStore'
import { templateService } from '@/lib/services/TemplateService'
import { CreateTemplateModal } from '@/components/planning/CreateTemplateModal'
import { EditTemplateModal } from '@/components/templates/EditTemplateModal'
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

const categoryIcons: Record<TemplateCategory, string> = {
  morning: '🌅',
  evening: '🌙',
  household: '🏠',
  childcare: '👶',
  shopping: '🛒',
  work: '💼',
  personal: '⭐',
  health: '🏥',
  travel: '✈️',
  custom: '📝'
}

export function SOPView() {
  const { currentFamilyId } = useAppStore()
  const { templates, setTemplates } = useTemplateStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | 'all'>('all')
  const [expandedTemplates, setExpandedTemplates] = useState<Set<string>>(new Set())
  const [completedSteps, setCompletedSteps] = useState<Record<string, Set<string>>>({})
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<TemplateWithSteps | null>(null)
  const [executingTemplate, setExecutingTemplate] = useState<string | null>(null)

  // Load templates on mount
  useEffect(() => {
    const loadTemplates = async () => {
      if (!currentFamilyId) return
      
      try {
        const familyTemplates = await templateService.getTemplatesByFamily(currentFamilyId)
        setTemplates(familyTemplates)
      } catch (error) {
        console.error('Error loading templates:', error)
      }
    }

    loadTemplates()
  }, [currentFamilyId, setTemplates])

  // Filter templates
  const filteredTemplates = templates.filter(template => {
    // Category filter
    if (selectedCategory !== 'all' && template.category !== selectedCategory) {
      return false
    }
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        template.title.toLowerCase().includes(query) ||
        template.description?.toLowerCase().includes(query) ||
        template.template_steps.some(step =>
          step.title.toLowerCase().includes(query) ||
          step.description?.toLowerCase().includes(query)
        )
      )
    }
    
    return true
  })

  // Group templates by category
  const templatesByCategory = filteredTemplates.reduce((acc, template) => {
    if (!acc[template.category]) {
      acc[template.category] = []
    }
    acc[template.category].push(template)
    return acc
  }, {} as Record<TemplateCategory, TemplateWithSteps[]>)

  const toggleTemplate = (templateId: string) => {
    setExpandedTemplates(prev => {
      const next = new Set(prev)
      if (next.has(templateId)) {
        next.delete(templateId)
      } else {
        next.add(templateId)
      }
      return next
    })
  }

  const toggleStep = (templateId: string, stepId: string) => {
    setCompletedSteps(prev => {
      const templateSteps = prev[templateId] || new Set()
      const next = new Set(templateSteps)
      if (next.has(stepId)) {
        next.delete(stepId)
      } else {
        next.add(stepId)
      }
      return { ...prev, [templateId]: next }
    })
  }

  const startExecution = (templateId: string) => {
    setExecutingTemplate(templateId)
    setExpandedTemplates(new Set([templateId]))
    setCompletedSteps(prev => ({ ...prev, [templateId]: new Set() }))
  }

  const stopExecution = (templateId: string) => {
    setExecutingTemplate(null)
    setCompletedSteps(prev => {
      const next = { ...prev }
      delete next[templateId]
      return next
    })
  }

  const handlePrint = (template: TemplateWithSteps) => {
    // Simple print implementation
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>${template.title}</title>
            <style>
              body { font-family: system-ui, -apple-system, sans-serif; padding: 20px; }
              h1 { color: #1a1a1a; }
              .step { margin: 10px 0; padding: 10px; border-left: 3px solid #3b82f6; }
              .step-title { font-weight: 600; }
              .step-description { color: #666; margin-top: 5px; }
            </style>
          </head>
          <body>
            <h1>${template.title}</h1>
            ${template.description ? `<p>${template.description}</p>` : ''}
            <div style="margin-top: 20px;">
              ${template.template_steps.map(step => `
                <div class="step">
                  <div class="step-title">☐ ${step.title}</div>
                  ${step.description ? `<div class="step-description">${step.description}</div>` : ''}
                </div>
              `).join('')}
            </div>
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
    }
  }

  const handleDelete = async (template: TemplateWithSteps) => {
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
      <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-background">
        <div className="px-6 py-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-foreground mb-2">
                    Standard Operating Procedures
                  </h1>
                  <p className="text-muted-foreground">
                    Quick reference guides and checklists for your family routines
                  </p>
                </div>
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 flex items-center gap-2"
                >
                  <PlusIcon className="h-5 w-5" />
                  Create SOP
                </button>
              </div>

              {/* Search and Filters */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search procedures..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-input rounded-lg bg-background text-foreground"
                  />
                </div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value as TemplateCategory | 'all')}
                  className="px-4 py-2 border border-input rounded-lg bg-background text-foreground"
                >
                  <option value="all">All Categories</option>
                  {Object.entries(categoryLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {categoryIcons[value as TemplateCategory]} {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Templates Grid */}
            {Object.keys(templatesByCategory).length === 0 ? (
              <div className="text-center py-12">
                <BookOpenIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg text-muted-foreground">
                  No procedures found. Create your first SOP to get started.
                </p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {Object.entries(templatesByCategory).map(([category, categoryTemplates]) => (
                  <div key={category} className="space-y-4">
                    <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                      <span>{categoryIcons[category as TemplateCategory]}</span>
                      {categoryLabels[category as TemplateCategory]}
                      <span className="text-sm text-muted-foreground">({categoryTemplates.length})</span>
                    </h2>
                    
                    {categoryTemplates.map(template => (
                      <motion.div
                        key={template.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-card border border-border rounded-lg shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h3 className="font-semibold text-card-foreground">
                                {template.title}
                              </h3>
                              {template.description && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {template.description}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              {executingTemplate === template.id ? (
                                <button
                                  onClick={() => stopExecution(template.id)}
                                  className="p-1.5 text-destructive hover:bg-destructive/10 rounded"
                                  title="Stop execution"
                                >
                                  <CheckCircleIcon className="h-4 w-4" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => startExecution(template.id)}
                                  className="p-1.5 text-primary hover:bg-primary/10 rounded"
                                  title="Start execution"
                                >
                                  <PlayIcon className="h-4 w-4" />
                                </button>
                              )}
                              <button
                                onClick={() => handlePrint(template)}
                                className="p-1.5 text-muted-foreground hover:text-foreground rounded"
                                title="Print"
                              >
                                <PrinterIcon className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => setEditingTemplate(template)}
                                className="p-1.5 text-muted-foreground hover:text-foreground rounded"
                                title="Edit"
                              >
                                <PencilIcon className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(template)}
                                className="p-1.5 text-destructive hover:bg-destructive/10 rounded"
                                title="Delete"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>
                          </div>

                          {/* Steps count */}
                          <div className="flex items-center justify-between">
                            <button
                              onClick={() => toggleTemplate(template.id)}
                              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                            >
                              {expandedTemplates.has(template.id) ? (
                                <ChevronDownIcon className="h-4 w-4" />
                              ) : (
                                <ChevronRightIcon className="h-4 w-4" />
                              )}
                              {template.template_steps.length} steps
                              {executingTemplate === template.id && (
                                <span className="text-primary">
                                  ({completedSteps[template.id]?.size || 0}/{template.template_steps.length})
                                </span>
                              )}
                            </button>
                            {template.is_system && (
                              <span className="text-xs text-primary font-medium">System</span>
                            )}
                          </div>

                          {/* Expanded Steps */}
                          <AnimatePresence>
                            {expandedTemplates.has(template.id) && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="mt-3 space-y-2"
                              >
                                {(() => {
                                  // Group steps by section
                                  const sections: Record<string, typeof template.template_steps> = {}
                                  const unsectionedSteps: typeof template.template_steps = []
                                  
                                  template.template_steps.forEach(step => {
                                    const section = step.metadata?.section
                                    if (section) {
                                      if (!sections[section]) sections[section] = []
                                      sections[section].push(step)
                                    } else {
                                      unsectionedSteps.push(step)
                                    }
                                  })
                                  
                                  // Sort sections by their order
                                  const sortedSections = Object.entries(sections).sort((a, b) => {
                                    const orderA = a[1][0]?.metadata?.sectionOrder || 0
                                    const orderB = b[1][0]?.metadata?.sectionOrder || 0
                                    return orderA - orderB
                                  })
                                  
                                  const isExecuting = executingTemplate === template.id
                                  let stepIndex = 0
                                  
                                  return (
                                    <>
                                      {/* Render unsectioned steps first if any */}
                                      {unsectionedSteps.length > 0 && unsectionedSteps.map((step) => {
                                        const isCompleted = completedSteps[template.id]?.has(step.id) || false
                                        stepIndex++
                                        const currentIndex = stepIndex
                                        
                                        return (
                                          <div
                                            key={step.id}
                                            className={cn(
                                              "flex items-start gap-2 p-2 rounded-md transition-colors",
                                              isExecuting && "hover:bg-accent cursor-pointer",
                                              isCompleted && "opacity-60"
                                            )}
                                            onClick={() => isExecuting && toggleStep(template.id, step.id)}
                                          >
                                            {isExecuting ? (
                                              <div className="mt-0.5">
                                                {isCompleted ? (
                                                  <CheckCircleIcon className="h-4 w-4 text-primary" />
                                                ) : (
                                                  <div className="h-4 w-4 border-2 border-muted-foreground rounded" />
                                                )}
                                              </div>
                                            ) : (
                                              <span className="text-xs text-muted-foreground mt-0.5">
                                                {currentIndex}.
                                              </span>
                                            )}
                                            <div className="flex-1">
                                              <p className={cn(
                                                "text-sm",
                                                isCompleted && "line-through"
                                              )}>
                                                {step.title}
                                              </p>
                                              {step.description && (
                                                <p className="text-xs text-muted-foreground mt-0.5">
                                                  {step.description}
                                                </p>
                                              )}
                                            </div>
                                          </div>
                                        )
                                      })}
                                      
                                      {/* Render sectioned steps */}
                                      {sortedSections.map(([sectionName, sectionSteps]) => (
                                        <div key={sectionName} className="space-y-2">
                                          <div className="font-medium text-sm text-primary mt-3 mb-1 flex items-center gap-2">
                                            <ChevronRightIcon className="h-4 w-4" />
                                            {sectionName}
                                          </div>
                                          <div className="ml-4 space-y-2">
                                            {sectionSteps.map((step) => {
                                              const isCompleted = completedSteps[template.id]?.has(step.id) || false
                                              stepIndex++
                                              const currentIndex = stepIndex
                                              
                                              return (
                                                <div
                                                  key={step.id}
                                                  className={cn(
                                                    "flex items-start gap-2 p-2 rounded-md transition-colors",
                                                    isExecuting && "hover:bg-accent cursor-pointer",
                                                    isCompleted && "opacity-60"
                                                  )}
                                                  onClick={() => isExecuting && toggleStep(template.id, step.id)}
                                                >
                                                  {isExecuting ? (
                                                    <div className="mt-0.5">
                                                      {isCompleted ? (
                                                        <CheckCircleIcon className="h-4 w-4 text-primary" />
                                                      ) : (
                                                        <div className="h-4 w-4 border-2 border-muted-foreground rounded" />
                                                      )}
                                                    </div>
                                                  ) : (
                                                    <span className="text-xs text-muted-foreground mt-0.5">
                                                      {currentIndex}.
                                                    </span>
                                                  )}
                                                  <div className="flex-1">
                                                    <p className={cn(
                                                      "text-sm",
                                                      isCompleted && "line-through"
                                                    )}>
                                                      {step.title}
                                                    </p>
                                                    {step.description && (
                                                      <p className="text-xs text-muted-foreground mt-0.5">
                                                        {step.description}
                                                      </p>
                                                    )}
                                                  </div>
                                                </div>
                                              )
                                            })}
                                          </div>
                                        </div>
                                      ))}
                                    </>
                                  )
                                })()}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Modal */}
      <CreateTemplateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      {/* Edit Modal */}
      {editingTemplate && (
        <EditTemplateModal
          template={editingTemplate}
          isOpen={!!editingTemplate}
          onClose={() => setEditingTemplate(null)}
          mode="permanent"
        />
      )}
    </>
  )
}