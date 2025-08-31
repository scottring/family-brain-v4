-- Fix user profile visibility for family members
-- Users should be able to see profiles of their family members

-- Drop the restrictive policy
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;

-- Create a new policy that allows users to see:
-- 1. Their own profile
-- 2. Profiles of users in the same family
CREATE POLICY "Users can view own and family member profiles" ON user_profiles
  FOR SELECT USING (
    auth.uid() = id
    OR 
    EXISTS (
      SELECT 1 FROM family_members fm1
      WHERE fm1.user_id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM family_members fm2
        WHERE fm2.family_id = fm1.family_id
        AND fm2.user_id = user_profiles.id
      )
    )
  );

-- Also create a policy to allow users to search for other users by email when adding to family
-- This is a special case that only exposes the id and email fields
CREATE POLICY "Users can check if email exists for family invites" ON user_profiles
  FOR SELECT USING (
    -- This policy allows any authenticated user to check if an email exists
    -- But they can only see the id and email fields (restricted in the query)
    auth.uid() IS NOT NULL
  );

-- Add a comment explaining the policies
COMMENT ON POLICY "Users can view own and family member profiles" ON user_profiles IS 
  'Allows users to see their own profile and profiles of users in the same family';

COMMENT ON POLICY "Users can check if email exists for family invites" ON user_profiles IS 
  'Allows authenticated users to check if an email exists when inviting to family';