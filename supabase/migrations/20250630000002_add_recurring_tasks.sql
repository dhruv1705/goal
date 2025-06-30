-- Add recurring task functionality to schedules table
ALTER TABLE public.schedules 
ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS recurrence_type TEXT CHECK (recurrence_type IN ('daily', 'weekly', 'monthly', 'yearly')),
ADD COLUMN IF NOT EXISTS recurrence_interval INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS recurrence_end_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS parent_task_id UUID REFERENCES public.schedules(id) ON DELETE CASCADE;

-- Create index for recurring tasks
CREATE INDEX IF NOT EXISTS idx_schedules_recurring ON public.schedules(is_recurring);
CREATE INDEX IF NOT EXISTS idx_schedules_parent_task ON public.schedules(parent_task_id);