'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { AppShell } from '@/components/common/AppShell'
import { PlanningView } from '@/components/planning/PlanningView'

export default function PlanningPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error || !user) {
        router.push('/auth/login')
        return
      }
      setUser(user)
      setLoading(false)
    }
    getUser()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full"></div>
          <p className="text-muted-foreground">Loading your planning workspace...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <AppShell>
      <PlanningView />
    </AppShell>
  )
}