import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'

export interface AuthenticatedUser {
  id: string
  email: string
  familyId?: string
  role?: string
}

export async function authenticateRequest(request: NextRequest): Promise<{
  user: AuthenticatedUser | null
  error: string | null
}> {
  try {
    const supabase = await createClient()
    
    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { user: null, error: 'Unauthorized' }
    }

    // Get user's family information
    const { data: familyMember, error: familyError } = await supabase
      .from('family_members')
      .select(`
        family_id,
        role,
        family:families (*)
      `)
      .eq('user_id', user.id)
      .single()

    if (familyError) {
      // User might not be part of a family yet
      return {
        user: {
          id: user.id,
          email: user.email || ''
        },
        error: null
      }
    }

    return {
      user: {
        id: user.id,
        email: user.email || '',
        familyId: familyMember.family_id,
        role: familyMember.role
      },
      error: null
    }
  } catch (error) {
    console.error('Authentication error:', error)
    return { user: null, error: 'Authentication failed' }
  }
}

export async function requireAuth(request: NextRequest): Promise<{
  user: AuthenticatedUser
  error: Response | null
}> {
  const { user, error } = await authenticateRequest(request)
  
  if (!user || error) {
    return {
      user: null as any,
      error: Response.json(
        { error: error || 'Unauthorized' },
        { status: 401 }
      )
    }
  }

  return { user, error: null }
}

export async function requireFamilyAccess(request: NextRequest, requiredFamilyId?: string): Promise<{
  user: AuthenticatedUser
  error: Response | null
}> {
  const { user, error } = await requireAuth(request)
  
  if (error) {
    return { user: null as any, error }
  }

  if (!user.familyId) {
    return {
      user: null as any,
      error: Response.json(
        { error: 'User not part of any family' },
        { status: 403 }
      )
    }
  }

  if (requiredFamilyId && user.familyId !== requiredFamilyId) {
    return {
      user: null as any,
      error: Response.json(
        { error: 'Access denied to this family' },
        { status: 403 }
      )
    }
  }

  return { user, error: null }
}

export function createErrorResponse(message: string, status: number = 400) {
  return Response.json({ error: message }, { status })
}

export function createSuccessResponse(data: any, status: number = 200) {
  return Response.json(data, { status })
}