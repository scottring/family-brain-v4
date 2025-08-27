#!/usr/bin/env node

/**
 * Script to create a test user for Family Brain V4
 * Usage: node scripts/create-test-user.js
 */

const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function createTestUser() {
  console.log('🚀 Creating test user for Family Brain V4...\n')
  
  const testUser = {
    email: 'test@familybrain.com',
    password: 'testpass123',
    fullName: 'Test User'
  }

  console.log('Email:', testUser.email)
  console.log('Password:', testUser.password)
  console.log('')

  try {
    // Sign up the user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testUser.email,
      password: testUser.password,
      options: {
        data: {
          full_name: testUser.fullName,
        }
      }
    })

    if (authError) {
      console.error('❌ Failed to create user:', authError.message)
      process.exit(1)
    }

    console.log('✅ User created successfully!')
    console.log('User ID:', authData.user?.id)
    console.log('')
    console.log('You can now log in at http://localhost:3001/auth/login')
    console.log('Use the email and password shown above.')
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
    process.exit(1)
  }
}

createTestUser()