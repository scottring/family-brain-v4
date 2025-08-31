'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Plus,
  X,
  GripVertical,
  Save,
  Copy,
  Trash2,
  ListPlus,
  Trophy
} from 'lucide-react'
import { TemplateWithSteps, TemplateCategory, TemplateStep, StepType, AssigneeType } from '@/lib/types/database'
import { templateService } from '@/lib/services/TemplateService'
import { useAppStore } from '@/lib/stores/useAppStore'
import { useTemplateStore } from '@/lib/stores/useTemplateStore'
import { cn } from '@/lib/utils'
import { BulkStepModal } from './BulkStepModal'

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

interface EditTemplateModalProps {
  template: TemplateWithSteps | null
  isOpen: boolean
  onClose: () => void
  onSave?: (template: TemplateWithSteps) => void
  mode?: 'permanent' | 'temporary'
}

export function EditTemplateModal({
  template,
  isOpen,
  onClose,
  onSave,
  mode = 'permanent'
}: EditTemplateModalProps) {
  const { currentFamilyId } = useAppStore()
  const { templates, setTemplates } = useTemplateStore()
  
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<TemplateCategory>('custom')
  const [steps, setSteps] = useState<Partial<TemplateStep>[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [editMode, setEditMode] = useState<'permanent' | 'temporary'>(mode)
  const [showBulkAdd, setShowBulkAdd] = useState(false)
  const [isTrackable, setIsTrackable] = useState(false)
  const [trackingEmoji, setTrackingEmoji] = useState('📊')

  useEffect(() => {
    if (template) {
      setTitle(template.title)
      setDescription(template.description || '')
      setCategory(template.category || 'custom')
      setSteps(template.template_steps || [])
      setIsTrackable((template as any).is_trackable || false)
      setTrackingEmoji((template as any).tracking_emoji || '📊')
    } else {
      setTitle('')
      setDescription('')
      setCategory('custom')
      setSteps([])
      setIsTrackable(false)
      setTrackingEmoji('📊')
    }
  }, [template])

  const handleAddStep = () => {
    setSteps([
      ...steps,
      {
        title: '',
        description: '',
        step_type: 'task' as StepType,
        order_position: steps.length,
        metadata: {}
      }
    ])
  }

  const handleRemoveStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index))
  }

  const handleStepChange = (index: number, field: string, value: any) => {
    const updatedSteps = [...steps]
    updatedSteps[index] = {
      ...updatedSteps[index],
      [field]: value
    }
    setSteps(updatedSteps)
  }

  const handleSave = async () => {
    if (!currentFamilyId || !title) return
    
    setIsSaving(true)
    
    try {
      if (editMode === 'temporary') {
        // Create a temporary copy (not saved to database)
        const tempTemplate: TemplateWithSteps = {
          id: template?.id || `temp-${Date.now()}`,
          family_id: currentFamilyId,
          title: `${title} (Modified)`,
          description,
          category,
          is_active: true,
          created_by: '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          template_steps: steps as TemplateStep[]
        }
        
        // Update local state only
        if (onSave) {
          onSave(tempTemplate)
        } else {
          // Add to local templates as a temporary template
          const updatedTemplates = [...templates]
          const index = updatedTemplates.findIndex(t => t.id === template?.id)
          if (index >= 0) {
            updatedTemplates[index] = tempTemplate
          } else {
            updatedTemplates.push(tempTemplate)
          }
          setTemplates(updatedTemplates)
        }
      } else {
        // Save permanently to database
        let savedTemplate: TemplateWithSteps
        
        if (template?.id && !template.id.startsWith('temp-')) {
          // Try to update existing template
          let isNewTemplate = false
          try {
            savedTemplate = await templateService.updateTemplate(template.id, {
              title,
              description: description || undefined,
              category,
              is_trackable: isTrackable,
              tracking_emoji: trackingEmoji
            } as any)
          } catch (error: any) {
            console.log('Caught error in updateTemplate:', {
              code: error?.code,
              message: error?.message,
              details: error?.details
            })
            // If template doesn't exist (404 or PGRST116), create a new one
            if (error?.code === 'PGRST116' || error?.message?.includes('0 rows') || error?.message?.includes('Cannot coerce')) {
              console.log('Template not found, creating new one instead')
              isNewTemplate = true
              savedTemplate = await templateService.createTemplate({
                family_id: currentFamilyId,
                title,
                description: description || undefined,
                category,
                is_trackable: isTrackable,
                tracking_emoji: trackingEmoji
              } as any)
            } else {
              throw error
            }
          }
          
          // Handle steps
          if (isNewTemplate) {
            // Add all steps to new template
            for (let i = 0; i < steps.length; i++) {
              const step = steps[i]
              await templateService.createTemplateStep(savedTemplate.id, {
                title: step.title!,
                description: step.description || undefined,
                step_type: step.step_type!,
                order_position: i,
                metadata: step.metadata || {}
              })
            }
          } else {
            // Update steps for existing template
            // Remove deleted steps
            const existingStepIds = template.template_steps.map(s => s.id)
            const currentStepIds = steps.filter(s => s.id).map(s => s.id)
            const stepsToDelete = existingStepIds.filter(id => !currentStepIds.includes(id!))
            
            for (const stepId of stepsToDelete) {
              await templateService.deleteTemplateStep(stepId!)
            }
            
            // Update or create steps
            for (let i = 0; i < steps.length; i++) {
              const step = steps[i]
              if (step.id) {
                await templateService.updateTemplateStep(step.id, {
                  title: step.title!,
                  description: step.description || undefined,
                  step_type: step.step_type!,
                  order_position: i,
                  metadata: step.metadata || {}
                })
              } else {
                await templateService.createTemplateStep(savedTemplate.id, {
                  title: step.title!,
                  description: step.description || undefined,
                  step_type: step.step_type!,
                  order_position: i,
                  metadata: step.metadata || {}
                })
              }
            }
          }
          
          // Reload template with updated steps
          const reloadedTemplate = await templateService.getTemplate(savedTemplate.id)
          if (reloadedTemplate) {
            savedTemplate = reloadedTemplate
          }
        } else {
          // Create new template (no ID at all)
          savedTemplate = await templateService.createTemplate({
            family_id: currentFamilyId,
            title,
            description: description || undefined,
            category,
            is_trackable: isTrackable,
            tracking_emoji: trackingEmoji
          } as any)
          
          // Add steps
          for (let i = 0; i < steps.length; i++) {
            const step = steps[i]
            await templateService.createTemplateStep(savedTemplate.id, {
              title: step.title!,
              description: step.description || undefined,
              step_type: step.step_type!,
              order_position: i,
              metadata: step.metadata || {}
            })
          }
          
          // Reload template with steps
          const reloadedTemplate = await templateService.getTemplate(savedTemplate.id)
          if (reloadedTemplate) {
            savedTemplate = reloadedTemplate
          }
        }
        
        // Update local state
        if (onSave) {
          onSave(savedTemplate)
        } else {
          const updatedTemplates = [...templates]
          const index = updatedTemplates.findIndex(t => t.id === template?.id)
          if (index >= 0) {
            updatedTemplates[index] = savedTemplate
          } else {
            updatedTemplates.push(savedTemplate)
          }
          setTemplates(updatedTemplates)
        }
      }
      
      onClose()
    } catch (error) {
      console.error('Error saving template:', error)
      alert('Failed to save template. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDuplicate = () => {
    setTitle(`${title} (Copy)`)
    setEditMode('permanent')
  }

  return (
    <>
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {template ? 'Edit Template' : 'Create Template'}
          </DialogTitle>
          <DialogDescription>
            {editMode === 'temporary' 
              ? 'Changes will only apply to this session'
              : 'Changes will be saved permanently'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Edit Mode Toggle */}
          <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <Label>Save Mode:</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={editMode === 'permanent' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setEditMode('permanent')}
              >
                <Save className="h-4 w-4 mr-1" />
                Permanent
              </Button>
              <Button
                type="button"
                variant={editMode === 'temporary' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setEditMode('temporary')}
              >
                <Copy className="h-4 w-4 mr-1" />
                This Session Only
              </Button>
            </div>
          </div>

          {/* Title */}
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter template title"
              required
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter template description"
              rows={2}
            />
          </div>

          {/* Category */}
          <div>
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={(value) => setCategory(value as TemplateCategory)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <span className="flex items-center gap-2">
                      <span>{option.icon}</span>
                      <span>{option.label}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tracking Settings */}
          <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="trackable" className="flex items-center space-x-2">
                  <Trophy className="h-4 w-4 text-yellow-500" />
                  <span>Enable Progress Tracking</span>
                </Label>
                <p className="text-sm text-muted-foreground">
                  Track daily completions and set reward goals
                </p>
              </div>
              <Switch
                id="trackable"
                checked={isTrackable}
                onCheckedChange={setIsTrackable}
              />
            </div>
            
            {isTrackable && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center space-x-2 pt-2"
              >
                <Label htmlFor="trackingEmoji" className="text-sm">
                  Tracking Icon:
                </Label>
                <Input
                  id="trackingEmoji"
                  value={trackingEmoji}
                  onChange={(e) => setTrackingEmoji(e.target.value)}
                  className="w-16 text-center text-xl"
                  maxLength={2}
                />
                <span className="text-sm text-muted-foreground">
                  This icon will appear in tracking dashboards
                </span>
              </motion.div>
            )}
          </div>

          {/* Steps */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Steps</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowBulkAdd(true)}
                >
                  <ListPlus className="h-4 w-4 mr-1" />
                  Bulk Add
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddStep}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Step
                </Button>
              </div>
            </div>
            
            <AnimatePresence>
              {steps.map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-start gap-2 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg mb-2"
                >
                  <GripVertical className="h-5 w-5 text-gray-400 mt-1" />
                  
                  <div className="flex-1 space-y-2">
                    {step.metadata?.section && (
                      <div className="text-xs font-medium text-blue-600 dark:text-blue-400">
                        Section: {step.metadata.section}
                      </div>
                    )}
                    <Input
                      value={step.title || ''}
                      onChange={(e) => handleStepChange(index, 'title', e.target.value)}
                      placeholder="Step title"
                    />
                    <Textarea
                      value={step.description || ''}
                      onChange={(e) => handleStepChange(index, 'description', e.target.value)}
                      placeholder="Step description (optional)"
                      rows={1}
                    />
                    <div className="flex gap-2">
                      <Select 
                        value={step.step_type || 'task'} 
                        onValueChange={(value) => handleStepChange(index, 'step_type', value)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="task">Task</SelectItem>
                          <SelectItem value="note">Note</SelectItem>
                          <SelectItem value="decision">Decision</SelectItem>
                          <SelectItem value="resource">Resource</SelectItem>
                          <SelectItem value="reference">Reference</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Select 
                        value={step.metadata?.assignee_type || 'any_member'} 
                        onValueChange={(value) => {
                          const newMetadata = { ...(step.metadata || {}), assignee_type: value as AssigneeType }
                          handleStepChange(index, 'metadata', newMetadata)
                        }}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="any_member">Anyone</SelectItem>
                          <SelectItem value="all_children">All Children</SelectItem>
                          <SelectItem value="all_members">All Members</SelectItem>
                          <SelectItem value="specific_member">Specific Person</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveStep(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {steps.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No steps added yet. Click "Add Step" to create checklist items.
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          {template && (
            <Button variant="outline" onClick={handleDuplicate}>
              <Copy className="h-4 w-4 mr-1" />
              Duplicate
            </Button>
          )}
          <Button onClick={handleSave} disabled={!title || isSaving}>
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    
    {/* Bulk Add Modal */}
    <BulkStepModal
      isOpen={showBulkAdd}
      onClose={() => setShowBulkAdd(false)}
      onAdd={(newSteps) => {
        const formattedSteps = newSteps.map((step, index) => ({
          title: step.title,
          description: step.description,
          step_type: 'task' as StepType,
          order_position: steps.length + index,
          metadata: step.metadata || {}
        }))
        setSteps([...steps, ...formattedSteps])
      }}
    />
    </>
  )
}