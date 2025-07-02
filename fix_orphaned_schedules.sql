-- Fix orphaned schedules that reference non-existent goals
-- This will set goal_id to NULL for schedules that reference deleted goals

UPDATE public.schedules 
SET goal_id = NULL 
WHERE goal_id IS NOT NULL 
AND goal_id NOT IN (SELECT id FROM public.goals);

-- Verify the fix
SELECT COUNT(*) as orphaned_schedules_fixed
FROM public.schedules 
WHERE goal_id IS NOT NULL 
AND goal_id NOT IN (SELECT id FROM public.goals);