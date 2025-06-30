-- Temporary test: Disable RLS to test basic functionality
-- Run this in your Supabase SQL Editor

-- Temporarily disable RLS for testing
ALTER TABLE public.goals DISABLE ROW LEVEL SECURITY;

-- Test if you can now insert a goal (this should work without authentication)
-- INSERT INTO goals (title, description, category, status, user_id, created_at, updated_at)
-- VALUES ('Test Goal', 'Test Description', 'Personal', 'active', '00000000-0000-0000-0000-000000000000', now(), now());

-- Check if the insert worked
-- SELECT * FROM goals;

-- IMPORTANT: After testing, re-enable RLS for security
-- ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;