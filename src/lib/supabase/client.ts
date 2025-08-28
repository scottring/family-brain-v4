import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Create a new client for each request to ensure proper authentication
export function createClient() {
  return createBrowserClient(supabaseUrl!, supabaseAnonKey!, {
    auth: {
      // Persist session across reloads and refresh tokens automatically
      persistSession: true,
      autoRefreshToken: true,
      // Handle OAuth/magic-link callback URLs
      detectSessionInUrl: true
    }
  })
}