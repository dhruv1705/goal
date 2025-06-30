-- Add missing columns to schedules table
ALTER TABLE public.schedules 
ADD COLUMN IF NOT EXISTS goal_id UUID REFERENCES public.goals(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low'));

-- Create index for goal_id for better performance
CREATE INDEX IF NOT EXISTS idx_schedules_goal_id ON public.schedules(goal_id);
CREATE INDEX IF NOT EXISTS idx_schedules_completed ON public.schedules(completed);
CREATE INDEX IF NOT EXISTS idx_schedules_priority ON public.schedules(priority);