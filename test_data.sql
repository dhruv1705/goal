-- Test Data for GoalJourneyContext
-- Run this in Supabase SQL Editor to add sample goals and habits

-- Insert Categories
INSERT INTO categories (name, description, icon, color, order_index) VALUES
('Physical Health', 'Build strength, endurance, and overall physical wellness', '💪', '#10B981', 1),
('Mental Health', 'Develop mindfulness, emotional resilience, and mental clarity', '🧠', '#3B82F6', 2),
('Finance', 'Improve financial literacy and build wealth', '💰', '#F59E0B', 3),
('Social', 'Strengthen relationships and build social connections', '👥', '#8B5CF6', 4)
ON CONFLICT (name) DO NOTHING;

-- Insert Goal Templates
INSERT INTO goal_templates (category_id, name, title, description, difficulty, estimated_duration, total_levels, benefits) VALUES
(
  (SELECT id FROM categories WHERE name = 'Physical Health'),
  'lose_weight',
  'Lose Weight',
  'Develop sustainable habits for healthy weight loss through exercise, nutrition, and lifestyle changes.',
  'intermediate',
  '12-16 weeks',
  4,
  '["Improved energy", "Better health markers", "Increased confidence", "Better sleep"]'
),
(
  (SELECT id FROM categories WHERE name = 'Physical Health'),
  'build_muscle',
  'Build Muscle',
  'Gain lean muscle mass through progressive strength training, proper nutrition, and recovery.',
  'intermediate',
  '16-20 weeks',
  4,
  '["Increased strength", "Better metabolism", "Improved body composition", "Enhanced performance"]'
),
(
  (SELECT id FROM categories WHERE name = 'Mental Health'),
  'reduce_stress',
  'Reduce Stress',
  'Learn mindfulness techniques and stress management strategies for better mental wellbeing.',
  'beginner',
  '8-12 weeks',
  4,
  '["Lower anxiety", "Better sleep", "Improved focus", "Enhanced mood"]'
),
(
  (SELECT id FROM categories WHERE name = 'Mental Health'),
  'improve_focus',
  'Improve Focus',
  'Develop concentration skills and eliminate distractions for enhanced productivity.',
  'intermediate',
  '10-14 weeks',
  4,
  '["Better productivity", "Enhanced creativity", "Reduced mental fatigue", "Improved learning"]'
)
ON CONFLICT (name) DO NOTHING;

-- Insert Habit Templates for "Lose Weight" goal
INSERT INTO habit_templates (goal_template_id, title, description, level, estimated_duration, xp_reward, habit_type, instructions, tips, unlock_requirements, order_index) VALUES
-- Level 1 (Foundation)
(
  (SELECT id FROM goal_templates WHERE name = 'lose_weight'),
  'Daily Weigh-In',
  'Track your weight every morning to build awareness',
  1, 2, 10, 'foundation',
  'Step on the scale first thing in the morning, after using the bathroom, wearing minimal clothing.',
  'Expect daily fluctuations - focus on weekly trends instead of daily changes.',
  '{"completed_habits": 0, "required_level": 1}',
  1
),
(
  (SELECT id FROM goal_templates WHERE name = 'lose_weight'),
  'Drink Water Before Meals',
  'Drink a full glass of water 30 minutes before each meal',
  1, 1, 15, 'foundation',
  'Drink 16-20 oz of water 30 minutes before breakfast, lunch, and dinner.',
  'This helps with portion control and keeps you hydrated throughout the day.',
  '{"completed_habits": 0, "required_level": 1}',
  2
),
(
  (SELECT id FROM goal_templates WHERE name = 'lose_weight'),
  'Take 10,000 Steps',
  'Walk at least 10,000 steps daily for increased activity',
  1, 60, 25, 'foundation',
  'Use a step counter or phone app to track your daily steps. Include walking, stairs, and regular activities.',
  'Break it up throughout the day - park farther away, take stairs, walk during calls.',
  '{"completed_habits": 0, "required_level": 1}',
  3
),
-- Level 2 (Building)
(
  (SELECT id FROM goal_templates WHERE name = 'lose_weight'),
  'Strength Training Session',
  'Complete a 30-minute strength training workout',
  2, 30, 40, 'building',
  'Perform bodyweight exercises or use weights. Focus on major muscle groups: legs, back, chest, shoulders.',
  'Start with bodyweight exercises like push-ups, squats, and planks if you are new to strength training.',
  '{"completed_habits": 5, "required_level": 2}',
  4
),
(
  (SELECT id FROM goal_templates WHERE name = 'lose_weight'),
  'Meal Prep Session',
  'Prepare healthy meals for the next 2-3 days',
  2, 45, 35, 'building',
  'Plan and prepare 2-3 days worth of healthy meals. Focus on lean proteins, vegetables, and whole grains.',
  'Start simple with basic ingredients. Batch cook proteins and roast vegetables.',
  '{"completed_habits": 5, "required_level": 2}',
  5
)
ON CONFLICT (goal_template_id, title) DO NOTHING;

-- Insert Habit Templates for "Reduce Stress" goal
INSERT INTO habit_templates (goal_template_id, title, description, level, estimated_duration, xp_reward, habit_type, instructions, tips, unlock_requirements, order_index) VALUES
-- Level 1 (Foundation)
(
  (SELECT id FROM goal_templates WHERE name = 'reduce_stress'),
  '5-Minute Breathing',
  'Practice deep breathing for 5 minutes to calm your mind',
  1, 5, 15, 'foundation',
  'Sit comfortably, close your eyes, and focus on your breath. Breathe in for 4 counts, hold for 4, exhale for 6.',
  'Try to do this in the same place and time each day to build consistency.',
  '{"completed_habits": 0, "required_level": 1}',
  1
),
(
  (SELECT id FROM goal_templates WHERE name = 'reduce_stress'),
  'Gratitude Journal',
  'Write down 3 things you are grateful for today',
  1, 5, 12, 'foundation',
  'Before bed, write down 3 specific things you are grateful for. Be specific and include why you are grateful.',
  'Focus on small, everyday moments rather than just big events.',
  '{"completed_habits": 0, "required_level": 1}',
  2
),
-- Level 2 (Building)
(
  (SELECT id FROM goal_templates WHERE name = 'reduce_stress'),
  '15-Minute Meditation',
  'Practice guided meditation for mental clarity',
  2, 15, 25, 'building',
  'Use a meditation app or follow along with a guided session. Focus on mindfulness or loving-kindness meditation.',
  'If your mind wanders, that is normal! Gently bring your attention back to the meditation.',
  '{"completed_habits": 3, "required_level": 2}',
  3
),
(
  (SELECT id FROM goal_templates WHERE name = 'reduce_stress'),
  'Digital Detox Hour',
  'Spend 1 hour without any digital devices',
  2, 60, 30, 'building',
  'Put away phone, computer, TV, and other devices. Read, walk, talk to someone, or do a hobby.',
  'Start with 30 minutes if 1 hour feels too long. Gradually increase the duration.',
  '{"completed_habits": 3, "required_level": 2}',
  4
)
ON CONFLICT (goal_template_id, title) DO NOTHING;

-- Verify the data was inserted
SELECT 
  c.name as category,
  g.title as goal,
  COUNT(h.id) as habit_count
FROM categories c
LEFT JOIN goal_templates g ON c.id = g.category_id
LEFT JOIN habit_templates h ON g.id = h.goal_template_id
GROUP BY c.id, c.name, g.id, g.title
ORDER BY c.order_index, g.title;