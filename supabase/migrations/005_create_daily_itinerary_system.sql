-- Daily Itinerary System (Primary Execution Interface)

-- Daily itineraries table
CREATE TABLE daily_itineraries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  title TEXT,
  description TEXT,
  status itinerary_status NOT NULL DEFAULT 'scheduled',
  total_planned_minutes INTEGER DEFAULT 0,
  total_actual_minutes INTEGER DEFAULT 0,
  completion_percentage DECIMAL(5,2) DEFAULT 0.00 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, date)
);

-- Itinerary template slots (templates scheduled within daily itineraries)
CREATE TABLE itinerary_template_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  itinerary_id UUID NOT NULL REFERENCES daily_itineraries(id) ON DELETE CASCADE,
  assignment_id UUID NOT NULL REFERENCES task_template_assignments(id) ON DELETE CASCADE,
  scheduled_start_time TIME,
  scheduled_end_time TIME,
  actual_start_time TIMESTAMP WITH TIME ZONE,
  actual_end_time TIMESTAMP WITH TIME ZONE,
  order_index INTEGER NOT NULL,
  status itinerary_status NOT NULL DEFAULT 'scheduled',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(itinerary_id, order_index)
);

-- Planning sessions (monthly/weekly planning records)
CREATE TABLE planning_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  family_id UUID REFERENCES families(id) ON DELETE SET NULL,
  session_type TEXT NOT NULL CHECK (session_type IN ('monthly', 'weekly')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  title TEXT,
  objectives TEXT[],
  outcomes TEXT[],
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed')),
  duration_minutes INTEGER,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Planning session items (goals/projects/tasks discussed in sessions)
CREATE TABLE planning_session_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES planning_sessions(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('goal', 'project', 'task')),
  item_id UUID NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('created', 'updated', 'reviewed', 'completed', 'deferred')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_daily_itineraries_user_id ON daily_itineraries(user_id);
CREATE INDEX idx_daily_itineraries_date ON daily_itineraries(date);
CREATE INDEX idx_daily_itineraries_user_date ON daily_itineraries(user_id, date);

CREATE INDEX idx_itinerary_template_slots_itinerary_id ON itinerary_template_slots(itinerary_id);
CREATE INDEX idx_itinerary_template_slots_assignment_id ON itinerary_template_slots(assignment_id);
CREATE INDEX idx_itinerary_template_slots_order ON itinerary_template_slots(itinerary_id, order_index);

CREATE INDEX idx_planning_sessions_user_id ON planning_sessions(user_id);
CREATE INDEX idx_planning_sessions_family_id ON planning_sessions(family_id);
CREATE INDEX idx_planning_sessions_period ON planning_sessions(period_start, period_end);
CREATE INDEX idx_planning_sessions_type ON planning_sessions(session_type);

CREATE INDEX idx_planning_session_items_session_id ON planning_session_items(session_id);
CREATE INDEX idx_planning_session_items_item ON planning_session_items(item_type, item_id);