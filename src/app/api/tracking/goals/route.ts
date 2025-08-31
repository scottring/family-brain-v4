import { NextRequest, NextResponse } from 'next/server'
import { trackingService } from '@/lib/services/TrackingService'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const familyId = searchParams.get('familyId')
    const memberId = searchParams.get('memberId')

    if (!familyId) {
      return NextResponse.json(
        { error: 'Family ID is required' },
        { status: 400 }
      )
    }

    const goals = memberId === 'all' || !memberId
      ? await trackingService.getActiveGoals(familyId)
      : await trackingService.getMemberGoals(familyId, memberId)

    return NextResponse.json({ success: true, data: goals })
  } catch (error) {
    console.error('Error fetching tracking goals:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tracking goals' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const result = await trackingService.createGoal(body)

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error('Error creating tracking goal:', error)
    return NextResponse.json(
      { error: 'Failed to create tracking goal' },
      { status: 500 }
    )
  }
}