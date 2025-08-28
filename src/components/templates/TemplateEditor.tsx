'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Plus,
  X,
  GripVertical,
  Edit,
  Trash2,
  Save,
  ExternalLink,
  Info,
  CheckSquare,
  FileQuestion,
  MessageCircle,
  Link
} from 'lucide-react'
import { TemplateWithSteps, TemplateCategory, StepType, TemplateStep } from '@/lib/types/database'
import { cn } from '@/lib/utils'

const CATEGORY_OPTIONS: { value: TemplateCategory; label: string; icon: string }[] = [
  { value: 'morning', label: 'Morning', icon: '🌅' },
  { value: 'evening', label: 'Evening', icon: '🌙' },
  { value: 'household', label: 'Household', icon: '🏠' },
  { value: 'childcare', label: 'Childcare', icon: '👶' },
  { value: 'shopping', label: 'Shopping', icon: '🛒' },
  { value: 'work', label: 'Work', icon: '💼' },
  { value: 'personal', label: 'Personal', icon: '⭐' },
  { value: 'health', label: 'Health', icon: '🏥' },
  { value: 'travel', label: 'Travel', icon: '✈️' },
  { value: 'custom', label: 'Custom', icon: '📝' }
]

const STEP_TYPE_OPTIONS: { value: StepType; label: string; icon: JSX.Element; description: string }[] = [
  { 
    value: 'task', 
    label: 'Task', 
    icon: <CheckSquare className="w-4 h-4" />,
    description: 'Action to complete'
  },
  { 
    value: 'decision', 
    label: 'Decision', 
    icon: <FileQuestion className="w-4 h-4" />,
    description: 'Choice point or decision'
  },
  { 
    value: 'note', 
    label: 'Note', 
    icon: <MessageCircle className="w-4 h-4" />,
    description: 'Information or reminder'
  },
  { 
    value: 'resource', 
    label: 'Resource', 
    icon: <Link className="w-4 h-4" />,
    description: 'External link or contact'
  },
  { 
    value: 'reference', 
    label: 'Reference', 
    icon: <Info className="w-4 h-4" />,
    description: 'Reference material'
  }
]

const ICON_OPTIONS = [
  '📄', '✅', '📋', '🔧', '🏠', '👶', '🛒', '💼', '⭐', '🏥', '✈️', '🌅', '🌙', 
  '🍳', '🧹', '🚗', '📚', '💡', '🎯', '📱', '💻', '📊', '🔒', '🎉', '🌟'
]

interface TemplateEditorProps {
  template: TemplateWithSteps | null
  isOpen: boolean
  onClose: () => void
  onSave: (template: TemplateWithSteps) => Promise<void>
  isNew?: boolean
}

interface EditingStep extends TemplateStep {
  isNew?: boolean
  isEditing?: boolean
}

export function TemplateEditor({ template, isOpen, onClose, onSave, isNew = false }: TemplateEditorProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<TemplateCategory>('custom')
  const [icon, setIcon] = useState('📄')
  const [color, setColor] = useState('')
  const [steps, setSteps] = useState<EditingStep[]>([])
  const [editingStepId, setEditingStepId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  useEffect(() => {
    if (template && isOpen) {
      setTitle(template.title)
      setDescription(template.description || '')
      setCategory(template.category)
      setIcon(template.icon || '📄')
      setColor(template.color || '')
      setSteps(template.template_steps?.map(step => ({ ...step, isEditing: false })) || [])
    } else if (isNew && isOpen) {
      // Reset form for new template
      setTitle('')
      setDescription('')
      setCategory('custom')
      setIcon('📄')
      setColor('')
      setSteps([])
    }
  }, [template, isOpen, isNew])

  const handleAddStep = () => {
    const newStep: EditingStep = {
      id: `temp_${Date.now()}`,
      template_id: template?.id || '',
      title: '',
      description: '',
      step_type: 'task',
      order_position: steps.length,
      metadata: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      isNew: true,
      isEditing: true
    }
    setSteps(prev => [...prev, newStep])
    setEditingStepId(newStep.id)
  }

  const handleEditStep = (stepId: string) => {
    setEditingStepId(stepId)
    setSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, isEditing: true } : step
    ))
  }

  const handleUpdateStep = (stepId: string, updates: Partial<EditingStep>) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, ...updates } : step
    ))
  }

  const handleSaveStep = (stepId: string) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, isEditing: false } : step
    ))
    setEditingStepId(null)
  }

  const handleDeleteStep = (stepId: string) => {
    setSteps(prev => prev.filter(step => step.id !== stepId).map((step, index) => ({
      ...step,
      order_position: index
    })))
  }

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === targetIndex) return

    const newSteps = [...steps]
    const draggedStep = newSteps[draggedIndex]
    newSteps.splice(draggedIndex, 1)
    newSteps.splice(targetIndex, 0, draggedStep)

    // Update order positions
    newSteps.forEach((step, index) => {
      step.order_position = index
    })

    setSteps(newSteps)
    setDraggedIndex(targetIndex)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
  }

  const handleSave = async () => {
    if (!title.trim()) {
      alert('Please enter a template title')
      return
    }

    if (steps.some(step => step.isEditing)) {
      alert('Please finish editing all steps before saving')
      return
    }

    setSaving(true)
    try {
      const templateData: TemplateWithSteps = {
        id: template?.id || '',
        title: title.trim(),
        description: description.trim() || null,
        category,
        icon,
        color: color || null,
        is_system: false,
        version: 1,
        family_id: template?.family_id || null,
        created_by: template?.created_by || null,
        created_at: template?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
        template_steps: steps.map((step, index) => ({
          ...step,
          order_position: index,
          isNew: undefined,
          isEditing: undefined
        }))
      }

      await onSave(templateData)
      onClose()
    } catch (error) {
      console.error('Error saving template:', error)
      alert('Failed to save template')
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {isNew ? 'Create New Template' : `Edit Template: ${template?.title}`}
          </DialogTitle>
          <DialogDescription>
            {isNew 
              ? 'Create a new template with steps for your family to follow'
              : 'Modify the template details and manage its steps'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col h-full overflow-hidden">
          <div className="flex-shrink-0 space-y-6 p-1">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Template title..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as TemplateCategory)}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
                >
                  {CATEGORY_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.icon} {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Icon</Label>
                <div className="flex flex-wrap gap-2">
                  {ICON_OPTIONS.map(iconOption => (
                    <button
                      key={iconOption}
                      onClick={() => setIcon(iconOption)}
                      className={cn(
                        "w-10 h-10 rounded-md border-2 flex items-center justify-center text-lg transition-colors",
                        icon === iconOption
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      {iconOption}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="color">Color (optional)</Label>
                <Input
                  id="color"
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-full h-10"
                />
              </div>
            </div>
          </div>

          <Separator className="my-4" />

          {/* Steps Section */}
          <div className="flex-1 overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Steps ({steps.length})</h3>
              <Button onClick={handleAddStep} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Step
              </Button>
            </div>

            <div className="overflow-y-auto max-h-[50vh] pr-2 space-y-3">
              <AnimatePresence>
                {steps.map((step, index) => (
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.2 }}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    className={cn(
                      "border rounded-lg transition-all",
                      draggedIndex === index ? "opacity-50" : "",
                      step.isEditing ? "border-primary" : "border-border"
                    )}
                  >
                    <Card>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                            <span className="text-sm text-muted-foreground">#{index + 1}</span>
                            {!step.isEditing && (
                              <Badge variant="outline" className="text-xs">
                                {STEP_TYPE_OPTIONS.find(t => t.value === step.step_type)?.icon}
                                <span className="ml-1">
                                  {STEP_TYPE_OPTIONS.find(t => t.value === step.step_type)?.label}
                                </span>
                              </Badge>
                            )}
                          </div>
                          <div className="flex space-x-1">
                            {!step.isEditing && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditStep(step.id)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteStep(step.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        {step.isEditing ? (
                          <StepEditor 
                            step={step}
                            onUpdate={(updates) => handleUpdateStep(step.id, updates)}
                            onSave={() => handleSaveStep(step.id)}
                          />
                        ) : (
                          <StepDisplay step={step} />
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>

              {steps.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <CheckSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No steps added yet. Click "Add Step" to get started.</p>
                </div>
              )}
            </div>
          </div>

          <Separator className="my-4" />

          {/* Actions */}
          <div className="flex-shrink-0 flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <div className="animate-spin w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {isNew ? 'Create Template' : 'Save Changes'}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

interface StepEditorProps {
  step: EditingStep
  onUpdate: (updates: Partial<EditingStep>) => void
  onSave: () => void
}

function StepEditor({ step, onUpdate, onSave }: StepEditorProps) {
  const [localStep, setLocalStep] = useState(step)

  useEffect(() => {
    setLocalStep(step)
  }, [step])

  const handleUpdate = (field: string, value: any) => {
    const updated = { ...localStep, [field]: value }
    setLocalStep(updated)
    onUpdate(updated)
  }

  const handleMetadataUpdate = (key: string, value: string) => {
    const metadata = { ...localStep.metadata, [key]: value }
    if (!value) {
      delete metadata[key]
    }
    handleUpdate('metadata', metadata)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      onSave()
    }
  }

  return (
    <div className="space-y-4" onKeyDown={handleKeyDown}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Title *</Label>
          <Input
            value={localStep.title}
            onChange={(e) => handleUpdate('title', e.target.value)}
            placeholder="Step title..."
          />
        </div>
        <div className="space-y-2">
          <Label>Type</Label>
          <select
            value={localStep.step_type}
            onChange={(e) => handleUpdate('step_type', e.target.value as StepType)}
            className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
          >
            {STEP_TYPE_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label} - {option.description}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea
          value={localStep.description || ''}
          onChange={(e) => handleUpdate('description', e.target.value)}
          placeholder="Step description..."
          rows={2}
        />
      </div>

      {/* Metadata fields based on step type */}
      {localStep.step_type === 'resource' && (
        <div className="space-y-3 p-3 bg-accent/20 rounded-lg">
          <Label className="text-sm font-medium">Resource Details</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">URL</Label>
              <Input
                value={localStep.metadata?.url || ''}
                onChange={(e) => handleMetadataUpdate('url', e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Phone</Label>
              <Input
                value={localStep.metadata?.phone || ''}
                onChange={(e) => handleMetadataUpdate('phone', e.target.value)}
                placeholder="+1 (555) 123-4567"
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Additional Notes</Label>
            <Textarea
              value={localStep.metadata?.note || ''}
              onChange={(e) => handleMetadataUpdate('note', e.target.value)}
              placeholder="Additional information about this resource..."
              rows={2}
            />
          </div>
        </div>
      )}

      <div className="flex justify-end space-x-2 pt-2">
        <Button onClick={onSave} size="sm">
          <Save className="w-4 h-4 mr-2" />
          Save Step
        </Button>
      </div>
    </div>
  )
}

interface StepDisplayProps {
  step: EditingStep
}

function StepDisplay({ step }: StepDisplayProps) {
  return (
    <div className="space-y-2">
      <h4 className="font-medium">{step.title}</h4>
      {step.description && (
        <p className="text-sm text-muted-foreground">{step.description}</p>
      )}

      {/* Show metadata for resources */}
      {step.step_type === 'resource' && step.metadata && Object.keys(step.metadata).length > 0 && (
        <div className="mt-3 p-3 bg-card rounded-lg border border-border/50 space-y-2">
          {step.metadata.url && (
            <div className="flex items-center space-x-2 text-sm">
              <ExternalLink className="w-4 h-4 text-primary" />
              <a href={step.metadata.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                {step.metadata.url}
              </a>
            </div>
          )}
          {step.metadata.phone && (
            <div className="flex items-center space-x-2 text-sm">
              <span className="w-4 h-4 flex items-center justify-center">📞</span>
              <a href={`tel:${step.metadata.phone}`} className="text-primary hover:underline">
                {step.metadata.phone}
              </a>
            </div>
          )}
          {step.metadata.note && (
            <div className="flex items-start space-x-2 text-sm">
              <Info className="w-4 h-4 text-muted-foreground mt-0.5" />
              <p className="text-muted-foreground">{step.metadata.note}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}