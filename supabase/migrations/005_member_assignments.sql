-- Migration for member assignments to schedule items
-- Allows tasks to be assigned to specific family members

-- Add assigned_members to schedule_items metadata
-- We'll store this in the existing metadata JSONB field
-- Structure: { "assigned_members": ["user_id1", "user_id2"], ... }

-- Function to get tasks for a specific member
CREATE OR REPLACE FUNCTION get_tasks_for_member(
  p_schedule_id UUID,
  p_member_id UUID
) RETURNS SETOF schedule_items AS $$
BEGIN
  RETURN QUERY
  SELECT si.*
  FROM schedule_items si
  JOIN time_blocks tb ON tb.id = si.time_block_id
  WHERE tb.schedule_id = p_schedule_id
    AND (
      -- Task is assigned to this specific member
      si.metadata->'assigned_members' ? p_member_id::text
      OR 
      -- Task has no specific assignment (available to all)
      si.metadata->'assigned_members' IS NULL
      OR
      -- Task is assigned to all members
      si.metadata->>'assigned_members' = '["all"]'
    )
  ORDER BY tb.start_time, si.order_position;
END;
$$ LANGUAGE plpgsql;

-- Function to assign members to a schedule item
CREATE OR REPLACE FUNCTION assign_members_to_item(
  p_item_id UUID,
  p_member_ids UUID[]
) RETURNS void AS $$
BEGIN
  UPDATE schedule_items
  SET metadata = jsonb_set(
    COALESCE(metadata, '{}'::jsonb),
    '{assigned_members}',
    to_jsonb(p_member_ids)
  )
  WHERE id = p_item_id;
END;
$$ LANGUAGE plpgsql;

-- Function to check if a member is assigned to an item
CREATE OR REPLACE FUNCTION is_member_assigned(
  p_item_id UUID,
  p_member_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_assigned_members jsonb;
BEGIN
  SELECT metadata->'assigned_members' 
  INTO v_assigned_members
  FROM schedule_items 
  WHERE id = p_item_id;
  
  IF v_assigned_members IS NULL THEN
    -- No specific assignment means available to all
    RETURN TRUE;
  END IF;
  
  -- Check if member is in the assigned list
  RETURN v_assigned_members ? p_member_id::text;
END;
$$ LANGUAGE plpgsql;

-- Add helper view for member-specific schedule items
CREATE OR REPLACE VIEW member_schedule_items AS
SELECT 
  si.*,
  tb.schedule_id,
  tb.start_time,
  tb.end_time,
  s.family_id,
  s.date,
  CASE 
    WHEN si.metadata->'assigned_members' IS NULL THEN 'all'
    ELSE si.metadata->>'assigned_members'
  END as assignment_type
FROM schedule_items si
JOIN time_blocks tb ON tb.id = si.time_block_id
JOIN schedules s ON s.id = tb.schedule_id;

-- Comment explaining the member assignment structure
COMMENT ON COLUMN schedule_items.metadata IS 
'JSON metadata including assigned_members array: ["user_id1", "user_id2"] or ["all"] for all members, null for unassigned/available to all';