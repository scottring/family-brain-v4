'use client'

import { useState, useEffect } from 'react'
import { templateService } from '@/lib/services/TemplateService'
import { familyService } from '@/lib/services/FamilyService'
import { TemplateWithSteps, TemplateCategory } from '@/lib/types/database'
import { createClient } from '@/lib/supabase/client'

const CATEGORY_LABELS: Record<TemplateCategory, string> = {
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

const CATEGORY_ICONS: Record<TemplateCategory, string> = {
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
  const [templates, setTemplates] = useState<TemplateWithSteps[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateWithSteps | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | 'all'>('all')
  const [familyId, setFamilyId] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Get user's families
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const families = await familyService.getFamiliesByUser(user.id)
        if (families.length > 0) {
          setFamilyId(families[0].id) // Use first family for now
        }
      }
      
      // Load all templates (system + family)
      const allTemplates = await templateService.getTemplatesByFamily(familyId || undefined)
      setTemplates(allTemplates)
    } catch (err) {
      console.error('Error loading templates:', err)
      setError('Failed to load templates')
    } finally {
      setLoading(false)
    }
  }

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = !searchQuery || 
      template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (template.description && template.description.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory
    
    return matchesSearch && matchesCategory
  })

  const templatesByCategory = filteredTemplates.reduce((acc, template) => {
    if (!acc[template.category]) {
      acc[template.category] = []
    }
    acc[template.category].push(template)
    return acc
  }, {} as Record<TemplateCategory, TemplateWithSteps[]>)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading templates...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow max-w-md w-full mx-4">
          <div className="text-red-600 text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold mb-2">Error</h2>
            <p>{error}</p>
            <button 
              onClick={loadData}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Quick Reference SOPs</h1>
            <div className="text-sm text-gray-600">
              {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filter */}
        <div className="mb-8 bg-white p-6 rounded-lg shadow">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as TemplateCategory | 'all')}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Categories</option>
                {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Templates Grid */}
        {filteredTemplates.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">No templates found</h3>
            <p className="text-gray-600">
              {searchQuery || selectedCategory !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'No templates available yet'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(templatesByCategory).map(([category, categoryTemplates]) => (
              <div key={category}>
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <span className="mr-2">
                    {CATEGORY_ICONS[category as TemplateCategory] || '📄'}
                  </span>
                  {CATEGORY_LABELS[category as TemplateCategory] || category}
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    ({categoryTemplates.length})
                  </span>
                </h2>
                
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {categoryTemplates.map((template) => (
                    <div
                      key={template.id}
                      onClick={() => setSelectedTemplate(template)}
                      className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer border border-gray-200"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-semibold text-gray-900">{template.title}</h3>
                        <span className="text-2xl">{template.icon || '📄'}</span>
                      </div>
                      
                      {template.description && (
                        <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                      )}
                      
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>{template.template_steps?.length || 0} steps</span>
                        {template.is_system && (
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                            System
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Template Detail Modal */}
      {selectedTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">{selectedTemplate.icon || '📄'}</span>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      {selectedTemplate.title}
                    </h2>
                    {selectedTemplate.description && (
                      <p className="text-sm text-gray-600">{selectedTemplate.description}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedTemplate(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="px-6 py-4 overflow-y-auto max-h-[60vh]">
              {selectedTemplate.template_steps && selectedTemplate.template_steps.length > 0 ? (
                <div className="space-y-4">
                  {selectedTemplate.template_steps.map((step, index) => (
                    <div key={step.id} className="flex items-start">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-sm font-medium mr-3">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center mb-1">
                          <h4 className="font-medium text-gray-900">{step.title}</h4>
                          {step.step_type === 'resource' && (
                            <span className="ml-2 bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                              Resource
                            </span>
                          )}
                          {step.step_type === 'note' && (
                            <span className="ml-2 bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">
                              Note
                            </span>
                          )}
                        </div>
                        {step.description && (
                          <p className="text-sm text-gray-600">{step.description}</p>
                        )}
                        
                        {/* Show metadata for resources */}
                        {step.metadata && Object.keys(step.metadata).length > 0 && (
                          <div className="mt-2 p-3 bg-gray-50 rounded text-sm">
                            {step.metadata.phone && (
                              <div className="mb-1">
                                📞 <a href={`tel:${step.metadata.phone}`} className="text-blue-600">
                                  {step.metadata.phone}
                                </a>
                              </div>
                            )}
                            {step.metadata.url && (
                              <div className="mb-1">
                                🔗 <a href={step.metadata.url} target="_blank" rel="noopener noreferrer" className="text-blue-600">
                                  Link
                                </a>
                              </div>
                            )}
                            {step.metadata.note && (
                              <div className="text-gray-600">
                                ℹ️ {step.metadata.note}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No steps defined for this template.</p>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-200">
              <button
                onClick={() => setSelectedTemplate(null)}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}