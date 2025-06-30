-- Fix RLS policies for goals table
-- Run this in your Supabase SQL Editor

-- First, drop existing policies to recreate them
DROP POLICY IF EXISTS "Users can view own goals" ON public.goals;
DROP POLICY IF EXISTS "Users can insert own goals" ON public.goals;
DROP POLICY IF EXISTS "Users can update own goals" ON public.goals;
DROP POLICY IF EXISTS "Users can delete own goals" ON public.goals;

-- Recreate policies with more explicit checks
CREATE POLICY "Enable read access for users based on user_id" ON public.goals
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Enable insert for authenticated users only" ON public.goals
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update for users based on user_id" ON public.goals
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable delete for users based on user_id" ON public.goals
    FOR DELETE USING (auth.uid() = user_id);

-- Verify RLS is enabled
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

-- Test query to verify policies work
-- SELECT * FROM goals WHERE user_id = auth.uid();