-- Enhanced recurring tasks migration with parent-child relationships
-- Run this script in your Supabase SQL Editor after applying the basic recurring migration

-- Add advanced recurring pattern columns (if not already added)
ALTER TABLE public.schedules 
ADD COLUMN IF NOT EXISTS recurrence_days_of_week JSONB,
ADD COLUMN IF NOT EXISTS recurrence_day_of_month INTEGER,
ADD COLUMN IF NOT EXISTS recurrence_pattern TEXT CHECK (recurrence_pattern IN ('simple', 'days_of_week', 'day_of_month'));

-- Add comments for documentation
COMMENT ON COLUMN public.schedules.recurrence_days_of_week IS 'JSON array of weekdays for weekly recurrence: ["monday", "wednesday", "friday"]';
COMMENT ON COLUMN public.schedules.recurrence_day_of_month IS 'Day of month (1-31) for monthly recurrence';
COMMENT ON COLUMN public.schedules.recurrence_pattern IS 'Type of recurrence pattern: simple (daily/yearly), days_of_week (weekly), day_of_month (monthly)';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_schedules_recurrence_pattern ON public.schedules(recurrence_pattern);
CREATE INDEX IF NOT EXISTS idx_schedules_parent_task ON public.schedules(parent_task_id);
CREATE INDEX IF NOT EXISTS idx_schedules_recurring ON public.schedules(is_recurring);

-- Create a trigger function to set parent_task_id for the first task in a recurring series
CREATE OR REPLACE FUNCTION set_parent_task_id_for_first_task()
RETURNS TRIGGER AS $$
BEGIN
    -- If this is a recurring task and parent_task_id is not set, make it self-referencing
    -- This handles the case where the parent task is being created
    IF NEW.is_recurring AND NEW.parent_task_id IS NULL THEN
        NEW.parent_task_id := NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for setting parent_task_id on INSERT
DROP TRIGGER IF EXISTS trg_set_parent_task_id ON public.schedules;
CREATE TRIGGER trg_set_parent_task_id
    BEFORE INSERT ON public.schedules
    FOR EACH ROW
    EXECUTE FUNCTION set_parent_task_id_for_first_task();

-- Create a function to get all tasks in a recurring series
CREATE OR REPLACE FUNCTION get_recurring_series(task_id UUID)
RETURNS TABLE (
    id UUID,
    title TEXT,
    schedule_date DATE,
    schedule_time TIME,
    completed BOOLEAN,
    is_parent BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    WITH series_parent AS (
        SELECT COALESCE(s.parent_task_id, s.id) as parent_id
        FROM schedules s
        WHERE s.id = task_id
    )
    SELECT 
        s.id,
        s.title,
        s.schedule_date,
        s.schedule_time,
        s.completed,
        (s.id = sp.parent_id) as is_parent
    FROM schedules s
    CROSS JOIN series_parent sp
    WHERE s.parent_task_id = sp.parent_id
       OR s.id = sp.parent_id
    ORDER BY s.schedule_date, s.schedule_time;
END;
$$ LANGUAGE plpgsql;

-- Create a function to delete entire recurring series
CREATE OR REPLACE FUNCTION delete_recurring_series(task_id UUID)
RETURNS INTEGER AS $$
DECLARE
    parent_id UUID;
    deleted_count INTEGER;
BEGIN
    -- Find the parent task ID
    SELECT COALESCE(parent_task_id, id) INTO parent_id
    FROM schedules 
    WHERE id = task_id;
    
    -- Delete all tasks in the series
    DELETE FROM schedules 
    WHERE parent_task_id = parent_id OR id = parent_id;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Verify the setup
DO $$
BEGIN
    RAISE NOTICE 'Enhanced recurring tasks migration completed successfully!';
    RAISE NOTICE 'New columns added: recurrence_days_of_week, recurrence_day_of_month, recurrence_pattern';
    RAISE NOTICE 'Trigger created: trg_set_parent_task_id';
    RAISE NOTICE 'Helper functions created: get_recurring_series(), delete_recurring_series()';
END $$;