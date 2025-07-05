-- Database Schema Testing Script
-- Run this after applying the migrations to test the schema

-- Test 1: Insert Skills (Categories)
INSERT INTO public.skills (name, description, icon, color, order_index) VALUES
('Physical Health', 'Build strength, lose weight, improve fitness', '💪', '#FF6B6B', 1),
('Mental Health', 'Reduce stress, build mindfulness, improve wellbeing', '🧠', '#4ECDC4', 2),
('Finance', 'Save money, budget better, build wealth', '💰', '#45B7D1', 3),
('Social', 'Improve relationships, network better, build connections', '👥', '#96CEB4', 4);

-- Test 2: Insert Goal Templates
INSERT INTO public.goal_templates (skill_id, name, title, description, difficulty, estimated_duration, total_levels, benefits) VALUES
((SELECT id FROM public.skills WHERE name = 'Physical Health'), 'lose-weight', 'Lose Weight', 'Achieve sustainable weight loss through healthy habits', 'intermediate', '8-12 weeks', 4, ARRAY['Improved confidence', 'Better health', 'Increased energy']),
((SELECT id FROM public.skills WHERE name = 'Mental Health'), 'reduce-stress', 'Reduce Stress', 'Learn stress management and build resilience', 'beginner', '6-8 weeks', 4, ARRAY['Lower anxiety', 'Better mood', 'Improved focus']);

-- Test 3: Insert Habit Templates
INSERT INTO public.habit_templates (goal_template_id, title, description, level, estimated_duration, xp_reward, habit_type, instructions, tips, order_index) VALUES
-- Physical Health - Lose Weight - Level 1
((SELECT id FROM public.goal_templates WHERE name = 'lose-weight'), '5-Minute Morning Stretch', 'Gentle stretching to wake up your body', 1, 5, 10, 'foundation', 'Complete neck rolls, shoulder shrugs, arm circles', 'Focus on breathing', 1),
((SELECT id FROM public.goal_templates WHERE name = 'lose-weight'), 'Track Water Intake', 'Monitor daily water consumption', 1, 2, 8, 'foundation', 'Log each glass of water. Aim for 8 glasses.', 'Keep water bottle nearby', 2),

-- Physical Health - Lose Weight - Level 2  
((SELECT id FROM public.goal_templates WHERE name = 'lose-weight'), '20-Minute Morning Run', 'Build cardiovascular endurance', 2, 20, 25, 'building', 'Run at comfortable pace for 20 minutes', 'Focus on consistency over speed', 1),
((SELECT id FROM public.goal_templates WHERE name = 'lose-weight'), 'Meal Prep Sunday', 'Prepare healthy meals for the week', 2, 45, 30, 'building', 'Prepare 3-5 healthy meals and snacks', 'Start simple with 2-3 meals', 2),

-- Mental Health - Reduce Stress - Level 1
((SELECT id FROM public.goal_templates WHERE name = 'reduce-stress'), '3-Minute Breathing', 'Simple breathing exercise for calm', 1, 3, 8, 'foundation', 'Breathe in 4, hold 4, out 6. Repeat 3 minutes.', 'Find quiet spot, close eyes', 1),
((SELECT id FROM public.goal_templates WHERE name = 'reduce-stress'), 'Gratitude Note', 'Write one thing you are grateful for', 1, 2, 6, 'foundation', 'Write one specific thing and why', 'Be specific for enhanced feeling', 2);

-- Test 4: Create Test User Active Goal (you'll need to replace 'test-user-id' with actual user ID)
-- This simulates a user selecting the "Lose Weight" goal
/*
INSERT INTO public.user_active_goals (user_id, goal_template_id, status, current_level, start_date, time_commitment) VALUES
('test-user-id', (SELECT id FROM public.goal_templates WHERE name = 'lose-weight'), 'active', 1, CURRENT_DATE, 'moderate');
*/

-- Test 5: Create Test Habit Progress Records
-- This simulates creating progress tracking for all habits in the goal
/*
INSERT INTO public.user_habit_progress (user_id, user_active_goal_id, habit_template_id, status, unlocked_at) 
SELECT 
    'test-user-id',
    (SELECT id FROM public.user_active_goals WHERE user_id = 'test-user-id' AND goal_template_id = (SELECT id FROM public.goal_templates WHERE name = 'lose-weight')),
    ht.id,
    CASE WHEN ht.level = 1 THEN 'available' ELSE 'locked' END,
    CASE WHEN ht.level = 1 THEN NOW() ELSE NULL END
FROM public.habit_templates ht
JOIN public.goal_templates gt ON ht.goal_template_id = gt.id
WHERE gt.name = 'lose-weight';
*/

-- Test 6: Create Test XP Progress Record
/*
INSERT INTO public.user_xp_progress (user_id, total_xp, current_level, xp_to_next_level, daily_xp_goal) VALUES
('test-user-id', 0, 1, 100, 50);
*/

-- Test 7: Simulate Habit Completion
/*
INSERT INTO public.habit_completions (user_id, habit_template_id, user_habit_progress_id, completion_date, xp_earned, rating) VALUES
('test-user-id', 
 (SELECT id FROM public.habit_templates WHERE title = '5-Minute Morning Stretch'),
 (SELECT id FROM public.user_habit_progress WHERE user_id = 'test-user-id' AND habit_template_id = (SELECT id FROM public.habit_templates WHERE title = '5-Minute Morning Stretch')),
 CURRENT_DATE,
 10,
 3);
*/

-- Test Queries: Verify Data Structure

-- Query 1: Show all skills with goal counts
SELECT 
    s.name as skill_name,
    s.icon,
    s.color,
    COUNT(gt.id) as goal_count
FROM public.skills s
LEFT JOIN public.goal_templates gt ON s.id = gt.skill_id
GROUP BY s.id, s.name, s.icon, s.color, s.order_index
ORDER BY s.order_index;

-- Query 2: Show all goals with habit counts by level
SELECT 
    s.name as skill_name,
    gt.title as goal_title,
    gt.difficulty,
    gt.estimated_duration,
    ht.level,
    ht.habit_type,
    COUNT(ht.id) as habits_in_level
FROM public.skills s
JOIN public.goal_templates gt ON s.id = gt.skill_id
JOIN public.habit_templates ht ON gt.id = ht.goal_template_id
GROUP BY s.name, gt.title, gt.difficulty, gt.estimated_duration, ht.level, ht.habit_type
ORDER BY s.order_index, gt.title, ht.level;

-- Query 3: Show habit progression for Lose Weight goal
SELECT 
    ht.level,
    ht.habit_type,
    ht.title,
    ht.estimated_duration || ' min' as duration,
    ht.xp_reward || ' XP' as reward,
    ht.order_index
FROM public.habit_templates ht
JOIN public.goal_templates gt ON ht.goal_template_id = gt.id
WHERE gt.name = 'lose-weight'
ORDER BY ht.level, ht.order_index;

-- Query 4: Test constraint violations (these should fail)

-- This should fail: Invalid skill name
-- INSERT INTO public.skills (name, description, icon, color, order_index) VALUES ('Invalid Skill', 'Test', '❌', '#000000', 5);

-- This should fail: Invalid difficulty
-- INSERT INTO public.goal_templates (skill_id, name, title, description, difficulty, estimated_duration, total_levels, benefits) VALUES ((SELECT id FROM public.skills WHERE name = 'Physical Health'), 'test-goal', 'Test Goal', 'Test', 'invalid', '1 week', 4, ARRAY['test']);

-- This should fail: Invalid habit level
-- INSERT INTO public.habit_templates (goal_template_id, title, description, level, estimated_duration, xp_reward, habit_type, instructions, tips, order_index) VALUES ((SELECT id FROM public.goal_templates WHERE name = 'lose-weight'), 'Test Habit', 'Test', 5, 10, 10, 'foundation', 'Test', 'Test', 1);

-- Query 5: Check foreign key relationships
SELECT 
    'skills -> goal_templates' as relationship,
    COUNT(*) as count
FROM public.goal_templates gt
JOIN public.skills s ON gt.skill_id = s.id

UNION ALL

SELECT 
    'goal_templates -> habit_templates' as relationship,
    COUNT(*) as count
FROM public.habit_templates ht
JOIN public.goal_templates gt ON ht.goal_template_id = gt.id;

-- Query 6: Verify indexes exist
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND tablename IN ('skills', 'goal_templates', 'habit_templates', 'user_active_goals', 'user_habit_progress', 'habit_completions', 'xp_transactions', 'user_achievements')
ORDER BY tablename, indexname;

-- Query 7: Check RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Cleanup (uncomment to remove test data)
-- DELETE FROM public.habit_templates;
-- DELETE FROM public.goal_templates;
-- DELETE FROM public.skills;