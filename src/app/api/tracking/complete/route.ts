import { NextRequest, NextResponse } from 'next/server'
import { trackingService } from '@/lib/services/TrackingService'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { templateId, memberId, date, completed, metadata } = body

    if (!templateId) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      )
    }

    const result = await trackingService.recordCompletion(
      templateId,
      new Date(date || Date.now()),
      completed,
      memberId,
      metadata
    )

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error('Error recording completion:', error)
    return NextResponse.json(
      { error: 'Failed to record completion' },
      { status: 500 }
    )
  }
}