-- Create comprehensive habit/lesson system for Duolingo-style goal progression
-- Migration: 20250705000001_create_habit_system.sql

-- 1. Skills table (categories with progression info)
CREATE TABLE IF NOT EXISTS public.skills (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE CHECK (name IN ('Physical Health', 'Mental Health', 'Finance', 'Social')),
    description TEXT,
    icon TEXT NOT NULL,
    color TEXT NOT NULL,
    order_index INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Goal templates table (specific goals within skills)
CREATE TABLE IF NOT EXISTS public.goal_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    estimated_duration TEXT NOT NULL, -- e.g., "8-12 weeks"
    total_levels INTEGER NOT NULL DEFAULT 4,
    benefits TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(skill_id, name)
);

-- 3. Habit templates table (individual habits within goals)
CREATE TABLE IF NOT EXISTS public.habit_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    goal_template_id UUID NOT NULL REFERENCES public.goal_templates(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    level INTEGER NOT NULL CHECK (level >= 1 AND level <= 4),
    estimated_duration INTEGER NOT NULL, -- in minutes
    xp_reward INTEGER NOT NULL DEFAULT 10,
    habit_type TEXT NOT NULL CHECK (habit_type IN ('foundation', 'building', 'power', 'mastery')),
    instructions TEXT,
    tips TEXT,
    unlock_requirements JSONB DEFAULT '{"completed_habits": 3, "required_level": 1}',
    order_index INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. User active goals table (goals user is currently working on)
CREATE TABLE IF NOT EXISTS public.user_active_goals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    goal_template_id UUID NOT NULL REFERENCES public.goal_templates(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
    current_level INTEGER NOT NULL DEFAULT 1,
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    target_completion_date DATE,
    completion_date DATE,
    time_commitment TEXT NOT NULL CHECK (time_commitment IN ('light', 'moderate', 'intensive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, goal_template_id)
);

-- 5. User habit progress table (track progress for each habit)
CREATE TABLE IF NOT EXISTS public.user_habit_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_active_goal_id UUID NOT NULL REFERENCES public.user_active_goals(id) ON DELETE CASCADE,
    habit_template_id UUID NOT NULL REFERENCES public.habit_templates(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'locked' CHECK (status IN ('locked', 'available', 'in_progress', 'completed')),
    completed_count INTEGER NOT NULL DEFAULT 0,
    best_streak INTEGER NOT NULL DEFAULT 0,
    current_streak INTEGER NOT NULL DEFAULT 0,
    total_xp_earned INTEGER NOT NULL DEFAULT 0,
    last_completed_at TIMESTAMP WITH TIME ZONE,
    unlocked_at TIMESTAMP WITH TIME ZONE,
    mastered_at TIMESTAMP WITH TIME ZONE, -- when user has completed this habit multiple times
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, habit_template_id)
);

-- 6. User XP and level tracking
CREATE TABLE IF NOT EXISTS public.user_xp_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    total_xp INTEGER NOT NULL DEFAULT 0,
    current_level INTEGER NOT NULL DEFAULT 1,
    xp_to_next_level INTEGER NOT NULL DEFAULT 100,
    daily_xp_goal INTEGER NOT NULL DEFAULT 50,
    current_streak INTEGER NOT NULL DEFAULT 0,
    best_streak INTEGER NOT NULL DEFAULT 0,
    last_activity_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Daily habit completions (track each completion)
CREATE TABLE IF NOT EXISTS public.habit_completions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    habit_template_id UUID NOT NULL REFERENCES public.habit_templates(id) ON DELETE CASCADE,
    user_habit_progress_id UUID NOT NULL REFERENCES public.user_habit_progress(id) ON DELETE CASCADE,
    completion_date DATE NOT NULL DEFAULT CURRENT_DATE,
    xp_earned INTEGER NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 3), -- 1=hard, 2=okay, 3=great
    notes TEXT,
    completion_time INTEGER, -- actual time spent in minutes
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. XP transactions (detailed XP earning history)
CREATE TABLE IF NOT EXISTS public.xp_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    habit_completion_id UUID REFERENCES public.habit_completions(id) ON DELETE CASCADE,
    xp_amount INTEGER NOT NULL,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('habit_completion', 'streak_bonus', 'perfect_score', 'level_bonus', 'achievement_bonus')),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. User achievements
CREATE TABLE IF NOT EXISTS public.user_achievements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    achievement_id TEXT NOT NULL, -- 'first_habit', 'week_warrior', 'foundation_master', etc.
    achievement_name TEXT NOT NULL,
    achievement_description TEXT NOT NULL,
    achievement_icon TEXT NOT NULL,
    xp_reward INTEGER NOT NULL DEFAULT 0,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, achievement_id)
);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_active_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_habit_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_xp_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xp_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for skills and templates (readable by all authenticated users)
CREATE POLICY "Authenticated users can read skills" ON public.skills FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can read goal templates" ON public.goal_templates FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can read habit templates" ON public.habit_templates FOR SELECT USING (auth.role() = 'authenticated');

-- RLS Policies for user-specific data
CREATE POLICY "Users can manage their own active goals" ON public.user_active_goals FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own habit progress" ON public.user_habit_progress FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own XP progress" ON public.user_xp_progress FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own habit completions" ON public.habit_completions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own XP transactions" ON public.xp_transactions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own achievements" ON public.user_achievements FOR ALL USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_goal_templates_skill_id ON public.goal_templates(skill_id);
CREATE INDEX IF NOT EXISTS idx_habit_templates_goal_template_id ON public.habit_templates(goal_template_id);
CREATE INDEX IF NOT EXISTS idx_habit_templates_level ON public.habit_templates(level);
CREATE INDEX IF NOT EXISTS idx_user_active_goals_user_id ON public.user_active_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_user_active_goals_status ON public.user_active_goals(status);
CREATE INDEX IF NOT EXISTS idx_user_habit_progress_user_id ON public.user_habit_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_habit_progress_status ON public.user_habit_progress(status);
CREATE INDEX IF NOT EXISTS idx_habit_completions_user_id ON public.habit_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_habit_completions_date ON public.habit_completions(completion_date);
CREATE INDEX IF NOT EXISTS idx_xp_transactions_user_id ON public.xp_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON public.user_achievements(user_id);

-- Create function to update updated_at timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER handle_user_active_goals_updated_at
    BEFORE UPDATE ON public.user_active_goals
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_user_habit_progress_updated_at
    BEFORE UPDATE ON public.user_habit_progress
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_user_xp_progress_updated_at
    BEFORE UPDATE ON public.user_xp_progress
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();