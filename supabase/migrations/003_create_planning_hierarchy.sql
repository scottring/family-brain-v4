-- Planning Hierarchy: Goals → Projects → Tasks

-- Goals table
CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  family_id UUID REFERENCES families(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  status goal_status NOT NULL DEFAULT 'planning',
  context context_type NOT NULL DEFAULT 'personal',
  priority priority_level NOT NULL DEFAULT 'medium',
  is_shared BOOLEAN NOT NULL DEFAULT false,
  sharing_level sharing_level NOT NULL DEFAULT 'private',
  due_date DATE,
  target_completion_date DATE,
  actual_completion_date DATE,
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  family_id UUID REFERENCES families(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  status project_status NOT NULL DEFAULT 'planning',
  context context_type NOT NULL DEFAULT 'personal',
  priority priority_level NOT NULL DEFAULT 'medium',
  is_shared BOOLEAN NOT NULL DEFAULT false,
  sharing_level sharing_level NOT NULL DEFAULT 'private',
  due_date DATE,
  target_completion_date DATE,
  actual_completion_date DATE,
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tasks table
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  family_id UUID REFERENCES families(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  status task_status NOT NULL DEFAULT 'todo',
  context context_type NOT NULL DEFAULT 'personal',
  priority priority_level NOT NULL DEFAULT 'medium',
  is_shared BOOLEAN NOT NULL DEFAULT false,
  sharing_level sharing_level NOT NULL DEFAULT 'private',
  due_date DATE,
  estimated_minutes INTEGER,
  actual_minutes INTEGER,
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance and queries
CREATE INDEX idx_goals_user_id ON goals(user_id);
CREATE INDEX idx_goals_family_id ON goals(family_id);
CREATE INDEX idx_goals_context ON goals(context);
CREATE INDEX idx_goals_status ON goals(status);

CREATE INDEX idx_projects_goal_id ON projects(goal_id);
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_family_id ON projects(family_id);
CREATE INDEX idx_projects_context ON projects(context);
CREATE INDEX idx_projects_status ON projects(status);

CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_family_id ON tasks(family_id);
CREATE INDEX idx_tasks_context ON tasks(context);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);