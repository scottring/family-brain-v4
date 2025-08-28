-- Simplify and fix user_profiles RLS policies
-- Remove all existing policies and create clean, simple ones

-- Drop all existing policies on user_profiles
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON user_profiles;
DROP POLICY IF EXISTS "Authenticated users can create profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users must insert own profile" ON user_profiles;

-- Create simple, working policies
-- Allow authenticated users to do everything with their own profile
CREATE POLICY "Users manage own profile" ON user_profiles
  FOR ALL 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);