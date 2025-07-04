-- Add advanced recurring pattern columns to schedules table
-- Run this script in your Supabase SQL Editor

ALTER TABLE public.schedules 
ADD COLUMN IF NOT EXISTS recurrence_days_of_week JSONB,
ADD COLUMN IF NOT EXISTS recurrence_day_of_month INTEGER,
ADD COLUMN IF NOT EXISTS recurrence_pattern TEXT CHECK (recurrence_pattern IN ('simple', 'days_of_week', 'day_of_month'));

-- Add comments for documentation
COMMENT ON COLUMN public.schedules.recurrence_days_of_week IS 'JSON array of weekdays for weekly recurrence: ["monday", "wednesday", "friday"]';
COMMENT ON COLUMN public.schedules.recurrence_day_of_month IS 'Day of month (1-31) for monthly recurrence';
COMMENT ON COLUMN public.schedules.recurrence_pattern IS 'Type of recurrence pattern: simple (daily/yearly), days_of_week (weekly), day_of_month (monthly)';

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_schedules_recurrence_pattern ON public.schedules(recurrence_pattern);

-- Verify the columns were added
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'schedules' 
AND table_schema = 'public'
AND column_name IN ('recurrence_days_of_week', 'recurrence_day_of_month', 'recurrence_pattern')
ORDER BY ordinal_position;