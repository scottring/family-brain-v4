-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_instance_steps ENABLE ROW LEVEL SECURITY;

-- User profiles policies
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Families policies
CREATE POLICY "Users can view families they belong to" ON families
  FOR SELECT USING (
    id IN (
      SELECT family_id FROM family_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Family owners can update their families" ON families
  FOR UPDATE USING (
    id IN (
      SELECT family_id FROM family_members 
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

CREATE POLICY "Users can create families" ON families
  FOR INSERT WITH CHECK (true);

-- Family members policies
CREATE POLICY "Users can view members of their families" ON family_members
  FOR SELECT USING (
    family_id IN (
      SELECT family_id FROM family_members fm2 
      WHERE fm2.user_id = auth.uid()
    )
  );

CREATE POLICY "Family owners can manage members" ON family_members
  FOR ALL USING (
    family_id IN (
      SELECT family_id FROM family_members fm2 
      WHERE fm2.user_id = auth.uid() AND fm2.role = 'owner'
    )
  );

CREATE POLICY "Users can add themselves to families" ON family_members
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Schedules policies
CREATE POLICY "Users can view family schedules" ON schedules
  FOR SELECT USING (
    family_id IN (
      SELECT family_id FROM family_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage family schedules" ON schedules
  FOR ALL USING (
    family_id IN (
      SELECT family_id FROM family_members 
      WHERE user_id = auth.uid()
    )
  );

-- Time blocks policies
CREATE POLICY "Users can view family time blocks" ON time_blocks
  FOR SELECT USING (
    schedule_id IN (
      SELECT id FROM schedules 
      WHERE family_id IN (
        SELECT family_id FROM family_members 
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage family time blocks" ON time_blocks
  FOR ALL USING (
    schedule_id IN (
      SELECT id FROM schedules 
      WHERE family_id IN (
        SELECT family_id FROM family_members 
        WHERE user_id = auth.uid()
      )
    )
  );

-- Schedule items policies
CREATE POLICY "Users can view family schedule items" ON schedule_items
  FOR SELECT USING (
    time_block_id IN (
      SELECT tb.id FROM time_blocks tb
      JOIN schedules s ON tb.schedule_id = s.id
      WHERE s.family_id IN (
        SELECT family_id FROM family_members 
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage family schedule items" ON schedule_items
  FOR ALL USING (
    time_block_id IN (
      SELECT tb.id FROM time_blocks tb
      JOIN schedules s ON tb.schedule_id = s.id
      WHERE s.family_id IN (
        SELECT family_id FROM family_members 
        WHERE user_id = auth.uid()
      )
    )
  );

-- Templates policies
CREATE POLICY "Everyone can view system templates" ON templates
  FOR SELECT USING (is_system = true);

CREATE POLICY "Users can view family templates" ON templates
  FOR SELECT USING (
    family_id IN (
      SELECT family_id FROM family_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage family templates" ON templates
  FOR ALL USING (
    family_id IN (
      SELECT family_id FROM family_members 
      WHERE user_id = auth.uid()
    )
  );

-- Template steps policies
CREATE POLICY "Users can view template steps" ON template_steps
  FOR SELECT USING (
    template_id IN (
      SELECT id FROM templates 
      WHERE is_system = true 
      OR family_id IN (
        SELECT family_id FROM family_members 
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage family template steps" ON template_steps
  FOR ALL USING (
    template_id IN (
      SELECT id FROM templates 
      WHERE family_id IN (
        SELECT family_id FROM family_members 
        WHERE user_id = auth.uid()
      )
    )
  );

-- Template instances policies
CREATE POLICY "Users can view family template instances" ON template_instances
  FOR SELECT USING (
    schedule_item_id IN (
      SELECT si.id FROM schedule_items si
      JOIN time_blocks tb ON si.time_block_id = tb.id
      JOIN schedules s ON tb.schedule_id = s.id
      WHERE s.family_id IN (
        SELECT family_id FROM family_members 
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage family template instances" ON template_instances
  FOR ALL USING (
    schedule_item_id IN (
      SELECT si.id FROM schedule_items si
      JOIN time_blocks tb ON si.time_block_id = tb.id
      JOIN schedules s ON tb.schedule_id = s.id
      WHERE s.family_id IN (
        SELECT family_id FROM family_members 
        WHERE user_id = auth.uid()
      )
    )
  );

-- Template instance steps policies
CREATE POLICY "Users can view family template instance steps" ON template_instance_steps
  FOR SELECT USING (
    template_instance_id IN (
      SELECT ti.id FROM template_instances ti
      JOIN schedule_items si ON ti.schedule_item_id = si.id
      JOIN time_blocks tb ON si.time_block_id = tb.id
      JOIN schedules s ON tb.schedule_id = s.id
      WHERE s.family_id IN (
        SELECT family_id FROM family_members 
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage family template instance steps" ON template_instance_steps
  FOR ALL USING (
    template_instance_id IN (
      SELECT ti.id FROM template_instances ti
      JOIN schedule_items si ON ti.schedule_item_id = si.id
      JOIN time_blocks tb ON si.time_block_id = tb.id
      JOIN schedules s ON tb.schedule_id = s.id
      WHERE s.family_id IN (
        SELECT family_id FROM family_members 
        WHERE user_id = auth.uid()
      )
    )
  );