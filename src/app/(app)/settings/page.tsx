'use client'

import { memo, useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Settings,
  User,
  Palette,
  Bell,
  Shield,
  Users,
  Globe,
  Smartphone,
  Clock,
  Eye,
  Volume2,
  Mail,
  Save,
  LogOut,
  Trash2,
  Download,
  Upload
} from 'lucide-react'
import { AppShell } from '@/components/common/AppShell'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ThemeToggle } from '@/components/common/ThemeToggle'
import { useAppStore } from '@/lib/stores/useAppStore'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { FamilyService } from '@/lib/services/FamilyService'
import { toast } from 'sonner'

interface SettingsSectionProps {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  children: React.ReactNode
  badge?: string
}

const SettingsSection = memo(function SettingsSection({
  icon: Icon,
  title,
  description,
  children,
  badge
}: SettingsSectionProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <CardTitle className="text-lg">{title}</CardTitle>
              {badge && <Badge variant="secondary">{badge}</Badge>}
            </div>
            <CardDescription>{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {children}
      </CardContent>
    </Card>
  )
})

const SettingItem = memo(function SettingItem({
  label,
  description,
  children,
  className
}: {
  label: string
  description?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex items-center justify-between', className)}>
      <div className="flex-1 min-w-0 mr-4">
        <Label className="text-sm font-medium">{label}</Label>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      <div className="flex-shrink-0">
        {children}
      </div>
    </div>
  )
})

export default function SettingsPage() {
  const { user, currentFamilyMembers, currentFamilyId, setCurrentFamilyMembers, isInitializing } = useAppStore()
  const [newMemberEmail, setNewMemberEmail] = useState('')
  const [isAddingMember, setIsAddingMember] = useState(false)
  const [settings, setSettings] = useState({
    profile: {
      fullName: user?.full_name || '',
      email: user?.email || '',
      timezone: 'America/New_York'
    },
    notifications: {
      scheduleReminders: true,
      familyUpdates: true,
      weeklyDigest: true,
      emailNotifications: false
    },
    privacy: {
      shareSchedule: true,
      shareProgress: false,
      allowFamilyEdits: true
    },
    preferences: {
      startOfWeek: 'monday',
      timeFormat: '12',
      dateFormat: 'MM/DD/YYYY',
      defaultView: 'today'
    }
  })

  const [isLoading, setIsLoading] = useState(false)
  const familyService = new FamilyService()
  const supabase = createClient()
  
  // Debug logging and fallback family loading
  useEffect(() => {
    console.log('Settings page mounted:', { 
      user: user?.email, 
      currentFamilyId, 
      currentFamilyMembers: currentFamilyMembers.length,
      isInitializing 
    })
    
    // If user exists but no family is set, try to load it
    if (user && !currentFamilyId && !isInitializing) {
      const loadUserFamily = async () => {
        try {
          const { data: familyMembers } = await supabase
            .from('family_members')
            .select('family_id')
            .eq('user_id', user.id)
            .single()
          
          if (familyMembers?.family_id) {
            console.log('Setting family ID from fallback:', familyMembers.family_id)
            useAppStore.getState().setCurrentFamilyId(familyMembers.family_id)
            
            // Also load family members with their profiles in a single query
            const { data: members } = await supabase
              .from('family_members')
              .select(`
                *,
                user_profile:user_profiles(*)
              `)
              .eq('family_id', familyMembers.family_id)
            
            if (members) {
              console.log('Loaded family members from fallback:', members)
              useAppStore.getState().setCurrentFamilyMembers(members as any)
            } else {
              console.log('No members found for family')
            }
          }
        } catch (error) {
          console.error('Error loading family:', error)
        }
      }
      loadUserFamily()
    }
  }, [user, currentFamilyId, currentFamilyMembers, isInitializing, supabase])

  const handleSave = async () => {
    setIsLoading(true)
    try {
      // Save settings to backend
      console.log('Saving settings:', settings)
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
    } finally {
      setIsLoading(false)
    }
  }

  const handleExportData = () => {
    console.log('Exporting user data...')
  }

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      // Clear app state
      window.location.href = '/auth/login'
    } catch (error) {
      console.error('Error signing out:', error)
      toast.error('Failed to sign out')
    }
  }

  const handleDeleteAccount = () => {
    console.log('Deleting account...')
  }

  const handleAddFamilyMember = async () => {
    console.log('handleAddFamilyMember called', { newMemberEmail, currentFamilyId })
    
    if (!newMemberEmail) {
      toast.error('Please enter an email address')
      return
    }
    
    if (!currentFamilyId) {
      toast.error('No family selected. Please refresh the page.')
      console.error('No currentFamilyId set')
      return
    }
    
    setIsAddingMember(true)
    try {
      // First, check if user exists
      const { data: userData, error: userError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('email', newMemberEmail)
        .single()
      
      if (userError || !userData) {
        toast.error('User not found. They need to sign up first.')
        return
      }
      
      // Add them to the family
      await familyService.addFamilyMember(currentFamilyId, userData.id, 'member')
      
      // Refresh family members
      const members = await familyService.getFamilyMembers(currentFamilyId)
      setCurrentFamilyMembers(members)
      
      toast.success(`Added ${newMemberEmail} to the family!`)
      setNewMemberEmail('')
    } catch (error) {
      console.error('Error adding family member:', error)
      toast.error('Failed to add family member')
    } finally {
      setIsAddingMember(false)
    }
  }

  const handleRemoveFamilyMember = async (memberId: string) => {
    if (!currentFamilyId) return
    
    try {
      await familyService.removeFamilyMember(memberId)
      
      // Refresh family members
      const members = await familyService.getFamilyMembers(currentFamilyId)
      setCurrentFamilyMembers(members)
      
      toast.success('Removed family member')
    } catch (error) {
      console.error('Error removing family member:', error)
      toast.error('Failed to remove family member')
    }
  }
  
  const handleUpdateMemberRole = async (memberId: string, newRole: 'owner' | 'member') => {
    if (!currentFamilyId) return
    
    try {
      const { error } = await supabase
        .from('family_members')
        .update({ role: newRole })
        .eq('id', memberId)
      
      if (error) throw error
      
      // Refresh family members
      const members = await familyService.getFamilyMembers(currentFamilyId)
      setCurrentFamilyMembers(members)
      
      toast.success(`Updated member role to ${newRole === 'owner' ? 'Admin' : 'Member'}`)
    } catch (error) {
      console.error('Error updating member role:', error)
      toast.error('Failed to update member role')
    }
  }
  
  // Show loading state while app is initializing
  if (isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <AppShell>
      <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-background">
        <div className="max-w-4xl mx-auto p-6 space-y-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2"
          >
            <div className="flex items-center space-x-3">
              <Settings className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold text-foreground">Settings</h1>
            </div>
            <p className="text-muted-foreground">
              Customize your Family Brain experience and manage your preferences.
            </p>
          </motion.div>

          <div className="space-y-6">
            {/* Profile Settings */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <SettingsSection
                icon={User}
                title="Profile"
                description="Manage your personal information and account details"
              >
                <div className="flex items-center space-x-6 mb-6">
                  <Avatar className="h-20 w-20 ring-4 ring-border/50">
                    <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/30 text-primary font-bold text-xl">
                      {user?.full_name?.charAt(0) || user?.email?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-2">
                    <Button variant="outline" size="sm">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Photo
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      JPG, PNG or GIF. Max size 2MB.
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      value={settings.profile.fullName}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        profile: { ...prev.profile, fullName: e.target.value }
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={settings.profile.email}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        profile: { ...prev.profile, email: e.target.value }
                      }))}
                    />
                  </div>
                </div>
              </SettingsSection>
            </motion.div>

            {/* Appearance */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <SettingsSection
                icon={Palette}
                title="Appearance"
                description="Customize the look and feel of your interface"
              >
                <SettingItem
                  label="Theme"
                  description="Choose between light, dark, or system theme"
                >
                  <ThemeToggle showLabel />
                </SettingItem>
              </SettingsSection>
            </motion.div>

            {/* Family Members */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <SettingsSection
                icon={Users}
                title="Family Members"
                description="Manage who's part of your family group"
              >
                <div className="space-y-4">
                  {/* Current Members */}
                  <div>
                    <Label className="text-sm font-medium mb-3 block">Current Members ({currentFamilyMembers.length})</Label>
                    <div className="space-y-2">
                      {currentFamilyMembers.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No family members yet. Add your first member below.</p>
                      ) : (
                        currentFamilyMembers.map((member) => (
                        <div 
                          key={member.user_id}
                          className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                        >
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/30 text-primary font-bold">
                                {member.user_profile?.full_name?.charAt(0).toUpperCase() || '?'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{member.user_profile?.full_name || 'Unknown'}</p>
                              <p className="text-xs text-muted-foreground">{member.user_profile?.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge 
                              variant={member.role === 'owner' ? 'default' : 'secondary'}
                              className="cursor-pointer"
                              onClick={() => {
                                // Only allow role changes if you're an owner and it's not yourself
                                if (user && currentFamilyMembers.find(m => m.user_id === user.id)?.role === 'owner' && member.user_id !== user.id) {
                                  handleUpdateMemberRole(member.id, member.role === 'owner' ? 'member' : 'owner')
                                }
                              }}
                              title={
                                user && currentFamilyMembers.find(m => m.user_id === user.id)?.role === 'owner' && member.user_id !== user.id
                                  ? 'Click to change role'
                                  : ''
                              }
                            >
                              {member.role === 'owner' ? 'Admin' : 'Member'}
                            </Badge>
                            {member.user_id !== user?.id && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveFamilyMember(member.id)}
                                title="Remove member"
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* Add New Member */}
                  <div>
                    <Label className="text-sm font-medium mb-3 block">Add Family Member</Label>
                    <div className="flex space-x-2">
                      <Input
                        type="email"
                        placeholder="Enter email address"
                        value={newMemberEmail}
                        onChange={(e) => setNewMemberEmail(e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        onClick={handleAddFamilyMember}
                        disabled={isAddingMember || !newMemberEmail}
                      >
                        {isAddingMember ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          >
                            <Save className="h-4 w-4" />
                          </motion.div>
                        ) : (
                          'Add Member'
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      The person must have an account already. They'll be added as a Member by default. 
                      Click their role badge to promote them to Admin (Admins can manage family members).
                    </p>
                  </div>
                </div>
              </SettingsSection>
            </motion.div>

            {/* Notifications */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <SettingsSection
                icon={Bell}
                title="Notifications"
                description="Control when and how you receive notifications"
                badge="Pro"
              >
                <div className="space-y-4">
                  <SettingItem
                    label="Schedule Reminders"
                    description="Get notified before time blocks start"
                  >
                    <Button
                      variant={settings.notifications.scheduleReminders ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSettings(prev => ({
                        ...prev,
                        notifications: { 
                          ...prev.notifications, 
                          scheduleReminders: !prev.notifications.scheduleReminders 
                        }
                      }))}
                    >
                      {settings.notifications.scheduleReminders ? 'On' : 'Off'}
                    </Button>
                  </SettingItem>

                  <SettingItem
                    label="Family Updates"
                    description="Notifications when family members update schedules"
                  >
                    <Button
                      variant={settings.notifications.familyUpdates ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSettings(prev => ({
                        ...prev,
                        notifications: { 
                          ...prev.notifications, 
                          familyUpdates: !prev.notifications.familyUpdates 
                        }
                      }))}
                    >
                      {settings.notifications.familyUpdates ? 'On' : 'Off'}
                    </Button>
                  </SettingItem>

                  <SettingItem
                    label="Email Notifications"
                    description="Receive notifications via email"
                  >
                    <Button
                      variant={settings.notifications.emailNotifications ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSettings(prev => ({
                        ...prev,
                        notifications: { 
                          ...prev.notifications, 
                          emailNotifications: !prev.notifications.emailNotifications 
                        }
                      }))}
                    >
                      {settings.notifications.emailNotifications ? 'On' : 'Off'}
                    </Button>
                  </SettingItem>
                </div>
              </SettingsSection>
            </motion.div>

            {/* Privacy */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <SettingsSection
                icon={Shield}
                title="Privacy & Sharing"
                description="Control what information is shared with family members"
              >
                <div className="space-y-4">
                  <SettingItem
                    label="Share Schedule"
                    description="Allow family members to see your schedule"
                  >
                    <Button
                      variant={settings.privacy.shareSchedule ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSettings(prev => ({
                        ...prev,
                        privacy: { 
                          ...prev.privacy, 
                          shareSchedule: !prev.privacy.shareSchedule 
                        }
                      }))}
                    >
                      {settings.privacy.shareSchedule ? 'On' : 'Off'}
                    </Button>
                  </SettingItem>

                  <SettingItem
                    label="Allow Family Edits"
                    description="Let family members edit your schedules"
                  >
                    <Button
                      variant={settings.privacy.allowFamilyEdits ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSettings(prev => ({
                        ...prev,
                        privacy: { 
                          ...prev.privacy, 
                          allowFamilyEdits: !prev.privacy.allowFamilyEdits 
                        }
                      }))}
                    >
                      {settings.privacy.allowFamilyEdits ? 'On' : 'Off'}
                    </Button>
                  </SettingItem>
                </div>
              </SettingsSection>
            </motion.div>

            {/* Data & Security */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <SettingsSection
                icon={Globe}
                title="Data & Security"
                description="Manage your data and account security"
              >
                <div className="space-y-4">
                  <SettingItem
                    label="Export Data"
                    description="Download a copy of all your data"
                  >
                    <Button variant="outline" size="sm" onClick={handleExportData}>
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </SettingItem>

                  <Separator />

                  <SettingItem
                    label="Sign Out"
                    description="Sign out of your account on this device"
                  >
                    <Button variant="outline" size="sm" onClick={handleSignOut}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </Button>
                  </SettingItem>

                  <SettingItem
                    label="Delete Account"
                    description="Permanently delete your account and all data"
                  >
                    <Button variant="destructive" size="sm" onClick={handleDeleteAccount}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </SettingItem>
                </div>
              </SettingsSection>
            </motion.div>

            {/* Save Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex justify-end"
            >
              <Button onClick={handleSave} disabled={isLoading} size="lg">
                {isLoading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="h-4 w-4 mr-2"
                  >
                    <Save className="h-4 w-4" />
                  </motion.div>
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Changes
              </Button>
            </motion.div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}