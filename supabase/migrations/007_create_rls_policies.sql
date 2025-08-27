-- Row Level Security Policies for Multi-Tenant Architecture

-- User Profiles Policies
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Family Policies
CREATE POLICY "Family members can view their families" ON families
  FOR SELECT USING (
    id IN (
      SELECT family_id FROM family_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Family admins can update family" ON families
  FOR UPDATE USING (
    id IN (
      SELECT family_id FROM family_members 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Family Members Policies
CREATE POLICY "Family members can view family membership" ON family_members
  FOR SELECT USING (
    user_id = auth.uid() OR 
    family_id IN (
      SELECT family_id FROM family_members WHERE user_id = auth.uid()
    )
  );

-- Goals Policies
CREATE POLICY "Users can view own and shared family goals" ON goals
  FOR SELECT USING (
    user_id = auth.uid() OR 
    (is_shared = true AND family_id IN (
      SELECT family_id FROM family_members WHERE user_id = auth.uid()
    ))
  );

CREATE POLICY "Users can insert own goals" ON goals
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own goals or family collaborative goals" ON goals
  FOR UPDATE USING (
    user_id = auth.uid() OR 
    (sharing_level = 'family_edit' AND family_id IN (
      SELECT family_id FROM family_members WHERE user_id = auth.uid()
    ))
  );

-- Projects Policies
CREATE POLICY "Users can view own and shared family projects" ON projects
  FOR SELECT USING (
    user_id = auth.uid() OR 
    (is_shared = true AND family_id IN (
      SELECT family_id FROM family_members WHERE user_id = auth.uid()
    ))
  );

CREATE POLICY "Users can insert own projects" ON projects
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own projects or family collaborative projects" ON projects
  FOR UPDATE USING (
    user_id = auth.uid() OR 
    (sharing_level = 'family_edit' AND family_id IN (
      SELECT family_id FROM family_members WHERE user_id = auth.uid()
    ))
  );

-- Tasks Policies
CREATE POLICY "Users can view own and shared family tasks" ON tasks
  FOR SELECT USING (
    user_id = auth.uid() OR 
    (is_shared = true AND family_id IN (
      SELECT family_id FROM family_members WHERE user_id = auth.uid()
    ))
  );

CREATE POLICY "Users can insert own tasks" ON tasks
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own tasks or family collaborative tasks" ON tasks
  FOR UPDATE USING (
    user_id = auth.uid() OR 
    (sharing_level = 'family_edit' AND family_id IN (
      SELECT family_id FROM family_members WHERE user_id = auth.uid()
    ))
  );

-- Templates Policies
CREATE POLICY "Users can view own and shared family templates" ON templates
  FOR SELECT USING (
    user_id = auth.uid() OR 
    (is_shared = true AND family_id IN (
      SELECT family_id FROM family_members WHERE user_id = auth.uid()
    ))
  );

CREATE POLICY "Users can insert own templates" ON templates
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own templates or family collaborative templates" ON templates
  FOR UPDATE USING (
    user_id = auth.uid() OR 
    (sharing_level = 'family_edit' AND family_id IN (
      SELECT family_id FROM family_members WHERE user_id = auth.uid()
    ))
  );

-- Template Line Items Policies
CREATE POLICY "Users can view template line items for accessible templates" ON template_line_items
  FOR SELECT USING (
    template_id IN (
      SELECT id FROM templates WHERE (
        user_id = auth.uid() OR 
        (is_shared = true AND family_id IN (
          SELECT family_id FROM family_members WHERE user_id = auth.uid()
        ))
      )
    )
  );

-- Template Executions Policies
CREATE POLICY "Users can view own template executions and shared family executions" ON template_executions
  FOR SELECT USING (
    user_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM task_template_assignments tta
      JOIN templates t ON tta.template_id = t.id
      WHERE tta.id = assignment_id 
      AND t.is_shared = true 
      AND t.family_id IN (
        SELECT family_id FROM family_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert own template executions" ON template_executions
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own template executions" ON template_executions
  FOR UPDATE USING (user_id = auth.uid());

-- Daily Itineraries Policies
CREATE POLICY "Users can view own daily itineraries" ON daily_itineraries
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own daily itineraries" ON daily_itineraries
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own daily itineraries" ON daily_itineraries
  FOR UPDATE USING (user_id = auth.uid());

-- Planning Sessions Policies
CREATE POLICY "Users can view own and family planning sessions" ON planning_sessions
  FOR SELECT USING (
    user_id = auth.uid() OR 
    family_id IN (
      SELECT family_id FROM family_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own planning sessions" ON planning_sessions
  FOR INSERT WITH CHECK (user_id = auth.uid());