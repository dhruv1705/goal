-- Create user_preferences table for storing category priorities and onboarding completion
CREATE TABLE IF NOT EXISTS public.user_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category TEXT NOT NULL CHECK (category IN ('Physical Health', 'Mental Health', 'Finance', 'Social')),
    priority_score INTEGER NOT NULL DEFAULT 0 CHECK (priority_score >= 0 AND priority_score <= 100),
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Ensure unique category per user
    UNIQUE(user_id, category)
);

-- Create user_onboarding table to track onboarding completion
CREATE TABLE IF NOT EXISTS public.user_onboarding (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    primary_goal TEXT,
    motivation_context TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Ensure one onboarding record per user
    UNIQUE(user_id)
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_onboarding ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_preferences
CREATE POLICY "Users can view their own preferences" ON public.user_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences" ON public.user_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences" ON public.user_preferences
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own preferences" ON public.user_preferences
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for user_onboarding
CREATE POLICY "Users can view their own onboarding" ON public.user_onboarding
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own onboarding" ON public.user_onboarding
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own onboarding" ON public.user_onboarding
    FOR UPDATE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_user_preferences_user_id ON public.user_preferences(user_id);
CREATE INDEX idx_user_preferences_priority ON public.user_preferences(user_id, priority_score DESC);
CREATE INDEX idx_user_onboarding_user_id ON public.user_onboarding(user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for user_preferences updated_at
CREATE TRIGGER handle_user_preferences_updated_at
    BEFORE UPDATE ON public.user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Insert default preferences for existing users (balanced approach)
INSERT INTO public.user_preferences (user_id, category, priority_score, is_primary)
SELECT DISTINCT 
    g.user_id,
    'Physical Health',
    25,
    FALSE
FROM public.goals g
WHERE NOT EXISTS (
    SELECT 1 FROM public.user_preferences up 
    WHERE up.user_id = g.user_id
)
ON CONFLICT (user_id, category) DO NOTHING;

INSERT INTO public.user_preferences (user_id, category, priority_score, is_primary)
SELECT DISTINCT 
    g.user_id,
    'Mental Health',
    25,
    FALSE
FROM public.goals g
WHERE NOT EXISTS (
    SELECT 1 FROM public.user_preferences up 
    WHERE up.user_id = g.user_id AND up.category = 'Mental Health'
)
ON CONFLICT (user_id, category) DO NOTHING;

INSERT INTO public.user_preferences (user_id, category, priority_score, is_primary)
SELECT DISTINCT 
    g.user_id,
    'Finance',
    25,
    FALSE
FROM public.goals g
WHERE NOT EXISTS (
    SELECT 1 FROM public.user_preferences up 
    WHERE up.user_id = g.user_id AND up.category = 'Finance'
)
ON CONFLICT (user_id, category) DO NOTHING;

INSERT INTO public.user_preferences (user_id, category, priority_score, is_primary)
SELECT DISTINCT 
    g.user_id,
    'Social',
    25,
    FALSE
FROM public.goals g
WHERE NOT EXISTS (
    SELECT 1 FROM public.user_preferences up 
    WHERE up.user_id = g.user_id AND up.category = 'Social'
)
ON CONFLICT (user_id, category) DO NOTHING;