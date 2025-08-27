-- Itineraries App - Initial Schema
-- Simple, focused database for daily execution with smart checklists

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Core enum types
CREATE TYPE user_role AS ENUM ('owner', 'member');
CREATE TYPE item_type AS ENUM ('simple', 'procedure', 'template_ref');
CREATE TYPE step_type AS ENUM ('task', 'note', 'decision', 'resource', 'reference');
CREATE TYPE template_category AS ENUM (
  'morning',
  'evening', 
  'household',
  'childcare',
  'shopping',
  'work',
  'personal',
  'health',
  'travel',
  'custom'
);

-- Users table (extends auth.users)
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Families table for spouse collaboration
CREATE TABLE families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Family members
CREATE TABLE family_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(family_id, user_id)
);

-- Daily schedules
CREATE TABLE schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  title TEXT,
  day_theme TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(family_id, date)
);

-- Time blocks (15-minute increments)
CREATE TABLE time_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

-- Schedule items (things to do in time blocks)
CREATE TABLE schedule_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  time_block_id UUID NOT NULL REFERENCES time_blocks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  item_type item_type NOT NULL DEFAULT 'simple',
  template_id UUID, -- References templates table if item_type = 'template_ref'
  completed_at TIMESTAMP WITH TIME ZONE,
  completed_by UUID REFERENCES user_profiles(id),
  order_position INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}', -- For storing URLs, phone numbers, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Templates for reusable procedures
CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID REFERENCES families(id) ON DELETE CASCADE, -- NULL for system templates
  title TEXT NOT NULL,
  description TEXT,
  category template_category NOT NULL DEFAULT 'custom',
  is_system BOOLEAN DEFAULT FALSE,
  icon TEXT,
  color TEXT,
  created_by UUID REFERENCES user_profiles(id),
  updated_by UUID REFERENCES user_profiles(id),
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Template steps
CREATE TABLE template_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  order_position INTEGER NOT NULL,
  step_type step_type NOT NULL DEFAULT 'task',
  metadata JSONB DEFAULT '{}', -- URLs, phone numbers, documents, dial-in info, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Template instances (when a template is used in a schedule)
CREATE TABLE template_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
  schedule_item_id UUID NOT NULL REFERENCES schedule_items(id) ON DELETE CASCADE,
  customizations JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(schedule_item_id)
);

-- Template instance steps (tracking completion of each step)
CREATE TABLE template_instance_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_instance_id UUID NOT NULL REFERENCES template_instances(id) ON DELETE CASCADE,
  template_step_id UUID NOT NULL REFERENCES template_steps(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE,
  completed_by UUID REFERENCES user_profiles(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(template_instance_id, template_step_id)
);

-- Indexes for performance
CREATE INDEX idx_family_members_user_id ON family_members(user_id);
CREATE INDEX idx_family_members_family_id ON family_members(family_id);
CREATE INDEX idx_schedules_family_date ON schedules(family_id, date);
CREATE INDEX idx_time_blocks_schedule_time ON time_blocks(schedule_id, start_time);
CREATE INDEX idx_schedule_items_time_block ON schedule_items(time_block_id, order_position);
CREATE INDEX idx_templates_family ON templates(family_id) WHERE family_id IS NOT NULL;
CREATE INDEX idx_templates_system ON templates(is_system) WHERE is_system = true;
CREATE INDEX idx_template_steps_order ON template_steps(template_id, order_position);

-- Updated at triggers
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_families_updated_at BEFORE UPDATE ON families
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_schedules_updated_at BEFORE UPDATE ON schedules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_schedule_items_updated_at BEFORE UPDATE ON schedule_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_templates_updated_at BEFORE UPDATE ON templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_template_steps_updated_at BEFORE UPDATE ON template_steps
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();