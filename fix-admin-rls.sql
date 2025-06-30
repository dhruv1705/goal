-- SQL commands to fix RLS policies for admin access
-- Run these commands in your Supabase SQL Editor

-- 1. Create an admin bypass policy for goals table
CREATE POLICY "Admin bypass for goals" ON public.goals
FOR ALL 
TO authenticated, anon
USING (true)
WITH CHECK (true);

-- 2. Create an admin bypass policy for schedules table  
CREATE POLICY "Admin bypass for schedules" ON public.schedules
FOR ALL 
TO authenticated, anon
USING (true)
WITH CHECK (true);

-- 3. Alternative: Temporarily disable RLS for admin testing
-- (You can re-enable later)
-- ALTER TABLE public.goals DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.schedules DISABLE ROW LEVEL SECURITY;

-- 4. Create a specific admin user table (optional)
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Insert admin user for testing
INSERT INTO public.admin_users (username) VALUES ('admin') 
ON CONFLICT (username) DO NOTHING;

-- 6. Grant permissions to the anon role for admin panel access
GRANT ALL ON public.goals TO anon;
GRANT ALL ON public.schedules TO anon;
GRANT ALL ON public.admin_users TO anon;

-- To check current policies, run:
-- SELECT * FROM pg_policies WHERE tablename IN ('goals', 'schedules');

-- To re-enable RLS later (if you disabled it):
-- ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;