'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/stores/useAppStore'
import { Label } from '@/components/ui/label'
import { Users, User, Baby } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

interface MemberAssignmentProps {
  assignedMembers: string[]
  onAssignmentChange: (memberIds: string[]) => void
  className?: string
  variant?: 'compact' | 'full'
}

export function MemberAssignment({ 
  assignedMembers, 
  onAssignmentChange,
  className,
  variant = 'full'
}: MemberAssignmentProps) {
  const { currentFamilyMembers } = useAppStore()
  const [allSelected, setAllSelected] = useState(
    assignedMembers.length === 0 || 
    assignedMembers.includes('all')
  )

  const handleAllChange = (checked: boolean) => {
    setAllSelected(checked)
    if (checked) {
      onAssignmentChange([]) // Empty means all
    } else {
      onAssignmentChange([]) // Still empty but allSelected is false
    }
  }

  const handleMemberChange = (memberId: string, checked: boolean) => {
    if (allSelected) {
      // If switching from all to specific members
      setAllSelected(false)
      const otherMembers = currentFamilyMembers
        .filter(m => m.user_id !== memberId)
        .map(m => m.user_id)
      
      if (checked) {
        // Include all members (since we're deselecting "all" but this member should be checked)
        onAssignmentChange(currentFamilyMembers.map(m => m.user_id))
      } else {
        // Include all except this one
        onAssignmentChange(otherMembers)
      }
    } else {
      // Normal toggle
      if (checked) {
        onAssignmentChange([...assignedMembers, memberId])
      } else {
        onAssignmentChange(assignedMembers.filter(id => id !== memberId))
      }
    }
  }

  const isMemberAssigned = (memberId: string) => {
    if (allSelected) return true
    return assignedMembers.includes(memberId)
  }

  const getMemberDetails = (memberId: string) => {
    const member = currentFamilyMembers.find(m => m.user_id === memberId)
    if (!member) return null
    
    const isChild = member.role === 'member'
    const initials = member.user_profile?.full_name
      ?.split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase() || '?'
    
    return {
      id: member.user_id,
      name: member.user_profile?.full_name || 'Unknown',
      initials,
      avatar: member.user_profile?.avatar_url,
      isChild
    }
  }

  const parents = currentFamilyMembers.filter(m => m.role === 'owner')
  const children = currentFamilyMembers.filter(m => m.role === 'member')

  if (variant === 'compact') {
    return (
      <div className={cn("space-y-2", className)}>
        <Label className="text-sm font-medium">Assign to</Label>
        <div className="flex flex-wrap gap-2">
          <label className="flex items-center space-x-2 px-3 py-1.5 rounded-md border cursor-pointer hover:bg-accent">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={(e) => handleAllChange(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Users className="h-4 w-4" />
            <span className="text-sm">Everyone</span>
          </label>
          
          {currentFamilyMembers.map(member => {
            const details = getMemberDetails(member.user_id)
            if (!details) return null
            
            return (
              <label 
                key={member.user_id}
                className="flex items-center space-x-2 px-3 py-1.5 rounded-md border cursor-pointer hover:bg-accent"
              >
                <input
                  type="checkbox"
                  checked={isMemberAssigned(member.user_id)}
                  onChange={(e) => handleMemberChange(member.user_id, e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                {details.isChild ? (
                  <Baby className="h-4 w-4" />
                ) : (
                  <User className="h-4 w-4" />
                )}
                <span className="text-sm">{details.name}</span>
              </label>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className={cn("space-y-3", className)}>
      <Label className="text-sm font-medium">Assign to Members</Label>
      
      <div className="space-y-3 p-3 border rounded-lg bg-muted/30">
        <label className="flex items-center space-x-3 cursor-pointer hover:bg-accent/50 p-2 rounded-md transition-colors">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={(e) => handleAllChange(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
          />
          <Users className="h-5 w-5 text-muted-foreground" />
          <span className="font-medium">All Members</span>
        </label>

        {children.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground px-2">Children</p>
            {children.map(member => {
              const details = getMemberDetails(member.user_id)
              if (!details) return null
              
              return (
                <label 
                  key={member.user_id}
                  className="flex items-center space-x-3 cursor-pointer hover:bg-accent/50 p-2 rounded-md transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={isMemberAssigned(member.user_id)}
                    onChange={(e) => handleMemberChange(member.user_id, e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={details.avatar || undefined} />
                    <AvatarFallback className="text-xs bg-orange-100 text-orange-700">
                      {details.initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="flex-1">{details.name}</span>
                  <Baby className="h-4 w-4 text-muted-foreground" />
                </label>
              )
            })}
          </div>
        )}

        {parents.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground px-2">Parents</p>
            {parents.map(member => {
              const details = getMemberDetails(member.user_id)
              if (!details) return null
              
              return (
                <label 
                  key={member.user_id}
                  className="flex items-center space-x-3 cursor-pointer hover:bg-accent/50 p-2 rounded-md transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={isMemberAssigned(member.user_id)}
                    onChange={(e) => handleMemberChange(member.user_id, e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={details.avatar || undefined} />
                    <AvatarFallback className="text-xs bg-blue-100 text-blue-700">
                      {details.initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="flex-1">{details.name}</span>
                  <User className="h-4 w-4 text-muted-foreground" />
                </label>
              )
            })}
          </div>
        )}
      </div>
      
      {!allSelected && assignedMembers.length === 0 && (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          ⚠️ No members selected - this item won't appear in anyone's view
        </p>
      )}
    </div>
  )
}