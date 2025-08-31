'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Trophy, Target, Calendar, Gift } from 'lucide-react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { trackingService } from '@/lib/services/TrackingService'
import { useAppStore } from '@/lib/stores/useAppStore'
import { toast } from '@/components/ui/use-toast'

interface TrackingGoalModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  templateId: string
  templateTitle: string
  onSuccess?: () => void
}

export function TrackingGoalModal({
  open,
  onOpenChange,
  templateId,
  templateTitle,
  onSuccess
}: TrackingGoalModalProps) {
  const { currentFamilyId, familyMembers } = useAppStore()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    goalType: 'count_in_period' as 'streak' | 'count_in_period' | 'daily',
    targetCount: 12,
    periodDays: 14,
    rewardDescription: '',
    rewardEmoji: '🎁',
    memberId: ''
  })

  const handleSubmit = async () => {
    if (!currentFamilyId) return

    setLoading(true)
    try {
      const result = await trackingService.createGoal({
        family_id: currentFamilyId,
        template_id: templateId,
        member_id: formData.memberId || undefined,
        goal_type: formData.goalType,
        target_count: formData.targetCount,
        period_days: formData.periodDays,
        reward_description: formData.rewardDescription || undefined,
        reward_emoji: formData.rewardEmoji || '🎁',
        is_active: true
      })

      toast({
        title: 'Tracking goal created',
        description: `Now tracking ${templateTitle}`,
      })

      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      console.error('Error creating tracking goal:', error)
      toast({
        title: 'Error',
        description: 'Failed to create tracking goal',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const getGoalDescription = () => {
    switch (formData.goalType) {
      case 'streak':
        return `Track consecutive days of completing "${templateTitle}"`
      case 'count_in_period':
        return `Complete ${formData.targetCount} times in ${formData.periodDays} days`
      case 'daily':
        return `Track daily completion of "${templateTitle}"`
      default:
        return ''
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            <span>Set Up Tracking Goal</span>
          </DialogTitle>
          <DialogDescription>
            Create a tracking goal for "{templateTitle}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Member Selection */}
          <div className="space-y-2">
            <Label htmlFor="member">Track for</Label>
            <Select
              value={formData.memberId}
              onValueChange={(value) => setFormData({ ...formData, memberId: value })}
            >
              <SelectTrigger id="member">
                <SelectValue placeholder="Select member (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All family members</SelectItem>
                {familyMembers.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Goal Type */}
          <div className="space-y-2">
            <Label htmlFor="goalType">Goal Type</Label>
            <Select
              value={formData.goalType}
              onValueChange={(value: any) => setFormData({ ...formData, goalType: value })}
            >
              <SelectTrigger id="goalType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="count_in_period">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4" />
                    <span>Count in Period</span>
                  </div>
                </SelectItem>
                <SelectItem value="streak">
                  <div className="flex items-center space-x-2">
                    <Target className="h-4 w-4" />
                    <span>Streak</span>
                  </div>
                </SelectItem>
                <SelectItem value="daily">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4" />
                    <span>Daily Tracking</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Target Configuration */}
          {formData.goalType === 'count_in_period' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="targetCount">Target Count</Label>
                  <Input
                    id="targetCount"
                    type="number"
                    value={formData.targetCount}
                    onChange={(e) => setFormData({ ...formData, targetCount: parseInt(e.target.value) })}
                    min={1}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="periodDays">Period (days)</Label>
                  <Input
                    id="periodDays"
                    type="number"
                    value={formData.periodDays}
                    onChange={(e) => setFormData({ ...formData, periodDays: parseInt(e.target.value) })}
                    min={1}
                  />
                </div>
              </div>
            </>
          )}

          {formData.goalType === 'streak' && (
            <div className="space-y-2">
              <Label htmlFor="targetStreak">Target Streak (days)</Label>
              <Input
                id="targetStreak"
                type="number"
                value={formData.targetCount}
                onChange={(e) => setFormData({ ...formData, targetCount: parseInt(e.target.value) })}
                min={1}
              />
            </div>
          )}

          {/* Reward Configuration */}
          <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center space-x-2">
              <Gift className="h-4 w-4 text-purple-500" />
              <Label>Reward (Optional)</Label>
            </div>
            
            <div className="grid grid-cols-[auto,1fr] gap-4">
              <div className="space-y-2">
                <Label htmlFor="rewardEmoji">Emoji</Label>
                <Input
                  id="rewardEmoji"
                  value={formData.rewardEmoji}
                  onChange={(e) => setFormData({ ...formData, rewardEmoji: e.target.value })}
                  className="w-16 text-center text-2xl"
                  maxLength={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rewardDescription">Description</Label>
                <Input
                  id="rewardDescription"
                  value={formData.rewardDescription}
                  onChange={(e) => setFormData({ ...formData, rewardDescription: e.target.value })}
                  placeholder="e.g., Extra screen time, special treat"
                />
              </div>
            </div>
          </div>

          {/* Goal Summary */}
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-300">
              Goal Summary:
            </p>
            <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
              {getGoalDescription()}
              {formData.rewardDescription && (
                <span className="block mt-1">
                  Reward: {formData.rewardEmoji} {formData.rewardDescription}
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create Goal'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}