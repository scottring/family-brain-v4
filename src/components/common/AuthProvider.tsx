'use client'

import { ReactNode, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/lib/stores/useAppStore'
import { familyService } from '@/lib/services/FamilyService'
import type { User } from '@supabase/supabase-js'

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const router = useRouter()
  const { user, setUser, setFamilies, setCurrentFamilyId, setIsLoading } = useAppStore()
  const [isInitialized, setIsInitialized] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    let mounted = true

    // Get initial session
    const getInitialSession = async () => {
      try {
        setIsLoading(true)
        
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Auth error:', error)
          return
        }

        if (session?.user) {
          await handleUserSignIn(session.user)
        }
      } catch (error) {
        console.error('Error getting initial session:', error)
      } finally {
        if (mounted) {
          setIsLoading(false)
          setIsInitialized(true)
        }
      }
    }

    // Handle user sign in
    const handleUserSignIn = async (authUser: User) => {
      try {
        // Get or create user profile
        let userProfile = await familyService.getCurrentUserProfile()
        
        if (!userProfile) {
          // Create user profile if it doesn't exist
          userProfile = {
            id: authUser.id,
            email: authUser.email!,
            full_name: authUser.user_metadata?.full_name || null,
            avatar_url: authUser.user_metadata?.avatar_url || null,
            preferences: {},
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
          
          await supabase.from('user_profiles').insert(userProfile)
        }
        
        setUser(userProfile)
        
        // Load user's families
        const families = await familyService.getUserFamilies(authUser.id)
        setFamilies(families)
        
        // Set current family (first one if available)
        if (families.length > 0) {
          setCurrentFamilyId(families[0].id)
        }
        
        // Redirect to today view if on auth page
        if (window.location.pathname.startsWith('/auth') || window.location.pathname === '/') {
          router.replace('/today')
        }
      } catch (error) {
        console.error('Error handling user sign in:', error)
      }
    }

    // Handle user sign out
    const handleUserSignOut = () => {
      setUser(null)
      setFamilies([])
      setCurrentFamilyId(null)
      router.replace('/auth/login')
    }

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return

        if (event === 'SIGNED_IN' && session?.user) {
          await handleUserSignIn(session.user)
        } else if (event === 'SIGNED_OUT') {
          handleUserSignOut()
        }
      }
    )

    getInitialSession()

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [supabase.auth, router, setUser, setFamilies, setCurrentFamilyId, setIsLoading])

  // Show loading screen while initializing
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}