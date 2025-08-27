-- Template System for Line-Item Execution

-- Templates table
CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  family_id UUID REFERENCES families(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  context context_type NOT NULL DEFAULT 'personal',
  estimated_duration_minutes INTEGER,
  is_shared BOOLEAN NOT NULL DEFAULT false,
  sharing_level sharing_level NOT NULL DEFAULT 'private',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Template line items (the actual checklist items)
CREATE TABLE template_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL,
  estimated_minutes INTEGER DEFAULT 0,
  is_optional BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(template_id, order_index)
);

-- Task template assignments (manual assignment of templates to tasks)
CREATE TABLE task_template_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
  assigned_by UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  assigned_date DATE NOT NULL,
  status assignment_status NOT NULL DEFAULT 'assigned',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(task_id, template_id)
);

-- Template executions (when someone starts executing a template)
CREATE TABLE template_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES task_template_assignments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  total_time_minutes INTEGER DEFAULT 0,
  completion_percentage DECIMAL(5,2) DEFAULT 0.00 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Line item completions (tracking individual checkbox completions)
CREATE TABLE line_item_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id UUID NOT NULL REFERENCES template_executions(id) ON DELETE CASCADE,
  line_item_id UUID NOT NULL REFERENCES template_line_items(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  time_minutes INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(execution_id, line_item_id)
);

-- Indexes for performance
CREATE INDEX idx_templates_user_id ON templates(user_id);
CREATE INDEX idx_templates_family_id ON templates(family_id);
CREATE INDEX idx_templates_context ON templates(context);

CREATE INDEX idx_template_line_items_template_id ON template_line_items(template_id);
CREATE INDEX idx_template_line_items_order ON template_line_items(template_id, order_index);

CREATE INDEX idx_task_template_assignments_task_id ON task_template_assignments(task_id);
CREATE INDEX idx_task_template_assignments_template_id ON task_template_assignments(template_id);
CREATE INDEX idx_task_template_assignments_date ON task_template_assignments(assigned_date);

CREATE INDEX idx_template_executions_assignment_id ON template_executions(assignment_id);
CREATE INDEX idx_template_executions_user_id ON template_executions(user_id);
CREATE INDEX idx_template_executions_started_at ON template_executions(started_at);

CREATE INDEX idx_line_item_completions_execution_id ON line_item_completions(execution_id);
CREATE INDEX idx_line_item_completions_completed_at ON line_item_completions(completed_at);