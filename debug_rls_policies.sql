-- Debug RLS policies for goals table
-- Run this in your Supabase SQL Editor to check current policies

-- 1. Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'goals';

-- 2. List all policies on goals table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'goals';

-- 3. Check if the goals table structure is correct
\d goals;

-- 4. Test if we can insert a goal as authenticated user
-- (This will only work if you're authenticated in the SQL Editor)
SELECT auth.uid() as current_user_id;

-- 5. If the above returns a user ID, try inserting a test goal
-- INSERT INTO goals (title, description, category, status, user_id, created_at, updated_at)
-- VALUES ('Test Goal', 'Test Description', 'Personal', 'active', auth.uid(), now(), now());

-- 6. Check if there are any existing goals
SELECT COUNT(*) as total_goals FROM goals;

-- 7. Check auth.users to see if there are any users
SELECT COUNT(*) as total_users FROM auth.users;