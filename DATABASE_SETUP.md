# Database Setup Instructions

## Issue
The goals table doesn't exist in your Supabase database yet, which is causing the "Failed to create goal" error.

## Solution
You need to run the SQL migrations manually in your Supabase dashboard.

### Steps:

1. **Go to your Supabase Dashboard**:
   - Visit: https://supabase.com/dashboard/project/ebdvpahpuefimdcfuvru
   - Go to the "SQL Editor" tab

2. **Run the Goals Table Migration**:
   Copy and paste this SQL into the SQL Editor and run it:

```sql
-- Create goals table
CREATE TABLE public.goals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
    category TEXT,
    target_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX idx_goals_user_id ON public.goals(user_id);
CREATE INDEX idx_goals_status ON public.goals(status);
CREATE INDEX idx_goals_user_status ON public.goals(user_id, status);

-- Enable Row Level Security
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

-- Create RLS policies so users can only access their own goals
CREATE POLICY "Users can view own goals" ON public.goals
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own goals" ON public.goals
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goals" ON public.goals
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own goals" ON public.goals
    FOR DELETE USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp (if it doesn't exist)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at timestamp
CREATE TRIGGER update_goals_updated_at 
    BEFORE UPDATE ON public.goals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

3. **Update Schedules Table**:
   Run this SQL to add the missing columns to the schedules table:

```sql
-- Add missing columns to schedules table
ALTER TABLE public.schedules 
ADD COLUMN IF NOT EXISTS goal_id UUID REFERENCES public.goals(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low'));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_schedules_goal_id ON public.schedules(goal_id);
CREATE INDEX IF NOT EXISTS idx_schedules_completed ON public.schedules(completed);
CREATE INDEX IF NOT EXISTS idx_schedules_priority ON public.schedules(priority);
```

4. **Test the App**:
   After running both SQL scripts, try creating a goal again in the app.

## Features Available After Setup:
- ✅ Create, edit, delete goals
- ✅ Categorize goals (Health, Career, Personal, etc.)
- ✅ Set target dates with calendar picker
- ✅ Track goal progress
- ✅ Add tasks to goals that sync with schedule
- ✅ Priority levels for tasks
- ✅ Complete task management

## Alternative: Local Development
If you want to use local development instead:
```bash
supabase start
supabase db reset
```
This will create a local Supabase instance with all migrations applied.