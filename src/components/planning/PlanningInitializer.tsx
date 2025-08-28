'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/stores/useAppStore'
import { useTemplateStore } from '@/lib/stores/useTemplateStore'
import { createClient } from '@/lib/supabase/client'
import { templateService } from '@/lib/services/TemplateService'

export function PlanningInitializer() {
  const { 
    currentFamilyId, 
    setCurrentFamilyId, 
    user,
    families,
    setFamilies
  } = useAppStore()
  const { setTemplates } = useTemplateStore()
  const [isInitialized, setIsInitialized] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const initializePlanning = async () => {
      if (!user || isInitialized) return

      try {
        // First, check if user has families
        const { data: userFamilies, error: familiesError } = await supabase
          .from('family_members')
          .select(`
            family_id,
            role,
            families (
              id,
              name,
              settings,
              created_at,
              updated_at
            )
          `)
          .eq('user_id', user.id)

        if (familiesError) {
          console.error('Error fetching families:', familiesError)
          return
        }

        let availableFamilies = userFamilies?.map(fm => fm.families).filter(Boolean) || []
        
        // If no families exist, create a default one
        if (availableFamilies.length === 0) {
          const { data: newFamily, error: createError } = await supabase
            .from('families')
            .insert({
              name: `${user.user_metadata?.full_name || user.email}'s Family`,
              settings: {}
            })
            .select()
            .single()

          if (createError) {
            console.error('Error creating family:', createError)
            return
          }

          // Add user as family owner
          const { error: memberError } = await supabase
            .from('family_members')
            .insert({
              family_id: newFamily.id,
              user_id: user.id,
              role: 'owner'
            })

          if (memberError) {
            console.error('Error adding family member:', memberError)
            return
          }

          availableFamilies = [newFamily]
        }

        // Set families in store
        setFamilies(availableFamilies)

        // Set current family if none is set
        if (!currentFamilyId && availableFamilies.length > 0) {
          setCurrentFamilyId(availableFamilies[0].id)
        }

        // Load templates for the current family
        const familyId = currentFamilyId || availableFamilies[0]?.id
        if (familyId) {
          const templates = await templateService.getTemplatesByFamily(familyId)
          setTemplates(templates)
        }

        setIsInitialized(true)
      } catch (error) {
        console.error('Error initializing planning:', error)
      }
    }

    initializePlanning()
  }, [user, isInitialized, currentFamilyId, setCurrentFamilyId, setFamilies, setTemplates])

  // This is a data initialization component, no UI needed
  return null
}