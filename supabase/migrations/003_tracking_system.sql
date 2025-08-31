-- Migration: Add template tracking system
-- Description: Adds tables and columns for tracking template completions, streaks, and rewards

-- Add tracking columns to templates table
ALTER TABLE templates 
ADD COLUMN IF NOT EXISTS is_trackable BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS tracking_emoji TEXT;

-- Create template tracking goals table
CREATE TABLE IF NOT EXISTS template_tracking_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
  member_id UUID REFERENCES user_profiles(id), -- NULL means applies to all family members
  goal_type TEXT NOT NULL CHECK (goal_type IN ('streak', 'count_in_period', 'daily')),
  target_count INTEGER NOT NULL, -- e.g., 12 for "12 out of 14 days"
  period_days INTEGER NOT NULL, -- e.g., 14 for "12 out of 14 days"
  reward_description TEXT,
  reward_emoji TEXT DEFAULT '🎁',
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(family_id, template_id, member_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_tracking_goals_family ON template_tracking_goals(family_id, is_active);
CREATE INDEX IF NOT EXISTS idx_tracking_goals_template ON template_tracking_goals(template_id, is_active);
CREATE INDEX IF NOT EXISTS idx_tracking_goals_member ON template_tracking_goals(member_id, is_active);

-- Create a view for easy tracking statistics
CREATE OR REPLACE VIEW template_completion_stats AS
SELECT 
  s.family_id,
  si.template_id,
  s.date,
  si.completed_by as member_id,
  COUNT(CASE WHEN si.completed_at IS NOT NULL THEN 1 END) as completed_count,
  COUNT(*) as total_count,
  MAX(si.completed_at) as last_completed_at
FROM schedules s
JOIN time_blocks tb ON tb.schedule_id = s.id
JOIN schedule_items si ON si.time_block_id = tb.id
WHERE si.template_id IS NOT NULL
GROUP BY s.family_id, si.template_id, s.date, si.completed_by;

-- Add RLS policies for template_tracking_goals
ALTER TABLE template_tracking_goals ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view tracking goals for their family
CREATE POLICY "Users can view their family tracking goals" ON template_tracking_goals
  FOR SELECT
  USING (
    family_id IN (
      SELECT family_id FROM family_members WHERE user_id = auth.uid()
    )
  );

-- Policy: Family admins can manage tracking goals
CREATE POLICY "Family admins can manage tracking goals" ON template_tracking_goals
  FOR ALL
  USING (
    family_id IN (
      SELECT family_id FROM family_members 
      WHERE user_id = auth.uid() AND role IN ('parent', 'admin')
    )
  );

-- Function to calculate current streak for a template
CREATE OR REPLACE FUNCTION calculate_template_streak(
  p_template_id UUID,
  p_member_id UUID DEFAULT NULL,
  p_family_id UUID DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
  v_streak INTEGER := 0;
  v_date DATE := CURRENT_DATE;
  v_found BOOLEAN;
BEGIN
  -- Count backwards from today
  LOOP
    SELECT EXISTS(
      SELECT 1 
      FROM template_completion_stats
      WHERE template_id = p_template_id
        AND date = v_date
        AND completed_count > 0
        AND (p_member_id IS NULL OR member_id = p_member_id)
        AND (p_family_id IS NULL OR family_id = p_family_id)
    ) INTO v_found;
    
    IF NOT v_found THEN
      -- Check if this is today (streak might still be valid if today hasn't been done yet)
      IF v_date = CURRENT_DATE AND v_streak > 0 THEN
        v_streak := v_streak; -- Keep current streak
      ELSE
        EXIT; -- Streak broken
      END IF;
    ELSE
      v_streak := v_streak + 1;
    END IF;
    
    v_date := v_date - INTERVAL '1 day';
    
    -- Reasonable limit to prevent infinite loops
    IF v_streak > 365 THEN
      EXIT;
    END IF;
  END LOOP;
  
  RETURN v_streak;
END;
$$ LANGUAGE plpgsql;

-- Function to get progress toward a tracking goal
CREATE OR REPLACE FUNCTION get_tracking_goal_progress(
  p_goal_id UUID
) RETURNS TABLE(
  current_count INTEGER,
  target_count INTEGER,
  period_days INTEGER,
  current_streak INTEGER,
  is_complete BOOLEAN,
  days_remaining INTEGER
) AS $$
DECLARE
  v_goal RECORD;
  v_start_date DATE;
  v_current_count INTEGER;
  v_current_streak INTEGER;
BEGIN
  -- Get the goal details
  SELECT * INTO v_goal FROM template_tracking_goals WHERE id = p_goal_id;
  
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  -- Calculate start date based on period
  v_start_date := CURRENT_DATE - (v_goal.period_days - 1) * INTERVAL '1 day';
  
  -- Count completions in the period
  SELECT COUNT(*) INTO v_current_count
  FROM template_completion_stats
  WHERE template_id = v_goal.template_id
    AND date >= v_start_date
    AND date <= CURRENT_DATE
    AND completed_count > 0
    AND (v_goal.member_id IS NULL OR member_id = v_goal.member_id)
    AND family_id = v_goal.family_id;
  
  -- Calculate current streak
  v_current_streak := calculate_template_streak(
    v_goal.template_id,
    v_goal.member_id,
    v_goal.family_id
  );
  
  RETURN QUERY
  SELECT 
    v_current_count,
    v_goal.target_count,
    v_goal.period_days,
    v_current_streak,
    v_current_count >= v_goal.target_count,
    v_goal.period_days - (CURRENT_DATE - v_start_date)::INTEGER;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE template_tracking_goals IS 'Stores tracking goals and reward thresholds for templates';
COMMENT ON COLUMN template_tracking_goals.goal_type IS 'Type of tracking goal: streak (consecutive days), count_in_period (X out of Y days), daily (every day)';
COMMENT ON COLUMN template_tracking_goals.member_id IS 'Specific family member this goal applies to, or NULL for all members';