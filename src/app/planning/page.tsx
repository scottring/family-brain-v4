'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

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
                <Link href="/today" className="text-gray-600 hover:text-gray-900 pb-1">
                  Today
                </Link>
                <Link href="/planning" className="text-blue-600 font-medium border-b-2 border-blue-600 pb-1">
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
            <Link href="/today" className="flex flex-col items-center text-gray-600 hover:text-gray-900">
              <span className="text-lg">⏰</span>
              <span className="text-xs">Today</span>
            </Link>
            <Link href="/planning" className="flex flex-col items-center text-blue-600">
              <span className="text-lg">📅</span>
              <span className="text-xs font-medium">Planning</span>
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
            <div className="text-6xl mb-6">📅</div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Weekly Planning</h2>
            <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
              This is where you'll design your week with drag-and-drop templates. 
              The planning interface will feature a week-view calendar with a template sidebar.
            </p>
            
            <div className="grid gap-8 lg:grid-cols-2 max-w-4xl mx-auto mb-8">
              <div className="text-left">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Planning Features</h3>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <span className="text-xl mr-3">📋</span>
                    <div>
                      <h4 className="font-medium text-gray-900">Template Sidebar</h4>
                      <p className="text-sm text-gray-600">Drag templates from categories onto your schedule</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <span className="text-xl mr-3">⏰</span>
                    <div>
                      <h4 className="font-medium text-gray-900">15-Minute Blocks</h4>
                      <p className="text-sm text-gray-600">Time slots that auto-collapse when empty</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <span className="text-xl mr-3">📝</span>
                    <div>
                      <h4 className="font-medium text-gray-900">Quick Add</h4>
                      <p className="text-sm text-gray-600">Click any slot to add simple items</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <span className="text-xl mr-3">📋</span>
                    <div>
                      <h4 className="font-medium text-gray-900">Copy Week</h4>
                      <p className="text-sm text-gray-600">Duplicate successful weeks to save time</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="text-left">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Available Templates</h3>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <span className="text-lg mr-3">🌅</span>
                    <span className="text-gray-700">Morning Routine</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-lg mr-3">🌙</span>
                    <span className="text-gray-700">Evening Wind Down</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-lg mr-3">🛏️</span>
                    <span className="text-gray-700">Bedwetting Response</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-lg mr-3">🐕</span>
                    <span className="text-gray-700">Leaving Dog Alone</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-lg mr-3">🛒</span>
                    <span className="text-gray-700">Grocery Shopping</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-lg mr-3">📝</span>
                    <span className="text-gray-700">General Notes</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-lg mr-3">🚗</span>
                    <span className="text-gray-700">Quick Errands</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-lg mr-3">📅</span>
                    <span className="text-gray-700">Weekly Planning Session</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-8">
              <p className="text-gray-600 mb-6">
                The planning interface is coming soon! For now, you can browse the available templates.
              </p>
              <Link 
                href="/sops" 
                className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Browse Templates
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}