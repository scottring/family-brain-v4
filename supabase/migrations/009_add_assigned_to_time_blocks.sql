-- Add assigned_to column to time_blocks table for family member assignment
ALTER TABLE time_blocks 
ADD COLUMN assigned_to UUID REFERENCES user_profiles(id) ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX idx_time_blocks_assigned_to ON time_blocks(assigned_to);

-- Update RLS policies to include assigned_to in operations
-- The existing policies should already handle this, but let's ensure they work correctly

-- Add comment for documentation
COMMENT ON COLUMN time_blocks.assigned_to IS 'The user this time block is assigned to (optional)';