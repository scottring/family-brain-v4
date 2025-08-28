'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, 
  Filter, 
  BookOpen, 
  Phone, 
  ExternalLink, 
  Info, 
  X,
  Sparkles,
  Tag,
  FileText,
  Layers,
  Plus,
  Edit,
  Trash2,
  Play,
  Copy,
  CheckCircle2,
  Circle,
  MoreVertical
} from 'lucide-react'
import { templateService } from '@/lib/services/TemplateService'
import { familyService } from '@/lib/services/FamilyService'
import { TemplateWithSteps, TemplateCategory } from '@/lib/types/database'
import { createClient } from '@/lib/supabase/client'
import { AppShell } from '@/components/common/AppShell'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { TemplateEditor } from './TemplateEditor'

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
      
      // Load templates using API
      await loadTemplates()
    } catch (err) {
      console.error('Error loading initial data:', err)
      setError('Failed to load templates')
    } finally {
      setLoading(false)
    }
  }

  const loadTemplates = async () => {
    try {
      const response = await fetch('/api/templates', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch templates')
      }

      const result = await response.json()
      setTemplates(result.data.templates || [])
    } catch (err) {
      console.error('Error loading templates:', err)
      throw err
    }
  }

  const handleSearch = async (query: string) => {
    setSearchQuery(query)
    if (query.trim()) {
      try {
        const response = await fetch(`/api/templates?search=${encodeURIComponent(query)}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        })

        if (response.ok) {
          const result = await response.json()
          setTemplates(result.data.templates || [])
        }
      } catch (err) {
        console.error('Error searching templates:', err)
      }
    } else {
      await loadTemplates()
    }
  }

  const handleCategoryFilter = async (category: TemplateCategory | 'all') => {
    setSelectedCategory(category)
    try {
      let url = '/api/templates'
      if (category !== 'all') {
        url += `?category=${category}`
      }
      if (searchQuery.trim()) {
        url += `${category !== 'all' ? '&' : '?'}search=${encodeURIComponent(searchQuery)}`
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const result = await response.json()
        setTemplates(result.data.templates || [])
      }
    } catch (err) {
      console.error('Error filtering templates:', err)
    }
  }

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) {
      return
    }

    try {
      const response = await fetch(`/api/templates/${templateId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        await loadTemplates()
      } else {
        const result = await response.json()
        alert(result.message || 'Failed to delete template')
      }
    } catch (err) {
      console.error('Error deleting template:', err)
      alert('Failed to delete template')
    }
  }

  const handleDuplicateTemplate = async (template: TemplateWithSteps) => {
    try {
      const response = await fetch(`/api/templates/${template.id}/duplicate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        await loadTemplates()
      } else {
        const result = await response.json()
        alert(result.message || 'Failed to duplicate template')
      }
    } catch (err) {
      console.error('Error duplicating template:', err)
      alert('Failed to duplicate template')
    }
  }

  const handleStartQuickExecution = (template: TemplateWithSteps) => {
    setQuickExecuteTemplate(template)
    const initialSteps: Record<string, boolean> = {}
    template.template_steps?.forEach(step => {
      initialSteps[step.id] = false
    })
    setExecutionSteps(initialSteps)
  }

  const toggleExecutionStep = (stepId: string) => {
    setExecutionSteps(prev => ({
      ...prev,
      [stepId]: !prev[stepId]
    }))
  }

  const handleCreateTemplate = async (templateData: TemplateWithSteps) => {
    try {
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: templateData.title,
          description: templateData.description,
          category: templateData.category,
          icon: templateData.icon,
          color: templateData.color
        })
      })

      if (response.ok) {
        const result = await response.json()
        const newTemplateId = result.data.template.id

        // Create steps if any
        if (templateData.template_steps && templateData.template_steps.length > 0) {
          for (const step of templateData.template_steps) {
            await fetch(`/api/templates/${newTemplateId}/steps`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                title: step.title,
                description: step.description,
                step_type: step.step_type,
                order_position: step.order_position,
                metadata: step.metadata
              })
            })
          }
        }

        await loadTemplates()
      } else {
        const result = await response.json()
        throw new Error(result.message || 'Failed to create template')
      }
    } catch (error) {
      console.error('Error creating template:', error)
      throw error
    }
  }

  const handleUpdateTemplate = async (templateData: TemplateWithSteps) => {
    try {
      // Update template basic info
      const response = await fetch(`/api/templates/${templateData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: templateData.title,
          description: templateData.description,
          category: templateData.category,
          icon: templateData.icon,
          color: templateData.color
        })
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.message || 'Failed to update template')
      }

      // For now, we'll just reload. In a more sophisticated implementation,
      // we'd handle step CRUD operations individually
      await loadTemplates()
    } catch (error) {
      console.error('Error updating template:', error)
      throw error
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
      <AppShell>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full"></div>
            <p className="text-muted-foreground">Loading your template library...</p>
          </div>
        </div>
      </AppShell>
    )
  }

  if (error) {
    return (
      <AppShell>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Card className="max-w-md w-full mx-4">
            <CardContent className="text-center p-8">
              <div className="text-4xl mb-4">⚠️</div>
              <CardTitle className="text-destructive mb-2">Error</CardTitle>
              <CardDescription className="mb-4">{error}</CardDescription>
              <Button onClick={loadData}>
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-background">
        {/* Hero Section */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-pattern opacity-5" />
          <div className="relative px-6 py-12">
            <div className="max-w-7xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-center mb-12"
              >
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary/20 to-primary/30 rounded-2xl mb-6">
                  <BookOpen className="h-10 w-10 text-primary" />
                </div>
                <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
                  Template
                  <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent ml-2">
                    Library
                  </span>
                </h1>
                <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                  Your family's collection of standard operating procedures and templates. 
                  Quick access to routines that keep your household running smoothly.
                </p>
                <div className="flex items-center justify-center mt-8 space-x-4">
                  <Badge variant="secondary" className="text-sm px-3 py-1">
                    <Layers className="w-3 h-3 mr-1" />
                    {filteredTemplates.length} Template{filteredTemplates.length !== 1 ? 's' : ''}
                  </Badge>
                  <Badge variant="outline" className="text-sm px-3 py-1">
                    Quick Reference
                  </Badge>
                  <Button 
                    onClick={() => setShowCreateTemplate(true)}
                    variant="default"
                    size="sm"
                    className="ml-4"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    New Template
                  </Button>
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="px-6 pb-8">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card className="border-border/50 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search templates..."
                        value={searchQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <div className="relative">
                      <Filter className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <select
                        value={selectedCategory}
                        onChange={(e) => handleCategoryFilter(e.target.value as TemplateCategory | 'all')}
                        className="pl-10 pr-4 py-2 border border-input rounded-md bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
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
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>

        {/* Templates Grid */}
        <div className="px-6 pb-12">
          <div className="max-w-7xl mx-auto">
            {filteredTemplates.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-center py-16"
              >
                <Card className="border-border/50 shadow-lg">
                  <CardContent className="p-12">
                    <div className="text-6xl mb-6">📝</div>
                    <CardTitle className="text-2xl mb-4">No templates found</CardTitle>
                    <CardDescription className="text-lg">
                      {searchQuery || selectedCategory !== 'all' 
                        ? 'Try adjusting your search or filter criteria'
                        : 'No templates available yet'
                      }
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <div className="space-y-12">
                {Object.entries(templatesByCategory).map(([category, categoryTemplates]) => (
                  <motion.div
                    key={category}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                  >
                    <div className="flex items-center mb-6">
                      <div className="flex items-center space-x-3">
                        <span className="text-3xl">
                          {CATEGORY_ICONS[category as TemplateCategory] || '📄'}
                        </span>
                        <div>
                          <h2 className="text-2xl font-bold text-foreground">
                            {CATEGORY_LABELS[category as TemplateCategory] || category}
                          </h2>
                          <p className="text-muted-foreground">
                            {categoryTemplates.length} template{categoryTemplates.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                      {categoryTemplates.map((template, index) => (
                        <motion.div
                          key={template.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.4, delay: 0.4 + index * 0.05 }}
                        >
                          <Card className="relative border-border/50 hover:border-primary/30 hover:shadow-xl transition-all duration-300 group">
                            <div 
                              onClick={() => setSelectedTemplate(template)}
                              className="cursor-pointer"
                            >
                              <CardHeader className="pb-4">
                                <div className="flex items-start justify-between">
                                  <CardTitle className="group-hover:text-primary transition-colors pr-8">
                                    {template.title}
                                  </CardTitle>
                                  <span className="text-2xl flex-shrink-0 ml-3">
                                    {template.icon || '📄'}
                                  </span>
                                </div>
                                {template.description && (
                                  <CardDescription className="text-base">
                                    {template.description}
                                  </CardDescription>
                                )}
                              </CardHeader>
                              <CardContent className="pt-0">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-2">
                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm text-muted-foreground">
                                      {template.template_steps?.length || 0} steps
                                    </span>
                                  </div>
                                  {template.is_system && (
                                    <Badge variant="secondary" className="text-xs">
                                      <Sparkles className="w-3 h-3 mr-1" />
                                      System
                                    </Badge>
                                  )}
                                </div>
                              </CardContent>
                            </div>
                            
                            {/* Action Menu */}
                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-8 w-8 p-0"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleStartQuickExecution(template); }}>
                                    <Play className="mr-2 h-4 w-4" />
                                    Quick Execute
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setSelectedTemplate(template); }}>
                                    <Info className="mr-2 h-4 w-4" />
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  {!template.is_system && (
                                    <>
                                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setEditingTemplate(template); }}>
                                        <Edit className="mr-2 h-4 w-4" />
                                        Edit Template
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDuplicateTemplate(template); }}>
                                        <Copy className="mr-2 h-4 w-4" />
                                        Duplicate
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem 
                                        onClick={(e) => { e.stopPropagation(); handleDeleteTemplate(template.id); }}
                                        className="text-destructive focus:text-destructive"
                                      >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                  {template.is_system && (
                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDuplicateTemplate(template); }}>
                                      <Copy className="mr-2 h-4 w-4" />
                                      Copy to Family
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Template Detail Modal */}
        <Dialog open={!!selectedTemplate} onOpenChange={() => setSelectedTemplate(null)}>
          {selectedTemplate && (
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-3xl">{selectedTemplate.icon || '📄'}</span>
                    <div>
                      <DialogTitle className="text-2xl">
                        {selectedTemplate.title}
                      </DialogTitle>
                      {selectedTemplate.description && (
                        <DialogDescription className="text-lg mt-2">
                          {selectedTemplate.description}
                        </DialogDescription>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => {
                        setSelectedTemplate(null)
                        handleStartQuickExecution(selectedTemplate)
                      }}
                      variant="default"
                      size="sm"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Quick Execute
                    </Button>
                    {!selectedTemplate.is_system && (
                      <Button
                        onClick={() => {
                          setSelectedTemplate(null)
                          setEditingTemplate(selectedTemplate)
                        }}
                        variant="outline"
                        size="sm"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                    )}
                  </div>
                </div>
              </DialogHeader>

              <Separator className="my-4" />

              <div className="overflow-y-auto max-h-[60vh] pr-2">
                {selectedTemplate.template_steps && selectedTemplate.template_steps.length > 0 ? (
                  <div className="space-y-6">
                    {selectedTemplate.template_steps.map((step, index) => (
                      <motion.div
                        key={step.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className="flex items-start space-x-4 p-4 rounded-xl bg-accent/20 border border-border/30"
                      >
                        <div className="flex-shrink-0 w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-semibold">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <h4 className="font-semibold text-foreground text-lg">{step.title}</h4>
                            {step.step_type === 'resource' && (
                              <Badge variant="secondary" className="ml-2">
                                <ExternalLink className="w-3 h-3 mr-1" />
                                Resource
                              </Badge>
                            )}
                            {step.step_type === 'note' && (
                              <Badge variant="outline" className="ml-2">
                                <Info className="w-3 h-3 mr-1" />
                                Note
                              </Badge>
                            )}
                          </div>
                          {step.description && (
                            <p className="text-muted-foreground mb-3">{step.description}</p>
                          )}
                          
                          {/* Show metadata for resources */}
                          {step.metadata && Object.keys(step.metadata).length > 0 && (
                            <div className="mt-3 p-4 bg-card rounded-lg border border-border/50 space-y-2">
                              {step.metadata.phone && (
                                <div className="flex items-center space-x-2">
                                  <Phone className="w-4 h-4 text-primary" />
                                  <a href={`tel:${step.metadata.phone}`} className="text-primary hover:underline font-medium">
                                    {step.metadata.phone}
                                  </a>
                                </div>
                              )}
                              {step.metadata.url && (
                                <div className="flex items-center space-x-2">
                                  <ExternalLink className="w-4 h-4 text-primary" />
                                  <a href={step.metadata.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">
                                    Open Link
                                  </a>
                                </div>
                              )}
                              {step.metadata.note && (
                                <div className="flex items-start space-x-2">
                                  <Info className="w-4 h-4 text-muted-foreground mt-0.5" />
                                  <p className="text-muted-foreground text-sm">
                                    {step.metadata.note}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground text-lg">No steps defined for this template.</p>
                  </div>
                )}
              </div>

              <Separator className="my-4" />

              <div className="flex justify-end">
                <Button onClick={() => setSelectedTemplate(null)} size="lg">
                  Close
                </Button>
              </div>
            </DialogContent>
          )}
        </Dialog>

        {/* Quick Execute Modal */}
        <Dialog open={!!quickExecuteTemplate} onOpenChange={() => { setQuickExecuteTemplate(null); setExecutionSteps({}); }}>
          {quickExecuteTemplate && (
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
              <DialogHeader>
                <div className="flex items-center space-x-3">
                  <span className="text-3xl">{quickExecuteTemplate.icon || '📄'}</span>
                  <div>
                    <DialogTitle className="text-2xl">
                      Quick Execute: {quickExecuteTemplate.title}
                    </DialogTitle>
                    <DialogDescription className="text-lg mt-2">
                      Complete each step and check it off as you go
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <Separator className="my-4" />

              <div className="overflow-y-auto max-h-[60vh] pr-2">
                {quickExecuteTemplate.template_steps && quickExecuteTemplate.template_steps.length > 0 ? (
                  <div className="space-y-4">
                    {quickExecuteTemplate.template_steps.map((step, index) => (
                      <div
                        key={step.id}
                        className={cn(
                          "flex items-start space-x-4 p-4 rounded-xl border transition-all duration-200",
                          executionSteps[step.id] 
                            ? "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800" 
                            : "bg-accent/20 border-border/30"
                        )}
                      >
                        <button
                          onClick={() => toggleExecutionStep(step.id)}
                          className="flex-shrink-0 mt-1"
                        >
                          {executionSteps[step.id] ? (
                            <CheckCircle2 className="w-6 h-6 text-green-600" />
                          ) : (
                            <Circle className="w-6 h-6 text-muted-foreground hover:text-primary transition-colors" />
                          )}
                        </button>
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <span className="text-sm text-muted-foreground mr-3">#{index + 1}</span>
                            <h4 className={cn(
                              "font-semibold text-lg",
                              executionSteps[step.id] 
                                ? "text-green-700 dark:text-green-300 line-through" 
                                : "text-foreground"
                            )}>
                              {step.title}
                            </h4>
                            {step.step_type === 'resource' && (
                              <Badge variant="secondary" className="ml-2">
                                <ExternalLink className="w-3 h-3 mr-1" />
                                Resource
                              </Badge>
                            )}
                            {step.step_type === 'note' && (
                              <Badge variant="outline" className="ml-2">
                                <Info className="w-3 h-3 mr-1" />
                                Note
                              </Badge>
                            )}
                          </div>
                          {step.description && (
                            <p className="text-muted-foreground mb-3">{step.description}</p>
                          )}
                          
                          {/* Show metadata for resources */}
                          {step.metadata && Object.keys(step.metadata).length > 0 && (
                            <div className="mt-3 p-3 bg-card rounded-lg border border-border/50 space-y-2">
                              {step.metadata.phone && (
                                <div className="flex items-center space-x-2">
                                  <Phone className="w-4 h-4 text-primary" />
                                  <a href={`tel:${step.metadata.phone}`} className="text-primary hover:underline font-medium">
                                    {step.metadata.phone}
                                  </a>
                                </div>
                              )}
                              {step.metadata.url && (
                                <div className="flex items-center space-x-2">
                                  <ExternalLink className="w-4 h-4 text-primary" />
                                  <a href={step.metadata.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">
                                    Open Link
                                  </a>
                                </div>
                              )}
                              {step.metadata.note && (
                                <div className="flex items-start space-x-2">
                                  <Info className="w-4 h-4 text-muted-foreground mt-0.5" />
                                  <p className="text-muted-foreground text-sm">
                                    {step.metadata.note}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground text-lg">No steps defined for this template.</p>
                  </div>
                )}
              </div>

              <Separator className="my-4" />

              <div className="flex justify-between items-center">
                <div className="text-sm text-muted-foreground">
                  {Object.values(executionSteps).filter(Boolean).length} of {quickExecuteTemplate.template_steps?.length || 0} steps completed
                </div>
                <div className="flex space-x-2">
                  <Button 
                    onClick={() => { setQuickExecuteTemplate(null); setExecutionSteps({}); }} 
                    variant="outline"
                  >
                    Close
                  </Button>
                  {Object.values(executionSteps).every(Boolean) && Object.keys(executionSteps).length > 0 && (
                    <Button onClick={() => { setQuickExecuteTemplate(null); setExecutionSteps({}); }}>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Complete
                    </Button>
                  )}
                </div>
              </div>
            </DialogContent>
          )}
        </Dialog>

        {/* Create Template Modal */}
        <TemplateEditor
          template={null}
          isOpen={showCreateTemplate}
          onClose={() => setShowCreateTemplate(false)}
          onSave={handleCreateTemplate}
          isNew={true}
        />

        {/* Edit Template Modal */}
        <TemplateEditor
          template={editingTemplate}
          isOpen={!!editingTemplate}
          onClose={() => setEditingTemplate(null)}
          onSave={handleUpdateTemplate}
          isNew={false}
        />
      </div>
    </AppShell>
  )
}