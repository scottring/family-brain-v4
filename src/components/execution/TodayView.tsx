'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { redirect, useRouter } from 'next/navigation'
import Link from 'next/link'

export function TodayView() {
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-8">
              <h1 className="text-2xl font-bold text-gray-900">Itineraries</h1>
              <nav className="hidden md:flex gap-6">
                <Link href="/today" className="text-blue-600 font-medium border-b-2 border-blue-600 pb-1">
                  Today
                </Link>
                <Link href="/planning" className="text-gray-600 hover:text-gray-900 pb-1">
                  Planning
                </Link>
                <Link href="/sops" className="text-gray-600 hover:text-gray-900 pb-1">
                  SOPs
                </Link>
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <span className="hidden sm:inline text-sm text-gray-600">{user.email}</span>
              <button 
                onClick={handleSignOut}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      <nav className="md:hidden bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-around py-3">
            <Link href="/today" className="flex flex-col items-center text-blue-600">
              <span className="text-lg">⏰</span>
              <span className="text-xs font-medium">Today</span>
            </Link>
            <Link href="/planning" className="flex flex-col items-center text-gray-600 hover:text-gray-900">
              <span className="text-lg">📅</span>
              <span className="text-xs">Planning</span>
            </Link>
            <Link href="/sops" className="flex flex-col items-center text-gray-600 hover:text-gray-900">
              <span className="text-lg">📋</span>
              <span className="text-xs">SOPs</span>
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-8">
          <div className="text-center">
            <div className="text-6xl mb-6">⏰</div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Today's Schedule</h2>
            <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
              Your daily execution view will appear here once you start planning your week. 
              This is where you'll see your time-blocked schedule and check off completed tasks.
            </p>
            
            <div className="grid gap-6 md:grid-cols-2 max-w-2xl mx-auto mb-8">
              <div className="bg-blue-50 p-6 rounded-lg">
                <div className="text-2xl mb-3">📅</div>
                <h3 className="font-semibold text-gray-900 mb-2">Plan Your Week</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Drag templates onto your weekly schedule to create time-blocked days.
                </p>
                <Link 
                  href="/planning" 
                  className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Start Planning
                </Link>
              </div>
              
              <div className="bg-green-50 p-6 rounded-lg">
                <div className="text-2xl mb-3">📋</div>
                <h3 className="font-semibold text-gray-900 mb-2">Quick Reference</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Access any template or checklist instantly, even without scheduling.
                </p>
                <Link 
                  href="/sops" 
                  className="inline-block px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                >
                  Browse SOPs
                </Link>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">What you'll see here:</h3>
              <div className="grid gap-4 md:grid-cols-3 text-left">
                <div className="flex items-start">
                  <span className="text-2xl mr-3">🎯</span>
                  <div>
                    <h4 className="font-medium text-gray-900">Current Focus</h4>
                    <p className="text-sm text-gray-600">Your current time block highlighted</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <span className="text-2xl mr-3">✅</span>
                  <div>
                    <h4 className="font-medium text-gray-900">Progress Tracking</h4>
                    <p className="text-sm text-gray-600">Check off completed tasks</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <span className="text-2xl mr-3">👫</span>
                  <div>
                    <h4 className="font-medium text-gray-900">Family Sync</h4>
                    <p className="text-sm text-gray-600">See spouse's progress in real-time</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}