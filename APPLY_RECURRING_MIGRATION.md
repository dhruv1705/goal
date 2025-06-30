# Apply Recurring Tasks Migration

## Issue
The "Failed to add task" error is occurring because the new recurring task fields don't exist in your database yet.

## Solution
Run this SQL in your Supabase Dashboard → SQL Editor:

```sql
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
```

## After Running the Migration
1. The task creation should work normally
2. You'll have access to recurring task functionality
3. The detailed error messages will show exactly what's wrong if there are other issues

## If You Don't Want Recurring Tasks Yet
Alternatively, I can temporarily disable the recurring functionality and just fix the basic task creation. Let me know your preference!