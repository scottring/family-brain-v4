-- Migration for template recurrence support
-- Allows templates to be scheduled with recurring patterns

-- Add recurrence fields to schedule_items table
ALTER TABLE schedule_items 
ADD COLUMN recurrence_pattern TEXT, -- 'daily', 'weekdays', 'weekly', 'custom'
ADD COLUMN recurrence_days INTEGER[], -- Array of days (0=Sunday, 6=Saturday) for weekly patterns
ADD COLUMN recurrence_end_date DATE, -- When the recurrence ends
ADD COLUMN recurrence_group_id UUID; -- Groups recurring items together

-- Create an index for recurrence groups
CREATE INDEX idx_schedule_items_recurrence_group ON schedule_items(recurrence_group_id) 
WHERE recurrence_group_id IS NOT NULL;

-- Function to create recurring template instances
CREATE OR REPLACE FUNCTION create_recurring_template_instances(
  p_template_id UUID,
  p_time_block_id UUID,
  p_start_date DATE,
  p_end_date DATE,
  p_recurrence_pattern TEXT,
  p_recurrence_days INTEGER[],
  p_family_id UUID
) RETURNS UUID AS $$
DECLARE
  v_current_date DATE;
  v_schedule_id UUID;
  v_target_time_block_id UUID;
  v_schedule_item_id UUID;
  v_template_instance_id UUID;
  v_recurrence_group_id UUID;
  v_time_block RECORD;
BEGIN
  -- Generate a group ID for all related recurring items
  v_recurrence_group_id := gen_random_uuid();
  
  -- Get the original time block details
  SELECT * INTO v_time_block FROM time_blocks WHERE id = p_time_block_id;
  
  -- Loop through each date in the range
  v_current_date := p_start_date;
  
  WHILE v_current_date <= p_end_date LOOP
    -- Check if this date matches the recurrence pattern
    IF (
      (p_recurrence_pattern = 'daily') OR
      (p_recurrence_pattern = 'weekdays' AND EXTRACT(DOW FROM v_current_date) BETWEEN 1 AND 5) OR
      (p_recurrence_pattern = 'weekly' AND EXTRACT(DOW FROM v_current_date) = ANY(p_recurrence_days)) OR
      (p_recurrence_pattern = 'custom' AND EXTRACT(DOW FROM v_current_date) = ANY(p_recurrence_days))
    ) THEN
      -- Get or create schedule for this date
      SELECT id INTO v_schedule_id FROM schedules 
      WHERE family_id = p_family_id AND date = v_current_date;
      
      IF v_schedule_id IS NULL THEN
        INSERT INTO schedules (family_id, date, created_at)
        VALUES (p_family_id, v_current_date, NOW())
        RETURNING id INTO v_schedule_id;
      END IF;
      
      -- Get or create time block for this schedule
      SELECT id INTO v_target_time_block_id FROM time_blocks
      WHERE schedule_id = v_schedule_id 
        AND start_time = v_time_block.start_time
        AND end_time = v_time_block.end_time;
      
      IF v_target_time_block_id IS NULL THEN
        INSERT INTO time_blocks (
          schedule_id, 
          start_time, 
          end_time, 
          assigned_to,
          created_at
        ) VALUES (
          v_schedule_id,
          v_time_block.start_time,
          v_time_block.end_time,
          v_time_block.assigned_to,
          NOW()
        ) RETURNING id INTO v_target_time_block_id;
      END IF;
      
      -- Create schedule item with recurrence info
      INSERT INTO schedule_items (
        time_block_id,
        title,
        item_type,
        template_id,
        order_position,
        recurrence_pattern,
        recurrence_days,
        recurrence_end_date,
        recurrence_group_id,
        created_at
      ) 
      SELECT
        v_target_time_block_id,
        t.title,
        'template_ref',
        p_template_id,
        COALESCE((SELECT MAX(order_position) FROM schedule_items WHERE time_block_id = v_target_time_block_id), 0) + 1,
        p_recurrence_pattern,
        p_recurrence_days,
        p_end_date,
        v_recurrence_group_id,
        NOW()
      FROM templates t
      WHERE t.id = p_template_id
      RETURNING id INTO v_schedule_item_id;
      
      -- Create template instance
      INSERT INTO template_instances (
        template_id,
        schedule_item_id,
        created_at
      ) VALUES (
        p_template_id,
        v_schedule_item_id,
        NOW()
      ) RETURNING id INTO v_template_instance_id;
      
      -- Create multi-member instance steps using existing function
      PERFORM create_multi_member_instance_steps(
        v_template_instance_id,
        p_template_id,
        p_family_id
      );
    END IF;
    
    v_current_date := v_current_date + INTERVAL '1 day';
  END LOOP;
  
  RETURN v_recurrence_group_id;
END;
$$ LANGUAGE plpgsql;

-- Function to delete a recurrence group
CREATE OR REPLACE FUNCTION delete_recurrence_group(p_recurrence_group_id UUID)
RETURNS void AS $$
BEGIN
  DELETE FROM schedule_items 
  WHERE recurrence_group_id = p_recurrence_group_id
    AND completed_at IS NULL; -- Don't delete completed items
END;
$$ LANGUAGE plpgsql;

-- Function to update a recurrence group
CREATE OR REPLACE FUNCTION update_recurrence_group(
  p_recurrence_group_id UUID,
  p_template_id UUID,
  p_new_time TIME,
  p_new_duration INTERVAL
) RETURNS void AS $$
BEGIN
  -- Update all future occurrences in the group
  UPDATE time_blocks tb
  SET 
    start_time = p_new_time,
    end_time = p_new_time + p_new_duration
  FROM schedule_items si
  JOIN schedules s ON s.id = tb.schedule_id
  WHERE si.time_block_id = tb.id
    AND si.recurrence_group_id = p_recurrence_group_id
    AND si.completed_at IS NULL
    AND s.date >= CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- Add comment explaining recurrence fields
COMMENT ON COLUMN schedule_items.recurrence_pattern IS 
'The recurrence pattern: daily, weekdays, weekly, or custom';

COMMENT ON COLUMN schedule_items.recurrence_days IS 
'Array of days of week (0=Sunday, 6=Saturday) when this item recurs';

COMMENT ON COLUMN schedule_items.recurrence_end_date IS 
'The last date this recurring item should appear';

COMMENT ON COLUMN schedule_items.recurrence_group_id IS 
'Groups all instances of a recurring item together for bulk operations';