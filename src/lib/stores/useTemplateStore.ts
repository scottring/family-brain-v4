import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import {
  TemplateWithSteps,
  TemplateCategory,
  TemplateInstanceWithSteps
} from '@/lib/types/database'

interface TemplateState {
  // Template data
  templates: TemplateWithSteps[]
  templatesById: Record<string, TemplateWithSteps>
  templatesByCategory: Record<TemplateCategory, TemplateWithSteps[]>
  
  // Search and filters
  searchQuery: string
  selectedCategory: TemplateCategory | 'all'
  showSystemTemplates: boolean
  showFamilyTemplates: boolean
  
  // Template editor state
  editingTemplate: TemplateWithSteps | null
  isCreatingTemplate: boolean
  
  // SOP view state
  selectedTemplateId: string | null
  quickExecutionTemplate: TemplateWithSteps | null
  quickExecutionSteps: Record<string, boolean> // stepId -> completed
  
  // Actions
  setTemplates: (templates: TemplateWithSteps[]) => void
  addTemplate: (template: TemplateWithSteps) => void
  updateTemplate: (templateId: string, updates: Partial<TemplateWithSteps>) => void
  removeTemplate: (templateId: string) => void
  setSearchQuery: (query: string) => void
  setSelectedCategory: (category: TemplateCategory | 'all') => void
  setShowSystemTemplates: (show: boolean) => void
  setShowFamilyTemplates: (show: boolean) => void
  setEditingTemplate: (template: TemplateWithSteps | null) => void
  setIsCreatingTemplate: (creating: boolean) => void
  setSelectedTemplateId: (id: string | null) => void
  setQuickExecutionTemplate: (template: TemplateWithSteps | null) => void
  toggleQuickExecutionStep: (stepId: string) => void
  resetQuickExecutionSteps: () => void
  getFilteredTemplates: () => TemplateWithSteps[]
  reset: () => void
}

const initialState = {
  templates: [],
  templatesById: {},
  templatesByCategory: {} as Record<TemplateCategory, TemplateWithSteps[]>,
  searchQuery: '',
  selectedCategory: 'all' as const,
  showSystemTemplates: true,
  showFamilyTemplates: true,
  editingTemplate: null,
  isCreatingTemplate: false,
  selectedTemplateId: null,
  quickExecutionTemplate: null,
  quickExecutionSteps: {}
}

export const useTemplateStore = create<TemplateState>()(
  devtools(
    (set, get) => ({
      ...initialState,
      
      setTemplates: (templates) => {
        const templatesById: Record<string, TemplateWithSteps> = {}
        const templatesByCategory: Record<TemplateCategory, TemplateWithSteps[]> = {
          morning: [],
          evening: [],
          household: [],
          childcare: [],
          shopping: [],
          work: [],
          personal: [],
          health: [],
          travel: [],
          custom: []
        }
        
        templates.forEach(template => {
          templatesById[template.id] = template
          if (!templatesByCategory[template.category]) {
            templatesByCategory[template.category] = []
          }
          templatesByCategory[template.category].push(template)
        })
        
        set({
          templates,
          templatesById,
          templatesByCategory
        }, false, 'setTemplates')
      },
      
      addTemplate: (template) => set(
        state => {
          const templates = [...state.templates, template]
          const templatesById = { ...state.templatesById, [template.id]: template }
          const categoryTemplates = state.templatesByCategory[template.category] || []
          const templatesByCategory = {
            ...state.templatesByCategory,
            [template.category]: [...categoryTemplates, template]
          }
          
          return {
            templates,
            templatesById,
            templatesByCategory
          }
        },
        false,
        'addTemplate'
      ),
      
      updateTemplate: (templateId, updates) => set(
        state => {
          const existingTemplate = state.templatesById[templateId]
          if (!existingTemplate) return state
          
          const updatedTemplate = { ...existingTemplate, ...updates }
          const templates = state.templates.map(t => 
            t.id === templateId ? updatedTemplate : t
          )
          const templatesById = { ...state.templatesById, [templateId]: updatedTemplate }
          
          // Update category arrays if category changed
          let templatesByCategory = state.templatesByCategory
          if (updates.category && updates.category !== existingTemplate.category) {
            templatesByCategory = {
              ...templatesByCategory,
              [existingTemplate.category]: templatesByCategory[existingTemplate.category].filter(t => t.id !== templateId),
              [updates.category]: [...(templatesByCategory[updates.category] || []), updatedTemplate]
            }
          } else {
            templatesByCategory = {
              ...templatesByCategory,
              [existingTemplate.category]: templatesByCategory[existingTemplate.category].map(t =>
                t.id === templateId ? updatedTemplate : t
              )
            }
          }
          
          return {
            templates,
            templatesById,
            templatesByCategory
          }
        },
        false,
        'updateTemplate'
      ),
      
      removeTemplate: (templateId) => set(
        state => {
          const template = state.templatesById[templateId]
          if (!template) return state
          
          const templates = state.templates.filter(t => t.id !== templateId)
          const { [templateId]: removed, ...templatesById } = state.templatesById
          const templatesByCategory = {
            ...state.templatesByCategory,
            [template.category]: state.templatesByCategory[template.category].filter(t => t.id !== templateId)
          }
          
          return {
            templates,
            templatesById,
            templatesByCategory
          }
        },
        false,
        'removeTemplate'
      ),
      
      setSearchQuery: (query) => set({ searchQuery: query }, false, 'setSearchQuery'),
      
      setSelectedCategory: (category) => set({ selectedCategory: category }, false, 'setSelectedCategory'),
      
      setShowSystemTemplates: (show) => set({ showSystemTemplates: show }, false, 'setShowSystemTemplates'),
      
      setShowFamilyTemplates: (show) => set({ showFamilyTemplates: show }, false, 'setShowFamilyTemplates'),
      
      setEditingTemplate: (template) => set({ editingTemplate: template }, false, 'setEditingTemplate'),
      
      setIsCreatingTemplate: (creating) => set({ isCreatingTemplate: creating }, false, 'setIsCreatingTemplate'),
      
      setSelectedTemplateId: (id) => set({ selectedTemplateId: id }, false, 'setSelectedTemplateId'),
      
      setQuickExecutionTemplate: (template) => set({ 
        quickExecutionTemplate: template,
        quickExecutionSteps: {}
      }, false, 'setQuickExecutionTemplate'),
      
      toggleQuickExecutionStep: (stepId) => set(
        state => ({
          quickExecutionSteps: {
            ...state.quickExecutionSteps,
            [stepId]: !state.quickExecutionSteps[stepId]
          }
        }),
        false,
        'toggleQuickExecutionStep'
      ),
      
      resetQuickExecutionSteps: () => set({ quickExecutionSteps: {} }, false, 'resetQuickExecutionSteps'),
      
      getFilteredTemplates: () => {
        const state = get()
        let filtered = state.templates
        
        // Filter by category
        if (state.selectedCategory !== 'all') {
          filtered = state.templatesByCategory[state.selectedCategory] || []
        }
        
        // Filter by type (system vs family)
        filtered = filtered.filter(template => {
          if (template.is_system && !state.showSystemTemplates) return false
          if (!template.is_system && !state.showFamilyTemplates) return false
          return true
        })
        
        // Filter by search query
        if (state.searchQuery.trim()) {
          const query = state.searchQuery.toLowerCase()
          filtered = filtered.filter(template => 
            template.title.toLowerCase().includes(query) ||
            template.description?.toLowerCase().includes(query) ||
            template.template_steps.some(step => 
              step.title.toLowerCase().includes(query) ||
              step.description?.toLowerCase().includes(query)
            )
          )
        }
        
        return filtered
      },
      
      reset: () => set(initialState, false, 'reset')
    }),
    {
      name: 'template-store'
    }
  )
)