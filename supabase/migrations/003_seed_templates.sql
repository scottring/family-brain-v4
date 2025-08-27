-- Seed system templates for common routines

-- Morning Routine Template
INSERT INTO templates (id, family_id, title, description, category, is_system, icon, color)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  NULL,
  'Morning Routine',
  'Start your day with a consistent routine',
  'morning',
  true,
  '🌅',
  'yellow'
);

INSERT INTO template_steps (template_id, title, description, order_position, step_type, metadata)
VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Wake up and hydrate', 'Drink a glass of water', 1, 'task', '{}'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Morning stretch', '5 minutes of light stretching', 2, 'task', '{}'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Shower and get dressed', 'Personal hygiene', 3, 'task', '{}'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Healthy breakfast', 'Prepare and eat breakfast', 4, 'task', '{}'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Review day''s schedule', 'Check calendar and priorities', 5, 'task', '{}');

-- Evening Routine Template
INSERT INTO templates (id, family_id, title, description, category, is_system, icon, color)
VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f23456789012',
  NULL,
  'Evening Wind Down',
  'Prepare for a restful night',
  'evening',
  true,
  '🌙',
  'indigo'
);

INSERT INTO template_steps (template_id, title, description, order_position, step_type, metadata)
VALUES
  ('b2c3d4e5-f6a7-8901-bcde-f23456789012', 'Tidy living spaces', 'Quick 10-minute cleanup', 1, 'task', '{}'),
  ('b2c3d4e5-f6a7-8901-bcde-f23456789012', 'Prepare for tomorrow', 'Lay out clothes, pack bags', 2, 'task', '{}'),
  ('b2c3d4e5-f6a7-8901-bcde-f23456789012', 'Personal hygiene', 'Brush teeth, wash face', 3, 'task', '{}'),
  ('b2c3d4e5-f6a7-8901-bcde-f23456789012', 'Screen time cutoff', 'Put devices away', 4, 'task', '{}'),
  ('b2c3d4e5-f6a7-8901-bcde-f23456789012', 'Relaxation activity', 'Reading, meditation, or light stretching', 5, 'task', '{}');

-- Bedwetting Response Template
INSERT INTO templates (id, family_id, title, description, category, is_system, icon, color)
VALUES (
  'c3d4e5f6-a7b8-9012-cdef-345678901234',
  NULL,
  'Bedwetting Response',
  'Step-by-step guide for handling nighttime accidents',
  'childcare',
  true,
  '🛏️',
  'blue'
);

INSERT INTO template_steps (template_id, title, description, order_position, step_type, metadata)
VALUES
  ('c3d4e5f6-a7b8-9012-cdef-345678901234', 'Stay calm and reassure', 'Comfort the child, let them know it''s okay', 1, 'task', '{}'),
  ('c3d4e5f6-a7b8-9012-cdef-345678901234', 'Quick cleanup', 'Help child to bathroom for cleanup', 2, 'task', '{}'),
  ('c3d4e5f6-a7b8-9012-cdef-345678901234', 'Change pajamas', 'Get fresh, dry pajamas', 3, 'task', '{}'),
  ('c3d4e5f6-a7b8-9012-cdef-345678901234', 'Strip the bed', 'Remove wet sheets and mattress protector', 4, 'task', '{}'),
  ('c3d4e5f6-a7b8-9012-cdef-345678901234', 'Clean mattress if needed', 'Spot clean and dry if necessary', 5, 'task', '{}'),
  ('c3d4e5f6-a7b8-9012-cdef-345678901234', 'Make bed with fresh sheets', 'Put on clean sheets and protector', 6, 'task', '{}'),
  ('c3d4e5f6-a7b8-9012-cdef-345678901234', 'Wash soiled items', 'Start laundry or place in hamper', 7, 'task', '{}'),
  ('c3d4e5f6-a7b8-9012-cdef-345678901234', 'Final comfort', 'Tuck child back in, reassure them', 8, 'task', '{}'),
  ('c3d4e5f6-a7b8-9012-cdef-345678901234', 'Document incident', 'Note time and any relevant details', 9, 'note', '{}');

-- Leaving Dog Alone Checklist
INSERT INTO templates (id, family_id, title, description, category, is_system, icon, color)
VALUES (
  'd4e5f6a7-b8c9-0123-defa-456789012345',
  NULL,
  'Leaving Dog Alone',
  'Ensure your pet is safe and comfortable',
  'household',
  true,
  '🐕',
  'green'
);

INSERT INTO template_steps (template_id, title, description, order_position, step_type, metadata)
VALUES
  ('d4e5f6a7-b8c9-0123-defa-456789012345', 'Fresh water', 'Fill water bowls', 1, 'task', '{}'),
  ('d4e5f6a7-b8c9-0123-defa-456789012345', 'Food preparation', 'Leave appropriate amount of food', 2, 'task', '{}'),
  ('d4e5f6a7-b8c9-0123-defa-456789012345', 'Potty break', 'Take dog out before leaving', 3, 'task', '{}'),
  ('d4e5f6a7-b8c9-0123-defa-456789012345', 'Safe environment', 'Remove hazards, secure trash', 4, 'task', '{}'),
  ('d4e5f6a7-b8c9-0123-defa-456789012345', 'Comfort items', 'Leave favorite toys or blanket', 5, 'task', '{}'),
  ('d4e5f6a7-b8c9-0123-defa-456789012345', 'Climate control', 'Adjust temperature for comfort', 6, 'task', '{}'),
  ('d4e5f6a7-b8c9-0123-defa-456789012345', 'Emergency contact', 'Leave vet info visible', 7, 'resource', '{"phone": "1-800-VET-HELP", "note": "Emergency vet contact"}'),
  ('d4e5f6a7-b8c9-0123-defa-456789012345', 'Calm departure', 'Leave quietly without fanfare', 8, 'task', '{}');

-- Grocery Shopping List
INSERT INTO templates (id, family_id, title, description, category, is_system, icon, color)
VALUES (
  'e5f6a7b8-c9d0-1234-efab-567890123456',
  NULL,
  'Grocery Shopping',
  'Organized shopping list by store section',
  'shopping',
  true,
  '🛒',
  'orange'
);

INSERT INTO template_steps (template_id, title, description, order_position, step_type, metadata)
VALUES
  ('e5f6a7b8-c9d0-1234-efab-567890123456', 'Check inventory', 'Review fridge, pantry, and supplies', 1, 'task', '{}'),
  ('e5f6a7b8-c9d0-1234-efab-567890123456', 'Produce section', 'Fruits and vegetables', 2, 'note', '{}'),
  ('e5f6a7b8-c9d0-1234-efab-567890123456', 'Dairy & eggs', 'Milk, cheese, yogurt, eggs', 3, 'note', '{}'),
  ('e5f6a7b8-c9d0-1234-efab-567890123456', 'Meat & seafood', 'Proteins for the week', 4, 'note', '{}'),
  ('e5f6a7b8-c9d0-1234-efab-567890123456', 'Bakery', 'Bread and baked goods', 5, 'note', '{}'),
  ('e5f6a7b8-c9d0-1234-efab-567890123456', 'Pantry staples', 'Pasta, rice, canned goods', 6, 'note', '{}'),
  ('e5f6a7b8-c9d0-1234-efab-567890123456', 'Frozen foods', 'Frozen vegetables, meals', 7, 'note', '{}'),
  ('e5f6a7b8-c9d0-1234-efab-567890123456', 'Household items', 'Cleaning supplies, paper products', 8, 'note', '{}'),
  ('e5f6a7b8-c9d0-1234-efab-567890123456', 'Check coupons/deals', 'Apply savings', 9, 'task', '{}');