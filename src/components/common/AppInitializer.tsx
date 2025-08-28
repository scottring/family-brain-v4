'use client'

import { useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/lib/stores/useAppStore'
import { UserProfile, Family, FamilyMemberWithProfile } from '@/lib/types/database'

export function AppInitializer() {
  const { 
    user,
    setUser, 
    setCurrentFamilyId, 
    setFamilies,
    setCurrentFamilyMembers,
    setIsInitializing
  } = useAppStore()
  
  const [mounted, setMounted] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (!mounted) {
      setMounted(true)
      return
    }

    let isCancelled = false

    const initializeApp = async () => {
      try {
        console.log('Starting app initialization...')
        setIsInitializing(true)
        
        // Get the authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        if (authError || !user) {
          console.log('No authenticated user found')
          setIsInitializing(false)
          return
        }

        if (isCancelled) return

        console.log('User authenticated:', user.id)

        // Get or create user profile
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (profileError) {
          if (profileError.code === 'PGRST116') {
            // Profile doesn't exist, create it
            console.log('Creating user profile...')
            const { data: newProfile, error: createError } = await supabase
              .from('user_profiles')
              .insert({
                id: user.id,
                email: user.email || '',
                full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'
              })
              .select()
              .single()

            if (createError) {
              console.error('Error creating profile:', createError)
              setIsInitializing(false)
              return
            }
            setUser(newProfile as UserProfile)
          } else {
            console.error('Error loading profile:', profileError)
            setIsInitializing(false)
            return
          }
        } else {
          setUser(profile as UserProfile)
        }

        if (isCancelled) return

        // Get user's families - simplified query
        console.log('Loading user families...')
        const { data: familyMembers, error: familiesError } = await supabase
          .from('family_members')
          .select('*')
          .eq('user_id', user.id)
        
        if (familiesError) {
          console.error('Error loading family members:', familiesError)
          setIsInitializing(false)
          return
        }

        if (isCancelled) return

        if (familyMembers && familyMembers.length > 0) {
          // Load the actual families
          const familyIds = familyMembers.map(fm => fm.family_id)
          const { data: families, error: familyError } = await supabase
            .from('families')
            .select('*')
            .in('id', familyIds)

          if (familyError) {
            console.error('Error loading families:', familyError)
            setIsInitializing(false)
            return
          }

          if (isCancelled) return

          setFamilies(families || [])
          
          // Set the first family as current
          if (families && families.length > 0) {
            const currentFamily = families[0]
            setCurrentFamilyId(currentFamily.id)
            
            // Load family members with profiles
            const { data: members, error: membersError } = await supabase
              .from('family_members')
              .select('*')
              .eq('family_id', currentFamily.id)
            
            if (!membersError && members) {
              // Load user profiles for members
              const userIds = members.map(m => m.user_id)
              const { data: profiles, error: profilesError } = await supabase
                .from('user_profiles')
                .select('*')
                .in('id', userIds)

              if (!profilesError && profiles) {
                const membersWithProfile = members.map(m => ({
                  ...m,
                  user_profile: profiles.find(p => p.id === m.user_id)
                }))
                setCurrentFamilyMembers(membersWithProfile as FamilyMemberWithProfile[])
              }
            }
          }
        } else {
          // No family exists, create one
          console.log('No family found, creating default family...')
          const { data: newFamily, error: createFamilyError } = await supabase
            .from('families')
            .insert({
              name: `${user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'}'s Family`,
              settings: {}
            })
            .select()
            .single()
          
          if (createFamilyError) {
            console.error('Error creating family:', createFamilyError)
            setIsInitializing(false)
            return
          }

          if (isCancelled) return

          if (newFamily) {
            // Add user as family member
            const { error: memberError } = await supabase
              .from('family_members')
              .insert({
                family_id: newFamily.id,
                user_id: user.id,
                role: 'owner'
              })
            
            if (memberError) {
              console.error('Error adding family member:', memberError)
              setIsInitializing(false)
              return
            }

            if (isCancelled) return

            setFamilies([newFamily as Family])
            setCurrentFamilyId(newFamily.id)
            
            // Load the member with profile
            const { data: profile } = await supabase
              .from('user_profiles')
              .select('*')
              .eq('id', user.id)
              .single()

            if (profile) {
              setCurrentFamilyMembers([{
                id: crypto.randomUUID(),
                family_id: newFamily.id,
                user_id: user.id,
                role: 'owner',
                joined_at: new Date().toISOString(),
                user_profile: profile
              } as FamilyMemberWithProfile])
            }
          }
        }

        console.log('App initialization complete')
        setIsInitializing(false)
        
      } catch (error) {
        console.error('Error initializing app:', error)
        setIsInitializing(false)
      }
    }

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      // Only handle logout - initialization happens once on mount
      if (!session?.user) {
        setUser(null)
        setCurrentFamilyId(null)
        setFamilies([])
        setCurrentFamilyMembers([])
        setIsInitializing(false)
      }
    })

    // Initial load
    initializeApp()

    return () => {
      isCancelled = true
      subscription.unsubscribe()
    }
  }, [mounted, supabase, setUser, setCurrentFamilyId, setFamilies, setCurrentFamilyMembers, setIsInitializing])

  // Show loading state while initializing
  const isInitializing = useAppStore(state => state.isInitializing)
  
  if (isInitializing) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Setting up your family workspace...
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            This will only take a moment
          </p>
        </div>
      </div>
    )
  }

  return null
}