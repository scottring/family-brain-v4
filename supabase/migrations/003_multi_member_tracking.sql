-- Migration for multi-member task tracking
-- Allows tasks to be assigned to and completed by multiple family members independently

-- First, drop the existing unique constraint
ALTER TABLE template_instance_steps 
DROP CONSTRAINT IF EXISTS template_instance_steps_template_instance_id_template_step_id_key;

-- Add assigned_to field to track who this step instance is for
ALTER TABLE template_instance_steps 
ADD COLUMN assigned_to UUID REFERENCES user_profiles(id);

-- Create new unique constraint including assigned_to
ALTER TABLE template_instance_steps 
ADD CONSTRAINT template_instance_steps_unique_per_member 
UNIQUE(template_instance_id, template_step_id, assigned_to);

-- Add assignee configuration to template_steps metadata
-- This will be stored in the existing metadata JSONB field with structure:
-- {
--   "assignee_type": "all_members" | "specific_member" | "any_member" | "all_children",
--   "specific_member_id": "uuid" (optional, used when assignee_type is specific_member),
--   "exclude_members": ["uuid1", "uuid2"] (optional, members to exclude)
-- }

-- Add a helper function to get family children (members who are not owners)
CREATE OR REPLACE FUNCTION get_family_children(p_family_id UUID)
RETURNS TABLE(user_id UUID, full_name TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    fm.user_id,
    up.full_name
  FROM family_members fm
  JOIN user_profiles up ON up.id = fm.user_id
  WHERE fm.family_id = p_family_id
    AND fm.role = 'member'  -- Children are members, not owners
  ORDER BY up.full_name;
END;
$$ LANGUAGE plpgsql;

-- Add a helper function to create template instance steps for multi-member assignments
CREATE OR REPLACE FUNCTION create_multi_member_instance_steps(
  p_template_instance_id UUID,
  p_template_id UUID,
  p_family_id UUID
) RETURNS void AS $$
DECLARE
  v_step RECORD;
  v_member RECORD;
  v_assignee_type TEXT;
  v_specific_member_id UUID;
BEGIN
  -- Loop through each template step
  FOR v_step IN 
    SELECT * FROM template_steps 
    WHERE template_id = p_template_id
    ORDER BY order_position
  LOOP
    -- Extract assignee configuration from metadata
    v_assignee_type := COALESCE(
      v_step.metadata->>'assignee_type', 
      'any_member'  -- Default to any member can complete
    );
    
    IF v_assignee_type = 'all_members' THEN
      -- Create instance for all family members
      FOR v_member IN 
        SELECT user_id FROM family_members 
        WHERE family_id = p_family_id
      LOOP
        INSERT INTO template_instance_steps (
          template_instance_id,
          template_step_id,
          assigned_to,
          created_at
        ) VALUES (
          p_template_instance_id,
          v_step.id,
          v_member.user_id,
          NOW()
        );
      END LOOP;
      
    ELSIF v_assignee_type = 'all_children' THEN
      -- Create instance for all children (non-owner members)
      FOR v_member IN 
        SELECT user_id FROM get_family_children(p_family_id)
      LOOP
        INSERT INTO template_instance_steps (
          template_instance_id,
          template_step_id,
          assigned_to,
          created_at
        ) VALUES (
          p_template_instance_id,
          v_step.id,
          v_member.user_id,
          NOW()
        );
      END LOOP;
      
    ELSIF v_assignee_type = 'specific_member' THEN
      -- Create instance for specific member
      v_specific_member_id := (v_step.metadata->>'specific_member_id')::UUID;
      IF v_specific_member_id IS NOT NULL THEN
        INSERT INTO template_instance_steps (
          template_instance_id,
          template_step_id,
          assigned_to,
          created_at
        ) VALUES (
          p_template_instance_id,
          v_step.id,
          v_specific_member_id,
          NOW()
        );
      END IF;
      
    ELSE -- 'any_member' or default
      -- Create single instance without specific assignment
      INSERT INTO template_instance_steps (
        template_instance_id,
        template_step_id,
        assigned_to,
        created_at
      ) VALUES (
        p_template_instance_id,
        v_step.id,
        NULL,  -- No specific assignment
        NOW()
      );
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Update RLS policies for the new structure
CREATE POLICY "Users can view their assigned steps" ON template_instance_steps
  FOR SELECT USING (
    assigned_to = auth.uid() OR
    assigned_to IS NULL OR
    EXISTS (
      SELECT 1 FROM template_instances ti
      JOIN schedule_items si ON si.id = ti.schedule_item_id
      JOIN time_blocks tb ON tb.id = si.time_block_id
      JOIN schedules s ON s.id = tb.schedule_id
      JOIN family_members fm ON fm.family_id = s.family_id
      WHERE ti.id = template_instance_steps.template_instance_id
        AND fm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their assigned steps" ON template_instance_steps
  FOR UPDATE USING (
    assigned_to = auth.uid() OR
    assigned_to IS NULL OR
    EXISTS (
      SELECT 1 FROM template_instances ti
      JOIN schedule_items si ON si.id = ti.schedule_item_id
      JOIN time_blocks tb ON tb.id = si.time_block_id
      JOIN schedules s ON s.id = tb.schedule_id
      JOIN family_members fm ON fm.family_id = s.family_id
      WHERE ti.id = template_instance_steps.template_instance_id
        AND fm.user_id = auth.uid()
    )
  );

-- Add index for performance
CREATE INDEX idx_template_instance_steps_assigned ON template_instance_steps(assigned_to) 
WHERE assigned_to IS NOT NULL;

-- Add comment explaining the new structure
COMMENT ON COLUMN template_instance_steps.assigned_to IS 
'The family member this step instance is assigned to. NULL means any family member can complete it.';

COMMENT ON COLUMN template_steps.metadata IS 
'JSON metadata including assignee_type configuration: all_members, all_children, specific_member, or any_member';