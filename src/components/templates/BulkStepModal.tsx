'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Info, ListPlus } from 'lucide-react'

interface BulkStepModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (steps: Array<{ title: string; description: string; metadata?: any }>) => void
}

export function BulkStepModal({ isOpen, onClose, onAdd }: BulkStepModalProps) {
  const [bulkText, setBulkText] = useState('')

  const handleAdd = () => {
    // Parse the bulk text input with section support
    const lines = bulkText.split('\n')
    const newSteps: Array<{ title: string; description: string; metadata?: any }> = []
    let currentSection = ''
    let sectionOrder = 0
    
    lines.forEach(line => {
      const trimmedLine = line.trim()
      if (!trimmedLine) return
      
      // Check if this is a section header (starts with ##)
      if (trimmedLine.startsWith('##')) {
        currentSection = trimmedLine.replace(/^##\s*/, '').trim()
        sectionOrder++
        return // Don't add section headers as steps
      }
      
      // Parse regular step
      let title = trimmedLine
      let description = ''
      
      if (trimmedLine.includes('|')) {
        const parts = trimmedLine.split('|')
        title = parts[0].trim()
        description = parts[1]?.trim() || ''
      } else if (trimmedLine.includes(' - ') && trimmedLine.indexOf(' - ') > 0) {
        const parts = trimmedLine.split(' - ')
        title = parts[0].trim()
        description = parts.slice(1).join(' - ').trim()
      }
      
      // Remove common list markers
      title = title.replace(/^[-*•]\s*/, '').replace(/^\d+\.\s*/, '')
      
      if (title) {
        const step: any = { title, description }
        
        // Add section metadata if we're in a section
        if (currentSection) {
          step.metadata = {
            section: currentSection,
            sectionOrder: sectionOrder
          }
        }
        
        newSteps.push(step)
      }
    })
    
    if (newSteps.length > 0) {
      onAdd(newSteps)
      setBulkText('')
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ListPlus className="h-5 w-5" />
            Bulk Add Steps
          </DialogTitle>
          <DialogDescription>
            Add multiple steps at once by entering them below
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Tips:</strong>
              <ul className="mt-2 space-y-1 text-sm">
                <li>• Enter one step per line</li>
                <li>• Use "##" to create section headers (e.g., "## Before Playing")</li>
                <li>• Use "|" or " - " to separate title from description</li>
                <li>• Example: "Wake up | Get out of bed and stretch"</li>
                <li>• Example: "Make breakfast - Prepare a healthy meal"</li>
                <li>• You can paste from a list or document</li>
              </ul>
            </AlertDescription>
          </Alert>

          <div>
            <Textarea
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              placeholder={`Enter steps here, one per line. Use ## for section headers...

Example:
## Morning Preparation
Wake up | Get out of bed and stretch
Brush teeth - 2 minutes with electric toothbrush
Make bed

## Breakfast Time
Prepare breakfast | Toast, eggs, and coffee
Take vitamins
Review daily schedule`}
              rows={12}
              className="font-mono text-sm"
            />
          </div>

          {bulkText && (
            <div className="text-sm text-muted-foreground">
              Will add {bulkText.split('\n').filter(line => line.trim()).length} steps
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleAdd}
            disabled={!bulkText.trim()}
          >
            <ListPlus className="h-4 w-4 mr-2" />
            Add Steps
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}