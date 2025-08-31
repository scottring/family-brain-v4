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
  onAdd: (steps: Array<{ title: string; description: string }>) => void
}

export function BulkStepModal({ isOpen, onClose, onAdd }: BulkStepModalProps) {
  const [bulkText, setBulkText] = useState('')

  const handleAdd = () => {
    // Parse the bulk text input
    const lines = bulkText.split('\n').filter(line => line.trim())
    const newSteps = lines.map(line => {
      // Support different formats:
      // 1. "Step title | Step description"
      // 2. "Step title - Step description"
      // 3. "Step title" (no description)
      
      let title = line
      let description = ''
      
      if (line.includes('|')) {
        const parts = line.split('|')
        title = parts[0].trim()
        description = parts[1]?.trim() || ''
      } else if (line.includes(' - ') && line.indexOf(' - ') > 0) {
        const parts = line.split(' - ')
        title = parts[0].trim()
        description = parts.slice(1).join(' - ').trim()
      }
      
      // Remove common list markers
      title = title.replace(/^[-*•]\s*/, '').replace(/^\d+\.\s*/, '')
      
      return { title, description }
    }).filter(step => step.title) // Filter out empty titles
    
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
              placeholder={`Enter steps here, one per line...

Examples:
Wake up | Get out of bed and stretch
Brush teeth - 2 minutes with electric toothbrush
Make bed
Prepare breakfast | Toast, eggs, and coffee
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