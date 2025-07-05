-- Seed data for habit system
-- Migration: 20250705000002_seed_habit_templates.sql

-- Insert Categories (Life Areas)
INSERT INTO public.categories (name, description, icon, color, order_index) VALUES
('Physical Health', 'Build strength, lose weight, improve fitness and overall physical wellbeing', '💪', '#FF6B6B', 1),
('Mental Health', 'Reduce stress, build mindfulness, improve emotional wellbeing and mental clarity', '🧠', '#4ECDC4', 2),
('Finance', 'Save money, budget better, build wealth and achieve financial freedom', '💰', '#45B7D1', 3),
('Social', 'Improve relationships, network better, build meaningful connections', '👥', '#96CEB4', 4)
ON CONFLICT (name) DO NOTHING;

-- Insert Goal Templates for Physical Health
INSERT INTO public.goal_templates (category_id, name, title, description, difficulty, estimated_duration, total_levels, benefits) VALUES
((SELECT id FROM public.categories WHERE name = 'Physical Health'), 'lose-weight', 'Lose Weight', 'Achieve sustainable weight loss through healthy habits and lifestyle changes', 'intermediate', '8-12 weeks', 4, ARRAY['Improved confidence', 'Better health markers', 'Increased energy', 'Better sleep quality']),
((SELECT id FROM public.categories WHERE name = 'Physical Health'), 'build-muscle', 'Build Muscle', 'Gain strength and muscle mass through progressive resistance training', 'advanced', '12-16 weeks', 4, ARRAY['Increased strength', 'Better physique', 'Higher metabolism', 'Improved bone density']),
((SELECT id FROM public.categories WHERE name = 'Physical Health'), 'improve-cardio', 'Improve Cardio', 'Build endurance and cardiovascular health through progressive training', 'beginner', '6-8 weeks', 4, ARRAY['Better heart health', 'Increased stamina', 'More energy', 'Stress reduction'])
ON CONFLICT (category_id, name) DO NOTHING;

-- Insert Goal Templates for Mental Health
INSERT INTO public.goal_templates (category_id, name, title, description, difficulty, estimated_duration, total_levels, benefits) VALUES
((SELECT id FROM public.categories WHERE name = 'Mental Health'), 'reduce-stress', 'Reduce Stress', 'Learn stress management techniques and build emotional resilience', 'beginner', '6-8 weeks', 4, ARRAY['Lower anxiety', 'Better mood', 'Improved focus', 'Better relationships']),
((SELECT id FROM public.categories WHERE name = 'Mental Health'), 'build-mindfulness', 'Build Mindfulness', 'Develop meditation practice and present-moment awareness', 'intermediate', '8-10 weeks', 4, ARRAY['Mental clarity', 'Emotional balance', 'Better decision making', 'Reduced reactivity']),
((SELECT id FROM public.categories WHERE name = 'Mental Health'), 'improve-sleep', 'Improve Sleep', 'Establish healthy sleep habits for better rest and recovery', 'beginner', '4-6 weeks', 4, ARRAY['Better energy', 'Improved mood', 'Better focus', 'Stronger immunity'])
ON CONFLICT (category_id, name) DO NOTHING;

-- Insert Goal Templates for Finance
INSERT INTO public.goal_templates (category_id, name, title, description, difficulty, estimated_duration, total_levels, benefits) VALUES
((SELECT id FROM public.categories WHERE name = 'Finance'), 'save-money', 'Save Money', 'Build a savings habit and create an emergency fund', 'beginner', '8-12 weeks', 4, ARRAY['Financial security', 'Reduced money stress', 'Future opportunities', 'Peace of mind']),
((SELECT id FROM public.categories WHERE name = 'Finance'), 'budget-better', 'Budget Better', 'Master budgeting and expense tracking for financial control', 'intermediate', '6-8 weeks', 4, ARRAY['Better spending control', 'Clear financial picture', 'Debt reduction', 'Goal achievement']),
((SELECT id FROM public.categories WHERE name = 'Finance'), 'build-wealth', 'Build Wealth', 'Learn investing and wealth building strategies', 'advanced', '12-16 weeks', 4, ARRAY['Long-term wealth', 'Passive income', 'Financial freedom', 'Retirement security'])
ON CONFLICT (category_id, name) DO NOTHING;

-- Insert Goal Templates for Social
INSERT INTO public.goal_templates (category_id, name, title, description, difficulty, estimated_duration, total_levels, benefits) VALUES
((SELECT id FROM public.categories WHERE name = 'Social'), 'improve-relationships', 'Improve Relationships', 'Strengthen existing relationships and build deeper connections', 'intermediate', '8-10 weeks', 4, ARRAY['Stronger bonds', 'Better communication', 'More support', 'Increased happiness']),
((SELECT id FROM public.categories WHERE name = 'Social'), 'network-better', 'Network Better', 'Build professional and personal networking skills', 'intermediate', '6-8 weeks', 4, ARRAY['Career opportunities', 'New friendships', 'Knowledge sharing', 'Personal growth']),
((SELECT id FROM public.categories WHERE name = 'Social'), 'build-confidence', 'Build Confidence', 'Develop social confidence and communication skills', 'beginner', '6-8 weeks', 4, ARRAY['Better self-esteem', 'Easier conversations', 'More opportunities', 'Reduced social anxiety'])
ON CONFLICT (category_id, name) DO NOTHING;

-- Insert Habit Templates for Physical Health - Lose Weight Goal
INSERT INTO public.habit_templates (goal_template_id, title, description, level, estimated_duration, xp_reward, habit_type, instructions, tips, order_index) VALUES
-- Level 1: Foundation
((SELECT id FROM public.goal_templates WHERE name = 'lose-weight'), '5-Minute Morning Stretch', 'Gentle stretching routine to wake up your body', 1, 5, 10, 'foundation', 'Complete neck rolls, shoulder shrugs, arm circles, side stretches, and gentle toe touches', 'Focus on breathing and move slowly. Listen to your body.', 1),
((SELECT id FROM public.goal_templates WHERE name = 'lose-weight'), 'Track Water Intake', 'Monitor your daily water consumption', 1, 2, 8, 'foundation', 'Log each glass of water you drink throughout the day. Aim for 8 glasses.', 'Keep a water bottle nearby as a visual reminder.', 2),
((SELECT id FROM public.goal_templates WHERE name = 'lose-weight'), 'Healthy Breakfast Choice', 'Start your day with a nutritious breakfast', 1, 10, 15, 'foundation', 'Choose a breakfast with protein, healthy fats, and complex carbs. Avoid sugary cereals.', 'Prep breakfast the night before to make mornings easier.', 3),
((SELECT id FROM public.goal_templates WHERE name = 'lose-weight'), '10-Minute Walk', 'Take a gentle walk to start moving', 1, 10, 12, 'foundation', 'Walk at a comfortable pace for 10 minutes. Focus on enjoying the movement.', 'Start with indoor walking if weather is bad.', 4),

-- Level 2: Building
((SELECT id FROM public.goal_templates WHERE name = 'lose-weight'), '20-Minute Morning Run', 'Build cardiovascular endurance with running', 2, 20, 25, 'building', 'Run at a comfortable pace for 20 minutes. Walk when needed.', 'Focus on consistency over speed. It''s okay to walk-run.', 1),
((SELECT id FROM public.goal_templates WHERE name = 'lose-weight'), 'Meal Prep Sunday', 'Prepare healthy meals for the week', 2, 45, 30, 'building', 'Spend time preparing healthy meals and snacks for the upcoming week.', 'Start with just 2-3 meals. Focus on simple, nutritious options.', 2),
((SELECT id FROM public.goal_templates WHERE name = 'lose-weight'), 'Daily Calorie Tracking', 'Monitor your food intake and calories', 2, 10, 18, 'building', 'Log everything you eat and drink. Use a food tracking app for accuracy.', 'Be honest and consistent. Knowledge is power.', 3),
((SELECT id FROM public.goal_templates WHERE name = 'lose-weight'), 'Weekly Weigh-In', 'Track your weight progress consistently', 2, 5, 20, 'building', 'Weigh yourself at the same time, same day each week. Record the result.', 'Weight fluctuates daily. Focus on weekly trends.', 4),

-- Level 3: Power
((SELECT id FROM public.goal_templates WHERE name = 'lose-weight'), '30-Minute Cardio Session', 'Intensive cardiovascular workout', 3, 30, 35, 'power', 'Complete 30 minutes of moderate to high-intensity cardio exercise.', 'Mix different activities: running, cycling, swimming, or HIIT.', 1),
((SELECT id FROM public.goal_templates WHERE name = 'lose-weight'), 'Strength Training', 'Build muscle to boost metabolism', 3, 40, 40, 'power', 'Complete a full-body strength training workout with proper form.', 'Focus on compound movements. Start with bodyweight if new.', 2),
((SELECT id FROM public.goal_templates WHERE name = 'lose-weight'), 'Macro Tracking', 'Monitor protein, carbs, and fat intake', 3, 15, 25, 'power', 'Track not just calories but macronutrient breakdown for optimal results.', 'Aim for adequate protein to preserve muscle during weight loss.', 3),
((SELECT id FROM public.goal_templates WHERE name = 'lose-weight'), 'Progress Photos', 'Document your physical transformation', 3, 5, 15, 'power', 'Take consistent progress photos from front, side, and back angles.', 'Use same lighting, time of day, and clothing for accurate comparison.', 4),

-- Level 4: Mastery
((SELECT id FROM public.goal_templates WHERE name = 'lose-weight'), 'Full Workout Routine', 'Complete comprehensive training program', 4, 60, 50, 'mastery', 'Execute a complete workout combining cardio, strength, and flexibility training.', 'Listen to your body and adjust intensity as needed.', 1),
((SELECT id FROM public.goal_templates WHERE name = 'lose-weight'), 'Advanced Nutrition Planning', 'Master meal timing and nutrient optimization', 4, 30, 45, 'mastery', 'Plan meals around workouts, optimize nutrient timing, and fine-tune your diet.', 'Consider working with a nutritionist for personalized guidance.', 2),
((SELECT id FROM public.goal_templates WHERE name = 'lose-weight'), 'Body Composition Analysis', 'Track muscle vs fat changes', 4, 10, 35, 'mastery', 'Use advanced methods to track body fat percentage and muscle mass changes.', 'Focus on body composition, not just weight on the scale.', 3),
((SELECT id FROM public.goal_templates WHERE name = 'lose-weight'), 'Maintenance Planning', 'Develop long-term sustainability strategy', 4, 20, 30, 'mastery', 'Create a plan for maintaining your weight loss and healthy habits long-term.', 'Focus on habits that are sustainable for life, not just short-term.', 4);

-- Insert Habit Templates for Mental Health - Reduce Stress Goal
INSERT INTO public.habit_templates (goal_template_id, title, description, level, estimated_duration, xp_reward, habit_type, instructions, tips, order_index) VALUES
-- Level 1: Foundation
((SELECT id FROM public.goal_templates WHERE name = 'reduce-stress'), '3-Minute Breathing', 'Simple breathing exercise for immediate calm', 1, 3, 8, 'foundation', 'Breathe in for 4 counts, hold for 4, breathe out for 6. Repeat for 3 minutes.', 'Find a quiet spot and close your eyes if comfortable.', 1),
((SELECT id FROM public.goal_templates WHERE name = 'reduce-stress'), 'Gratitude Note', 'Write down one thing you''re grateful for', 1, 2, 6, 'foundation', 'Each day, write down one specific thing you''re grateful for and why.', 'Be specific and focus on details to enhance the positive feeling.', 2),
((SELECT id FROM public.goal_templates WHERE name = 'reduce-stress'), 'Mood Check-In', 'Acknowledge and name your current emotions', 1, 1, 5, 'foundation', 'Take a moment to identify and name how you''re feeling right now.', 'There are no wrong emotions. Simply notice without judgment.', 3),
((SELECT id FROM public.goal_templates WHERE name = 'reduce-stress'), 'Tech-Free Break', 'Take a 10-minute break from all devices', 1, 10, 10, 'foundation', 'Put away all electronic devices and spend 10 minutes in quiet reflection or gentle activity.', 'Try looking out a window, gentle stretching, or just sitting quietly.', 4);

-- Add more habit templates for other goals and levels...
-- (This is a sample - would continue with all goals and levels)