-- Add General Notes template for ad-hoc tasks

-- General Notes / Quick Tasks Template
INSERT INTO templates (id, family_id, title, description, category, is_system, icon, color)
VALUES (
  'f6a7b8c9-d0e1-2345-fabc-678901234567',
  NULL,
  'General Notes / Quick Tasks',
  'Flexible template for ad-hoc tasks and notes that don''t fit a pattern',
  'custom',
  true,
  '📝',
  'gray'
);

-- Template steps are intentionally generic and flexible
INSERT INTO template_steps (template_id, title, description, order_position, step_type, metadata)
VALUES
  ('f6a7b8c9-d0e1-2345-fabc-678901234567', 'Task 1', 'First item to complete', 1, 'task', '{}'),
  ('f6a7b8c9-d0e1-2345-fabc-678901234567', 'Task 2', 'Second item to complete', 2, 'task', '{}'),
  ('f6a7b8c9-d0e1-2345-fabc-678901234567', 'Task 3', 'Third item to complete', 3, 'task', '{}'),
  ('f6a7b8c9-d0e1-2345-fabc-678901234567', 'Notes', 'Additional notes or reminders', 4, 'note', '{}'),
  ('f6a7b8c9-d0e1-2345-fabc-678901234567', 'Task 4', 'Fourth item to complete', 5, 'task', '{}'),
  ('f6a7b8c9-d0e1-2345-fabc-678901234567', 'Task 5', 'Fifth item to complete', 6, 'task', '{}'),
  ('f6a7b8c9-d0e1-2345-fabc-678901234567', 'Follow-up', 'Things to remember for next time', 7, 'note', '{}');

-- Also add a Quick Errands template
INSERT INTO templates (id, family_id, title, description, category, is_system, icon, color)
VALUES (
  'a7b8c9d0-e1f2-3456-abcd-789012345678',
  NULL,
  'Quick Errands',
  'Running multiple errands efficiently',
  'personal',
  true,
  '🚗',
  'purple'
);

INSERT INTO template_steps (template_id, title, description, order_position, step_type, metadata)
VALUES
  ('a7b8c9d0-e1f2-3456-abcd-789012345678', 'Check list and route', 'Plan efficient route for all stops', 1, 'task', '{}'),
  ('a7b8c9d0-e1f2-3456-abcd-789012345678', 'Gather needed items', 'Reusable bags, returns, coupons, etc.', 2, 'task', '{}'),
  ('a7b8c9d0-e1f2-3456-abcd-789012345678', 'Stop 1', 'First errand location', 3, 'task', '{}'),
  ('a7b8c9d0-e1f2-3456-abcd-789012345678', 'Stop 2', 'Second errand location', 4, 'task', '{}'),
  ('a7b8c9d0-e1f2-3456-abcd-789012345678', 'Stop 3', 'Third errand location', 5, 'task', '{}'),
  ('a7b8c9d0-e1f2-3456-abcd-789012345678', 'Stop 4', 'Fourth errand location', 6, 'task', '{}'),
  ('a7b8c9d0-e1f2-3456-abcd-789012345678', 'Unload and organize', 'Put everything away at home', 7, 'task', '{}');

-- Add a Weekly Review template for planning sessions
INSERT INTO templates (id, family_id, title, description, category, is_system, icon, color)
VALUES (
  'b8c9d0e1-f2a3-4567-bcde-890123456789',
  NULL,
  'Weekly Planning Session',
  'Review the week and plan ahead with your spouse',
  'personal',
  true,
  '📅',
  'blue'
);

INSERT INTO template_steps (template_id, title, description, order_position, step_type, metadata)
VALUES
  ('b8c9d0e1-f2a3-4567-bcde-890123456789', 'Review last week', 'What worked, what didn''t', 1, 'task', '{}'),
  ('b8c9d0e1-f2a3-4567-bcde-890123456789', 'Check calendars', 'Review both calendars for upcoming events', 2, 'task', '{}'),
  ('b8c9d0e1-f2a3-4567-bcde-890123456789', 'Meal planning', 'Plan meals for the week', 3, 'task', '{}'),
  ('b8c9d0e1-f2a3-4567-bcde-890123456789', 'Kid activities', 'School events, activities, playdates', 4, 'task', '{}'),
  ('b8c9d0e1-f2a3-4567-bcde-890123456789', 'Household tasks', 'Cleaning, maintenance, projects', 5, 'task', '{}'),
  ('b8c9d0e1-f2a3-4567-bcde-890123456789', 'Work priorities', 'Major work deadlines or meetings', 6, 'task', '{}'),
  ('b8c9d0e1-f2a3-4567-bcde-890123456789', 'Date/family time', 'Schedule quality time together', 7, 'task', '{}'),
  ('b8c9d0e1-f2a3-4567-bcde-890123456789', 'Set week theme', 'Choose focus or theme for the week', 8, 'task', '{}');