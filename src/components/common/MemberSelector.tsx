'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/stores/useAppStore'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Users, User, Baby } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface MemberSelectorProps {
  className?: string
  variant?: 'dropdown' | 'buttons'
  showLabel?: boolean
}

export function MemberSelector({ 
  className, 
  variant = 'dropdown',
  showLabel = true 
}: MemberSelectorProps) {
  const { 
    currentFamilyMembers, 
    selectedMemberView, 
    setSelectedMemberView,
    user 
  } = useAppStore()

  // Load saved preference from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('selectedMemberView')
      if (saved && (saved === 'all' || currentFamilyMembers.some(m => m.user_id === saved))) {
        setSelectedMemberView(saved)
      }
    }
  }, [currentFamilyMembers, setSelectedMemberView])

  // Get member details for display
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
      isChild,
      isCurrentUser: member.user_id === user?.id
    }
  }

  // Separate parents and children for better organization
  const parents = currentFamilyMembers.filter(m => m.role === 'owner')
  const children = currentFamilyMembers.filter(m => m.role === 'member')

  if (variant === 'buttons') {
    return (
      <div className={cn("flex gap-2", className)}>
        {showLabel && (
          <span className="text-sm text-muted-foreground self-center mr-2">
            View:
          </span>
        )}
        
        <Button
          variant={selectedMemberView === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedMemberView('all')}
        >
          <Users className="h-4 w-4 mr-1" />
          All Members
        </Button>
        
        {children.map(child => {
          const details = getMemberDetails(child.user_id)
          if (!details) return null
          
          return (
            <Button
              key={child.user_id}
              variant={selectedMemberView === child.user_id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedMemberView(child.user_id)}
            >
              <Baby className="h-4 w-4 mr-1" />
              {details.name}
            </Button>
          )
        })}
        
        {parents.map(parent => {
          const details = getMemberDetails(parent.user_id)
          if (!details) return null
          
          return (
            <Button
              key={parent.user_id}
              variant={selectedMemberView === parent.user_id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedMemberView(parent.user_id)}
            >
              <User className="h-4 w-4 mr-1" />
              {details.name}
            </Button>
          )
        })}
      </div>
    )
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {showLabel && (
        <span className="text-sm text-muted-foreground">View:</span>
      )}
      
      <Select value={selectedMemberView} onValueChange={setSelectedMemberView}>
        <SelectTrigger className="w-[200px]">
          <SelectValue>
            {selectedMemberView === 'all' ? (
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>All Members</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {(() => {
                  const details = getMemberDetails(selectedMemberView)
                  if (!details) return <>Unknown</>
                  
                  return (
                    <>
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={details.avatar} />
                        <AvatarFallback className="text-xs">
                          {details.initials}
                        </AvatarFallback>
                      </Avatar>
                      <span>{details.name}</span>
                      {details.isChild && (
                        <Baby className="h-3 w-3 text-muted-foreground" />
                      )}
                    </>
                  )
                })()}
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        
        <SelectContent>
          <SelectItem value="all">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>All Members</span>
            </div>
          </SelectItem>
          
          {children.length > 0 && (
            <SelectGroup>
              <SelectLabel>Children</SelectLabel>
              {children.map(child => {
                const details = getMemberDetails(child.user_id)
                if (!details) return null
                
                return (
                  <SelectItem key={child.user_id} value={child.user_id}>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={details.avatar} />
                        <AvatarFallback className="text-xs">
                          {details.initials}
                        </AvatarFallback>
                      </Avatar>
                      <span>{details.name}</span>
                    </div>
                  </SelectItem>
                )
              })}
            </SelectGroup>
          )}
          
          {parents.length > 0 && (
            <SelectGroup>
              <SelectLabel>Parents</SelectLabel>
              {parents.map(parent => {
                const details = getMemberDetails(parent.user_id)
                if (!details) return null
                
                return (
                  <SelectItem key={parent.user_id} value={parent.user_id}>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={details.avatar} />
                        <AvatarFallback className="text-xs">
                          {details.initials}
                        </AvatarFallback>
                      </Avatar>
                      <span>{details.name}</span>
                      {details.isCurrentUser && (
                        <span className="text-xs text-muted-foreground">(You)</span>
                      )}
                    </div>
                  </SelectItem>
                )
              })}
            </SelectGroup>
          )}
        </SelectContent>
      </Select>
    </div>
  )
}