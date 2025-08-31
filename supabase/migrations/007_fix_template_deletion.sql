-- Add policy to allow users to delete their own system templates
CREATE POLICY "Users can delete their own system templates" ON templates
  FOR DELETE USING (
    is_system = true 
    AND created_by = auth.uid()::text
  );

-- Also add a policy for INSERT and UPDATE to manage system templates
CREATE POLICY "Users can create their own system templates" ON templates
  FOR INSERT WITH CHECK (
    is_system = true 
    AND created_by = auth.uid()::text
  );

CREATE POLICY "Users can update their own system templates" ON templates
  FOR UPDATE USING (
    is_system = true 
    AND created_by = auth.uid()::text
  );