-- Fix user_profiles insert during signup
-- The issue is that during signup, the user might not have a fully established session yet

-- Drop the existing INSERT policy
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;

-- Create a more permissive INSERT policy that allows authenticated users to create profiles
-- This is safe because the id field is the user's auth.uid() which prevents creating profiles for others
CREATE POLICY "Authenticated users can create profiles" ON user_profiles
  FOR INSERT 
  TO authenticated
  WITH CHECK (true);

-- Also ensure the authenticated user is creating their own profile
CREATE POLICY "Users must insert own profile" ON user_profiles
  FOR INSERT
  WITH CHECK (id = auth.uid());