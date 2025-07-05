-- Seed data for habit system (FIXED VERSION)
-- Migration: 20250705000002_seed_habit_templates_fixed.sql

-- Insert into 'skills' table (this is what Migration 1 actually created)
INSERT INTO public.skills (name, description, icon, color, order_index) VALUES
('Physical Health', 'Build strength, lose weight, improve fitness and overall physical wellbeing', '💪', '#FF6B6B', 1),
('Mental Health', 'Reduce stress, build mindfulness, improve emotional wellbeing and mental clarity', '🧠', '#4ECDC4', 2),
('Finance', 'Save money, budget better, build wealth and achieve financial freedom', '💰', '#45B7D1', 3),
('Social', 'Improve relationships, network better, build meaningful connections', '👥', '#96CEB4', 4)
ON CONFLICT (name) DO NOTHING;

-- Insert Goal Templates for Physical Health (using skill_id, not category_id)
INSERT INTO public.goal_templates (skill_id, name, title, description, difficulty, estimated_duration, total_levels, benefits) VALUES
((SELECT id FROM public.skills WHERE name = 'Physical Health'), 'lose-weight', 'Lose Weight', 'Achieve sustainable weight loss through healthy habits and lifestyle changes', 'intermediate', '8-12 weeks', 4, ARRAY['Improved confidence', 'Better health markers', 'Increased energy', 'Better sleep quality']),
((SELECT id FROM public.skills WHERE name = 'Physical Health'), 'build-muscle', 'Build Muscle', 'Gain strength and muscle mass through progressive resistance training', 'advanced', '12-16 weeks', 4, ARRAY['Increased strength', 'Better physique', 'Higher metabolism', 'Improved bone density']),
((SELECT id FROM public.skills WHERE name = 'Physical Health'), 'improve-cardio', 'Improve Cardio', 'Build endurance and cardiovascular health through progressive training', 'beginner', '6-8 weeks', 4, ARRAY['Better heart health', 'Increased stamina', 'More energy', 'Stress reduction'])
ON CONFLICT (skill_id, name) DO NOTHING;

-- Insert Goal Templates for Mental Health
INSERT INTO public.goal_templates (skill_id, name, title, description, difficulty, estimated_duration, total_levels, benefits) VALUES
((SELECT id FROM public.skills WHERE name = 'Mental Health'), 'reduce-stress', 'Reduce Stress', 'Learn stress management techniques and build emotional resilience', 'beginner', '6-8 weeks', 4, ARRAY['Lower anxiety', 'Better mood', 'Improved focus', 'Better relationships']),
((SELECT id FROM public.skills WHERE name = 'Mental Health'), 'build-mindfulness', 'Build Mindfulness', 'Develop meditation practice and present-moment awareness', 'intermediate', '8-10 weeks', 4, ARRAY['Mental clarity', 'Emotional balance', 'Better decision making', 'Reduced reactivity']),
((SELECT id FROM public.skills WHERE name = 'Mental Health'), 'improve-sleep', 'Improve Sleep', 'Establish healthy sleep habits for better rest and recovery', 'beginner', '4-6 weeks', 4, ARRAY['Better energy', 'Improved mood', 'Better focus', 'Stronger immunity'])
ON CONFLICT (skill_id, name) DO NOTHING;

-- Insert Goal Templates for Finance
INSERT INTO public.goal_templates (skill_id, name, title, description, difficulty, estimated_duration, total_levels, benefits) VALUES
((SELECT id FROM public.skills WHERE name = 'Finance'), 'save-money', 'Save Money', 'Build a savings habit and create an emergency fund', 'beginner', '8-12 weeks', 4, ARRAY['Financial security', 'Reduced money stress', 'Future opportunities', 'Peace of mind']),
((SELECT id FROM public.skills WHERE name = 'Finance'), 'budget-better', 'Budget Better', 'Master budgeting and expense tracking for financial control', 'intermediate', '6-8 weeks', 4, ARRAY['Better spending control', 'Clear financial picture', 'Debt reduction', 'Goal achievement']),
((SELECT id FROM public.skills WHERE name = 'Finance'), 'build-wealth', 'Build Wealth', 'Learn investing and wealth building strategies', 'advanced', '12-16 weeks', 4, ARRAY['Long-term wealth', 'Passive income', 'Financial freedom', 'Retirement security'])
ON CONFLICT (skill_id, name) DO NOTHING;

-- Insert Goal Templates for Social
INSERT INTO public.goal_templates (skill_id, name, title, description, difficulty, estimated_duration, total_levels, benefits) VALUES
((SELECT id FROM public.skills WHERE name = 'Social'), 'improve-relationships', 'Improve Relationships', 'Strengthen existing relationships and build deeper connections', 'intermediate', '8-10 weeks', 4, ARRAY['Stronger bonds', 'Better communication', 'More support', 'Increased happiness']),
((SELECT id FROM public.skills WHERE name = 'Social'), 'network-better', 'Network Better', 'Build professional and personal networking skills', 'intermediate', '6-8 weeks', 4, ARRAY['Career opportunities', 'New friendships', 'Knowledge sharing', 'Personal growth']),
((SELECT id FROM public.skills WHERE name = 'Social'), 'build-confidence', 'Build Confidence', 'Develop social confidence and communication skills', 'beginner', '6-8 weeks', 4, ARRAY['Better self-esteem', 'Easier conversations', 'More opportunities', 'Reduced social anxiety'])
ON CONFLICT (skill_id, name) DO NOTHING;

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
((SELECT id FROM public.goal_templates WHERE name = 'reduce-stress'), 'Tech-Free Break', 'Take a 10-minute break from all devices', 1, 10, 10, 'foundation', 'Put away all electronic devices and spend 10 minutes in quiet reflection or gentle activity.', 'Try looking out a window, gentle stretching, or just sitting quietly.', 4),

-- Level 2: Building
((SELECT id FROM public.goal_templates WHERE name = 'reduce-stress'), '10-Minute Meditation', 'Guided meditation practice', 2, 10, 15, 'building', 'Use a meditation app or quiet focus on breath for 10 minutes.', 'Start with guided meditations if you''re new to the practice.', 1),
((SELECT id FROM public.goal_templates WHERE name = 'reduce-stress'), 'Evening Journaling', 'Reflect on your day through writing', 2, 15, 18, 'building', 'Write about your day, feelings, and thoughts for 15 minutes before bed.', 'Focus on processing emotions, not perfect writing.', 2),
((SELECT id FROM public.goal_templates WHERE name = 'reduce-stress'), 'Mindful Walking', 'Walking meditation practice', 2, 20, 22, 'building', 'Take a 20-minute walk focusing on each step and your surroundings.', 'Leave phone behind and focus on being present.', 3),
((SELECT id FROM public.goal_templates WHERE name = 'reduce-stress'), 'Stress Check & Response', 'Identify and address stress triggers', 2, 5, 12, 'building', 'Notice when stress arises and choose a healthy response technique.', 'Build awareness first, then practice your response tools.', 4),

-- Level 3: Power
((SELECT id FROM public.goal_templates WHERE name = 'reduce-stress'), 'Deep Relaxation Session', 'Progressive muscle relaxation practice', 3, 25, 30, 'power', 'Complete a full-body progressive muscle relaxation session.', 'Focus on tensing and releasing each muscle group systematically.', 1),
((SELECT id FROM public.goal_templates WHERE name = 'reduce-stress'), 'Emotional Processing', 'Work through challenging emotions', 3, 20, 28, 'power', 'Set aside time to fully process and work through difficult emotions.', 'Consider speaking with a counselor for additional support.', 2),
((SELECT id FROM public.goal_templates WHERE name = 'reduce-stress'), 'Boundaries Practice', 'Set and maintain healthy boundaries', 3, 15, 25, 'power', 'Practice saying no to requests that increase stress or overwhelm.', 'Start with small boundaries and build up to larger ones.', 3),
((SELECT id FROM public.goal_templates WHERE name = 'reduce-stress'), 'Stress Prevention Planning', 'Proactive stress management', 3, 30, 35, 'power', 'Plan your week to minimize stress triggers and maximize support.', 'Include buffer time and stress-relief activities in your schedule.', 4),

-- Level 4: Mastery
((SELECT id FROM public.goal_templates WHERE name = 'reduce-stress'), 'Advanced Mindfulness Practice', 'Complex mindfulness techniques', 4, 45, 50, 'mastery', 'Practice advanced mindfulness techniques like loving-kindness meditation.', 'Explore different meditation styles to find what resonates most.', 1),
((SELECT id FROM public.goal_templates WHERE name = 'reduce-stress'), 'Stress Coaching Others', 'Help others with stress management', 4, 30, 45, 'mastery', 'Share stress management techniques with friends or family members.', 'Teaching others reinforces your own learning and practice.', 2),
((SELECT id FROM public.goal_templates WHERE name = 'reduce-stress'), 'Life Integration', 'Integrate all stress management tools', 4, 20, 40, 'mastery', 'Seamlessly integrate all learned stress management tools into daily life.', 'Focus on making stress management a natural part of your routine.', 3),
((SELECT id FROM public.goal_templates WHERE name = 'reduce-stress'), 'Resilience Building', 'Build long-term emotional resilience', 4, 35, 48, 'mastery', 'Work on building long-term resilience to handle future stressors.', 'Focus on building a strong foundation for lifelong stress management.', 4);